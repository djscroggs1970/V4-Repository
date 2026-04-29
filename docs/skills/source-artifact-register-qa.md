# V4 Source Artifact Register QA Skill

Status: governed skill design  
Scope: documentation/schema/test-tooling only  
Framework family: V4 Civil Estimating Platform

## Purpose

The Source Artifact Register QA Skill performs provisional, review-gated quality checks on source artifact register entries for completeness, traceability, storage-reference hygiene, source-of-truth alignment, project-instance isolation, and premature downstream-use risk.

This skill does not inspect real plans, parse PDFs, classify production drawings, normalize vendor quotes, trigger AGTEK/earthwork production logic, create source artifact records, create quantities/costs, or write to external systems.

## Source-of-truth hierarchy

1. GitHub `djscroggs1970/V4-Repository` is the technical code source of truth.
2. Airtable `V4 Base` is the checkpoint/build-governance source of truth.
3. Google Drive `V4 Framework` is source-document/source-file storage source of truth.
4. ClickUp `V4 Framework` is execution tracking only and never governance proof.
5. Chat history is not a system of record.
6. A storage link alone is not governance proof.
7. A current-state note alone is not source artifact QA proof.
8. Register QA readiness is not downstream processing authorization.

## Required outcomes

- `register_ready`
- `needs_manual_confirmation`
- `blocked_missing_identity`
- `blocked_missing_storage_reference`
- `blocked_traceability_gap`
- `blocked_project_instance_mismatch`
- `blocked_source_origin_violation`
- `blocked_real_job_data_leak`
- `blocked_downstream_use`
- `not_applicable`

## Required review modes

- `single_artifact`
- `batch_register_review`
- `downstream_gate_review`
- `fixture_review`

## Required data boundaries

- `framework`
- `sandbox`
- `project`
- `mixed_unknown`

## Decision priority

Use the most conservative applicable outcome:

1. Real job data leak into framework/sandbox fixture -> `blocked_real_job_data_leak`.
2. Project instance mismatch -> `blocked_project_instance_mismatch`.
3. Missing identity -> `blocked_missing_identity`.
4. Missing/malformed storage reference -> `blocked_missing_storage_reference`.
5. Missing traceability -> `blocked_traceability_gap`.
6. Source-origin misuse or ClickUp/governance confusion -> `blocked_source_origin_violation`.
7. Premature downstream use -> `blocked_downstream_use`.
8. Ambiguous revision/date/storage/source metadata -> `needs_manual_confirmation`.
9. Clean artifact with complete identity/storage/traceability/isolation -> `register_ready`.
10. Irrelevant administrative item with no downstream claim -> `not_applicable`.

## Downstream gate requirements

Downstream use should remain blocked unless an artifact is cleanly `register_ready` and requested use is only register QA handoff.

This skill never authorizes:

- PDF intelligence;
- quantity extraction;
- TakeoffItem creation;
- quote normalization;
- cost registry merge;
- AGTEK/earthwork production logic;
- external transmission;
- bid output.

## Manual confirmation triggers

Manual confirmation is required when identity, storage reference, traceability, project-instance mapping, source-origin alignment, revision metadata, or downstream-use authorization is ambiguous, missing, conflicting, or premature.

## Output contract

The governed output schema is stored at:

```text
schemas/skills/source-artifact-register-qa.output.schema.json
```

Outputs must remain provisional, review-gated, include non-empty `trace_refs`, and avoid any runtime external writes or production-data creation.
