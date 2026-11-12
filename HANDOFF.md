# tklu EGM Updater — Handoff

**Written:** 2026-11-11; **Updated:** 2026-11-12  
**Workspace:** `C:\TechemTools\Projekte\sources\pi-egm`  
**Status:** All four design sections approved. Source updater not implemented; separate implementation authorization is outstanding. `deploy.ps1` has not been run or tested.

## Resume here

The user approved all four sections in `design_draft.md`. The approved implementation scope is the source updater and isolated tests only. Implementation is not authorized yet; obtain separate explicit authorization before any code changes or test execution. No code has been changed or run.

Decisions incorporated in the approved design: manual source-repository exclusivity only (no updater lock), with a pre-apply state recheck; LF-normalized text comparisons/merges and host-native output (CRLF on Windows, LF on macOS/Linux), with EOL-only changes treated as no-op and binary files compared byte-for-byte; tracked root-level `upstream-state.json`; one Pi review capped at five minutes and 128 KiB; no `deploy.ps1` changes in the approved implementation scope; and if skills registration fails after deployment swap, keep the new package and old backup and report manual recovery.

Next: wait for explicit authorization to implement the source updater and tests. Do not execute a live import, invoke the configured Pi model, change or test `deploy.ps1`, alter Pi settings, or deploy unless separately authorized.

## Current repository state

- Branch: `main`, last commit `6923749 Prepare private local tklu fork`.
- Git history has four commits: exact npm snapshot; permission/cancellation fix; child shutdown fix; private local `tklu` packaging.
- Working tree at inspection: modified `FORK.md`, `README.md`, `docs/harnesses.md`, and `package.json`; deleted `extensions/index.ts`; untracked `HANDOFF.md`, `concepts_brief.md`, `design_draft.md`, `deploy.ps1`, and root `index.ts`. The three documentation files were reconciled in this session; no code was changed or run.
- `package.json` now names `@tklu/pi-egm` and points the extension entry to `./index.ts`; `deploy.ps1` targets `C:\TechemTools\Programme\Pi\extensions\pi-egm`.
- The previous handoff recorded the active Pi package as `npm:@rizkiaprita/egm`; current `settings.json` was not inspected here. `deploy.ps1` warns but continues if that package is configured. Do not run deployment or change Pi settings without explicit authorization.
- The source repository is not the live extension. No source-updater implementation exists. `deploy.ps1` is present; static inspection only, not executed or tested.

## Verified upstream provenance

- npm package: `@rizkiaprita/egm@0.3.2`.
- npm `gitHead`: `d02a32a9aa9c07af2f6127c84c801b85ac69476b`.
- Actual common Google ancestor: `403d8881d62022490637d740657b33f01e321ea8`.
- npm source line is four commits beyond that ancestor; it is not Google `main` ancestry.
- All 48 npm files match the npm source tree after line-ending normalization. Relative to the Google ancestor: 41 identical files, four Pi-adapted files, and three Pi/package-only files.
- Pi-adapted shared files: `README.md`, `docs/harnesses.md`, `skills/egm-resolve/SKILL.md`, and `skills/egm-review/SKILL.md`. Routine imports will keep README and all `docs/` local; the two adapted skills remain in the import scope and need three-way merge handling.
- Pi/package-only files include `package.json`, `index.ts`, and `docs/pi.md`. Preserve the local adapter and its two fixes.
- Research target used for examples: Google `main` commit `0f06dd7230261c00f0e03bd8d3ca8b5a1b898e2b`.

## Owner decisions — keep these fixed

### Source update

- Occasional **manual**, strictly one-way imports from Google. The owner selects a whole upstream revision; do not cherry-pick individual commits.
- Runtime: Python 3 standard library plus Git. Fetch Google into an external temporary Git repository; do not add a permanent remote to `tklu`.
- Select the target using a shortened hexadecimal commit hash. Resolve it uniquely to a full SHA, show/store that SHA, and fail if invalid, ambiguous, not reachable from Google `main`, or not descended from the recorded baseline.
- Initial upstream baseline: `403d8881d62022490637d740657b33f01e321ea8`.
- Managed content: `agents/**`, `skills/**` except `TEST.md` and `test_scenarios.yaml`, `resources/**`, and shared `assets/**`. Keep README and all `docs/` local. Do not replace `index.ts`, package identity, or Pi fixes.
- Preserve non-conflicting local/upstream edits with three-way merge. On content conflicts, abort the whole candidate. Mirror upstream deletes only when the local file still matches the old baseline; treat rename as delete-plus-add under that rule.
- No effective eligible content change means a true no-op: no review, baseline advance, version bump, or commit.
- Review only when the candidate changes at least one managed skill. One separate Pi CLI process uses the **configured default Pi model**. It sees changed skill diffs plus relevant excerpts of the actual local adapter and Pi-specific skill conventions; it does not see persona files, README/docs, or unrelated assets. Review is only for possible Pi interface mismatches, not persona quality.
- Start that CLI process with print mode and tools, extensions, skills, prompt templates, themes, context-file discovery, and session persistence disabled. Use a temporary working directory without the upstream checkout. Skill diffs are untrusted evidence, not instructions to execute. The only clean answer is one line, `NO_CONCERNS: <evidence IDs>`. Any concern, uncertainty, bad/missing ID, malformed output, timeout, auth/CLI failure, or nonzero exit stops the update. A clean answer is not proof of compatibility.
- Any failed check or review must leave the source and deployed copy unchanged. Prepare/check before modifying the source.
- Apply the accepted candidate **in place**. On a caught failure, reset to the saved original HEAD and remove only paths created by that run. For abrupt termination, the user chose **manual recovery, no journal**: next run must stop on a dirty/ambiguous state and print recovery guidance; do not auto-reset over possible later edits.
- Exactly one success commit contains imported content, upstream state, and package version. Always bump MINOR for a content-changing update (e.g. `0.3.2` → `0.4.0`); no patch/major override. No-op has no bump.
- Commit identity is `tklu <tklu@localhost>` using per-command configuration, not global config. Bypass Git hooks and disable signing.

### Separate deployment

- Source stays at `C:\TechemTools\Projekte\sources\pi-egm`. Pi must load a deployed copy, not this source directory.
- Verified `PI_CODING_AGENT_DIR=C:\TechemTools\Programme\Pi`; the global auto-discovery root is `C:\TechemTools\Programme\Pi\extensions`. Pi supports a one-level package subdirectory with `package.json` and `pi.extensions`.
- Target used by `deploy.ps1`: `C:\TechemTools\Programme\Pi\extensions\pi-egm`.
- `deploy.ps1` intentionally adds the deployed `skills` directory to Pi's `settings.json`, backing up an existing settings file. If the legacy `npm:@rizkiaprita/egm` is configured, the script warns but continues; it does not remove or disable that package. Remove it manually to avoid duplicate EGM registrations.
- Deployment is a separate manual operation, never part of source update/commit. The script runs `npm pack --ignore-scripts`, extracts to a staging directory under the extensions root, and swaps the package into the target; it does not build or publish. It then registers the deployed skills path and reminds the user to restart Pi or run `/reload`.
- Pi may be running during the swap; after success, remind the user to run `/reload`. Windows directory replacement may involve two renames, file locks, and a brief gap; plan backup/restore and explain limits. If deployed code regresses, reset source to the previous known-good commit, deploy again, then reload.
- The separate reviewer must not load EGM. `--no-extensions` prevents extension code from loading; the source being updated is not in the deployed extension directory.

## Open design work

1. The design is complete and all four sections are approved. No source-updater implementation exists.
2. Wait for separate explicit authorization before implementing `update_shared_content.py` and its isolated tests. Preserve existing working-tree content; do not reset or discard it.
3. The approved implementation excludes `deploy.ps1` changes or testing, a live upstream import, configured-model calls, Pi settings changes, and deployment. Do not perform those without separate authorization.
4. The original six brainstorm reviewers did **not** assess the later hybrid/deployment choices. If another Goldfish review is run, label it as a new packet-only review unless full reports and independent tool access are genuinely available.

## Artifacts
- `concepts_brief.md` — approved concept and baseline research, amended to record the chosen deployment behavior; recheck consistency.
- `design_draft.md` — all four design sections approved; implementation authorization is outstanding.
- `HANDOFF.md` — this resume note.
