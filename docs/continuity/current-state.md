# V4 Current State

Status: active restart snapshot  
Last updated: 2026-04-24  
Current verified version: `v0.1-vs1a-quantity-export-ci-pass`

## Purpose

This document is the compact restart point for future V4 Civil Estimating Platform sessions. Use it with `docs/continuity/source-of-truth.md` and the latest Airtable checkpoint.

## Source of truth locations

- GitHub repo: `djscroggs1970/V4-Repository`
- Airtable base: `V4 Base`
- Google Drive root: `V4 Framework`
- ClickUp location: `V4 Framework`
- Continuity guide: `docs/continuity/source-of-truth.md`

## Current verified VS1A chain

VS1A is verified through quantity-only export.

1. Upload registration
2. Sheet index creation
3. Takeoff candidate entry
4. Takeoff review
5. Quantity summary
6. Quantity export

## Current implementation package

Primary package:

```text
packages/vs1a
```

Key files:

```text
packages/vs1a/src/index.ts
packages/vs1a/src/review.ts
packages/vs1a/src/summary.ts
packages/vs1a/src/quantity-export.ts
packages/vs1a/src/index.test.ts
```

## Verified behavior

The current VS1A pipeline can:

- create a project instance
- register an uploaded PDF drawing using metadata
- create controlled drawing sheet records
- create structured/manual sanitary takeoff candidates
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

## Current guardrails

- Chat history is not the system of record.
- Do not rely on prior job data unless the user explicitly provides it.
- Sample jobs and fixtures remain sandbox data unless promoted through governance.
- Every project/job instance must carry its own `project_instance_id`.
- Framework, sandbox, and project data must remain separated.
- Only approved reviewed takeoff items can feed quantity summary or export.
- CI must pass before a slice is marked verified.

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

Some standalone sample scripts may exist outside CI and should be treated as supplemental checks unless explicitly wired into the workflow.

## Next logical slice

Recommended next slice:

```text
VS1A Continuity State CI Verification
```

Goal: confirm this continuity state document exists and keep Airtable aligned with the latest verified restart snapshot.

After that, the likely next product slice is:

```text
VS1A Export Persistence
```

Goal: persist the quantity export object to the designated storage path with project-instance isolation and traceability.

## New session boot instruction

Start future sessions with:

```text
This is a V4 Civil Estimating Platform session.
Use GitHub `djscroggs1970/V4-Repository`, Airtable `V4 Base`, Drive `V4 Framework`, and ClickUp `V4 Framework` as the external sources of truth.
Read `docs/continuity/source-of-truth.md` and `docs/continuity/current-state.md` before continuing.
Current goal: [one sentence].
Do not rely on prior job data unless explicitly provided.
Maintain job-instance isolation and no-bleed/no-drift rules.
```
