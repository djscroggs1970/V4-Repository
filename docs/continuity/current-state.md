# V4 Current State

Status: active restart snapshot  
Last updated: 2026-04-28  
Current verified version: `v0.1-source-artifact-register-qa-skill-governance-ci-pass`

## Purpose

This document is the compact restart point for V4 Civil Estimating Platform sessions. Use it with `docs/continuity/source-of-truth.md`, root `AGENTS.md`, `docs/governance/production-rate-source-policy.md`, and the latest Airtable framework checkpoint.

Chat is the command lane only. GitHub, Airtable, Drive, and ClickUp hold durable source-of-truth records for their assigned domains.

## Source of truth locations

- GitHub repo: `djscroggs1970/V4-Repository`
- Airtable base: `V4 Base`
- Google Drive root: `V4 Framework`
- ClickUp location: `V4 Framework`
- Codex repo contract: `AGENTS.md`
- Continuity guide: `docs/continuity/source-of-truth.md`
- Production-rate policy: `docs/governance/production-rate-source-policy.md`

## Latest verified checkpoint

`v0.1-source-artifact-register-qa-skill-governance-ci-pass`

Evidence:

```text
PR: #31 Add source artifact register QA skill governance
GitHub Actions CI run: 25087404299
CI conclusion: success
Merge SHA: b3741c2185add61b049a26ef4db7221f82794ab3
Airtable checkpoint record: recADXh7FaGyPQar7
```

## Latest continuity update

This document update records the PR #31 checkpoint. Previous continuity PR #30 recorded the PR #29 checkpoint and merged with SHA `3baa0e464e5143e555e1040789e7468ffa3b2f73`.

## Current verified VS1A chain

VS1A is verified through the sanitary sewer candidate audit adapter stage.

Verified VS1A chain:

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
13. Shared civil extraction candidate framework
14. Sanitary sewer module extraction candidate builder
15. Sanitary sewer candidate audit adapter

VS1A can create controlled project/upload/sheet/takeoff/review/quantity-export structures and controlled sanitary sewer extraction/audit candidate structures, but extraction, audit, and candidate layers remain provisional and review-gated. Sanitary sewer audit adapter outputs remain audit inputs only and must not create quantity exports, summary output, costs, or bid-grade claims.

## Current verified VS1B chain

VS1B is verified through vendor quote registry merge review gate.

Verified VS1B chain:

1. Initial cost buildout from approved quantity exports
2. Cost input registry
3. Production-rate source policy
4. Cost scenario output manifest
5. Cost scenario persistence record
6. Estimate package output for controlled human review
7. Estimate package persistence record
8. Human review workflow for approve / reject / needs-review decisions
9. Bid-grade release gate
10. Output document generation
11. Output document persistence and review
12. Client-facing export package assembly
13. Client export persistence / distribution gate
14. External share / delivery manifest
15. Delivery persistence / external transmission gate
16. Controlled transmission adapter boundary
17. Vendor quote intake / normalized pricing schema
18. Vendor quote registry merge review gate

VS1B can consume approved quantity exports and validated cost input registries, assemble/persist/review estimate packages and client-facing package structures, and normalize/review vendor quote lines. It must not transmit files externally, create labor/equipment/production-rate records from vendor quote intake/review, or use placeholder production rates in cost output.

## Current verified governance/tooling chain

V4 includes a controlled Codex command lane and governed skill support.

1. Codex can be used as a repo-bound implementation assistant.
2. This chat remains the task controller and governance reviewer.
3. The user may relay tasks/results between this chat and Codex when direct handoff is unavailable.
4. Codex must follow root `AGENTS.md`.
5. Codex may create repo-scoped branches/PRs, but it cannot mark slices verified.
6. Codex cannot create Airtable checkpoints.
7. CI/check evidence and human/governance review are required before verification.
8. If Codex cannot push/open a visible PR because of environment restrictions, the change may be recreated through the GitHub connector only after confirming changed-file scope and preserving V4 guardrails.
9. PDF Intake Packetization Skill governance is verified as documentation/schema/test tooling only.
10. Codex Task Builder Skill governance is verified as documentation/schema/test tooling only.
11. PR Review / Merge Gate Skill governance is verified as documentation/schema/test tooling only.
12. Continuity / Restart Snapshot Skill governance is verified as documentation/schema/test tooling only.
13. Source Artifact Register QA Skill governance is verified as documentation/schema/test tooling only.

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
packages/vs1a/src/civil-extraction-candidates.ts
packages/vs1a/src/sanitary-sewer-extraction-candidates.ts
packages/vs1a/src/sanitary-sewer-audit-adapter.ts
packages/vs1a/src/pdf-intake-packetization-governance.test.ts
packages/vs1a/src/codex-task-builder-governance.test.ts
packages/vs1a/src/pr-review-merge-gate-governance.test.ts
packages/vs1a/src/continuity-restart-snapshot-governance.test.ts
packages/vs1a/src/source-artifact-register-qa-governance.test.ts
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
packages/vs1b/src/vendor-quote-registry-review-gate.ts
```

Key governance/tooling files:

```text
AGENTS.md
docs/continuity/source-of-truth.md
docs/continuity/current-state.md
docs/governance/production-rate-source-policy.md
docs/skills/pdf-intake-packetization.md
docs/skills/codex-task-builder.md
docs/skills/pr-review-merge-gate.md
docs/skills/continuity-restart-snapshot.md
docs/skills/source-artifact-register-qa.md
schemas/skills/pdf-intake-packetization.output.schema.json
schemas/skills/codex-task-builder.output.schema.json
schemas/skills/pr-review-merge-gate.output.schema.json
schemas/skills/continuity-restart-snapshot.output.schema.json
schemas/skills/source-artifact-register-qa.output.schema.json
tests/fixtures/pdf-intake-packetization/
tests/fixtures/codex-task-builder/
tests/fixtures/pr-review-merge-gate/
tests/fixtures/continuity-restart-snapshot/
tests/fixtures/source-artifact-register-qa/
.github/workflows/ci.yml
```

## Verified skill/governance behavior

### PDF Intake Packetization Skill governance

The PDF Intake Packetization Skill governance can define a provisional-only output contract for plan PDF intake packetization; require `provisional_status: provisional_pending_manual_review`; require `review_gated: true`; require hard guardrail confirmations that no quantities, takeoff items, costs, pricing records, or production-rate records were created; require typed sheet classifications, possible relationships, source artifact register, manual confirmation flags, bounded confidence values, and trace references; and validate synthetic fixtures without production OCR, real plan parsing, real project data, quantity extraction, takeoff creation, or pricing output.

### Codex Task Builder Skill governance

The Codex Task Builder Skill governance can define governed output for Codex task prompt creation; support `NEW TASK`, `SAME TASK`, `FIX CURRENT PR`, and `VERIFY / REPORT ONLY`; classify task types; require routing reason, provisional status, review gating, hard guardrails, CI command sequence, return format, governance instructions, and trace references; and require manual confirmation for vague goals, real job data, PDF intelligence, quantities/costs, Airtable governance changes, current-state changes, multi-module work, external apps/credentials, oversized slices, and checkpoint/mark-verified requests.

### PR Review / Merge Gate Skill governance

The PR Review / Merge Gate Skill governance can review GitHub pull request metadata, changed-file scope, CI evidence, source-of-truth guardrails, drift risk, manual confirmation triggers, merge readiness, checkpoint readiness, and continuity update readiness. It treats GitHub Actions CI as authoritative, blocks missing/failed CI from merge recommendation, blocks guardrail violations before scope/CI optimism, prevents premature verified/checkpoint/current-state claims, and remains documentation/schema/test tooling only.

### Continuity / Restart Snapshot Skill governance

The Continuity / Restart Snapshot Skill governance can produce compact, provisional restart snapshot outputs without treating chat history as authority. It checks source-of-truth evidence across GitHub, Airtable, Drive, ClickUp, chat history, and `current-state.md`; classifies missing evidence, stale/conflicting context, unverified claims, handoff readiness, continuity update candidates, and safe restart state; and preserves no-bleed/no-drift boundaries.

It creates no runtime external-write automation, Airtable write automation, merge/checkpoint/verified authority, current-state update authority, PDF intelligence, real job data, quantities, takeoff records, exports, costs, labor/equipment records, production-rate records, vendor-pricing records, estimating logic changes, or external transmission behavior.

### Source Artifact Register QA Skill governance

The Source Artifact Register QA Skill governance can review source artifact register entries for completeness, traceability, source-of-truth alignment, storage reference hygiene, project-instance isolation, manual-confirmation needs, and premature downstream-use risk. It defines conservative outcomes for register readiness, missing identity, missing storage reference, traceability gaps, project-instance mismatch, source-origin violation, real job data leakage, premature downstream use, manual confirmation, and not-applicable artifacts.

It treats Google Drive as source-file storage rather than governance proof, ClickUp as execution tracking only, and register QA readiness as separate from downstream processing authorization. It creates no runtime external-write automation, source artifact records, Airtable write automation, merge/checkpoint/verified authority, current-state update authority, PDF parsing/intelligence, real job data, quantities, TakeoffItems, summaries, exports, costs, labor/equipment records, production-rate records, vendor-pricing records, quote normalization, AGTEK/earthwork production logic, estimating logic changes, or external transmission behavior.

## Current guardrails

- Chat history is not the system of record.
- Do not rely on prior job data unless the user explicitly provides it.
- Sample jobs and fixtures remain sandbox data unless promoted through governance.
- Every project/job instance must carry its own `project_instance_id`.
- Framework, sandbox, and project data must remain separated.
- Only approved reviewed takeoff items can feed quantity summary or export.
- Extraction audit harnesses are not complete extraction claims.
- Civil extraction candidate framework outputs are provisional candidate records only.
- Civil extraction candidate outputs must remain module-scoped, human-review gated, and not quantity-export-ready.
- Sanitary sewer extraction candidate builder outputs are provisional module records only.
- Sanitary sewer audit adapter outputs remain provisional audit inputs only and must not bypass human review.
- Skill governance artifacts are documentation/schema/test tooling only.
- Skill outputs must remain provisional, review-gated, and must not grant verification, Airtable checkpoint, direct merge, current-state authority, production automation, external-write authority, source artifact creation, or downstream processing authorization.
- Audit outputs must remain provisional and human-review gated until explicitly resolved by future governance.
- Audit promotion gate outputs are not quantity-export-ready.
- Promoted audit candidates must still pass takeoff review before quantity summary or export.
- Source artifact register QA readiness is not PDF intelligence authorization, quantity extraction authorization, quote normalization authorization, cost registry authorization, AGTEK/earthwork production authorization, or external transmission authorization.
- Cost scenarios may consume only approved quantity exports and validated cost input registries.
- Placeholder production rates may exist in tests but must be blocked from estimate output.
- Production rates must be registered, versioned, traceable, reviewed, tied to crew/equipment, and validated before cost output.
- Vendor quote intake may normalize only user-provided quote data and must not invent unit costs or vendor assumptions.
- Normalized vendor quote records must remain pending registry review before they can feed validated cost input registries.
- Vendor quote registry review may make approved quote records eligible for registry merge only; it must not create a validated cost input registry by itself.
- Labor rates, equipment rates, and production rates must not be created from vendor quote intake or vendor quote registry review unless a future explicit slice and review workflow allows it.
- Estimate packages are for controlled human review, not autonomous bid submission.
- Generated output documents, client-facing export packages, delivery manifests, and adapter-boundary records do not transmit, upload, email, or externally distribute files.
- Controlled adapter-boundary records must keep execution disabled until governance explicitly enables it.
- Codex must follow `AGENTS.md` and cannot mark anything verified without CI/check evidence.
- CI/checks must pass before a slice is marked verified.

## Current export surface note

The VS1A sanitary utility extraction audit harness, audit review promotion gate, audit candidate handoff, shared civil extraction candidate framework, sanitary sewer extraction candidate builder, and sanitary sewer candidate audit adapter are verified and exposed through the VS1A root package barrel export:

```text
@v4/vs1a
```

The V4 skill governance artifacts are verified as documentation/schema/test tooling:

```text
docs/skills/pdf-intake-packetization.md
docs/skills/codex-task-builder.md
docs/skills/pr-review-merge-gate.md
docs/skills/continuity-restart-snapshot.md
docs/skills/source-artifact-register-qa.md
schemas/skills/pdf-intake-packetization.output.schema.json
schemas/skills/codex-task-builder.output.schema.json
schemas/skills/pr-review-merge-gate.output.schema.json
schemas/skills/continuity-restart-snapshot.output.schema.json
schemas/skills/source-artifact-register-qa.output.schema.json
```

The VS1B vendor quote intake and vendor quote registry review gate modules are verified and exposed through the VS1B root package barrel export:

```text
@v4/vs1b
```

Some older VS1B document/delivery modules are also exposed through package subpath exports. Direct root barrel cleanup for older document/delivery modules remains a follow-up cleanup item unless later verified state says otherwise.

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

CI workflow is currently set to Node 24 and clean action runtime. Standalone sample scripts outside CI are supplemental unless explicitly wired into the workflow.

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
- Codex-created PRs still require CI/checks and governance review.
- Codex local environment failures must be distinguished from GitHub Actions CI/check results.

Known Codex environment limitation:

- Codex has previously drafted local changes but could not always push/open visible PRs because of environment restrictions.
- Visible PRs may be recreated through the GitHub connector only after confirming changed-file scope and preserving V4 guardrails.

## Next logical slice

Recommended next implementation slice:

```text
Sanitary Sewer End-to-End Candidate Chain Fixture
```

Goal: add a controlled synthetic fixture/test that proves the sanitary sewer module candidate builder, audit adapter, sewer extraction audit harness, audit review promotion gate, and audit candidate takeoff handoff can work together end-to-end without real job data, PDF intelligence, autonomous quantity export, or bypassing human review.

Next optional skill lane after implementation work resumes:

```text
Sanitary Sewer Review Assistant Skill
```

Goal: add governed documentation/schema/test support for reviewing sanitary sewer candidate/audit/handoff outputs for completeness, traceability, ambiguity, manual-confirmation needs, and no-bypass constraints without creating quantities, costs, or autonomous takeoff approval.

## New session boot instruction

Start future sessions with:

```text
This is a V4 Civil Estimating Platform session.
Use GitHub `djscroggs1970/V4-Repository`, Airtable `V4 Base`, Drive `V4 Framework`, and ClickUp `V4 Framework` as the external sources of truth.
Read `AGENTS.md`, `docs/continuity/source-of-truth.md`, `docs/continuity/current-state.md`, and `docs/governance/production-rate-source-policy.md` before continuing.
Codex is available as a controlled implementation assistant, but this chat remains task controller/reviewer and Codex must follow AGENTS.md.
Current verified version: `v0.1-source-artifact-register-qa-skill-governance-ci-pass`.
Current goal: [one sentence].
Do not rely on prior job data unless explicitly provided.
Maintain job-instance isolation and no-bleed/no-drift rules.
```
