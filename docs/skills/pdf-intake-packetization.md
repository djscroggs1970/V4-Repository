# V4 PDF Intake Packetization Skill (Governed Support)

## Purpose

This slice adds governed repository support for a **provisional-only** PDF intake packetization skill output contract.

It is documentation/schema/test tooling only. It does **not** perform OCR, plan parsing, quantity extraction, takeoff creation, cost generation, labor/equipment loading, production-rate generation, or vendor pricing output.

## Output Contract

Schema location:

- `schemas/skills/pdf-intake-packetization.output.schema.json`

The output contract is intentionally constrained to support review-gated intake packetization evidence:

- `provisional_status` is required and fixed to `provisional_pending_manual_review`.
- `review_gated` is required and fixed to `true`.
- `hard_guardrail_confirmation` requires:
  - `quantities_extracted = false`
  - `takeoff_items_created = false`
  - `cost_outputs_created = false`
  - `pricing_records_created = false`
  - `production_rate_records_created = false`
  - `review_gated = true`
- `sheet_classifications`, `possible_relationships`, `source_artifact_register`, and `manual_confirmation_flags` are fully typed (no loose untyped arrays).
- confidence values are constrained to `0..1` where applicable.
- `trace_refs` arrays are required where applicable.

## Governance Guardrails

This schema/tooling enforces intake-only boundaries:

- No takeoff items.
- No quantity summaries/exports.
- No cost outputs.
- No labor/equipment/production-rate outputs.
- No vendor pricing outputs.
- No claim of full PDF intelligence.

## Synthetic Fixtures

Fixtures are synthetic and non-project-specific:

- `tests/fixtures/pdf-intake-packetization/clear-sheet-index.fixture.json`
- `tests/fixtures/pdf-intake-packetization/missing-index.fixture.json`
- `tests/fixtures/pdf-intake-packetization/duplicate-sheet-id.fixture.json`
- `tests/fixtures/pdf-intake-packetization/mixed-utility.fixture.json`
- `tests/fixtures/pdf-intake-packetization/broad-construction-details.fixture.json`

C-50/C-51 are used only as generic sheet-label examples.

## Deterministic Test Coverage

Governance tests assert that fixture outputs remain provisional and review-gated, retain required register fields, keep confidence bounded, force manual confirmation for known risk conditions, preserve/placeholder identity references, and do not create estimating structures.
