# Concept Brief: Manual Google EGM Shared-Content Import

**Author:** tklu
**Date:** 2026-11-11
**Amended:** 2026-11-12 — deployment target and skills registration aligned with the user's choice to use `deploy.ps1` behavior; script behavior has not been runtime-tested.
**Review basis:** The initial six-lens review was packet-only. The hybrid direction was selected afterward and has not yet been re-reviewed.

## Overview

Build a manually invoked Python 3 workflow for selected Google EGM shared content. Python owns the workflow, fixed checks, permitted changes, version bump, and commit. Restricted subagents check only possible incompatibilities between imported interface assumptions and the Pi integration. A possible incompatibility, unresolved interface concern, or failed/unusable review stops the entire update. Preserve local Pi fixes, keep README and docs/ local, and trust normal upstream persona behavior. Each accepted content-changing update creates one commit with the imported content, source revision record, and a MINOR version bump by default. Keep the source separate from the deployed copy. Per the user's 2026-11-12 choice, the separate manual deployment targets `C:\TechemTools\Programme\Pi\extensions\pi-egm` and registers its `skills/` directory in Pi's `settings.json`. Current `deploy.ps1` stages under the extensions root and warns but continues if the legacy npm package remains configured; these behaviors have not been runtime-tested.

The parent investigation below recovered the historical Google baseline and verified the npm source snapshot. The local project still begins with an npm distribution snapshot rather than Google's Git history. An updater can use the verified upstream baseline for file-level comparisons without rewriting the existing local commits; it must preserve the known Pi adaptations.

### Reviewer completion status and limitations

| Reviewer | Assigned lens | Status |
| --- | --- | --- |
| egm-design | Contrarian/complexity | completed |
| egm-codebase-details | Cost and execution budget | completed |
| egm-zoom-out | UX/developer ergonomics | completed |
| egm-comprehension | Migration/backward compatibility | completed |
| egm-implementation-readiness | Observability/failure diagnosis | completed |
| egm-structural | Long-term maintainability | completed |

Exactly six fresh-context reviewers were dispatched concurrently with the complete caller packet and their distinct lenses. All returned reports; no retry was necessary. They were instructed not to use tools or delegate and reported packet-only analysis. This is not a live code audit. Parent-supplied facts F1–F7 were not independently verified. No importer, code tests, installation changes, or upstream fetches were performed.

The harness exposed shortened excerpts of the six reports and advertised a retrieval tool that was not available to this synthesizer. Accordingly, the synthesis uses the visible reviewer findings and the supplied packet; it does not claim exhaustive coverage of the full hidden reports. Additional reasoning below is explicitly identified as synthesis rather than attributed to unseen reviewer text.

## Analysis

### Confirmed requirements

- Occasional manual use after the user inspects upstream changes; no scheduler or background updater.
- Each run imports the whole selected Google revision within the approved shared-content scope; no cherry-picking of individual upstream commits. Record a single upstream baseline.
- Strictly one-way imports. No upstream submissions and no replacement of the Pi integration/local fixes.
- Clean working tree; unrelated changes must not enter the update commit.
- Temporary preparation and checks, with all-or-nothing rejection on detected conflicts or unsupported Pi requirements.
- Exactly one automatic commit for each successful update, combining content, source revision, and version bump.
- Version policy: always bump tklu's own MINOR version on a successful content-changing import, for example `0.3.2` to `0.4.0`; no per-run PATCH/MAJOR override and no bump on no-op.
- Keep source updates and deployment separate. On success, the source updater makes one commit and never changes deployed files or Pi settings. A separate manual deploy runs `npm pack --ignore-scripts`, stages under the extensions root, and swaps the package into `C:\TechemTools\Programme\Pi\extensions\pi-egm`. It adds the deployed `skills/` path to Pi's `settings.json` and reminds the user to run `/reload`. This packages files; it does not compile or publish.
- Remove or disable the legacy `npm:@rizkiaprita/egm` manually before using the local deployment to avoid duplicate registrations. `deploy.ps1` only warns if the legacy package is still configured and continues; it does not remove or disable it. Only the separate manual deploy edits Pi's `settings.json`, adding the deployed skills path; the source updater never changes settings.
- Apply the accepted candidate in-place only after all checks. On a caught failure, reset to the saved original HEAD and remove only files created by the run; abrupt termination or failed rollback can require manual recovery.
- Windows environment and CRLF for authored text. Use commit identity `tklu <tklu@localhost>` without changing global Git configuration; bypass Git hooks and disable signing for updater commits.
- Runtime: Python 3 standard library plus Git. Retrieve the selected source through an external temporary Git repository. Invoke one separate Pi CLI process for compatibility review; do not add a custom Node SDK worker or extension bridge.
- Content scope: personas, skills, resources, and shared assets only. README.md and every docs/ file stay local. Exclude upstream `TEST.md` and `test_scenarios.yaml`, matching the original npm package.
- Treat renames as an old-path deletion plus a new-path addition. Mirror a deletion only if the local file still matches the recorded old upstream baseline; otherwise stop the entire update.
- Accept a shortened hexadecimal commit hash; resolve it uniquely in fetched upstream history, display/store the full SHA, and stop if invalid or ambiguous.
- Run exactly one interface reviewer only when the candidate changes at least one managed skill file. Persona/resource/asset-only changes use fixed checks and the user's stated trust in Google-authored persona behavior.
- Trust Google persona behavior and do not perform general persona-quality or editorial review. Review only possible Pi interface/API incompatibilities: tool names/arguments, command argument conventions, delegation inputs, and result contracts.
- On updates that change at least one managed skill, one fresh reviewer inspects the final diffs of changed skill files plus relevant excerpts of the current local Pi adapter and Pi-specific skill conventions. Do not send persona files, README/docs, or unrelated assets.
- Any possible interface incompatibility, unresolved interface uncertainty, missing/failed reviewer, or unusable response stops the whole update. The clean result is exactly one short `NO_CONCERNS: <evidence IDs>` verdict; all IDs must exist in the evidence packet. Any different or malformed response stops.
- The reviewer uses Pi's configured default model and credentials. If Pi CLI/model/authentication fails, the update stops.

### Selected hybrid responsibility boundary

The owner explicitly selected this hybrid after the original concept review. Python controls source preparation, checks, version, commit, and a separate manual deployment operation; one isolated Pi CLI process reviews changed skill interfaces only. It preserves the one-way, all-or-nothing, one-commit, MINOR-version, and source/deployment separation decisions.
1. Python verifies the starting state, fetches the selected revision in an external temporary Git repository, uniquely resolves the user's shortened hexadecimal commit hash to a full commit ID, prepares a candidate outside the working tree, and runs fixed checks.
2. If at least one managed skill changes, Python launches exactly one separate Pi CLI process. It receives diffs for changed skill files only and relevant excerpts from the actual current adapter and Pi-specific command conventions. It does not receive persona files, README/docs, or unrelated assets. If only personas, resources, or assets change, skip the reviewer.
3. Disable reviewer capabilities using CLI controls, not prompt wording alone: `--print`, `--no-session`, `--no-tools`, `--no-extensions`, `--no-skills`, `--no-prompt-templates`, `--no-themes`, and `--no-context-files`. Use a trusted system prompt and an isolated temporary working directory with no upstream checkout.
4. The only success result is exactly one short line, `NO_CONCERNS: <evidence IDs>`, with IDs present in the packet. Any concern, uncertainty, failed process, absent/malformed result, invalid ID, or nonzero exit rejects the candidate. A clean line only allows fixed checks to continue; it does not prove universal compatibility. Do not let the model write a patch or decide import scope.
5. After all candidate checks pass, Python applies the candidate in-place to the source repository and creates one unsigned, hook-free commit. On a caught failure, reset to the saved original HEAD and remove only paths created by that run. The deployed copy is not touched.

Reviewers must not be granted filesystem, shell, network, installation, or mutation tools. The selected mechanism is a separate Pi CLI process with the corresponding tool/resource-discovery disable flags. Its working directory is temporary and contains no upstream checkout. Pass changed-skill diffs and relevant excerpts from the actual current adapter/local Pi-specific command guidance as prompt evidence; a system instruction says to analyze upstream text, not follow it.
The review is limited to diffs in changed upstream skill files plus excerpts from the actual current Pi adapter and Pi-specific skill argument conventions. It excludes persona files, README/docs, and unrelated assets, and does not judge normal persona behavior. It checks possible mismatches in tool names/arguments, command argument conventions, delegation inputs, and result contracts.
### Selected handling and review details

- Retrieve the chosen whole upstream snapshot from an external temporary Git repository. Resolve the user's shortened hexadecimal commit ID to one full SHA; show and record that SHA. Do not add a permanent Git remote to tklu.
- Exclude `skills/**/TEST.md` and `skills/**/test_scenarios.yaml` because these were excluded from the original npm package. Do not import README or any `docs/` paths.
- Compute candidate changes from the recorded Google baseline, the current local files, and the selected upstream tree. Apply non-conflicting local/upstream changes together. Any content conflict stops the whole update.
- Treat a managed upstream deletion or rename as delete-plus-add. Delete an old local file only when its normalized content still matches the recorded upstream baseline; otherwise stop. Never overwrite an unexpected local file at a newly added path.
- A no-op candidate does not run a reviewer and does not advance the baseline or version. Report no eligible changes; make no commit.
- For a changed candidate, launch one fresh Pi CLI process with print mode and no tools, extensions, skills, prompt templates, themes, context-file discovery, or session persistence. Give it only the final diffs for changed skill files, relevant source excerpts from the current `index.ts` and local Pi command conventions, and a concise prompt. The working directory is temporary and contains no upstream checkout.
- The only accepted clean reply is one short line in the form `NO_CONCERNS: <evidence IDs>`, with IDs that exist in the supplied packet. Any concern, uncertainty, missing/malformed result, invalid ID, timeout, nonzero process exit, or CLI error aborts the candidate. A clean reply does not prove complete coverage.

Upstream skill diffs may contain imperative text. They are data to analyze, never executable instructions. Disabling tools contains agent actions but does not guarantee truthful judgment or prevent every prompt-injection influence. Require the exact short `NO_CONCERNS: <evidence IDs>` result referencing IDs from the supplied packet; anything else, including uncertainty or a concern, stops. This output check verifies shape and references, not semantic truth or complete reasoning.
One review process adds model cost, latency, credential dependence, Pi CLI/version compatibility, and false-positive risk for skill-changing updates. The original six reviewers did not assess this hybrid; it still needs a fresh review after the technical plan is complete.
Some interface conventions are in skill prose rather than schemas. Diffs are therefore bounded to changed skill files, while the Pi side is represented by excerpts from the actual current adapter and locally adapted skill conventions. The reviewer has no file tools. A verdict cannot prove the model examined every implication; a clean response is not a compatibility certificate.


If the selected upstream revision has no changes within the managed scope, report a no-op; do not run a reviewer, advance the recorded baseline, bump the version, or create a commit.

The complexity of a safe general updater may exceed the benefit of occasional imports into this small, private fork. Provenance reconstruction, merge decisions, compatibility judgments, Windows failure recovery, and future upstream restructuring can turn a short script into a maintenance product. The common smaller alternative in the visible design, budget, migration, and maintainability feedback is a narrow importer with an explicitly reconciled initial content set and a human-reviewed bootstrap, not generalized merge intelligence.

That alternative preserves the approved workflow. It narrows the supported import contract rather than reopening the decisions to use all-or-nothing updates and one automatic commit.

### Deduplicated prioritized findings

Severity describes concept-readiness risk, not a verified defect in existing code. Recommendations below are not additional user decisions.

#### Initial blocker B1 — Historical baseline recovered; ownership still needs approval

**Reviewer attribution:** egm-zoom-out explicitly identifies this blocker; visible recommendations from egm-codebase-details and egm-comprehension reinforce it.
The historical baseline and npm source line are known, so a first update can use the Google ancestor `403d8881d62022490637d740657b33f01e321ea8` as the base. The updater's committed state must thereafter track the last successfully imported full Google SHA; no-op or rejected candidates leave it unchanged.


**Evidence at review time:** F4 reported no recorded upstream baseline or per-file provenance map; F2 established independent local history based on an npm snapshot. The subsequent parent investigation below recovered the source commit and its actual common ancestor with Google main. This finding was not available to the reviewers.

**Failure scenario:** A publisher transformation or pre-existing local edit is mistaken for upstream content. An import silently removes it, or repeatedly reports meaningless conflicts because its supposed base was never valid.

**Parent follow-up:** Historical reconciliation is now complete. Before implementation, record the verified Google baseline and source-to-destination ownership map, retain the Pi-specific adaptations, and define the import checks. No invented adoption baseline or local-history rewrite is needed.

#### Major M1 — Textual compatibility is not Pi behavioral compatibility

**Reviewer attribution:** egm-design and egm-structural give concrete unsupported-tool/lifecycle scenarios; egm-comprehension recommends a bounded compatibility envelope; egm-zoom-out recommends explicit limits on success claims.

**Failure scenario:** A persona or skill imports cleanly but introduces another harness's tool, command, or lifecycle assumption. Structural checks pass and the failure appears only when the persona is invoked in Pi.

**Recommendation:** Define a small, explicit compatibility contract and checks for known unsupported requirements and broken references. Reject known unsupported changes. Keep arbitrary semantic compatibility outside the guarantee, retain the user's upstream review, and describe success as declared checks passing rather than universal runtime correctness.

#### Major M2 — Bound import ownership and maintenance cost

**Reviewer attribution:** egm-codebase-details recommends one runtime, one revision-selection mechanism, and deterministic checks; egm-comprehension recommends one reconciled content set; egm-design cautions against generalized merge intelligence. Long-term ownership implications are synthesizer analysis informed by the assigned structural lens, not a claim about hidden report text.

**Failure scenario:** A broad directory copy admits other-harness instructions or removes a local adaptation. Future upstream moves force the tool to guess whether a path was renamed, deleted, or replaced.

**Recommendation:** Agree on an explicit mapping and ownership boundary. Keep index.ts and local package identity outside imported ownership; allow the package version change only as a deliberate local operation. Decide deletion and rename handling explicitly. Reject unsupported mapping changes instead of attempting clever recovery. Preserve required license and attribution material. Avoid adding plugin systems or broad dependency machinery without a demonstrated need.

#### Major M3 — Specify the failure boundary before promising unchanged state

**Attribution:** Synthesizer analysis from D3, D4, and F7. The visible observability review excerpt does not expose its full transaction findings.

**Failure scenario:** Temporary checks pass, but a Windows file lock or process interruption occurs while applying files. A concurrent edit arrives after the initial cleanliness check, or commit creation fails after working-tree changes have started.

**Recommendation:** Distinguish preparation rejection, final application, commit creation, and crash recovery. Recheck expected repository state immediately before mutation and define concurrency protection. Ordinary detected conflicts and compatibility failures must leave the project unchanged. Do not promise arbitrary filesystem atomicity under power loss, antivirus interference, or hostile concurrent writers. Specify recovery and the evidence retained for an interrupted application before implementation; do not silently weaken all-or-nothing behavior.

#### Major M4 — Separate repository success from activation success

**Reviewer attribution:** egm-implementation-readiness explicitly requires this distinction; egm-zoom-out recommends qualified success wording.

**Failure scenario:** The repository receives its update commit, but Pi still loads npm:@rizkiaprita/egm. The user reloads and assumes the new local content is active, or adds the local package without removing the original and receives duplicate registrations.

**Recommendation:** Report the committed revision and package version, checks performed, and activation not performed. Explain replacing the original configured package with the local path, avoiding duplicates, and then using the appropriate restart/reload procedure. Do not claim a running revision has been verified. A package-source switch is not equivalent to a reload.

#### Minor N1 — Keep repeat runs and diagnostics unsurprising

**Attribution:** Synthesizer analysis from F7, with the qualified success language supported by visible egm-zoom-out and egm-implementation-readiness feedback.

**Failure scenario:** Repeating the same import creates meaningless version-only commits, or an abort says only "failed" and leaves the user unable to distinguish a conflict from a fetch problem.

**Recommendation:** Decide no-op semantics explicitly. Report the failing stage, requested and resolved revision, affected paths where relevant, and whether project state changed. Keep any diagnostic output outside the project on rejected preparation so the failure guarantee remains meaningful. Avoid a large logging subsystem for an occasional manual command.

### Parent investigation — baseline recovered on 2026-11-11

This is additional parent research after the packet-only reviews. It is not a claim that the reviewers inspected these sources or re-reviewed the findings.

#### Source identity and ancestry

- Registry metadata for `@rizkiaprita/egm@0.3.2` records publication at `2026-11-01T07:11:52.684Z` and `gitHead` **`d02a32a9aa9c07af2f6127c84c801b85ac69476b`**.
- Its shared ancestor with the inspected Google main is **`403d8881d62022490637d740657b33f01e321ea8`**, titled `Verify tagged OpenAI ZIPs in Codex (#217)`.
- The npm source line contains four commits beyond that ancestor: `de5a6b85` (initial Pi additions), `427df7b6` (Pi/package changes), `65ebbb04` (single skill-command workflows), and `d02a32a9` (manifest version/scope alignment).
- The Google target inspected was pinned to **`0f06dd7230261c00f0e03bd8d3ca8b5a1b898e2b`**. The GitHub comparison reported divergent histories: Google had 69 commits beyond the shared ancestor; the npm source line had four.
- A commit accessible through the parent repository's GitHub API may belong to a fork's source line. API visibility is not evidence that the npm source commits are part of Google main. The ancestry comparison, not dates or URL ownership, establishes the relationship. The publisher's hosted fork repository was not identified.

```text
Google ancestor 403d8881
  |-- Google main ... 0f06dd72 (inspected target; 69 further commits)
  `-- four npm-source commits ... d02a32a9
        `-- published npm snapshot 0.3.2
              `-- local snapshot history and separate tklu fixes
```

#### File verification

All 48 published npm files match the source tree at `d02a32a9` after CRLF-to-LF normalization. This is content equivalence after line-ending normalization, not raw-byte identity between the npm archive and Google Git blobs. The local initial commit still preserves the original npm archive bytes.

Against the Google ancestor at `403d8881`:

| Category | Files | Meaning |
| --- | ---: | --- |
| Identical after line-ending normalization | 41 | Google content carried without substantive edits in the npm package |
| Adapted shared files | 4 | Existing Pi-specific changes must be retained during future imports |
| Added Pi package files | 3 | No source counterpart at that Google ancestor; keep locally owned |

The four adapted shared files are:

- `README.md`: Pi installation and skill-command instructions; the current local README also has the tklu notice.
- `docs/harnesses.md`: Pi installation, directory layout, delegation, and harness guidance.
- `skills/egm-resolve/SKILL.md`: interpretation of `/skill:egm-resolve` arguments.
- `skills/egm-review/SKILL.md`: interpretation of `/skill:egm-review` arguments.

The three added package files are `package.json`, `index.ts`, and `docs/pi.md`. Treat these as local/Pi-owned. In particular, do not overwrite the adapter, the two local implementation fixes, or the private tklu package identity with Google content.

#### Consequences for an importer

- The initial upstream comparison baseline can be the real Google commit `403d8881`, not an invented adoption revision. Keep npm source `d02a32a9` and npm version `0.3.2` as separate provenance facts.
- A later import can compare the old Google version, the current local file, and the selected new Google version. Existing Pi edits become known local differences rather than unexplained conflicts. Abort if they cannot be reconciled under the approved checks.
- The subsequently selected scope is the packaged personas, skills, resources, and shared assets. README.md and all docs/ remain local. Exact eligible paths, additions, and test exclusions still need specification; no broad copy is authorized.
- The npm package omits upstream `TEST.md` and `test_scenarios.yaml` skill files. Decide explicitly whether upstream test material belongs in updater validation, package contents, or neither; it must not appear through an accidental broad copy.
- Preserve the two adapted skills as overlays within shared content. The owner selected exclusion of README.md and all docs/ from routine import ownership, so retain their Pi guidance locally rather than merging them during updates.
- Keep fork-only documentation, ignore rules, updater code, and future import metadata locally owned. Preserve license/attribution. A package version change remains an intentional local operation in the one success commit.
- No Google remote, upstream ancestry rewrite, contribution workflow, or continued dependence on future releases of the npm publisher is required for this one-way content workflow.

#### Concrete changes available at the inspected target

Fifteen previously packaged Google files changed between `403d8881` and `0f06dd72`; none of those packaged Google files was deleted. Changes include two existing personas, seven packaged skill files/references, three resource files, two documentation files, and README. Google also added `agents/inventive_catalyst.md`.

The local adapter has a generic persona-filename fallback in addition to its hard-coded aliases. Therefore, a new agent filename alone does not establish incompatibility; its instructions, delegation needs, and tool requirements still require review. No candidate content was applied and no runtime compatibility test was performed during this investigation.

#### Evidence links

- [Published registry metadata](https://registry.npmjs.org/@rizkiaprita%2Fegm/0.3.2)
- [npm source commit d02a32a9](https://github.com/google/elephant-goldfish-model/commit/d02a32a9aa9c07af2f6127c84c801b85ac69476b)
- [Google baseline 403d8881](https://github.com/google/elephant-goldfish-model/commit/403d8881d62022490637d740657b33f01e321ea8)
- [Baseline to npm source comparison](https://github.com/google/elephant-goldfish-model/compare/403d8881d62022490637d740657b33f01e321ea8...d02a32a9aa9c07af2f6127c84c801b85ac69476b)
- [Pinned Google target 0f06dd72](https://github.com/google/elephant-goldfish-model/commit/0f06dd7230261c00f0e03bd8d3ca8b5a1b898e2b)

### Factual unknowns and remaining design work

- The tracked baseline, content scope, test-file exclusions, shortened-hash input, safe deletion rule, and no-op behavior are decided. Exact repository paths and the first-success state record still need to be written in the technical plan.
- Routine content scope is personas, skills, resources, and shared assets. README.md and all docs/ remain locally owned. Only the two Pi-adapted shared skills require routine import/merge handling; the documentation adaptations are outside that ownership.
- Python 3 standard library plus Git, an external temporary Git source repository, and one separate Pi CLI process for review are selected. Reviewer tools/resources are disabled through CLI flags. The relevant Pi baseline comes from current adapter and locally adapted skill excerpts, not a separate contract file.
- Review only diffs in changed skills plus trusted local Pi excerpts; skip review if no managed skill changes. Require a short `NO_CONCERNS` verdict with valid evidence IDs. Use Pi's configured default model. Timeout, payload-size limit, and diagnostics remain to be designed.
- The shortened hash, no-op behavior, deletion rules, source in-place/reset method, manual staged deployment, `npm pack`, and always-MINOR version bump are decided. Update commits use `tklu@localhost`, bypass hooks, and are unsigned. Abrupt source-update termination uses manual recovery (no journal). Concurrency locking, deployment swap/backup and file-lock handling, and diagnostics remain open.
- Reviewers see skill-diff text only as untrusted evidence. Tools and local filesystem access are disabled. They do not see persona files; the user trusts their normal behavior. This limits actions but does not guarantee truthful or complete judgment.
- The actual Pi extension root is verified as `C:\TechemTools\Programme\Pi\extensions` (`PI_CODING_AGENT_DIR` is set to its parent). `deploy.ps1` targets `extensions\pi-egm`, stages under the extensions root, and registers the deployed skills directory in `settings.json`. It warns but does not stop if the legacy npm EGM is configured. These script behaviors are not runtime-verified. Stage/swap and remind the user to run `/reload`; exact Windows rollback/file-lock handling remains to be designed.
- `deploy.ps1` currently assembles with `npm pack --ignore-scripts`, extracts under a staging directory inside the Pi extension root, backs up an existing deployment outside that root, swaps to `extensions\pi-egm`, and then updates `settings.json`. Verify safe extraction, restore behavior if settings registration fails after the swap, backup retention, and file-lock handling before relying on it.

## Goals vs. Non-Goals

| Goals | Non-goals |
| --- | --- |
| Reproducible, revision-recorded manual imports | Continuous synchronization or arbitrary upstream merging |
| Preserve Pi integration, permission forwarding, cancellation, and shutdown fixes | Replace the local adapter with another harness's integration |
| Reject detected conflicts and unsupported requirements before application | Prove all natural-language instructions semantically compatible |
| One coherent automatic update commit | Partial acceptance, split update commits, or uncommitted delivery |
| Clear failure guidance and explicit manual deployment | Automatic deployment, npm publication, upstream contribution, or remote creation |
| Small, supportable import boundary | A generalized package manager or synchronization framework |

## Alternatives Weighed

| Alternative | Disposition and accepted tradeoff |
| --- | --- |
| Narrow mapped Python workflow with restricted interface review | Selected hybrid. Python controls the workflow and mutation; one isolated Pi CLI process reviews changed skill diffs only against actual local Pi source excerpts, and any concern stops the update. |
| Review-branch default | Rejected by D3. A branch could support manual inspection, but it is not the selected delivery workflow. Temporary preparation is still required and is not a user-facing review-branch default. |
| Partial import | Rejected by D3. May salvage independent changes but risks inconsistent references and changes the approved acceptance model. Every selected mapped update must pass or be rejected as a unit. |
| Individual upstream commit selection | Rejected after investigation. A whole selected revision inside the supported content scope keeps one baseline and avoids tracking skipped commits or guessing their dependencies. |
| Deterministic-only Python updater | Superseded by the selected hybrid because interface assumptions in prose may need judgment beyond fixed checks. Python still enforces the workflow and all mutations. |
| Agent-only updater skill | Not selected. Instructions alone do not enforce allowed paths, state transitions, or commit/version safeguards. |
| General persona/behavior review | Rejected as the review scope. Google persona behavior is intentionally adopted; review is limited to possible Pi interface incompatibility. |
| Two commits | Rejected by D4. Separating imported content from provenance/version metadata makes intermediate history incoherent and violates the one-commit requirement. |
| Leave changes uncommitted | Rejected by D4. Provides manual discretion but transfers completion and staging risks to the user. |
| Whole-repo merge | Unsuitable for independent npm-snapshot history and a mixed-harness upstream repository. Would import irrelevant material and threaten Pi-owned files. |
| Automatic deploy/publish or package-setting changes | Automatic deployment, npm publication, and settings changes during source updates remain rejected. The separate manual deploy intentionally registers the deployed skills path in Pi's `settings.json`; the source updater never edits settings. |
| Generalized semantic merge and compatibility engine | Not recommended. Its cost and correctness claims exceed this occasional manual use case. Prefer explicit checks and supported mappings. |

## Key Decisions & Staging for Next Steps

### Design decisions to resolve before implementation

1. **File mapping:** The content ownership and exclusions are settled; specify exact paths, the bootstrap state file, and the candidate merge procedure. Preserve local changes and stop on conflicts.
2. **Reviewer invocation and protocol:** Python plus Git and a separate tool-less Pi CLI are selected. Specify process flags, source excerpts, prompt transport, exact verdict parsing, timeouts, and diagnostics.
3. **Revision and version details:** Resolve a shortened hash uniquely to a full commit and require it to advance the recorded baseline. Default to a MINOR bump for a content-changing update. No-op behavior is fixed; determine whether an explicit version override is needed.
4. **Application and recovery contracts:** Specify clean-state checks, source update/reset on ordinary errors, locking/concurrency, hook/signing behavior, crash boundaries, and file-lock recovery. Separately specify the Windows deployment stage/swap/backup/recovery process and `/reload` behavior. The update commit must never modify deployed files.

Do not ask the user to reselect manual updates, one-way sync, all-or-nothing acceptance, one update commit, default minor version, reviewer scope, or separate manual deployment. Detailed lock mechanics, diagnostic formatting, and identity validation can be proposed as implementation details. Honor the supplied author identity without changing global Git configuration.

### Recommended staging, subject to further approval

1. **Record exact ownership and merge rules:** The historical baseline is established. Implement the confirmed managed paths, test exclusions, deletion/rename rule, and adapted-skill handling in a precise file mapping.
2. **Specify the hybrid contract:** Use Python + Git and a separate isolated Pi CLI reviewer on changed skill diffs only. State exact command flags, current adapter excerpts, response parser, model choice, and failure behavior.
3. **Define safe source application and separate deployment:** Use the clean worktree, conflict, concurrency, hook/signing, and failure recovery contract; create one commit only after fixed and required model checks pass. The manual deployment stage/swap is separate and leaves source history unchanged.
4. **Validation plan, not completed tests:** Test abbreviated SHA ambiguity, ancestry, content conflicts, skill/no-skill reviewer triggers, no-tools CLI isolation, malformed verdict/citations, preserved adapter/README/docs, CRLF, repeated runs, locks/concurrency, source rollback, deployment staging/swap/restore, and commit/apply failures in disposable repositories. Prove unchanged source/deployment on pre-apply rejection and document crash recovery separately.
5. **Handoff:** Report source revision, version, commit, declared checks, and deployment instructions. Do not deploy, alter Pi settings, or reload Pi automatically as part of the source update. The separate manual deploy registers the deployed skills path in `settings.json`.

This brainstorm creates only this requested brief. The supplied clean-tree observation predates artifact creation; do not assume the project remains clean after writing this file. Before a future importer run, handle this artifact deliberately rather than silently including it in an update commit.
