# V4 Sanitary Sewer Review Assistant Skill

Status: governed skill design  
Scope: sanitary sewer only (documentation/schema/test-tooling)  
Framework family: V4 Civil Estimating Platform

## Purpose

The Sanitary Sewer Review Assistant Skill performs provisional, review-gated evaluation of sanitary sewer candidate, audit, adapter, promotion-gate, and handoff outputs. It checks completeness, traceability, ambiguity, no-bypass constraints, and manual-confirmation needs.

This skill is sanitary-sewer-specific and must not be generalized to storm, water, grading, earthwork, paving, erosion control, landscape, or other non-sanitary scopes.

This skill does not parse PDFs, perform full PDF intelligence, extract quantities, create TakeoffItems, calculate costs/rates, generate labor/equipment/vendor records, or write to external systems.

## Required outcome set

- `review_ready`
- `needs_manual_confirmation`
- `blocked_missing_traceability`
- `blocked_missing_source_reference`
- `blocked_candidate_incomplete`
- `blocked_audit_unresolved`
- `blocked_bypass_attempt`
- `blocked_quantity_export_attempt`
- `blocked_cost_or_rate_attempt`
- `blocked_real_job_data_leak`
- `not_applicable`

## Required scope

- `sanitary_sewer` only.

## Conservative decision priority

1. Real job data leak into framework/sandbox fixture -> `blocked_real_job_data_leak`
2. Quantity export attempt -> `blocked_quantity_export_attempt`
3. Cost/rate/labor/equipment/vendor-pricing attempt -> `blocked_cost_or_rate_attempt`
4. TakeoffItem creation or human-review bypass attempt -> `blocked_bypass_attempt`
5. Adapter output bypassing audit/review -> `blocked_bypass_attempt`
6. Audit unresolved with promotion requested -> `blocked_audit_unresolved`
7. Missing source document/source artifact/sheet reference -> `blocked_missing_source_reference`
8. Missing `trace_refs` -> `blocked_missing_traceability`
9. Incomplete sanitary candidate / duplicate candidate IDs / missing endpoints / missing structure reference -> `blocked_candidate_incomplete`
10. Conflicting or ambiguous sanitary fields -> `needs_manual_confirmation`
11. Other-scope generalization attempt -> blocked as bypass/scope-drift condition
12. Clean sanitary review handoff with no approval authority -> `review_ready`
13. Irrelevant non-sanitary item with no downstream claim -> `not_applicable`

## Manual confirmation triggers

Manual confirmation is required for missing/ambiguous project identity, source references, sheet references, trace refs, duplicate candidate IDs, missing pipe endpoints, missing structure references, conflicting diameter/material/depth class values, ambiguous invert/rim/elevation/stationing references, profile-vs-plan conflict, unresolved/ambiguous audit status, premature promotion requests, adapter bypass attempts, promotion quantity-export-ready attempts, direct TakeoffItem handoff attempts, unclear downstream use, scope-drift attempts, and real-job-data leakage into framework/sandbox fixtures.

## Output contract

Schema path:

```text
schemas/skills/sanitary-sewer-review-assistant.output.schema.json
```

Outputs must remain provisional and review-gated, include non-empty `trace_refs`, and not grant approval authority for quantity export, TakeoffItem creation, or cost/rate operations.

## Guardrails

This skill must not:

- update `docs/continuity/current-state.md`;
- create Airtable checkpoints;
- merge PRs;
- mark anything verified;
- implement production sanitary sewer extraction logic;
- parse PDFs or perform PDF intelligence;
- inspect drawings for quantities;
- create TakeoffItems, summaries, quantity exports, costs, rates, vendor/labor/equipment records, quote normalization, AGTEK/earthwork production logic, or estimating math;
- generalize this skill into non-sanitary scopes.
