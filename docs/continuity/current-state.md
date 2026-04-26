# V4 Current State

Status: active restart snapshot  
Last updated: 2026-04-26  
Current verified version: `v0.1-delivery-manifest-ci-pass`

## Purpose

This document is the compact restart point for future V4 Civil Estimating Platform sessions. Use it with `docs/continuity/source-of-truth.md` and the latest Airtable checkpoint.

## Source of truth locations

- GitHub repo: `djscroggs1970/V4-Repository`
- Airtable base: `V4 Base`
- Google Drive root: `V4 Framework`
- ClickUp location: `V4 Framework`
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

VS1B is verified through external share / delivery manifest.

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
packages/vs1b/src/index.test.ts
packages/vs1b/src/estimate-package-persistence.test.ts
packages/vs1b/src/bid-grade-release-gate.test.ts
packages/vs1b/src/output-document-generation.test.ts
packages/vs1b/src/output-document-persistence-review.test.ts
packages/vs1b/src/client-export-package.test.ts
packages/vs1b/src/client-package-release-gate.test.ts
packages/vs1b/src/delivery-manifest.test.ts
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
- CI must pass before a slice is marked verified.

## Current export surface note

The output document persistence/review, client-facing export package, client package release gate, and delivery manifest modules are verified and exposed through package subpath exports:

```text
@v4/vs1b/output-document-persistence-review
@v4/vs1b/client-export-package
@v4/vs1b/client-package-release-gate
@v4/vs1b/delivery-manifest
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

## Next logical slice

Recommended next slice:

```text
Delivery Persistence / External Transmission Gate
```

Goal: persist delivery manifest records and require an explicit final human authorization gate before any actual external transmission workflow is introduced.

Important boundary: this slice should consume prepared delivery manifests and should not transmit files, email clients, upload to portals, or otherwise distribute externally.

After that, the likely next product slice is:

```text
Controlled Transmission Adapter Boundary
```

Goal: define the adapter interface for future external transmission while keeping real transmission disabled until governance explicitly enables it.

## New session boot instruction

Start future sessions with:

```text
This is a V4 Civil Estimating Platform session.
Use GitHub `djscroggs1970/V4-Repository`, Airtable `V4 Base`, Drive `V4 Framework`, and ClickUp `V4 Framework` as the external sources of truth.
Read `docs/continuity/source-of-truth.md`, `docs/continuity/current-state.md`, and `docs/governance/production-rate-source-policy.md` before continuing.
Current goal: [one sentence].
Do not rely on prior job data unless explicitly provided.
Maintain job-instance isolation and no-bleed/no-drift rules.
```
