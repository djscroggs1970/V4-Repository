# V4 AGTEK / Earthwork Intake Skill

Status: governed skill design  
Scope: AGTEK / earthwork intake QA only (documentation/schema/test-tooling)  
Framework family: V4 Civil Estimating Platform

## Purpose

The AGTEK / Earthwork Intake Skill performs provisional, review-gated intake QA on AGTEK and earthwork source artifacts. It checks artifact identity, storage references, traceability, source-of-truth alignment, project-instance isolation, file metadata, manual-confirmation needs, and premature downstream-use risk.

This skill is intake QA only. It does not parse AGTEK files into production records, interpret surfaces, calculate earthwork quantities, create takeoff records, generate cost records, or write to external systems.

## Required outcome set

- `intake_ready`
- `needs_manual_confirmation`
- `blocked_missing_identity`
- `blocked_missing_storage_reference`
- `blocked_traceability_gap`
- `blocked_project_instance_mismatch`
- `blocked_source_origin_violation`
- `blocked_unsupported_file_type`
- `blocked_real_job_data_leak`
- `blocked_downstream_use`
- `not_applicable`

## Required scope

- `agtek_earthwork_intake` only.

## Source-of-truth boundaries

- GitHub is the code source of truth.
- Airtable is the checkpoint/build-governance source of truth.
- Google Drive is source-file storage source of truth.
- ClickUp is execution tracking only and never governance proof.
- Chat history is not the system of record.
- A storage link alone is not governance proof.
- Intake readiness is not quantity, cost, estimate, or production authorization.

## Conservative decision priority

1. Real job data leak into framework/sandbox fixture -> `blocked_real_job_data_leak`.
2. Project instance mismatch -> `blocked_project_instance_mismatch`.
3. Missing source artifact/document/file identity -> `blocked_missing_identity`.
4. Missing or malformed storage reference -> `blocked_missing_storage_reference`.
5. Missing traceability -> `blocked_traceability_gap`.
6. Unsupported file type -> `blocked_unsupported_file_type`.
7. Source-origin misuse or ClickUp/governance confusion -> `blocked_source_origin_violation`.
8. Any earthwork production, quantity, cost, estimate, or transmission attempt -> `blocked_downstream_use`.
9. File extension/MIME mismatch or ambiguous surface/revision/source-date/scope metadata -> `needs_manual_confirmation`.
10. Clean AGTEK / earthwork artifact with complete identity/storage/traceability/isolation and intake-handoff-only request -> `intake_ready`.
11. Irrelevant administrative item with no downstream claim -> `not_applicable`.

## Manual confirmation triggers

Manual confirmation is required for missing or ambiguous project identity, source artifact identity, storage reference, traceability, file type, source origin, data boundary, surface label, phase/bid area, revision label, source date, duplicate artifact IDs, Google Drive metadata gaps, ClickUp governance misuse, or premature downstream-use requests.

## Downstream gate requirements

This skill may only support intake QA handoff. It must not authorize AGTEK production parsing, earthwork production logic, surface interpretation, quantity calculation, quantity export, TakeoffItem creation, cost/rate/labor/equipment/vendor-pricing creation, estimate package output, bid output, or external transmission.

## Output contract

Schema path:

```text
schemas/skills/agtek-earthwork-intake.output.schema.json
```

Outputs must remain provisional and review-gated, include non-empty `trace_refs`, and keep downstream use gated to intake QA handoff only.

## Guardrails

This skill must not update continuity state, create Airtable checkpoints, merge PRs, mark anything verified, use real job data, parse production files, calculate earthwork quantities, create estimates/costs/rates, or add runtime connector behavior.
