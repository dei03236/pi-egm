import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface PersonaRecord {
  filePath: string;
  sourceFilename: string;
  declaredName: string;
  filenameStem: string;
}
export interface PersonaRegistry {
  readonly byNormalizedKey: ReadonlyMap<string, PersonaRecord>;
  readonly registeredFiles: number;
  readonly registeredKeys: number;
  readonly conflicts: number;
  readonly skippedEntries: number;
}
type PersonaRegistryDiagnostic =
  | { kind: "skip"; filename: string; reason: string }
  | { kind: "conflict"; key: string; filenames: string[] }
  | { kind: "summary"; registeredFiles: number; registeredKeys: number; conflicts: number; skippedEntries: number };
interface PersonaRegistryDependencies {
  readdir(directory: string): Promise<string[]>;
  lstat(path: string): Promise<{ isFile(): boolean; isSymbolicLink(): boolean }>;
  readFile(path: string, encoding: "utf8"): Promise<string>;
  diagnostic(event: PersonaRegistryDiagnostic): void;
}
const nodeDependencies: PersonaRegistryDependencies = {
  readdir: fs.readdir, lstat: fs.lstat, readFile: fs.readFile,
  diagnostic: (event) => console.warn("[pi-egm personas]", JSON.stringify(event)),
};
export class PersonaRegistryInitializationError extends Error {
  constructor(cause: unknown) {
    super("Persona registry initialization failed: cannot enumerate agents directory", { cause });
    this.name = "PersonaRegistryInitializationError";
  }
}
export class UnknownPersonaError extends Error {
  constructor() {
    super("Unknown or ambiguous persona name");
    this.name = "UnknownPersonaError";
  }
}
const normalize = (key: string) => key.trim().toLowerCase();

function declaredName(text: string): string | undefined {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0] !== "---") return;
  const end = lines.indexOf("---", 1);
  if (end < 0) return;
  const names = lines.slice(1, end).filter(line => /^\s*name\s*:/.test(line));
  if (names.length !== 1) return;
  return /^name:[ \t]*([A-Za-z0-9][A-Za-z0-9._-]*)[ \t]*$/.exec(names[0])?.[1];
}

export async function loadPersonaRegistry(
  packageRoot: string, dependencies: PersonaRegistryDependencies = nodeDependencies,
): Promise<PersonaRegistry> {
  const directory = path.join(packageRoot, "agents");
  let filenames: string[];
  try { filenames = await dependencies.readdir(directory); }
  catch (cause) { throw new PersonaRegistryInitializationError(cause); }
  const owners = new Map<string, PersonaRecord[]>();
  let skippedEntries = 0;
  const skip = (filename: string, reason: string) => {
    skippedEntries++;
    dependencies.diagnostic({ kind: "skip", filename, reason });
  };
  // Error messages may contain file contents supplied by a dependency. Log only codes.
  const failureReason = (operation: string, error: unknown) => {
    const code = (error as { code?: unknown } | null)?.code;
    return `${operation} failed${typeof code === "string" && /^[A-Z0-9_]{1,40}$/.test(code) ? ` (${code})` : ""}`;
  };
  for (const filename of filenames) {
    if (!filename.endsWith(".md")) continue;
    const filePath = path.join(directory, filename);
    let stat;
    try { stat = await dependencies.lstat(filePath); }
    catch (error) { skip(filename, failureReason("lstat", error)); continue; }
    if (stat.isSymbolicLink()) { skip(filename, "symbolic link"); continue; }
    if (!stat.isFile()) { skip(filename, "not a regular file"); continue; }
    let text: string;
    try { text = await dependencies.readFile(filePath, "utf8"); }
    catch (error) { skip(filename, failureReason("read", error)); continue; }
    const name = declaredName(text);
    if (!name) { skip(filename, "invalid frontmatter name or delimiters"); continue; }
    const record = { filePath, sourceFilename: filename, declaredName: name, filenameStem: filename.slice(0, -3) };
    for (const key of new Set([normalize(name), normalize(record.filenameStem)])) {
      const records = owners.get(key) ?? [];
      records.push(record);
      owners.set(key, records);
    }
  }
  const byNormalizedKey = new Map<string, PersonaRecord>();
  let conflicts = 0;
  for (const [key, records] of owners) {
    if (records.length === 1) byNormalizedKey.set(key, records[0]);
    else {
      conflicts++;
      dependencies.diagnostic({ kind: "conflict", key, filenames: records.map(record => record.sourceFilename).sort() });
    }
  }
  const counts = { registeredFiles: new Set(byNormalizedKey.values()).size, registeredKeys: byNormalizedKey.size, conflicts, skippedEntries };
  dependencies.diagnostic({ kind: "summary", ...counts });
  return { byNormalizedKey, ...counts };
}
export function lookupPersona(registry: PersonaRegistry, callerName: string): PersonaRecord {
  const record = registry.byNormalizedKey.get(normalize(callerName));
  if (!record) throw new UnknownPersonaError();
  return record;
}
