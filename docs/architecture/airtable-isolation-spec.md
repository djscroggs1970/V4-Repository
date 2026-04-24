# Airtable Isolation Spec

Status: framework baseline

## Operating model

Airtable must support template-plus-instance behavior:

1. Framework governance and reusable reference data.
2. Project-instance operational data.
3. Sandbox and validation data.

## Required boundary fields

Every operational table must include:

- project_instance_id
- data_layer
- source_origin
- framework_version
- created_at
- updated_at

## Guardrails

- Do not create operational records without project_instance_id unless they are explicitly framework-scoped.
- Do not mix framework, project, and sandbox records in default operational views.
- Do not let sample job data become reusable framework data by default.
- All project-instance automations must filter by the instance key.

## Framework-scoped governance tables

- System Directives
- External Reference Register
- Framework Versions
- Build Specs
- Connector Registry
- Project Instance Rules
- Promotion Log
- Phase 1 Backlog
- Phase 1 Tasks
- Sample Job Register
