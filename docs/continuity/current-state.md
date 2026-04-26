# V4 Current State

Status: active restart snapshot  
Last updated: 2026-04-26  
Current verified version: `v0.1-codex-repo-contract-ci-pass`

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

## Current verified VS1A chain

VS1A is verified through sandbox plan harvest and quantity export persistence.

1. Upload registration
2. Sheet index creation
3. Takeoff candidate entry
4. Takeoff review
5. Quantity summary
6. Quantity export
7. Quantity export persistence manifest
8. Sanitized controlled real-plan-style validation
9. Plan harvest sandbox with review/export gates

## Current verified VS1B chain

VS1B is verified through controlled transmission adapter boundary.

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

## Current verified governance/tooling chain

V4 now includes a controlled Codex command lane.

1. Codex can be used as a repo-bound implementation assistant.
2. This chat remains the task controller and governance reviewer.
3. The user acts as messenger between this chat and Codex when direct handoff is unavailable.
4. Codex must follow root `AGENTS.md`.
5. Codex may create repo-scoped branches/PRs, but it cannot mark slices verified.
6. Codex cannot create Airtable checkpoints.
7. CI evidence and human/governance review are still required before verification.
8. If Codex cannot push/open a PR because of environment restrictions, the change may be recreated through the GitHub connector only after the changed-file scope is verified.

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
packages/vs1a/src/index.test.ts
packages/vs1a/src/plan-harvest.test.ts
packages/vs1a/src/promenade-plan-validation.test.ts
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
- block scenario output when cost line inputs are not present in the validated registry
- assemble quantity export, quantity persistence, cost buildout, cost scenario output, cost scenario persistence, review status, storage paths, and trace manifest into a controlled human-review estimate package
- persist estimate package records with project-instance isolation, package ID, review status, storage path, total cost, and trace references
- reject estimate packages with project-instance mismatches or missing takeoff trace coverage
- create human review records for approved, rejected, and needs-review estimate packages
- require review notes for rejected or needs-review estimate packages
- block rejected or needs-review packages from external/bid-grade release
- mark approved packages eligible for release workflow
- build a bid-grade release manifest only from an approved human-review record, matching estimate package output, and matching estimate package persistence record
- reject bid-grade release when package, persistence, review, project instance, storage path, or trace coverage checks fail
- mark approved release manifests ready for output document generation
- generate a controlled output document set only from a ready bid-grade release manifest
- create estimate summary, cost breakdown, quantity/cost trace exhibit, and client-facing export manifest document objects
- preserve release, package, review, quantity export, cost scenario, registry, source document, and takeoff trace references in generated output document objects
- reject output document generation when release status/action or trace coverage is invalid
- mark generated output document sets pending persistence and review
- persist generated output document sets with project-instance storage paths and trace references
- create output document review records for approved, rejected, and needs-review decisions
- require review notes for rejected or needs-review output document decisions
- block unapproved output documents from client-facing export package assembly
- mark approved output documents eligible for client-facing export package assembly
- assemble a controlled client-facing export package manifest only from persisted output documents and an approved output document review record
- preserve document set, output persistence, output review, release, estimate package, quantity export, cost scenario, and document trace references in the client-facing export package manifest
- reject client-facing export package assembly for rejected or needs-review output document review records
- reject client-facing export package assembly when document set, persistence, review, project instance, release, package, quantity export, cost scenario, document coverage, storage path, or trace checks fail
- keep assembled client-facing export packages pending a separate distribution gate
- persist assembled client-facing export package manifests with project-instance storage paths and trace references
- create client package release gate records for approved, rejected, and needs-review decisions
- require review notes for rejected or needs-review client package release gate decisions
- block delivery manifest generation unless the persisted client export package is approved at the release gate
- mark approved persisted client export packages eligible for delivery manifest generation
- create delivery manifest records only from persisted client export packages and approved client package release gate records
- preserve client export package, persistence, release gate, release, estimate package, quantity export, cost scenario, and document trace references in delivery manifests
- reject delivery manifest generation for rejected or needs-review release gate records
- reject delivery manifest generation when package, persistence, project instance, document coverage, storage path, or trace checks fail
- keep delivery manifests prepared pending a final external transmission gate
- persist prepared delivery manifest records with project-instance storage paths and trace references
- create external transmission gate records for approved, rejected, and needs-review decisions
- require review notes for rejected or needs-review external transmission gate decisions
- block future adapter-boundary preparation unless the persisted delivery manifest is approved at the external transmission gate
- mark approved persisted delivery manifests authorized for adapter-boundary preparation only, not for live transmission
- define controlled adapter-boundary records for future external transfer paths
- keep all adapter-boundary execution disabled pending governance enablement
- ensure controlled adapter boundaries never email, upload, send, or externally distribute files

## Current guardrails

- Chat history is not the system of record.
- Do not rely on prior job data unless the user explicitly provides it.
- Sample jobs and fixtures remain sandbox data unless promoted through governance.
- Every project/job instance must carry its own `project_instance_id`.
- Framework, sandbox, and project data must remain separated.
- Only approved reviewed takeoff items can feed quantity summary or export.
- Cost scenarios may consume only approved quantity exports and validated cost input registries.
- Placeholder production rates may exist in tests but must be blocked from estimate output.
- Estimate packages are for controlled human review, not autonomous bid submission.
- Rejected or needs-review estimate packages must be resolved before release.
- Bid-grade release manifests may consume only approved human-review records and trace-complete package/persistence records.
- Output document generation may consume approved release manifests, not raw/unreviewed estimate packages.
- Generated output documents are not externally shareable until persisted and reviewed.
- Client-facing export package assembly may consume only persisted and approved output document review records.
- Client-facing export packages are not externally distributable until the distribution gate is implemented and approved.
- Delivery manifest generation may consume only persisted client export packages with approved client package release gate records.
- Delivery manifests do not transmit, upload, email, or externally distribute files.
- Delivery manifest persistence and external transmission gates do not transmit, upload, email, or externally distribute files.
- External transmission approval currently authorizes only future adapter-boundary preparation.
- Controlled adapter-boundary records must keep execution disabled until governance explicitly enables it.
- Codex must follow `AGENTS.md` and cannot mark anything verified without CI evidence.
- CI must pass before a slice is marked verified.

## Current export surface note

The output document persistence/review, client-facing export package, client package release gate, delivery manifest, delivery transmission gate, and controlled adapter boundary modules are verified and exposed through package subpath exports:

```text
@v4/vs1b/output-document-persistence-review
@v4/vs1b/client-export-package
@v4/vs1b/client-package-release-gate
@v4/vs1b/delivery-manifest
@v4/vs1b/delivery-transmission-gate
@v4/vs1b/controlled-adapter-boundary
```

Direct root `packages/vs1b/src/index.ts` barrel exports for these modules remain follow-up cleanup items. Attempts to patch that file through the GitHub connector were blocked by the tool safety layer. Package subpath exports in `packages/vs1b/package.json` were added instead and CI passed after those patches.

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

Codex is now available as a controlled implementation assistant for V4.

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

- During the first Codex test, Codex could create the local `AGENTS.md` commit but could not push/open a visible PR because GitHub push failed with a CONNECT tunnel 403 and `gh` was unavailable.
- The visible PR was recreated through the GitHub connector after confirming Codex changed only `AGENTS.md`.

## Next logical slice

Recommended next slice:

```text
Sewer Extraction Completeness Audit
```

Goal: audit the PDF intelligence gap for sanitary sewer by identifying all sewer-bearing sheets, extracting all visible sewer run candidates, and reporting unresolved/uncertain runs before any real plan-output test is treated as complete.

Important boundary: this slice should produce a completeness/audit harness and should not claim full sewer extraction is complete unless the audit proves it. It should not create bid-grade output or costing from partial harvest data.

After that, the likely next product slice is:

```text
Vendor Quote Intake / Normalized Pricing Schema
```

Goal: ingest uploaded quote data into controlled, traceable pricing records that can merge into the cost input registry without inventing unit costs or vendor assumptions.

## New session boot instruction

Start future sessions with:

```text
This is a V4 Civil Estimating Platform session.
Use GitHub `djscroggs1970/V4-Repository`, Airtable `V4 Base`, Drive `V4 Framework`, and ClickUp `V4 Framework` as the external sources of truth.
Read `AGENTS.md`, `docs/continuity/source-of-truth.md`, `docs/continuity/current-state.md`, and `docs/governance/production-rate-source-policy.md` before continuing.
Codex is available as a controlled implementation assistant, but this chat remains task controller/reviewer and Codex must follow AGENTS.md.
Current goal: [one sentence].
Do not rely on prior job data unless explicitly provided.
Maintain job-instance isolation and no-bleed/no-drift rules.
```
