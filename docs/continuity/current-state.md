# V4 Current State

Status: active restart snapshot  
Last updated: 2026-04-27  
Current verified version: `v0.1-audit-candidate-handoff-ci-pass`

## Purpose

This document is the compact restart point for future V4 Civil Estimating Platform sessions. Use it with `docs/continuity/source-of-truth.md`, root `AGENTS.md`, and the latest Airtable checkpoint.

## Source of truth locations

- GitHub repo: `djscroggs1970/V4-Repository`
- Airtable base: `V4 Base`
- Google Drive root: `V4 Framework`
- ClickUp location: `V4 Framework`
- Codex repo contract: `AGENTS.md`
- Continuity guide: `docs/continuity/source-of-truth.md`
- Production-rate policy: `docs/governance/production-rate-source-policy.md`

## Latest verified checkpoint

`v0.1-audit-candidate-handoff-ci-pass`

Evidence:

```text
PR: #13 Add VS1A audit candidate handoff
GitHub Actions CI run: 24970637314
CI conclusion: success
Merge SHA: 5248f175e28e3bd300881a7a3bbce4b8248a0b0e
Airtable checkpoint record: recvlhMWhL9IM07zn
```

## Current verified VS1A chain

VS1A is verified through the audit candidate handoff stage.

1. Upload registration
2. Sheet index creation
3. Takeoff candidate entry
4. Takeoff review
5. Quantity summary
6. Quantity export
7. Quantity export persistence manifest
8. Sanitized controlled real-plan-style validation
9. Plan harvest sandbox with review/export gates
10. Utility extraction completeness audit harness for sanitary scope
11. Audit review / candidate promotion gate
12. VS1A audit candidate handoff

## Current verified VS1B chain

VS1B is verified through vendor quote intake / normalized pricing schema.

1. Initial cost buildout from approved quantity exports
2. Cost input registry
3. Production-rate source policy
4. Cost scenario output manifest
5. Cost scenario persistence record
6. Estimate package output for controlled human review
7. Estimate package persistence record
8. Human review workflow for approve / reject / needs-review decisions
9. Bid-grade output release gate
10. Output document generation
11. Output document persistence and review
12. Client-facing export package assembly
13. Client export persistence / distribution gate
14. External share / delivery manifest
15. Delivery persistence / external transmission gate
16. Controlled transmission adapter boundary
17. Vendor quote intake / normalized pricing schema

## Current verified governance/tooling chain

V4 includes a controlled Codex command lane.

1. Codex can be used as a repo-bound implementation assistant.
2. This chat remains the task controller and governance reviewer.
3. The user acts as messenger between this chat and Codex when direct handoff is unavailable.
4. Codex must follow root `AGENTS.md`.
5. Codex may create repo-scoped branches/PRs, but it cannot mark slices verified.
6. Codex cannot create Airtable checkpoints.
7. CI evidence and human/governance review are still required before verification.
8. If Codex cannot push/open a PR because of environment restrictions, the change may be recreated through the GitHub connector only after confirming changed-file scope and preserving V4 guardrails.

## Current implementation packages

Primary packages:

```text
packages/vs1a
packages/vs1b
```

Key VS1A files:

```text
packages/vs1a/src/index.ts
packages/vs1a/src/review.ts
packages/vs1a/src/summary.ts
packages/vs1a/src/quantity-export.ts
packages/vs1a/src/export-persistence.ts
packages/vs1a/src/plan-harvest.ts
packages/vs1a/src/sewer-extraction-audit.ts
packages/vs1a/src/audit-review-gate.ts
packages/vs1a/src/audit-candidate-handoff.ts
packages/vs1a/src/index.test.ts
packages/vs1a/src/plan-harvest.test.ts
packages/vs1a/src/promenade-plan-validation.test.ts
packages/vs1a/src/sewer-extraction-audit.test.ts
packages/vs1a/src/audit-review-gate.test.ts
packages/vs1a/src/audit-candidate-handoff.test.ts
```

Key VS1B files:

```text
packages/vs1b/package.json
packages/vs1b/src/index.ts
packages/vs1b/src/cost-input-registry.ts
packages/vs1b/src/cost-scenario-output.ts
packages/vs1b/src/cost-scenario-persistence.ts
packages/vs1b/src/estimate-package.ts
packages/vs1b/src/estimate-package-persistence.ts
packages/vs1b/src/estimate-package-review.ts
packages/vs1b/src/bid-grade-release-gate.ts
packages/vs1b/src/output-document-generation.ts
packages/vs1b/src/output-document-persistence-review.ts
packages/vs1b/src/client-export-package.ts
packages/vs1b/src/client-package-release-gate.ts
packages/vs1b/src/delivery-manifest.ts
packages/vs1b/src/delivery-transmission-gate.ts
packages/vs1b/src/controlled-adapter-boundary.ts
packages/vs1b/src/vendor-quote-intake.ts
packages/vs1b/src/index.test.ts
packages/vs1b/src/estimate-package-persistence.test.ts
packages/vs1b/src/bid-grade-release-gate.test.ts
packages/vs1b/src/output-document-generation.test.ts
packages/vs1b/src/output-document-persistence-review.test.ts
packages/vs1b/src/client-export-package.test.ts
packages/vs1b/src/client-package-release-gate.test.ts
packages/vs1b/src/delivery-manifest.test.ts
packages/vs1b/src/delivery-transmission-gate.test.ts
packages/vs1b/src/controlled-adapter-boundary.test.ts
packages/vs1b/src/vendor-quote-intake.test.ts
```

Key governance/tooling files:

```text
AGENTS.md
docs/continuity/source-of-truth.md
docs/continuity/current-state.md
docs/governance/production-rate-source-policy.md
.github/workflows/ci.yml
```

## Verified VS1A behavior

The current VS1A pipeline can:

- create a project instance
- register an uploaded PDF drawing using metadata
- create controlled drawing sheet records
- create structured/manual sanitary takeoff candidates
- create provisional sandbox harvest candidates with provenance and confidence
- validate source sheet references
- split pipe quantities by depth class when depths are provided
- apply review decisions to takeoff candidates
- require notes for rejected or flagged review items
- summarize approved takeoff items only
- exclude rejected, pending, and needs-review items from quantity summary
- group quantity summary by material, diameter, depth class, and unit
- preserve source takeoff item IDs
- create a quantity-only export object
- block export when review items are still open
- create a project-isolated quantity export persistence manifest
- create a sanitary utility extraction audit harness for classifying candidate findings
- classify audit records as found utility runs, uncertain candidates, excluded non-target items, or unresolved plan questions
- keep extraction audit results provisional with `audit_status: provisional_incomplete` and `completeness_claim: not_claimed`
- require human review for every extraction audit record
- allow only approved found-run audit records with required handoff fields to become eligible for takeoff review
- keep promoted audit candidates pending takeoff review and not quantity-export-ready
- convert completed audit promotion gate output into controlled pending `TakeoffItem` records
- require completed audit review promotion gate status before handoff
- block open audit review gates with `audit_handoff_requires_completed_gate`
- validate eligible promoted candidate state and required handoff fields
- preserve audit, audit-record, candidate, project, document, and sheet trace references on the handoff manifest/result
- avoid mutating `TakeoffItem` with trace references
- keep generated takeoff items pending review
- keep handoff output `quantity_export_ready: false`
- avoid summarizing quantities or creating quantity exports from handoff output

## Verified VS1B behavior

The current VS1B pipeline can:

- consume approved quantity-only exports
- apply controlled material quotes
- apply controlled labor rates
- apply controlled equipment rates
- apply validated production rates
- reject placeholder production rates
- create traceable cost buildout lines and totals
- validate cost input registries
- enforce unique registry IDs
- enforce production-rate links to known crew and equipment records
- preserve quantity export, takeoff item, quote, labor, equipment, production-rate, and registry traceability
- create a project-isolated cost scenario output manifest
- persist cost scenario output records with storage path and trace references
- assemble and persist controlled human-review estimate packages
- create estimate package human review records and block rejected or needs-review packages from release
- build bid-grade release manifests only from approved human-review records and trace-complete package/persistence records
- generate controlled output document sets only from approved release manifests
- persist and review generated output document sets
- assemble client-facing export package manifests only from persisted and approved output document review records
- persist client-facing export packages and require a release gate before delivery manifest generation
- create and persist delivery manifests without transmitting, uploading, emailing, or externally distributing files
- create external transmission gate records that authorize only future adapter-boundary preparation
- define disabled controlled adapter-boundary records for future external transfer paths
- normalize user-provided vendor quote lines into traceable material quote records
- preserve vendor quote batch, project instance, source document, source file, vendor, quote-line, and normalized quote trace references
- keep normalized vendor quote records pending registry review and not automatically merged into the validated cost input registry
- reject duplicate quote line IDs, missing quote identity fields, invalid material/diameter/uom/unit-cost fields, unsupported currency, and non-upload source origins

## Current guardrails

- Chat history is not the system of record.
- Do not rely on prior job data unless the user explicitly provides it.
- Sample jobs and fixtures remain sandbox data unless promoted through governance.
- Every project/job instance must carry its own `project_instance_id`.
- Framework, sandbox, and project data must remain separated.
- Only approved reviewed takeoff items can feed quantity summary or export.
- Extraction audit harnesses are not complete extraction claims.
- Audit outputs must remain provisional and human-review gated until explicitly resolved by future governance.
- Audit promotion gate outputs are not quantity-export-ready.
- Promoted audit candidates must still pass takeoff review before quantity summary or export.
- Audit handoff outputs still require takeoff review before quantity summary/export.
- Cost scenarios may consume only approved quantity exports and validated cost input registries.
- Placeholder production rates may exist in tests but must be blocked from estimate output.
- Vendor quote intake may normalize only user-provided quote data and must not invent unit costs or vendor assumptions.
- Normalized vendor quote records must remain pending registry review before they can feed validated cost input registries.
- Labor rates, equipment rates, and production rates must not be created from vendor quote intake unless a future explicit slice and review workflow allows it.
- Estimate packages are for controlled human review, not autonomous bid submission.
- Generated output documents, client-facing export packages, delivery manifests, and adapter-boundary records do not transmit, upload, email, or externally distribute files.
- Controlled adapter-boundary records must keep execution disabled until governance explicitly enables it.
- Codex must follow `AGENTS.md` and cannot mark anything verified without CI evidence.
- CI must pass before a slice is marked verified.

## Current export surface note

The VS1A sanitary utility extraction audit harness, audit review promotion gate, and audit candidate handoff are verified and exposed through the VS1A root package barrel export:

```text
@v4/vs1a
```

The VS1B vendor quote intake module is verified and exposed through both the VS1B root package barrel export and package subpath export:

```text
@v4/vs1b
@v4/vs1b/vendor-quote-intake
```

The output document persistence/review, client-facing export package, client package release gate, delivery manifest, delivery transmission gate, and controlled adapter boundary modules are verified and exposed through package subpath exports:

```text
@v4/vs1b/output-document-persistence-review
@v4/vs1b/client-export-package
@v4/vs1b/client-package-release-gate
@v4/vs1b/delivery-manifest
@v4/vs1b/delivery-transmission-gate
@v4/vs1b/controlled-adapter-boundary
```

Direct root `packages/vs1b/src/index.ts` barrel exports for the older document/delivery modules remain follow-up cleanup items. Package subpath exports in `packages/vs1b/package.json` are verified.

## Current CI command set

Expected CI path:

```bash
pnpm install --frozen-lockfile=false
pnpm build
pnpm typecheck
pnpm test
pnpm validate:rules
pnpm sample:vs1a
pnpm sample:vs1a:upload
```

CI workflow is currently set to Node 24 and clean action runtime.

Some standalone sample scripts may exist outside CI and should be treated as supplemental checks unless explicitly wired into the workflow.

## Codex command lane

Codex is available as a controlled implementation assistant for V4.

Operating model:

```text
This chat defines the task.
The user relays the task to Codex when direct control is unavailable.
Codex works inside the GitHub repo under AGENTS.md.
Codex returns a PR/result/log.
This chat reviews the result against V4 governance before merge/checkpoint.
```

Rules:

- Give Codex narrow repo-scoped tasks only.
- Do not ask Codex to “build V4”, “extract the plans”, or “make it bid-grade”.
- Prefer deterministic schema, fixture, test, CI, and documentation tasks.
- Codex-created PRs still require CI and governance review.
- Codex local environment failures must be distinguished from GitHub Actions CI results.

Known Codex environment limitation:

- Codex has previously drafted local changes but could not always push/open visible PRs because of environment restrictions.
- Visible PRs may be recreated through the GitHub connector only after confirming changed-file scope and preserving V4 guardrails.

## Next logical slice

Recommended next slice:

```text
Vendor Quote Registry Merge Review Gate
```

Goal: review normalized vendor quote records and allow only approved quote records to merge into the validated cost input registry without inventing pricing or bypassing traceability.

## New session boot instruction

Start future sessions with:

```text
This is a V4 Civil Estimating Platform session.
Use GitHub `djscroggs1970/V4-Repository`, Airtable `V4 Base`, Drive `V4 Framework`, and ClickUp `V4 Framework` as the external sources of truth.
Read `AGENTS.md`, `docs/continuity/source-of-truth.md`, `docs/continuity/current-state.md`, and `docs/governance/production-rate-source-policy.md` before continuing.
Codex is available as a controlled implementation assistant, but this chat remains task controller/reviewer and Codex must follow AGENTS.md.
Current verified version: `v0.1-audit-candidate-handoff-ci-pass`.
Current goal: [one sentence].
Do not rely on prior job data unless explicitly provided.
Maintain job-instance isolation and no-bleed/no-drift rules.
```
