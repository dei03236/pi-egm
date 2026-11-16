// Copyright 2026 Google LLC.
// SPDX-License-Identifier: Apache-2.0

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import * as fs from "node:fs/promises";
import { loadPersonaRegistry, lookupPersona, PersonaRegistryInitializationError } from "./persona-registry.ts";
import type { PersonaRegistry } from "./persona-registry.ts";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const packageRoot = currentDir;

type RegistryOutcome = { ok: true; registry: PersonaRegistry } | { ok: false; cause: unknown };
function initializeRegistry(root: string, load = loadPersonaRegistry): Promise<RegistryOutcome> {
  return load(root).then(
    registry => ({ ok: true as const, registry }),
    cause => ({ ok: false as const, cause }),
  );
}

const READ_ONLY_REVIEWER_TOOLS = ["read", "grep", "find", "ls"];
const SYNTHESIZER_TOOLS = ["read", "grep", "find", "ls", "write", "invoke_subagent"];
const BOOTSTRAP_TOOLS = ["read", "grep", "find", "ls", "write", "edit", "bash", "invoke_subagent"];

const SubagentInputSchema = Type.Object({
  subagent_type: Type.String({
    description: "The persona name (e.g. 'egm-zoom-out', 'egm-synthesizer', 'egm-design', 'egm-comprehension')",
  }),
  prompt: Type.String({
    description: "The task instructions for the subagent to execute",
  }),
  mode: Type.Optional(Type.String({
    description: "Optional operating mode: 'REVIEW' or 'BRAINSTORM'",
  })),
  context_files: Type.Optional(Type.Array(Type.String(), {
    description: "Optional list of context files to supply to the subagent",
  })),
});

type SubagentInput = {
  subagent_type: string;
  prompt: string;
  mode?: string;
  context_files?: string[];
};

// Internal seam: tests supply sessions and reads without launching the host.
const runtime = { createAgentSession, sessionManager: () => SessionManager.inMemory(), readFile: fs.readFile };
export const __testing = { initializeRegistry, createSubagentToolDefinition };

function createSubagentToolDefinition(
  pkgRoot: string, events: ExtensionAPI["events"], registryOutcome: Promise<RegistryOutcome>, dependencies = runtime,
) {
  return {
    name: "invoke_subagent",
    label: "invoke_subagent",
    description: "Spawn a fresh-context Goldfish reviewer or Synthesizer in an isolated in-memory session.",
    parameters: SubagentInputSchema,
    execute: async (
      _toolCallId: string,
      params: SubagentInput,
      _signal: AbortSignal | undefined,
      _onUpdate: unknown,
      ctx: ExtensionContext
    ) => {
      const subagent = (params.subagent_type || (params as any).persona || (params as any).name || "").trim();
      const taskPrompt = params.prompt || (params as any).task || (params as any).instructions || "";
      const outcome = await registryOutcome;
      if (!outcome.ok) {
        throw outcome.cause instanceof PersonaRegistryInitializationError
          ? outcome.cause : new PersonaRegistryInitializationError(outcome.cause);
      }
      const persona = lookupPersona(outcome.registry, subagent);
      const role = persona.sourceFilename === "synthesizer.md" && persona.declaredName === "egm-synthesizer"
        ? "synthesizer"
        : persona.sourceFilename === "bootstrap_orchestrator.md" && persona.declaredName === "egm-bootstrap-orchestrator"
          ? "bootstrap"
          : "reviewer";

      let activeTools: string[] = READ_ONLY_REVIEWER_TOOLS;
      let customTools: any[] = [];
      if (role === "synthesizer") {
        activeTools = SYNTHESIZER_TOOLS;
        customTools = [createSubagentToolDefinition(pkgRoot, events, registryOutcome, dependencies)];
      } else if (role === "bootstrap") {
        activeTools = BOOTSTRAP_TOOLS;
        customTools = [createSubagentToolDefinition(pkgRoot, events, registryOutcome, dependencies)];
      }

      const sessionManager = dependencies.sessionManager();
      const { session: childSession } = await dependencies.createAgentSession({
        sessionManager,
        cwd: ctx.cwd,
        tools: activeTools,
        customTools,
        model: ctx.model,
      });

      const sessionId = sessionManager.getSessionId();
      const parentSessionId = ctx.sessionManager.getSessionId();
      const abortChild = () => { void childSession.abort(); };
      _signal?.addEventListener("abort", abortChild, { once: true });

      try {
        _signal?.throwIfAborted();

        // Announce synchronously before binding so the permission extension can
        // detect this child and forward asks to its parent, including nested runs.
        events.emit("subagents:child:session-created", { sessionId, parentSessionId });
        await childSession.bindExtensions({});
        events.emit("subagents:child:bound", { sessionId, parentSessionId });
        _signal?.throwIfAborted();

        let assembledPrompt = "";
        const personaText = await dependencies.readFile(persona.filePath, "utf8");
        assembledPrompt += `You are operating as the specialized persona defined below:\n\n${personaText}\n\n---\n\n`;
        if (params.mode) {
          assembledPrompt += `Mode: ${params.mode}\n\n`;
        }
        if (Array.isArray(params.context_files) && params.context_files.length > 0) {
          assembledPrompt += `Context files to examine:\n${params.context_files.map((f: string) => `- ${f}`).join("\n")}\n\n`;
        }
        assembledPrompt += taskPrompt;

        if (ctx.ui?.setStatus) {
          ctx.ui.setStatus(`Goldfish [${subagent}] running...`);
        }
        _signal?.throwIfAborted();
        await childSession.prompt(assembledPrompt);
        const resultText = childSession.getLastAssistantText() || "";
        return {
          content: [{ type: "text", text: resultText || "Review completed with no output." }],
          details: { subagent, status: "completed" },
        };
      } finally {
        _signal?.removeEventListener("abort", abortChild);
        try {
          try {
            // Raw SDK dispose() invalidates ctx without notifying extensions.
            // Let child extensions release timers and other resources first.
            const runner = childSession.extensionRunner;
            if (runner.hasHandlers("session_shutdown")) {
              await runner.emit({ type: "session_shutdown", reason: "quit" });
            }
          } finally {
            // Disposal and the outer registry notification must survive errors
            // from shutdown emission as well as bind/prompt/cancellation paths.
            childSession.dispose();
          }
        } finally {
          events.emit("subagents:child:disposed", { sessionId });
          if (ctx.ui?.setStatus) {
            ctx.ui.setStatus(undefined);
          }
        }
      }
    },
  };
}

export default function egmExtension(pi: ExtensionAPI) {
  const registryOutcome = initializeRegistry(packageRoot);
  pi.registerTool(createSubagentToolDefinition(packageRoot, pi.events, registryOutcome));
  pi.on("session_start", async (_event, ctx) => {
    const outcome = await registryOutcome;
    if (!ctx.hasUI) return;
    if (!outcome.ok) {
      ctx.ui.notify("EGM: persona registry initialization failed; subagents are unavailable.", "error");
    } else if (outcome.registry.conflicts || outcome.registry.skippedEntries) {
      ctx.ui.notify(
        `EGM personas: ${outcome.registry.conflicts} conflicts, ${outcome.registry.skippedEntries} skipped entries. Set PI_EGM_DEBUG_LOG to a file path for details.`,
        "warning",
      );
    }
  });
  // Slash commands are the skill commands Pi derives from skills/. Do not
  // register /egm-* commands here: prompt shims that forward to a skill showed
  // up twice in the command menu, and command names registered here on top of
  // them make Pi hosts reject the whole command list as duplicates.
}