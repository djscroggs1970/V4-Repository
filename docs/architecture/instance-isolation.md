# Instance Isolation

Status: framework baseline

## Rule

Framework assets are generic. Project instances are isolated. Sandbox data is disposable. Promotions are explicit.

## Required layers

- framework
- project
- sandbox

No project or sandbox data may move into the framework layer unless it passes an explicit promotion workflow.

## Required fields

Operational records must carry boundary metadata:

- project_instance_id
- data_layer
- source_origin
- framework_version
- created_at
- updated_at

Framework-scoped records may leave project_instance_id blank only when the record is explicitly framework-governance or framework-reference content.

## Project instance rule

A new estimate starts from approved framework templates and reference seeds only. It must not clone a prior project instance, override set, output package, or snapshot.

## Sample job rule

The Promenade and all sample jobs are sandbox or project-instance validation data only. They are not reusable framework baseline content by default.
