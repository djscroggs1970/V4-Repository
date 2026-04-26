# AGENTS.md — V4 Civil Estimating Platform Repo Contract

This file defines the operating contract for AI coding agents working in this repository.

## 1) Project purpose

- V4 is a civil estimating platform.
- Current code is governed through verified slices and CI.
- GitHub is the technical/code source of truth.

## 2) Source-of-truth hierarchy

Use these systems in this order for their designated domains:

1. **GitHub (`djscroggs1970/V4-Repository`)**
   - Technical implementation source of truth (code, package structure, schemas, tests, CI workflow).
2. **Airtable (`V4 Base`)**
   - Checkpoint/build-governance source of truth (verified checkpoints, active/draft slices, governance status).
3. **Google Drive (`V4 Framework`)**
   - Source document and uploaded file storage source of truth.
4. **ClickUp (`V4 Framework`)**
   - Execution tracking only. Must not override Airtable governance decisions.

## 3) Job-instance isolation rules

- Every job/project workflow must carry `project_instance_id`.
- No data bleed between framework, sandbox, and project/job instances.
- Sandbox fixtures are not real job data.
- Controlled Promenade fixtures must not be treated as complete plan extraction.

## 4) CI command contract

Required CI command sequence:

```bash
pnpm install --frozen-lockfile=false
pnpm build
pnpm typecheck
pnpm test
pnpm validate:rules
pnpm sample:vs1a
pnpm sample:vs1a:upload
```

## 5) Slice definition of done

- Work must be narrow and branch-scoped.
- Tests must be added or updated for behavior changes.
- CI must pass before any slice is considered verified.
- Airtable checkpoint comes only after CI passes.
- `docs/continuity/current-state.md` is updated only after merge or when explicitly requested.

## 6) Boundary rules

- Do not start full PDF intelligence unless `docs/continuity/current-state.md` explicitly authorizes it.
- Do not claim all sewer, utility, or plan quantities are harvested unless a completeness audit proves it.
- Do not invent production rates, material quotes, labor rates, or equipment rates.
- Do not email, upload, transmit, distribute, or externally share files.
- Transmission/adapter modules must remain disabled unless governance explicitly enables execution.

## 7) Package export rules

- Root barrel exports are preferred when safe.
- If root barrel export updates are blocked or unsafe, use package subpath exports in `package.json` and document the limitation.
- Do not remove existing subpath exports.

## 8) Review behavior

- State assumptions clearly.
- Stop on ambiguity that could affect estimate validity, cost validity, or external release.
- Prefer deterministic tests and explicit fixtures.
- Do not mark anything verified without CI evidence.

## 9) Current next procedural direction

- Follow `docs/continuity/current-state.md` for the current verified state and next slice.
- Current planned next major procedural item after adapter-boundary work is **Sewer Extraction Completeness Audit**, unless `current-state.md` says otherwise.

## Additional operational constraints

- Do not modify application code or estimating logic unless explicitly requested by the user.
- Do not modify tests unless absolutely necessary for the requested scope.
- Do not use or create real job data.
