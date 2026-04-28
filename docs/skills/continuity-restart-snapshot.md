# V4 Continuity / Restart Snapshot Skill

Status: governed skill design  
Scope: documentation/schema/test-tooling only  
Framework family: V4 Civil Estimating Platform

## Purpose

The Continuity / Restart Snapshot Skill produces compact, safe, provisional restart context for new V4 sessions without relying on chat history as authority.

The skill helps the main V4 Design/build chat review whether snapshot evidence appears sufficient across GitHub, Airtable, and `docs/continuity/current-state.md` while preventing stale, oversized, conflicting, or job-specific context from entering framework memory.

The skill does not verify a slice, merge PRs, update continuity, or create checkpoints.

## Source-of-truth hierarchy

1. GitHub `djscroggs1970/V4-Repository` is the implementation, PR, changed-file, merge SHA, and GitHub Actions CI source of truth.
2. Airtable `V4 Base` is the checkpoint/build-governance source of truth.
3. Google Drive `V4 Framework` is document/source-file storage only.
4. ClickUp `V4 Framework` is execution tracking only and must not override Airtable governance.
5. Chat history is lead context only and is never the system of record.
6. `docs/continuity/current-state.md` is a continuity reference, not standalone proof of CI/checkpoint status.

## Required outcomes

- `restart_snapshot_ready`
- `needs_source_of_truth_check`
- `blocked_unverified_claim`
- `manual_confirmation_required`
- `continuity_update_candidate`
- `stale_or_conflicting_context`
- `handoff_ready`

## Required session modes

- `implementation`
- `skill_design`
- `verification_only`
- `continuity_only`

## Decision priority

Use the most conservative applicable outcome:

1. Unsupported verified, merged, checkpointed, or current-state claim without evidence -> `blocked_unverified_claim`.
2. Source-of-truth conflict -> `stale_or_conflicting_context`.
3. Real job, PDF plan, quantity, or cost leakage -> `manual_confirmation_required`.
4. Missing GitHub, Airtable, or current-state evidence -> `needs_source_of_truth_check`.
5. Pending continuity PR without CI/merge evidence -> `needs_source_of_truth_check`.
6. Good evidence with continuity update review intent -> `continuity_update_candidate`.
7. Compact safe restart with complete evidence -> `restart_snapshot_ready`.
8. Safe new-chat handoff prompt generated -> `handoff_ready`.

## Guardrail requirements

Snapshots must preserve all of the following:

- no runtime external writes;
- no merge, checkpoint, or verified authority;
- no current-state update authority;
- no PDF intelligence;
- no real job data;
- no quantities, costs, rates, takeoff records, vendor records, labor records, or equipment outputs;
- `project_instance_id` and `source_document_id` isolation;
- framework/job-data separation;
- compact restart focus;
- review-gated/provisional status.

## Manual confirmation triggers

Manual confirmation is required when any of the following appear:

- verified state is claimed without CI, merge SHA, and Airtable checkpoint evidence;
- CI is missing, failed, pending, or incomplete;
- a continuity PR is open but not confirmed passed/merged;
- current-state update is claimed without evidence;
- source-of-truth evidence conflicts;
- real job/project/PDF data appears;
- quantities, costs, rates, vendor records, TakeoffItems, or exports appear;
- next action is ambiguous;
- the snapshot is too long, too vague, or combines multiple tasks;
- the session mode is unclear;
- local-only Codex output is treated as GitHub-visible;
- external credentials or connector access are needed.

## Output contract

The governed output schema is stored at:

```text
schemas/skills/continuity-restart-snapshot.output.schema.json
```

Outputs must stay provisional/review-gated and must include non-empty `trace_refs`.

## Fixture/test coverage

Synthetic fixtures and deterministic VS1A governance tests validate enums, source-of-truth evidence status values, required fields, decision priority behavior, compactness/handoff conditions, and strict guardrails without live connector access.

All fixtures are synthetic and must not be treated as verified PR, Airtable, plan, quantity, or cost evidence.
