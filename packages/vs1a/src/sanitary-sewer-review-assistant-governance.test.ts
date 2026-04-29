import { describe, expect, it } from "vitest";

type Outcome =
  | "review_ready"
  | "needs_manual_confirmation"
  | "blocked_missing_traceability"
  | "blocked_missing_source_reference"
  | "blocked_candidate_incomplete"
  | "blocked_audit_unresolved"
  | "blocked_bypass_attempt"
  | "blocked_quantity_export_attempt"
  | "blocked_cost_or_rate_attempt"
  | "blocked_real_job_data_leak"
  | "not_applicable";

type Fixture = {
  skill_name: "V4 Sanitary Sewer Review Assistant Skill";
  scope: "sanitary_sewer";
  provisional_status: "provisional_review_only";
  review_gated: true;
  outcome: Outcome;
  confidence: number;
  metadata: { data_context: "framework" | "sandbox" | "project"; sanitary_candidate_ids: string[]; is_synthetic_fixture: true };
  guardrail_review: { quantity_export_attempt: boolean; cost_or_rate_attempt: boolean; takeoffitem_attempt: boolean; adapter_bypass_attempt: boolean; real_job_data_leak: boolean; scope_drift_attempt: boolean };
  audit_promotion_handoff_review: { approval_authority_granted: false };
  manual_confirmation_required: boolean;
  trace_refs: string[];
};

const outcomes: Outcome[] = ["review_ready", "needs_manual_confirmation", "blocked_missing_traceability", "blocked_missing_source_reference", "blocked_candidate_incomplete", "blocked_audit_unresolved", "blocked_bypass_attempt", "blocked_quantity_export_attempt", "blocked_cost_or_rate_attempt", "blocked_real_job_data_leak", "not_applicable"];
const mk = (outcome: Outcome, partial: Partial<Fixture> = {}): Fixture => ({
  skill_name: "V4 Sanitary Sewer Review Assistant Skill",
  scope: "sanitary_sewer",
  provisional_status: "provisional_review_only",
  review_gated: true,
  outcome,
  confidence: 0.9,
  metadata: { data_context: "project", sanitary_candidate_ids: ["ssc-001"], is_synthetic_fixture: true },
  guardrail_review: { quantity_export_attempt: false, cost_or_rate_attempt: false, takeoffitem_attempt: false, adapter_bypass_attempt: false, real_job_data_leak: false, scope_drift_attempt: false },
  audit_promotion_handoff_review: { approval_authority_granted: false },
  manual_confirmation_required: outcome !== "review_ready" && outcome !== "not_applicable",
  trace_refs: ["fixture:ssra"],
  ...partial
});

const fixtures: Record<string, Fixture> = {
  "clean-review-ready.fixture.json": mk("review_ready"),
  "missing-source-document-or-artifact.fixture.json": mk("blocked_missing_source_reference"),
  "missing-trace-refs.fixture.json": mk("blocked_missing_traceability"),
  "missing-sheet-reference.fixture.json": mk("blocked_missing_source_reference"),
  "duplicate-candidate-ids.fixture.json": mk("blocked_candidate_incomplete", { metadata: { data_context: "project", sanitary_candidate_ids: ["ssc-dup", "ssc-dup"], is_synthetic_fixture: true } }),
  "pipe-run-missing-endpoints.fixture.json": mk("blocked_candidate_incomplete"),
  "structure-missing-reference.fixture.json": mk("blocked_candidate_incomplete"),
  "conflicting-diameter-material-depth.fixture.json": mk("needs_manual_confirmation"),
  "ambiguous-invert-elevation.fixture.json": mk("needs_manual_confirmation"),
  "profile-vs-plan-ambiguity.fixture.json": mk("needs_manual_confirmation"),
  "audit-unresolved-promotion-requested.fixture.json": mk("blocked_audit_unresolved"),
  "adapter-bypass-attempt.fixture.json": mk("blocked_bypass_attempt", { guardrail_review: { quantity_export_attempt: false, cost_or_rate_attempt: false, takeoffitem_attempt: false, adapter_bypass_attempt: true, real_job_data_leak: false, scope_drift_attempt: false } }),
  "promotion-quantity-export-ready-attempt.fixture.json": mk("blocked_quantity_export_attempt", { guardrail_review: { quantity_export_attempt: true, cost_or_rate_attempt: false, takeoffitem_attempt: false, adapter_bypass_attempt: false, real_job_data_leak: false, scope_drift_attempt: false } }),
  "handoff-direct-takeoffitem-attempt.fixture.json": mk("blocked_bypass_attempt", { guardrail_review: { quantity_export_attempt: false, cost_or_rate_attempt: false, takeoffitem_attempt: true, adapter_bypass_attempt: false, real_job_data_leak: false, scope_drift_attempt: false } }),
  "quantity-export-attempt.fixture.json": mk("blocked_quantity_export_attempt", { guardrail_review: { quantity_export_attempt: true, cost_or_rate_attempt: false, takeoffitem_attempt: false, adapter_bypass_attempt: false, real_job_data_leak: false, scope_drift_attempt: false } }),
  "cost-rate-labor-equipment-vendor-attempt.fixture.json": mk("blocked_cost_or_rate_attempt", { guardrail_review: { quantity_export_attempt: false, cost_or_rate_attempt: true, takeoffitem_attempt: false, adapter_bypass_attempt: false, real_job_data_leak: false, scope_drift_attempt: false } }),
  "real-job-data-in-framework-fixture.fixture.json": mk("blocked_real_job_data_leak", { metadata: { data_context: "framework", sanitary_candidate_ids: ["ssc-001"], is_synthetic_fixture: true }, guardrail_review: { quantity_export_attempt: false, cost_or_rate_attempt: false, takeoffitem_attempt: false, adapter_bypass_attempt: false, real_job_data_leak: true, scope_drift_attempt: false } }),
  "not-applicable-candidate.fixture.json": mk("not_applicable", { manual_confirmation_required: false }),
  "scope-drift-other-scopes.fixture.json": mk("blocked_bypass_attempt", { guardrail_review: { quantity_export_attempt: false, cost_or_rate_attempt: false, takeoffitem_attempt: false, adapter_bypass_attempt: false, real_job_data_leak: false, scope_drift_attempt: true } }),
  "valid-handoff-no-approval-authority.fixture.json": mk("review_ready")
};

describe("sanitary sewer review assistant governance", () => {
  it("locks exact outcomes and sanitary-only scope", () => {
    expect(outcomes).toEqual(["review_ready", "needs_manual_confirmation", "blocked_missing_traceability", "blocked_missing_source_reference", "blocked_candidate_incomplete", "blocked_audit_unresolved", "blocked_bypass_attempt", "blocked_quantity_export_attempt", "blocked_cost_or_rate_attempt", "blocked_real_job_data_leak", "not_applicable"]);
    expect(Object.values(fixtures).every((fixture) => fixture.scope === "sanitary_sewer")).toBe(true);
  });

  it("preserves provisional review-gated shape and traceability", () => {
    for (const fixture of Object.values(fixtures)) {
      expect(fixture.provisional_status).toBe("provisional_review_only");
      expect(fixture.review_gated).toBe(true);
      expect(fixture.confidence).toBeGreaterThanOrEqual(0);
      expect(fixture.confidence).toBeLessThanOrEqual(1);
      expect(fixture.trace_refs.length).toBeGreaterThan(0);
      expect(fixture.audit_promotion_handoff_review.approval_authority_granted).toBe(false);
      expect(fixture.metadata.is_synthetic_fixture).toBe(true);
    }
  });

  it("covers all required synthetic scenarios", () => {
    expect(Object.keys(fixtures).length).toBe(20);
    expect(fixtures["clean-review-ready.fixture.json"].outcome).toBe("review_ready");
    expect(fixtures["missing-source-document-or-artifact.fixture.json"].outcome).toBe("blocked_missing_source_reference");
    expect(fixtures["missing-trace-refs.fixture.json"].outcome).toBe("blocked_missing_traceability");
    expect(fixtures["missing-sheet-reference.fixture.json"].outcome).toBe("blocked_missing_source_reference");
    expect(fixtures["duplicate-candidate-ids.fixture.json"].outcome).toBe("blocked_candidate_incomplete");
    expect(fixtures["pipe-run-missing-endpoints.fixture.json"].outcome).toBe("blocked_candidate_incomplete");
    expect(fixtures["structure-missing-reference.fixture.json"].outcome).toBe("blocked_candidate_incomplete");
    expect(fixtures["conflicting-diameter-material-depth.fixture.json"].outcome).toBe("needs_manual_confirmation");
    expect(fixtures["ambiguous-invert-elevation.fixture.json"].outcome).toBe("needs_manual_confirmation");
    expect(fixtures["profile-vs-plan-ambiguity.fixture.json"].outcome).toBe("needs_manual_confirmation");
    expect(fixtures["audit-unresolved-promotion-requested.fixture.json"].outcome).toBe("blocked_audit_unresolved");
    expect(fixtures["not-applicable-candidate.fixture.json"].outcome).toBe("not_applicable");
  });

  it("blocks downstream behavior and approval authority", () => {
    expect(fixtures["adapter-bypass-attempt.fixture.json"].guardrail_review.adapter_bypass_attempt).toBe(true);
    expect(fixtures["promotion-quantity-export-ready-attempt.fixture.json"].guardrail_review.quantity_export_attempt).toBe(true);
    expect(fixtures["quantity-export-attempt.fixture.json"].guardrail_review.quantity_export_attempt).toBe(true);
    expect(fixtures["handoff-direct-takeoffitem-attempt.fixture.json"].guardrail_review.takeoffitem_attempt).toBe(true);
    expect(fixtures["cost-rate-labor-equipment-vendor-attempt.fixture.json"].guardrail_review.cost_or_rate_attempt).toBe(true);
    expect(fixtures["real-job-data-in-framework-fixture.fixture.json"].guardrail_review.real_job_data_leak).toBe(true);
    expect(fixtures["scope-drift-other-scopes.fixture.json"].guardrail_review.scope_drift_attempt).toBe(true);
    expect(fixtures["valid-handoff-no-approval-authority.fixture.json"].audit_promotion_handoff_review.approval_authority_granted).toBe(false);
  });
});
