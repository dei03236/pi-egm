import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { loadPersonaRegistry, lookupPersona, UnknownPersonaError, PersonaRegistryInitializationError } from "../persona-registry.ts";

async function fixture(t: any) {
  const root = await fs.mkdtemp(path.join(tmpdir(), "egm-personas-"));
  await fs.mkdir(path.join(root, "agents"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const diagnostics: any[] = [];
  const dependencies = { readdir: fs.readdir, lstat: fs.lstat, readFile: fs.readFile, diagnostic: (event: any) => diagnostics.push(event) };
  return { root, diagnostics, dependencies, put: (name: string, text: string) => fs.writeFile(path.join(root, "agents", name), text) };
}
const metadata = (name: string) => `---\nname: ${name}\n---\nPRIVATE BODY`;

test("direct regular files, aliases, normalization, snapshot and reload", async t => {
  const f = await fixture(t);
  await f.put("Alias.md", "\uFEFF---\r\nname:\tCanonical-1._ \t\r\nother: opaque\r\n---\r\nname: ignored");
  await f.put("ignored.txt", metadata("ignored"));
  await fs.mkdir(path.join(f.root, "agents", "directory.md"));
  await fs.writeFile(path.join(f.root, "agents", "directory.md", "nested.md"), metadata("nested"));
  const registry = await loadPersonaRegistry(f.root, f.dependencies);
  assert.equal(lookupPersona(registry, " CANONICAL-1._ ").sourceFilename, "Alias.md");
  assert.equal(lookupPersona(registry, " alias ").declaredName, "Canonical-1._");
  for (const key of ["ignored", "nested", "../../outside", "C:\\secret", "egm-design-critic", "egm-bootstrap"]) {
    assert.throws(() => lookupPersona(registry, key), UnknownPersonaError);
  }
  await f.put("new.md", metadata("new"));
  assert.throws(() => lookupPersona(registry, "new"), UnknownPersonaError);
  assert.equal(lookupPersona(await loadPersonaRegistry(f.root, f.dependencies), "new").filenameStem, "new");
  await fs.unlink(path.join(f.root, "agents", "new.md"));
  await f.put("Alias.md", metadata("edited"));
  const refreshed = await loadPersonaRegistry(f.root, f.dependencies);
  assert.throws(() => lookupPersona(refreshed, "new"), UnknownPersonaError);
  assert.throws(() => lookupPersona(refreshed, "Canonical-1._"), UnknownPersonaError);
  assert.equal(lookupPersona(refreshed, "edited").sourceFilename, "Alias.md");
});

test("exact frontmatter grammar rejects unsupported metadata without inspecting body", async t => {
  const f = await fixture(t);
  const invalid = [
    "body only", "\n" + metadata("x"), "--- \nname: x\n---", "---\nname: x\n--- ",
    "---\nother: x\n---\nname: body", "---\nname: x\nname: y\n---",
    ...["", "'x'", '"x"', "x # comment", "x/y", "x:y", "-x", "x y", "é", "x!"].map(value => `---\nname: ${value}\n---`),
    "---\n name: x\n---", "---\n\tname: x\n---", "---\nname : x\n---",
    "---\nname: x\n name: y\n---", "---\nname: x\n...",
  ];
  for (const [i, text] of invalid.entries()) await f.put(`bad${i}.md`, text);
  await f.put("good.md", metadata("good"));
  const registry = await loadPersonaRegistry(f.root, f.dependencies);
  assert.equal(registry.registeredFiles, 1);
  assert.equal(registry.skippedEntries, invalid.length);
  assert.equal(registry.registeredKeys, 1);
  assert.ok(!JSON.stringify(f.diagnostics).includes("PRIVATE BODY"));
});

test("collisions exclude only shared keys in either enumeration order", async t => {
  const f = await fixture(t);
  await f.put("first.md", metadata("second"));
  await f.put("second.md", metadata("unique"));
  await f.put("third.md", metadata("SECOND"));
  for (const names of [["first.md", "second.md", "third.md"], ["third.md", "second.md", "first.md"]]) {
    const r = await loadPersonaRegistry(f.root, { ...f.dependencies, readdir: async () => names });
    assert.throws(() => lookupPersona(r, "second"), UnknownPersonaError);
    assert.equal(r.conflicts, 1);
    assert.equal(r.registeredFiles, 3);
    assert.equal(r.registeredKeys, 3);
    for (const key of ["first", "unique", "third"]) assert.ok(lookupPersona(r, key));
  }
  assert.ok(f.diagnostics.some(e => e.kind === "conflict" && e.filenames.length === 3));
});

test("individual lstat/read failures and Node-classified symlinks retain valid entries", async t => {
  const f = await fixture(t);
  for (const key of ["good", "stat", "read", "link"]) await f.put(`${key}.md`, metadata(key));
  const reads: string[] = [];
  const registry = await loadPersonaRegistry(f.root, {
    ...f.dependencies,
    lstat: async p => {
      if (p.endsWith("stat.md")) throw new Error("PRIVATE BODY");
      if (p.endsWith("link.md")) return { isFile: () => true, isSymbolicLink: () => true };
      return fs.lstat(p);
    },
    readFile: async (p, encoding) => {
      reads.push(p);
      if (p.endsWith("read.md")) throw Object.assign(new Error("PRIVATE BODY"), { code: "EACCES" });
      return fs.readFile(p, encoding);
    },
  });
  assert.equal(registry.registeredFiles, 1);
  assert.equal(registry.skippedEntries, 3);
  assert.ok(lookupPersona(registry, "good"));
  assert.ok(!reads.some(p => p.endsWith("link.md") || p.endsWith("stat.md")));
  assert.ok(!JSON.stringify(f.diagnostics).includes("PRIVATE BODY"));
  assert.equal(f.diagnostics.filter(e => e.kind === "summary").length, 1);
  assert.ok(f.diagnostics.some(e => e.filename === "read.md" && e.reason.includes("EACCES")));
});

test("directory enumeration failure is distinct and retains cause", async t => {
  const f = await fixture(t);
  const cause = new Error("unavailable");
  await assert.rejects(loadPersonaRegistry(f.root, { ...f.dependencies, readdir: async () => { throw cause; } }), error => {
    assert.ok(error instanceof PersonaRegistryInitializationError);
    assert.equal(error.cause, cause);
    assert.ok(!(error instanceof UnknownPersonaError));
    return true;
  });
});

test("current repository personas include inventive catalyst, not removed aliases", async () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const registry = await loadPersonaRegistry(root, { readdir: fs.readdir, lstat: fs.lstat, readFile: fs.readFile, diagnostic: () => {} });
  for (const record of new Set(registry.byNormalizedKey.values())) {
    assert.equal(lookupPersona(registry, record.declaredName), record);
    assert.equal(lookupPersona(registry, record.filenameStem), record);
  }
  assert.ok(lookupPersona(registry, "egm-inventive-catalyst"));
  assert.ok(lookupPersona(registry, "egm-design"));
  for (const alias of ["egm-design-critic", "egm-bootstrap"]) assert.throws(() => lookupPersona(registry, alias), UnknownPersonaError);
});
