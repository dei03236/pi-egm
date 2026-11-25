# pi-egm

This is an Elephant–Goldfish Model (EGM) extension for the [Pi coding agent](https://pi.dev). You can draft specifications with your main agent, then have fresh-context reviewer subagents challenge the design before you implement it.

This project started as an independent fork of [`@rizkiaprita/egm@0.3.2`](https://www.npmjs.com/package/@rizkiaprita/egm/v/0.3.2), maintained as `@tklu/pi-egm`. It is not an official Google or Pi project.

## Other Pi ports and what makes this fork different

Other EGM ports for Pi include [`@schultzp2020/pi-egm`](https://www.npmjs.com/package/@schultzp2020/pi-egm), [`@estebanforge/pi-egm`](https://www.npmjs.com/package/@estebanforge/pi-egm), and [`@rizkiaprita/egm`](https://www.npmjs.com/package/@rizkiaprita/egm), on which this fork is based.

This fork focuses on:

- **Fixing Pi integration bugs** in the original `@rizkiaprita/egm@0.3.2` package, as detailed below.
- **Being self-contained:** the extension, subagent runtime integration, personas, and skills are bundled together. It does not depend on other Pi add-on packages such as `pi-subagents`; it uses Pi's own SDK to create child sessions. Pi itself and its host-provided libraries are still required.
- **Keeping Google's personas current:** the bundled upstream personas were last updated on **2026-11-25**.


## Persona diagnostics

The successful persona initialization is silent. Conflicts, skipped entries, and initialization failures are reported through Pi's UI, never directly to the terminal.

To capture detailed diagnostics (including the initialization summary), set `PI_EGM_DEBUG_LOG` to a writable log-file path before starting Pi. Events are appended to that file; logging failures are ignored so they cannot interrupt initialization.

## Why this fork exists

The original Pi package had bugs in its subagent integration that needed fixing. This fork addresses them and updates the reviewer personas that were outdated in `@rizkiaprita/egm@0.3.2`.

The Pi-specific fixes include:

- **Permission forwarding:** announce child sessions before binding their extensions so permission prompts can be forwarded to the parent session, including nested runs.
- **Cancellation:** propagate cancellation to the child session instead of leaving the subagent running independently.
- **Child-session cleanup:** await extension shutdown handlers before disposing of a child session, allowing extensions to release timers and other resources.
- **Persona resolution:** replace hard-coded aliases and an unsafe filename fallback with a session-local registry. Unknown or ambiguous personas fail explicitly rather than silently running without the intended persona.
- **Role-specific tool access:** select synthesizer and bootstrap privileges from the resolved persona's identity, rather than the spelling of the caller-supplied alias. Ordinary reviewers have read-only tools.


## Install in Pi

The Pi SDK compatibility baseline for this fork is **Pi 1.5.2**, used for the integration review. A minimum supported Pi version has not been established; compatibility with other releases is not guaranteed.

Install the public npm package in Pi:

```sh
pi install npm:@tklu/pi-egm
```

Alternatively, install directly from this repository:

```sh
pi install git:github.com/dei03236/pi-egm
```

Restart Pi after installation. The package supplies both the Pi extension and its EGM skills; no separate subagent extension is required.

**Do not load this fork alongside `@rizkiaprita/egm`:** both register the same tool and skills. If replacing that package, back up any modifications to its installed files before removing it:

```sh
pi remove npm:@rizkiaprita/egm
pi install npm:@tklu/pi-egm
```

The package is published publicly on npm as [`@tklu/pi-egm`](https://www.npmjs.com/package/@tklu/pi-egm).

## Use in Pi

Your main Pi agent retains the project context and helps you develop a design. The extension's `invoke_subagent` tool runs Goldfish reviewers in separate, in-memory sessions, without the main conversation history. Reviewers receive their persona, the task, and any supplied context-file paths, which they can inspect using read tools. You decide which findings to address and when a design is ready to implement.
### Roles and responsibilities

| Role | Context | Responsibility |
| --- | --- | --- |
| **Elephant — your main Pi agent** | Your project, requirements, conversation, and earlier decisions. | Explore the problem, develop the design, and draft the specification. |
| **Goldfish — fresh-context reviewers** | The review task, document, and referenced source material, without the main conversation history. | Challenge assumptions, identify unclear requirements, and expose implementation risks. |
| **You** | The goals and constraints that matter. | Resolve trade-offs, choose which findings to address, approve the design, and decide when to implement. |

### Review existing work

You do not need to brainstorm or draft a new specification first. Review an existing design document or a PR plan saved as Markdown:

```text
/skill:egm-review docs/designs/webhooks.md
```

Reviewers examine the document and relevant source code. To compare existing documentation with the current implementation instead:

```text
/skill:egm-drift-report docs/designs/
```

Replace these example paths with your own. You decide whether to update the document or the code.

### Choose a workflow

Invoke the bundled skills using Pi's `/skill:` commands:

| Skill | Purpose |
| --- | --- |
| `/skill:egm-brainstorm` | Explore an idea and develop a concept brief. |
| `/skill:egm-draft` | Turn a brief or notes into a design document. |
| `/skill:egm-review` | Review a design with fresh-context reviewers. |
| `/skill:egm-resolve` | Work through review findings and agree on changes. |
| `/skill:egm-review-loop` | Run a configurable review loop and apply approved fixes. |
| `/skill:egm-bootstrap` | Create or update directory README files for an existing codebase. |
| `/skill:egm-lite` | Fast-track small iterations, specification revisions, refactors, and bug fixes. |
| `/skill:egm-drift-report` | Compare design documents with the current implementation. |

Ordinary reviewer subagents have read-only tools, but the workflows are not entirely read-only: they can create concept briefs, drafts, and review reports. Review-loop can apply approved changes, and bootstrap subagents have file-writing, editing, and shell access.

### Develop a new design
For example:

```text
/skill:egm-brainstorm Add webhook delivery with retries to this project.
/skill:egm-draft
/skill:egm-review design_draft.md
```

Use the document path produced by your session. You can also review an existing document without first brainstorming or drafting. Reviews supplement tests and human judgment; they do not replace them.
### Small changes with EGM Lite

For a smaller task, use the lightweight workflow instead of drafting a full design document:

```text
/skill:egm-lite Refactor webhook retry handling without changing its behavior.
```

EGM Lite separates critique, checklist creation, implementation, and fresh-context review. Follow its prompts one phase at a time; implementation requires an explicit `exec` command or **Proceed** approval after the checklist or triage phase. It can modify code and specifications, so it is not a read-only review workflow.

### Upstream documentation

- [Workflow guide](https://github.com/google/elephant-goldfish-model/blob/main/docs/getting_started.md): the full design process and document layout.
- [Architecture](https://github.com/google/elephant-goldfish-model/blob/main/docs/designs/architecture.md): how skills and reviewers fit together.

These guides describe Google's upstream plugin. For Pi installation and command syntax, use the instructions above.

## Development

The Pi integration lives in `index.ts`, persona discovery in `persona-registry.ts`, reviewer definitions in `agents/`, and workflows in `skills/`.

The test suite requires Node.js with both TypeScript stripping (`--experimental-strip-types`) and `node:module.registerHooks` support. It has been run successfully on **Node.js 24.16.0**; this is a tested version, not a minimum-version claim.

```sh
npm test
```

Please report fork-specific bugs and submit changes in [this repository](https://github.com/dei03236/pi-egm/issues).

## License and attribution

[Apache License 2.0](LICENSE). This fork is based on `@rizkiaprita/egm@0.3.2` and incorporates selected material from Google's Elephant–Goldfish Model project. Original copyright notices and the license are retained. This is not an officially supported Google product.
