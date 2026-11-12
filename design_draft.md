# Manual Google EGM Shared-Content Updates for tklu

- **Author:** tklu
- **Status:** Overview & Goals, Technical Plan, Alternatives, and Implementation Plan approved. Separate implementation authorization is outstanding; source updater is not implemented.
- **Date:** 2026-11-11; **Updated:** 2026-11-12
- **Predecessor:** [Approved concept brief](concepts_brief.md)

## Overview

Provide an occasional, manually run Python 3 workflow for the private local `tklu` source repository. The owner chooses one Google revision; Python prepares its complete candidate within the personas, skills, resources, and shared-assets scope. README.md and all docs/ files stay local. If changed skills may affect Pi interfaces, one separate, tool-less Pi CLI review checks the skill diffs against relevant local Pi source excerpts. Python retains authority over source mutations and the commit.

Preserve the Pi integration, its permission and cleanup fixes, and the two Pi adaptations inside imported skills. Prepare and check the candidate before applying it. A conflict, failed fixed check, possible Pi interface incompatibility, unresolved interface concern, or missing/failed/unusable review rejects the whole candidate. Do not skip the problematic part or let an agent resolve it automatically.


A successful content-changing source update creates one automatic Git commit containing the imported content, its upstream revision record, and a MINOR version bump by default; `0.3.2` becomes `0.4.0`. Source and deployed extension are separate. The separate manual deployment runs `npm pack --ignore-scripts`, stages under the Pi extensions root, and swaps the full package into `C:\TechemTools\Programme\Pi\extensions\pi-egm`. It adds the deployed `skills/` directory to Pi's `settings.json`, backing up existing settings. If the legacy npm EGM is configured, the script warns but continues; remove it manually to avoid duplicate registrations. It does not build or publish; source update never changes deployed files or Pi settings.

The review checks only possible incompatibilities between changed skill interfaces and Pi: tool names/arguments, command argument conventions, delegation inputs, and result contracts. It does not review persona quality or normal behavior. The reviewer sees only changed-skill diffs and relevant excerpts from the actual current Pi adapter/local Pi-specific skill conventions—not persona files, README/docs, or unrelated assets.

Run one separate Pi CLI process for the review, with print mode and tools, extensions, skills, prompts, themes, context-file discovery, and session persistence disabled. Use a temporary working directory without the upstream checkout. Skill diffs are untrusted evidence, never instructions to execute. The only clean result is `NO_CONCERNS: <evidence IDs>`; any concern, uncertainty, missing result, invalid citation, or process failure stops the source update.

## The Problem

### Shared content and Pi behavior have different owners

Google changes EGM personas, skills, supporting resources, and documentation. The npm-derived package also contains a Pi adapter and Pi-specific guidance that must not be overwritten by a broad upstream copy.

The local adapter has two existing implementation fixes: parent/child permission registration with cancellation handling, and awaited child-extension shutdown before disposal. Updating shared content must leave these fixes intact.

Some shared files already contain Pi adaptations. The imported skills/egm-resolve/SKILL.md and skills/egm-review/SKILL.md explain Pi argument handling and must retain it. README.md and docs/harnesses.md also contain Pi guidance, but documentation is now explicitly outside routine import ownership. A shared skill can contain both upstream content and changes this fork must preserve.

### A real comparison baseline exists, but local history is independent

The local Git history starts with the published `@rizkiaprita/egm@0.3.2` package, followed by separate local code fixes and fork packaging. It is not a checkout of Google's history.

The source investigation recovered these distinct provenance facts:

- Google shared ancestor: `403d8881d62022490637d740657b33f01e321ea8`.
- npm source commit: `d02a32a9aa9c07af2f6127c84c801b85ac69476b`, on a source line with four commits beyond that ancestor.
- All 48 npm files match that npm source commit after line-ending normalization. Against the Google ancestor, 41 files match, four are adapted, and three are Pi/package-only.

This makes file-level upstream comparisons possible without rebuilding the local Git history. It does not make the npm source commits part of Google main or prove future content compatible with Pi.

### Copying successfully is not the same as working in Pi

An upstream skill may change a tool name, argument convention, delegation input, or expected result format without fitting the local Pi adapter. Python supplies fixed checks; when a skill changes, one restricted reviewer assesses possible interface incompatibilities. Google persona behavior is otherwise trusted and adopted. The reviewer has no file or other tools, and a clean verdict is not proof of compatibility.
The source update itself never changes Pi's deployed copy. After a successful source commit, a separate manual deployment stages and swaps the complete package while Pi may be running, then reminds the user to run `/reload`. A running instance stays on its loaded version until reload. If a new deployment fails, reset the source to the previous commit, deploy again, and reload. The swap must handle Windows locks and interruption.
To avoid duplicate EGM registrations, remove or disable the legacy npm package manually before using the local copy. The current deploy script only warns if it remains configured; it does not stop or remove it. The separate manual deployment intentionally adds the deployed `skills/` path to Pi's `settings.json`; the source updater itself never edits settings.

## Goals

1. **Deliberate, one-way imports.** Choose one Google revision and take its whole snapshot within the approved personas/skills/resources/assets scope, not individual commits. Keep README.md and all docs/ local. Never send local changes back to Google.
2. **Traceable content.** Record the exact upstream revision represented by a successful import and preserve the original source/version provenance. Keep source provenance distinct from `tklu`'s package version.
3. **Preserved local behavior.** Leave the Pi adapter, permission/cancellation fix, shutdown fix, package identity, and private-publication safeguard intact. Preserve known Pi adaptations wherever imported files share ownership.
4. **No unrelated changes.** Require a clean starting repository and reject states that would mix the import with the owner's other work. The exact preflight and interruption checks belong in the technical plan.
5. **All-or-nothing source update.** Prepare separately and run fixed checks plus the restricted Pi interface review when skills change. A conflict, failed check, possible incompatibility, unresolved interface concern, or unusable review leaves source files, version, history, and deployed installation unchanged. No deployment occurs during this process.
6. **One coherent success commit.** Commit the accepted content, upstream revision record, and version increment together. Default to a MINOR increment for a content-changing update. No-op behavior is fixed: no eligible upstream changes means no review, baseline advance, version bump, or commit.
7. **Bounded, actionable review.** For skill-changing candidates, report the interface verdict and evidence references. A clean line only permits the remaining checks; it is not proof of compatibility. Report the resolved revision, checks, result, version, and commit.
8. **Separate deployment and recovery.** Keep Pi pointed at the deployed copy under `C:\TechemTools\Programme\Pi\extensions\pi-egm`, separate from the source checkout. A distinct manual deployment packages with `npm pack --ignore-scripts`, stages under the extensions root, swaps the package, and registers the deployed `skills/` path in Pi's `settings.json` (backing up an existing settings file). The current script warns but continues if the legacy npm package remains configured; remove it manually to avoid duplicates. Source updates never deploy or modify Pi settings. Verify staging, backups, rollback, locks, and `/reload` behavior before relying on deployment.
9. **Windows and attribution.** Design for this Windows environment, use CRLF for authored text, and retain required Apache-2.0 licensing and copyright notices. State the recovery limits for in-place source rollback and deployed-directory swaps.

## Non-Goals

- A scheduler, background monitor, or automatic decision about which Google revision is worth adopting.
- Bidirectional synchronization, pull requests to Google, or changes contributed upstream.
- Replacing the Pi integration with another harness's adapter or importing Google's entire repository.
- Cherry-picking individual upstream commits or silently accepting only the compatible parts of the chosen candidate.
- Reconstructing Google ancestry inside the existing local commit history.
- Following the original npm publisher's future releases or adopting another project's version numbering.
- Automatic deployment or `/reload`, publication, upstream contribution, permanent remote creation, or pushing commits. Manual deployment is separate and explicit; it intentionally registers the deployed skills path in Pi's `settings.json`, while the source updater must not change settings.
- General persona-quality, editorial, or behavioral review; Google persona behavior is intentionally adopted.
- Proving every interface implication of arbitrary text, or claiming that structured review output proves semantic truth. Checks and review must state their coverage.
- A general-purpose synchronization framework, package manager, or semantic merge engine.

## Open Questions for the Technical Plan
## Technical Plan

### Components and ownership

- Add a root-level `update_shared_content.py`, using Python 3 standard library plus the Git CLI. It accepts one user-selected abbreviated hexadecimal Google commit ID; it does not select “latest” automatically or install dependencies.
- Store the last successful import in a tracked root-level `upstream-state.json` (`schema_version`, upstream repository, and full `last_imported_commit`). The first run uses the fixed historical baseline `403d8881d62022490637d740657b33f01e321ea8`; the state file is created only in the first successful content-changing commit. If a previously tracked state file is missing or invalid, stop rather than silently bootstrap again.
- Keep the importer’s ownership limited to path-identical `agents/**`, `skills/**` except `TEST.md` and `test_scenarios.yaml`, `resources/**`, and shared `assets/**`. Keep `README.md`, all `docs/**`, `index.ts`, `deploy.ps1`, fork metadata, and other local files outside upstream ownership. The only intentional non-import changes are the package `version` field and `upstream-state.json` in a successful update.
- The importer never deploys, edits Pi settings, creates a permanent remote, publishes, pushes, or rewrites local Git ancestry. Deployment remains a separate manual operation.

### Preflight and revision selection

1. Require invocation from this repository, a valid Python 3/Git runtime, and a clean Git worktree and index. Require the operator to ensure no other process is editing or using the source repository while the update runs. No updater lock is planned; this is a procedural exclusivity requirement, not protection against arbitrary concurrent writers.
2. Record the starting `HEAD` and repository state. Before applying any candidate, recheck that `HEAD`, index, and worktree still match the clean preflight. If not, abort without applying. The final check narrows—but cannot eliminate—the race with an unrelated writer; do not claim filesystem transactionality.
3. Fetch Google’s `main` into a temporary Git repository outside the source checkout. Do not add a remote to this repository. Accept only hexadecimal abbreviated hashes (7–40 characters), resolve to exactly one full commit SHA, and require the target to be reachable from fetched `main` and descended from the current baseline. Fetch enough history to prove ancestry. Invalid, ambiguous, missing, or out-of-scope targets fail closed.
4. Use the full SHA in all reports and in `upstream-state.json`. Validate the state schema and SHA before using it as the next three-way base. A no-op or rejected candidate does not advance this state.

### Candidate construction and merge rules

- Read the recorded baseline tree, selected upstream tree, and current local files. Build the complete candidate in a temporary directory outside the source repository; do not modify source files during fetch, merge, or review.
- Treat text content as LF-normalized for comparison and merge, then write changed text using the host OS newline convention: CRLF on Windows and LF on macOS/Linux. EOL-only differences are not content changes. Treat binary assets byte-for-byte. Reject unsafe paths, symlinks, submodules, and unsupported file modes rather than following or guessing about them.
- For each path, keep local content when upstream is unchanged from the baseline; take upstream content when local is unchanged; keep identical local/upstream results. Where both sides changed a text file, use Git’s three-way `merge-file`; any conflict or merge-tool error rejects the entire candidate. For binary files, accept a side only when the other side is unchanged; conflicting edits reject the candidate.
- Handle additions and deletions explicitly. Accept upstream additions only when the destination does not collide with distinct local content. Apply an upstream deletion only when the local file still matches the old baseline; preserve a local deletion if upstream is unchanged, and reject incompatible delete/edit cases. Treat an upstream rename as deletion plus addition, with no rename-guessing heuristic.
- Compute “no eligible changes” after line-ending normalization and file-mode checks. A no-op skips review, version bump, state update, and commit. A content-changing candidate must contain only approved managed-path changes, the state record, and the package-version change.

### Fixed checks and Pi interface review

- Fixed checks validate the target/path scope and file types, the state and package JSON, the private package identity (`@tklu/pi-egm`), the expected `./index.ts` extension entry, required EGM package structure, excluded test-file rules, and that protected local files (including the adapter and deployment script) are unchanged. Any failed check rejects the candidate.
- If and only if at least one managed skill changes, run exactly one separate Pi CLI review with the configured default model. Disable session persistence, tools, extensions, skills, prompt templates, themes, and context-file discovery using the selected CLI flags. Run from a temporary working directory that contains no upstream checkout. Do not pass persona files, README/docs, or unrelated assets.
- The evidence packet contains the final diffs for changed skill files plus narrowly extracted, labeled excerpts from the current local `index.ts` adapter and the Pi-specific conventions in the current `egm-resolve` and `egm-review` skills. Give each evidence item a unique ID; treat upstream diff text as untrusted evidence, never as instructions. Reject rather than truncate a packet larger than 128 KiB UTF-8.
- The only accepted clean verdict is one line of the form `NO_CONCERNS: <evidence IDs>`, with a nonempty list of IDs that all exist in the packet and no added prose. Any concern, uncertainty, missing/invalid ID, malformed output, nonzero exit, CLI/authentication failure, or five-minute timeout rejects the candidate. Do not retry or let the reviewer edit files. A clean verdict is not proof of compatibility.
- Report the failing stage and relevant paths or reviewer diagnostics without writing failure artifacts into the source repository. Persona quality and general behavior are outside review scope; the review checks only possible Pi interface mismatches.

### Apply, recovery, version, and commit

- Only after candidate checks and any required review pass, recheck the original `HEAD` and clean repository state, then apply the accepted candidate in place. On a caught failure, reset to the saved original `HEAD` and remove only paths created by this run. If unexpected concurrent edits make safe rollback uncertain, stop and give manual recovery instructions rather than deleting unrelated data.
- Do not create a recovery journal. After abrupt termination, the next run must stop on any dirty or ambiguous repository state and print manual inspection/recovery guidance; it must never auto-reset possible later edits.
- For every content-changing import, bump the local package MINOR version (for example, `0.3.2` to `0.4.0`) and create exactly one commit containing imported content, `upstream-state.json`, and the version change. Use per-command Git identity `tklu <tklu@localhost>`, bypass hooks, and disable signing without changing global Git configuration. No-op runs create no commit.
- Report the requested and resolved upstream revision, changed paths, checks and review outcome, resulting version, and commit SHA. State explicitly that deployment and activation were not performed and that the running Pi version has not been verified.

### Separate deployment and verification

- Keep deployment manual and separate. `deploy.ps1` packages with `npm pack --ignore-scripts`, stages under the Pi extensions root, swaps into `C:\TechemTools\Programme\Pi\extensions\pi-egm`, backs up an existing package, and registers the deployed `skills` path in Pi’s `settings.json`. It warns but continues if `npm:@rizkiaprita/egm` remains configured; the operator must remove that package manually to avoid duplicate registrations.
- If skills registration fails after the package swap, keep the new deployment and prior-package backup in place, stop, and report the partial state and manual recovery steps. Do not claim deployment is all-or-nothing. On success, remind the operator to restart Pi or run `/reload`; a running process does not activate the new copy until reload.
- Before relying on deployment, verify it in an isolated temporary Pi directory with fake packaging/extraction commands and temporary settings—not the real Pi installation or network. Cover package validation, safe extraction, settings backup/idempotence, legacy-package warning, swap failure restoration, registration failure with the selected keep-and-report behavior, staging cleanup, and Windows rename/lock limitations. The script has not been run or tested as part of this design work.
- Planned source-updater tests use Python `unittest`, temporary Git repositories, and a fake Pi CLI; they must not use the live Google repository, configured model, real Pi settings, or deployment directory. Cover revision validation/ancestry, merge/add/delete/rename and binary/EOL cases, no-op behavior, scope/path checks, reviewer packet/parser/timeout/size failures, version/state generation, commit metadata, pre-apply state changes, and caught-failure rollback. The exact test command and any deployment-script changes must be reviewed before implementation.

*This Technical Plan is a draft for review. No source-updater implementation, deployment execution, or code change is authorized by this section; implementation requires separate explicit authorization.*

## Alternatives Considered

The choices below explain why the approved design uses a deliberately bounded updater. They record accepted trade-offs; they do not reopen approved decisions.

| Alternative | Disposition and trade-off |
| --- | --- |
| Copy the full upstream package or repository | Rejected. It would bring unrelated harness content and could overwrite the Pi adapter, private package identity, local documentation, and known local fixes. The importer instead uses the explicit shared-content mapping. |
| Blind overwrite, partial import, or cherry-pick individual commits | Rejected. Overwrite can erase local adaptations; partial import can leave related content inconsistent; cherry-picking complicates the baseline. Use the complete selected revision within the managed scope, three-way merge non-conflicting edits, and reject the whole candidate on conflicts. |
| General-purpose semantic merge or synchronization framework | Rejected as disproportionate for occasional manual updates. The supported contract is explicit path mapping, text three-way merge, byte-wise binary handling, and fail-closed behavior for unsupported cases. |
| No compatibility review, or a broad persona/behavior review | Rejected. Fixed checks alone may miss Pi interface assumptions in skill prose, while reviewing persona quality is outside scope. Use one restricted Pi CLI review only when skills change; accept its latency and model/authentication dependency, and do not treat a clean verdict as proof. |
| Agent-only updater or in-process reviewer | Rejected. Instructions alone do not enforce file ownership and commit safeguards; an in-process extension reviewer has broader ambient context. Python and Git control changes, while a separate restricted Pi CLI process reviews bounded evidence. |
| Review branch, uncommitted output, or separate metadata commit | Rejected. These add user staging burden or split one logical update. Prepare and validate outside the source tree, then make one hook-free, unsigned commit containing content, state, and the MINOR version bump. The accepted trade-off is that a successful update commits automatically. |
| Updater lock and crash journal | Not selected. They could coordinate updater runs or aid recovery, but add locking and journal lifecycle complexity. The operator must ensure exclusive repository use; checks run before application; caught failures roll back; abrupt termination requires manual recovery. This does not protect against arbitrary concurrent writers or promise power-loss atomicity. |
| Commit trailer instead of tracked revision state | Rejected. A root `upstream-state.json` makes the current imported revision directly inspectable and is committed with the update. The trade-off is one additional tracked file. |
| Preserve upstream or existing file line endings uniformly | Rejected in favor of host-native output for changed text: CRLF on Windows and LF on macOS/Linux. Comparisons normalize to LF so EOL-only changes are no-ops. The accepted trade-off is that equivalent updates can produce different Git blobs when run on different operating systems. Binary assets remain byte-for-byte. |
| Couple deployment to source update, or roll back deployment whenever settings registration fails | Rejected. Source update and activation remain separate manual operations. If registration fails after the package swap, keep the new package and old backup and report the partial state for manual recovery; this is simpler but not an all-or-nothing deployment. |

The principal costs accepted are operational care (manual exclusivity and crash recovery), reviewer latency and fail-closed stops, OS-dependent text blobs, and a deployment that may require manual recovery. These limits are explicit rather than hidden behind broader correctness claims.

## Implementation Plan

### Scope and file layout

- Add root-level `update_shared_content.py` as a private maintenance tool, plus `tests/test_update_shared_content.py` using only Python’s standard `unittest` framework. Keep the updater and tests out of the npm package contents; do not change `deploy.ps1` or Pi settings.
- Keep implementation in one small script with separable functions for CLI/preflight, Git invocation, state and path validation, candidate/merge construction, reviewer packet and verdict parsing, apply/rollback, versioning, and reporting. Avoid a new dependency or generic plugin framework.
- Use temporary source and bare Git repositories in tests to model the historical baseline and selected upstream target. Inject/fake the Pi CLI process so tests can cover reviewer results without invoking the configured model.

### Work sequence

1. Preserve the existing working-tree content; do not reset or discard it. Before any future live updater run, require a clean source repository. Use disposable temporary repositories for development tests and keep the deployed extension and Pi configuration out of scope.
2. Implement and test pure helpers first: abbreviated-SHA validation, managed-path selection, state JSON validation, OS-native newline conversion, binary/text classification, version bumping, and strict reviewer verdict parsing.
3. Implement external temporary-repository fetch and ancestry validation, then candidate construction for unchanged/changed files, additions, deletions, renames, text merges, binary conflicts, and no-op detection. Test all cases with local fixture repositories; do not contact Google during tests.
4. Add fixed candidate checks and the restricted reviewer adapter. Before wiring a real reviewer call, verify the installed Pi CLI help documents the selected isolation flags and a safe prompt-input method; do not submit a model prompt during implementation. If the CLI contract differs from the approved design, stop and return the discrepancy for review.
5. Implement apply, caught-error rollback, version/state updates, the single Git commit, and user-facing reports. Test successful and rejected runs in disposable source repositories, asserting that rejections leave the repository unchanged and successes create exactly one expected commit.
6. Review the final diff and test results. Do not run the updater against this working repository or a real Google revision during implementation. Leave `deploy.ps1`, Pi `settings.json`, the deployed extension, and npm publication untouched.

### Verification and acceptance criteria

- Run `py -3 -B -m unittest discover -s tests -v` on Windows (or the equivalent Python 3 unittest command with bytecode writing disabled on another supported host). The `-B` flag prevents bytecode caches from appearing in this repo. Tests must use temporary local Git repositories and fake reviewer processes, with no network, configured-model request, real Pi settings, or deployment directory.
- Cover unique/ambiguous/invalid hashes and ancestry; scope exclusions and unsafe entries; text merge and conflict; binary add/change/delete; add/delete/rename handling; EOL-only no-op and Windows versus macOS/Linux newline output; state bootstrap/update/no-op; reviewer trigger, packet cap, timeout, malformed output, and invalid evidence IDs; caught-failure rollback; version bump; commit count/identity/hooks/signing; and source-state changes detected before apply.
- Acceptance requires the test suite to pass, no change to `deploy.ps1` or Pi configuration, and test evidence that every pre-apply rejection leaves the disposable source repository unchanged while a successful fixture update creates one coherent commit. Inspect the final source diff, test file paths, and line endings before reporting results.
- Do not execute a real update or deployment as part of implementation. After implementation review, the user must separately authorize any live import, model review, or deployment operation.

*This Implementation Plan is design only. It does not authorize code changes, test execution, a live upstream import, a Pi model call, or deployment.*

## Additional Resources

- [Approved concept brief and baseline investigation](concepts_brief.md)
- [Published npm metadata](https://registry.npmjs.org/@rizkiaprita%2Fegm/0.3.2)
- [Verified Google baseline](https://github.com/google/elephant-goldfish-model/commit/403d8881d62022490637d740657b33f01e321ea8)
- [npm source commit](https://github.com/google/elephant-goldfish-model/commit/d02a32a9aa9c07af2f6127c84c801b85ac69476b)

*Drafted with EGM. Overview & Goals, Technical Plan, Alternatives, and Implementation Plan approved by the user. Source-updater implementation is not authorized. No source updater exists; `deploy.ps1` remains untested. No code has been changed or run in this continuation.*
