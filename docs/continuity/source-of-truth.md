# V4 Source of Truth and Session Boot Guide

Status: active continuity guide  
Framework family: V4 Civil Estimating Platform  
Purpose: keep ChatGPT sessions lightweight, restartable, and isolated from stale context.

## Rule 1: Do not use chat history as the system of record

Chat is only the command lane. Durable truth lives in the external systems below.

If a new session conflicts with old chat memory, use the external source of truth for that subject.

## Canonical sources of truth

| Domain | Source of truth | Purpose |
|---|---|---|
| Build/code/tests | GitHub `djscroggs1970/V4-Repository` | Source code, CI, package structure, tests, rule/data files, sample runners, exports |
| Governance/checkpoints | Airtable `V4 Base` | Framework versions, verified checkpoints, build specs, active/draft slices, governance state |
| Reference documents/storage | Google Drive `V4 Framework` | Framework documents, reference material, uploaded artifacts, non-code documentation |
| Execution tracking | ClickUp `V4 Framework` | Epics, stories, active work, blockers, execution status |
| PDF/document tooling | Acrobat connection | PDF processing support when needed for document workflows |

## Session boot header template

Use this at the start of a new chat when continuity matters:

```text
This is a V4 Civil Estimating Platform session.

Use these sources of truth:
- GitHub repo: djscroggs1970/V4-Repository
- Drive root folder: V4 Framework
- Airtable base: V4 Base
- ClickUp location: V4 Framework
- Current framework doc: docs/continuity/source-of-truth.md plus latest Airtable framework checkpoint

Current goal for this session:
[one sentence]

Do not rely on prior job data unless I explicitly provide it.
Maintain job-instance isolation and no-bleed/no-drift rules.
```

## Operating rules for future sessions

1. Use GitHub for implementation truth.
2. Use Airtable for checkpoint and governance truth.
3. Use Drive for reference/document truth.
4. Use ClickUp for execution tracking only.
5. Do not infer live job facts from prior examples, fixtures, or sample projects.
6. Treat sample jobs as sandbox fixtures unless explicitly promoted through governance.
7. Every project/job instance must carry its own project instance ID.
8. Framework data, sandbox data, and project data must remain separated.
9. No approved output may depend on unresolved, rejected, or pending review records.
10. CI pass is required before marking a build slice verified.

## Current lightweight restart procedure

A new chat should do the minimum needed:

1. Read this document.
2. Check the latest Airtable framework checkpoint.
3. Check current GitHub `main` if implementation state matters.
4. Continue from the active/draft slice in Airtable.
5. Avoid replaying old chat history unless the user explicitly asks.

## Chat health policy

Use hard breaks only:

- implementation complete
- CI passed or failed
- checkpoint recorded
- blocker found
- user decision needed

Avoid long progress summaries unless requested.

## Current verified chain pattern

Each slice should follow this lifecycle:

```text
Draft spec -> GitHub implementation -> CI pass -> Airtable checkpoint -> ClickUp status update -> next draft slice
```

This keeps the chat short and makes the platform portable across future sessions.
