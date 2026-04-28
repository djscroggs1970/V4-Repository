# V4 PR Review / Merge Gate Skill

Status: governed skill design  
Scope: documentation/schema/test-tooling only  
Framework family: V4 Civil Estimating Platform

## Purpose

The PR Review / Merge Gate Skill produces a conservative, structured review recommendation for GitHub pull requests before any merge, checkpoint, or continuity update action in V4.

It helps the main V4 design/build chat check whether a PR:

- matches the claimed task scope;
- has complete GitHub Actions CI evidence;
- respects V4 source-of-truth boundaries;
- avoids job-instance bleed and unauthorized real job data;
- avoids unauthorized PDF intelligence, quantity creation, cost output, labor/equipment records, production-rate records, vendor pricing, exports, or transmission records;
- is ready for merge review, checkpoint preparation, or continuity follow-up.

The skill recommends only. It does not merge, checkpoint, verify, write to Airtable, call runtime GitHub APIs, modify estimating logic, or override the main V4 build chat.

## Source-of-truth hierarchy

1. GitHub `djscroggs1970/V4-Repository` is the code/test/schema/documentation source of truth.
2. GitHub Actions CI is the CI source of truth.
3. Airtable `V4 Base` is the checkpoint/build-governance source of truth.
4. Google Drive `V4 Framework` is the document/source-file storage source of truth.
5. ClickUp `V4 Framework` is execution tracking only and must not override Airtable governance.

## Non-goals

This skill must not:

- execute or automate GitHub merges;
- create or update Airtable checkpoint records;
- mark a slice verified;
- update `docs/continuity/current-state.md` unless a separate authorized continuity slice exists;
- start full PDF intelligence;
- use real project data unless explicitly authorized by governance;
- create quantities, TakeoffItems, quantity summaries, quantity exports, cost outputs, labor/equipment records, production-rate records, vendor pricing records, client packages, delivery manifests, or external transmissions;
- modify estimating math or production implementation behavior.

## Inputs

Expected inputs may include:

- PR number, title, body, branch, base branch, head SHA, draft status, and mergeability;
- claimed scope and intended slice name;
- changed files, additions, deletions, and diff summary;
- GitHub Actions run ID, conclusion, and per-step evidence;
- Codex local results, if available, treated as context only;
- reviewer notes;
- explicit authorizations for current-state updates, Airtable governance, real job data, PDF intelligence, production-rate/cost logic, or checkpoint preparation.

Missing critical evidence must produce a conservative decision rather than an invented fact.

## Required CI command evidence

GitHub Actions must be treated as authoritative. Local Codex results are useful context but do not prove merge readiness.

The required CI sequence is exactly:

```bash
pnpm install --frozen-lockfile=false
pnpm build
pnpm typecheck
pnpm test
pnpm validate:rules
pnpm sample:vs1a
pnpm sample:vs1a:upload
```

## Decision values

The skill output must use one of these primary decisions:

- `ready_to_merge`
- `blocked_failed_ci`
- `blocked_scope_drift`
- `blocked_guardrail_violation`
- `needs_manual_review`
- `docs_only_ready`
- `checkpoint_ready_after_merge`
- `not_checkpoint_eligible`

## Decision priority

Use the most conservative applicable decision:

1. Guardrail violation -> `blocked_guardrail_violation`.
2. Failed, missing, pending, or incomplete GitHub Actions CI for a merge-readiness request -> `blocked_failed_ci`.
3. Material changed-file scope drift -> `blocked_scope_drift`.
4. Missing critical evidence or ambiguity -> `needs_manual_review`.
5. Authorized docs-only PR with passing CI -> `docs_only_ready`.
6. Post-merge evidence complete and checkpoint-authorized -> `checkpoint_ready_after_merge`.
7. Clean implementation/schema/test PR with passing CI -> `ready_to_merge`.
8. Useful report-only review with no merge/checkpoint authority -> `not_checkpoint_eligible`.

## Merge recommendation values

- `recommend_merge`
- `do_not_merge`
- `hold_for_manual_review`
- `report_only_no_merge_recommendation`

A merge recommendation is allowed only when the PR is not draft, is mergeable, has passing required GitHub Actions CI, has changed files aligned to scope, has no guardrail violation, and has no unresolved manual confirmation trigger.

## Checkpoint recommendation values

- `checkpoint_after_merge`
- `do_not_checkpoint`
- `checkpoint_needs_merge_sha_and_airtable_record`
- `not_applicable`

A pre-merge PR must not be called checkpoint-ready. Checkpoint readiness requires merge evidence and Airtable checkpoint authorization.

## Continuity update recommendation values

- `create_continuity_update_pr_after_checkpoint`
- `continuity_update_ready`
- `do_not_update_current_state_yet`
- `not_applicable`

Do not recommend updating `docs/continuity/current-state.md` until the main V4 build chat authorizes a separate continuity slice after merge/checkpoint evidence.

## Changed-file review categories

Changed files must be classified as one of:

- `source_code`
- `test`
- `schema`
- `docs`
- `continuity_docs`
- `skill_docs`
- `governance_fixture`
- `ci_workflow`
- `package_export`
- `airtable_governance`
- `project_data`
- `unknown`

Scope status must be one of `in_scope`, `out_of_scope`, or `ambiguous`.

## Manual confirmation triggers

Manual confirmation is required for:

- missing or incomplete PR metadata;
- missing, pending, or incomplete CI evidence;
- local-only Codex results not visible in GitHub;
- draft PRs;
- unknown mergeability;
- changed files outside claimed scope;
- `docs/continuity/current-state.md` changes without explicit continuity authorization;
- Airtable governance/checkpoint requests before merge evidence;
- real job data or The Promenade data in an unauthorized PR;
- production PDF intelligence;
- unauthorized quantity/cost/labor/equipment/production-rate/vendor-pricing/export/transmission outputs;
- production-rate or cost logic changes without explicit governance scope;
- oversized or vague multi-module PRs.

## Output contract

The governed output schema is stored at:

```text
schemas/skills/pr-review-merge-gate.output.schema.json
```

The output must remain provisional and review-gated, preserve non-empty `trace_refs`, and include merge/checkpoint/continuity recommendations without granting authority.

## Fixture coverage

Synthetic fixtures cover clean merge-ready review, failed CI, missing CI, docs-only continuity, scope drift, local-only Codex recreation, premature verified claims, premature Airtable checkpoint requests, unauthorized real data/PDF/quantity/cost risk, unauthorized cost logic touch, verify/report-only review, and post-merge checkpoint/continuity context.

All fixtures are synthetic and must not be treated as real PR evidence.
