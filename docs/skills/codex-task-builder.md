# V4 Codex Task Builder Skill (Governed Support)

## Purpose

This slice adds governed **documentation/schema/test tooling only** support for a Codex Task Builder Skill output contract.

It does **not** create production automation, does **not** call Codex from code, does **not** create Airtable writes, and does **not** grant GitHub merge authority.

## Supported Task Classes

The output contract supports the following task classes:

- `new_repo_slice`
- `fix_existing_pr`
- `recreate_local_only_codex_result`
- `docs_only_continuity_update`
- `schema_test_governance_fixture_slice`
- `verification_only_request`
- `review_merge_checkpoint_preparation`
- `skill_governance_documentation_slice`

## Routing Contract

The output contract supports routing values:

- `NEW TASK`
- `SAME TASK`
- `FIX CURRENT PR`
- `VERIFY / REPORT ONLY`

Requirements:

- Routing is required.
- Routing reason is required.
- `review_gated` must remain `true`.
- Output must remain provisional.

## Governance Requirements Captured in Schema/Test Tooling

- Current verified version is required **or** manual confirmation is required.
- Latest checkpoint reference is required **or** manual confirmation is required.
- Hard guardrails are explicit and required.
- CI command sequence is explicit and required:
  1. `pnpm install --frozen-lockfile=false`
  2. `pnpm build`
  3. `pnpm typecheck`
  4. `pnpm test`
  5. `pnpm validate:rules`
  6. `pnpm sample:vs1a`
  7. `pnpm sample:vs1a:upload`
- Codex return format requirements are explicit and required.
- Explicit instruction is required to avoid `docs/continuity/current-state.md` updates unless authorized.
- Explicit instruction is required to avoid marking anything verified.
- Explicit instruction is required to avoid creating Airtable checkpoint records.
- `trace_refs` must be present and non-empty where applicable.

## Manual Confirmation Triggers

Manual confirmation is required for:

- vague goals
- real job data
- PDF intelligence
- quantities or costs
- Airtable governance changes
- `docs/continuity/current-state.md` changes
- multiple-module work
- external credentials/apps
- combined oversized slices
- merge/checkpoint/mark-verified requests

## Synthetic Fixtures

Synthetic non-project fixtures are provided at:

- `tests/fixtures/codex-task-builder/new-task.fixture.json`
- `tests/fixtures/codex-task-builder/same-task.fixture.json`
- `tests/fixtures/codex-task-builder/fix-current-pr.fixture.json`
- `tests/fixtures/codex-task-builder/verify-report-only.fixture.json`
- `tests/fixtures/codex-task-builder/manual-confirmation-required.fixture.json`

## Deterministic Test Coverage

Governance tests verify valid routed outputs for all routing types above and flag/require manual confirmation for missing routing, missing verified version/checkpoint context, unauthorized current-state updates, verification authority requests, Airtable checkpoint creation requests, merge authority requests, real job data, PDF intelligence, and quantity/cost creation requests.
