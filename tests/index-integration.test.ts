import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { loadPersonaRegistry, PersonaRegistryInitializationError, UnknownPersonaError } from "../persona-registry.ts";

// Only the two host imports are stubbed; orchestration runs from the real index.ts.
const sources: Record<string, string> = {
  "@earendil-works/pi-coding-agent": "export const createAgentSession = () => { throw Error('unexpected host call'); }; export const SessionManager = { inMemory() { throw Error('unexpected host call'); } };",
  "typebox": "export const Type = new Proxy({}, { get: () => (...args) => args });",
};
const hooks = registerHooks({ resolve(specifier, context, next) {
  if (sources[specifier]) return { url: `data:text/javascript,${encodeURIComponent(sources[specifier])}`, shortCircuit: true };
  return next(specifier, context);
} });
const { __testing, default: extension } = await import("../index.ts");
hooks.deregister();

async function registry() {
  return loadPersonaRegistry("/fixed", {
    readdir: async () => ["synthesizer.md"],
    lstat: async () => ({ isFile: () => true, isSymbolicLink: () => false }),
    readFile: async () => "---\nname: egm-synthesizer\n---\nPERSONA", diagnostic: () => {},
  });
}
function harness(outcome: any, options: { readFailure?: boolean; bindFailure?: boolean; promptFailure?: boolean; shutdownFailure?: boolean } = {}) {
  const log: string[] = [];
  const reads: string[] = [];
  const creations: any[] = [];
  const dependencies: any = {
    sessionManager: () => ({ getSessionId: () => "child" }),
    createAgentSession: async (config: any) => {
      creations.push(config);
      return { session: {
        abort: async () => { log.push("abort"); },
        bindExtensions: async () => { log.push("bind"); if (options.bindFailure) throw Error("bind failed"); },
        prompt: async (text: string) => { log.push(`prompt:${text}`); if (options.promptFailure) throw Error("prompt failed"); },
        getLastAssistantText: () => "result",
        extensionRunner: { hasHandlers: () => true, emit: async () => { log.push("shutdown"); if (options.shutdownFailure) throw Error("shutdown failed"); } },
        dispose: () => log.push("dispose"),
      } };
    },
    readFile: async (p: string) => {
      reads.push(p);
      if (options.readFailure) throw Error("read failed");
      return "PERSONA";
    },
  };
  const events: any = { emit: (name: string) => log.push(name) };
  const context: any = { cwd: "/work", model: {}, sessionManager: { getSessionId: () => "parent" }, ui: { setStatus: (value: any) => log.push(value ? "status" : "clear") } };
  const tool = __testing.createSubagentToolDefinition("/fixed", events, outcome, dependencies);
  const invoke = (name: string, selected = tool, signal?: AbortSignal) => selected.execute("id", { subagent_type: name, prompt: "TASK" }, signal, undefined, context);
  return { log, reads, creations, invoke };
}
function assertCleanup(log: string[]) {
  assert.ok(log.includes("subagents:child:session-created"));
  assert.ok(log.includes("subagents:child:bound"));
  assert.deepEqual(log.slice(-4), ["shutdown", "dispose", "subagents:child:disposed", "clear"]);
}

test("parent and nested tools share one initialization and read only registry paths", async () => {
  let loads = 0;
  const outcome = __testing.initializeRegistry("/fixed", async () => { loads++; return registry(); });
  const h = harness(outcome);
  const result = await h.invoke("egm-synthesizer");
  assert.equal(result.details.status, "completed");
  const nested = h.creations[0].customTools[0];
  await h.invoke(" SyNtHeSiZeR ", nested);
  assert.equal(loads, 1);
  const resolved = (await outcome as any).registry.byNormalizedKey.get("synthesizer").filePath;
  assert.deepEqual(h.reads, [resolved, resolved]);
  assert.ok(h.log.some(item => item.includes("PERSONA") && item.includes("TASK")));
  assertCleanup(h.log);
});

test("initialization rejection while idle is handled immediately and shared with nested tools", async t => {
  const unhandled: unknown[] = [];
  const listener = (error: unknown) => unhandled.push(error);
  process.on("unhandledRejection", listener);
  t.after(() => process.off("unhandledRejection", listener));
  const cause = new Error("enumeration unavailable");
  let loads = 0;
  const outcome = __testing.initializeRegistry("/fixed", async () => { loads++; throw cause; });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(unhandled, []);
  const h = harness(outcome);
  await assert.rejects(h.invoke("egm-synthesizer"), (error: any) => {
    assert.ok(error instanceof PersonaRegistryInitializationError);
    assert.equal(error.cause, cause);
    return true;
  });
  await assert.rejects(h.invoke("egm-synthesizer", h.creations[0].customTools[0]), PersonaRegistryInitializationError);
  assert.equal(loads, 1);
  assert.deepEqual(h.reads, []);
  assert.ok(!h.log.some(item => item.startsWith("prompt:")));
  assertCleanup(h.log);
});

test("unknown names never read a caller-derived path or prompt and still clean up", async () => {
  const outcome = __testing.initializeRegistry("/fixed", registry);
  for (const name of ["../../secret", "C:\\secret", "egm-design-critic", "egm-bootstrap", "missing"]) {
    const h = harness(outcome);
    await assert.rejects(h.invoke(name), UnknownPersonaError);
    assert.deepEqual(h.reads, []);
    assert.ok(!h.log.some(item => item.startsWith("prompt:")));
    assertCleanup(h.log);
  }
});

test("bind, prompt, shutdown and cancellation failures preserve disposal notifications", async () => {
  const outcome = __testing.initializeRegistry("/fixed", registry);
  for (const options of [{ readFailure: true }, { bindFailure: true }, { promptFailure: true }, { shutdownFailure: true }]) {
    const h = harness(outcome, options);
    await assert.rejects(h.invoke("synthesizer"));
    assert.deepEqual(h.log.slice(-4), ["shutdown", "dispose", "subagents:child:disposed", "clear"]);
  }
  const h = harness(outcome);
  await assert.rejects(h.invoke("synthesizer", undefined, AbortSignal.abort()));
  assert.deepEqual(h.log.slice(-4), ["shutdown", "dispose", "subagents:child:disposed", "clear"]);
});
test("caller-substring tool permissions remain case-sensitive and unchanged (Issue 2)", async () => {
  const outcome = __testing.initializeRegistry("/fixed", registry);
  for (const [name, expected] of [
    ["egm-synthesizer", ["read", "grep", "find", "ls", "write", "invoke_subagent"]],
    ["SYNTHESIZER", ["read", "grep", "find", "ls"]],
    ["unknown-bootstrap", ["read", "grep", "find", "ls", "write", "edit", "bash", "invoke_subagent"]],
  ] as const) {
    const h = harness(outcome);
    try { await h.invoke(name); } catch (error) { assert.ok(error instanceof UnknownPersonaError); }
    assert.deepEqual(h.creations[0].tools, expected);
  }
});

test("extension registers the integrated tool without launching a child", () => {
  const tools: any[] = [];
  extension({ registerTool: (tool: any) => tools.push(tool), events: { emit() {} } } as any);
  assert.equal(tools.length, 1);
  assert.equal(tools[0].name, "invoke_subagent");
});
