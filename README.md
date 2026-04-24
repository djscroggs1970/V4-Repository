# V4 Repository

Reusable framework source for the V4 civil estimating platform.

## Current baseline

- Mode 1: quantity takeoff only.
- Mode 2: quantity takeoff plus optional cost buildout.
- Phase 1 work type: PVC gravity sewer.
- Framework version: v0.1-bootstrap.

## Local commands

```bash
pnpm install
pnpm build
pnpm test
pnpm validate:rules
```

## Workspace layout

- `apps/web` browser UI shell
- `apps/api` API shell
- `apps/worker` worker shell
- `packages/domain` shared models
- `packages/config` shared config
- `packages/production-rules` production rule resolver
- `packages/estimating-engine` estimate line logic
- `packages/takeoff-engine` quantity takeoff helpers
- `packages/quote-normalizer` quote parsing helpers
- `rules` machine-readable estimating rules
- `data/seed` framework seed datasets
- `tests` shared tests and fixtures

## Storage rule

This repo stores generic framework source only. Live job inputs, outputs, client deliverables, and snapshots belong outside the repo in their own project-instance storage.
