# Production Rate Source Policy

Status: active governance policy  
Framework family: V4 Civil Estimating Platform  
Applies to: VS1B cost buildout and all later estimate/cost modules

## Purpose

Production rates directly control labor and equipment cost. They must not be treated as casual defaults.

This policy defines when a production rate can be used, how it is classified, and what traceability is required before it can feed a cost scenario.

## Core rule

No cost scenario may use a production rate unless the rate is explicitly registered, versioned, traceable, and marked `validated`.

Placeholder rates may exist for design/testing, but they must be blocked from estimate output.

## Production rate classes

| Class | Status | Allowed in CI/test fixtures | Allowed in bid/cost output | Description |
|---|---|---:|---:|---|
| National baseline | `validated` only after source review | Yes | Yes, if validated | A generalized rate based on recognized estimating references, historical datasets, or approved framework seed data |
| Project-specific | `validated` only after project review | Yes | Yes, if validated | A rate adjusted for known project constraints, access, depth, soil, traffic control, utility conflicts, sequencing, or crew plan |
| Vendor/subcontractor | `validated` only after quote review | Yes | Yes, if validated | A rate or cost basis from a vendor/subcontractor quote or AGTEK/earthwork input |
| Company historical | `validated` only after source review | Yes | Yes, if validated | A rate derived from internal completed-work history |
| Placeholder | `placeholder` | Yes | No | A temporary design/test value used to prove software behavior only |

## Required production rate fields

Every production rate must carry:

```text
production_rate_id
rule_version or registry_version
work_type
material_type
diameter_in
depth_class
production_uom
units_per_day
crew_code
equipment_code
validation_status
source_origin
trace_refs
```

For pipe installation, the minimum matching dimensions are:

```text
work_type + material_type + diameter_in + depth_class + production_uom
```

## Validation requirements

A production rate may be marked `validated` only when all are true:

1. The source is known.
2. The units are clear.
3. The rate is tied to a crew and equipment setup.
4. The depth class is explicit.
5. The rate has a version or registry reference.
6. Any override has a reason and trace reference.
7. The rate is reviewed before feeding cost output.

## Override rules

Overrides are allowed, but they must create a new rate/version. Do not mutate the old rate in place.

Each override must capture:

```text
previous_production_rate_id
new_production_rate_id
override_reason
reviewer
approved_at
trace_refs
```

Common valid override reasons:

```text
unusual depth
rock excavation
limited access
traffic control constraint
night work
high groundwater
utility conflict
accelerated schedule
subcontractor quote controls
project-specific crew plan
```

## Blocking rules

The system must block cost output when:

- production rate is missing
- production rate is marked `placeholder`
- production rate references unknown crew code
- production rate references unknown equipment code
- production rate unit does not match quantity unit
- production rate depth class does not match quantity depth class
- production rate source cannot be traced

## Relationship to VS1B

VS1B cost buildout may consume only approved quantity exports and validated cost input registries.

Cost lines must preserve traceability to:

```text
quantity export
source takeoff item IDs
material quote
labor rate
equipment rate
production rate
cost input registry version
```

## Current implementation expectation

The code should continue enforcing:

```text
production_rate_must_be_validated
production_units_per_day_must_be_positive
production_rate_labor_rate_not_found
production_rate_equipment_rate_not_found
```

Future slices should add explicit source and override records before any bid-grade output is allowed.

## Practical estimating caution

National baseline rates are useful for early estimates, but they are not automatically bid-grade.

For real jobs, production should be adjusted or confirmed against project conditions before final pricing.
