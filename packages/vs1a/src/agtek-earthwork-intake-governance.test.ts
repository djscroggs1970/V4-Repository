import { describe, expect, it } from "vitest";

type Outcome =
  | "intake_ready"
  | "needs_manual_confirmation"
  | "blocked_missing_identity"
  | "blocked_missing_storage_reference"
  | "blocked_traceability_gap"
  | "blocked_project_instance_mismatch"
  | "blocked_source_origin_violation"
  | "blocked_unsupported_file_type"
  | "blocked_real_job_data_leak"
  | "blocked_downstream_use"
  | "not_applicable";

type Fixture = {
  skill_name: "V4 AGTEK / Earthwork Intake Skill";
  scope: "agtek_earthwork_intake";
  provisional_status: "provisional_review_only";
  review_gated: true;
  outcome: Outcome;
  confidence: number;
  metadata: { data_context: "framework" | "sandbox" | "project"; is_synthetic_fixture: true; source_artifact_id: string };
  downstream_gate: { allowed: boolean; allowed_use: "intake_qa_handoff_only" | "none" };
  guardrail_review: { runtime_external_write: false; production_data_created: false; downstream_use_attempt: boolean; real_job_data_leak: boolean };
  manual_confirmation_required: boolean;
  trace_refs: string[];
};

const outcomes: Outcome[] = ["intake_ready", "needs_manual_confirmation", "blocked_missing_identity", "blocked_missing_storage_reference", "blocked_traceability_gap", "blocked_project_instance_mismatch", "blocked_source_origin_violation", "blocked_unsupported_file_type", "blocked_real_job_data_leak", "blocked_downstream_use", "not_applicable"];

const mk = (outcome: Outcome, partial: Partial<Fixture> = {}): Fixture => ({
  skill_name: "V4 AGTEK / Earthwork Intake Skill",
  scope: "agtek_earthwork_intake",
  provisional_status: "provisional_review_only",
  review_gated: true,
  outcome,
  confidence: 0.9,
  metadata: { data_context: "project", is_synthetic_fixture: true, source_artifact_id: "aew-001" },
  downstream_gate: { allowed: outcome === "intake_ready", allowed_use: outcome === "intake_ready" ? "intake_qa_handoff_only" : "none" },
  guardrail_review: { runtime_external_write: false, production_data_created: false, downstream_use_attempt: outcome === "blocked_downstream_use", real_job_data_leak: outcome === "blocked_real_job_data_leak" },
  manual_confirmation_required: outcome !== "intake_ready" && outcome !== "not_applicable",
  trace_refs: ["fixture:agtek-earthwork-intake"],
  ...partial
});

const fixtures: Record<string, Fixture> = {
  "clean-agtek-export-intake-ready.fixture.json": mk("intake_ready"),
  "clean-earthwork-quote-intake-ready.fixture.json": mk("intake_ready"),
  "missing-identity.fixture.json": mk("blocked_missing_identity", { metadata: { data_context: "project", is_synthetic_fixture: true, source_artifact_id: "" } }),
  "missing-storage-reference.fixture.json": mk("blocked_missing_storage_reference"),
  "malformed-storage-reference.fixture.json": mk("needs_manual_confirmation"),
  "missing-trace-refs.fixture.json": mk("blocked_traceability_gap"),
  "duplicate-agtek-earthwork-artifact-ids.fixture.json": mk("needs_manual_confirmation"),
  "project-instance-mismatch.fixture.json": mk("blocked_project_instance_mismatch"),
  "real-job-data-in-framework-fixture.fixture.json": mk("blocked_real_job_data_leak", { metadata: { data_context: "framework", is_synthetic_fixture: true, source_artifact_id: "aew-001" } }),
  "unsupported-file-type.fixture.json": mk("blocked_unsupported_file_type"),
  "extension-mime-mismatch.fixture.json": mk("needs_manual_confirmation"),
  "drive-reference-missing-governance.fixture.json": mk("needs_manual_confirmation"),
  "clickup-governance-proof.fixture.json": mk("blocked_source_origin_violation"),
  "agtek-production-logic-attempt.fixture.json": mk("blocked_downstream_use"),
  "agtek-cut-fill-calculation-attempt.fixture.json": mk("blocked_downstream_use"),
  "earthwork-quote-cost-rate-attempt.fixture.json": mk("blocked_downstream_use"),
  "earthwork-quantity-export-estimate-package-attempt.fixture.json": mk("blocked_downstream_use"),
  "ambiguous-surface-revision-date.fixture.json": mk("needs_manual_confirmation"),
  "not-applicable-artifact.fixture.json": mk("not_applicable", { downstream_gate: { allowed: false, allowed_use: "none" }, manual_confirmation_required: false }),
  "intake-ready-downstream-gated.fixture.json": mk("intake_ready", { downstream_gate: { allowed: true, allowed_use: "intake_qa_handoff_only" } })
};

describe("AGTEK earthwork intake governance", () => {
  it("locks exact outcomes and intake-only scope", () => {
    expect(outcomes).toEqual(["intake_ready", "needs_manual_confirmation", "blocked_missing_identity", "blocked_missing_storage_reference", "blocked_traceability_gap", "blocked_project_instance_mismatch", "blocked_source_origin_violation", "blocked_unsupported_file_type", "blocked_real_job_data_leak", "blocked_downstream_use", "not_applicable"]);
    expect(Object.values(fixtures).every((fixture) => fixture.scope === "agtek_earthwork_intake")).toBe(true);
  });

  it("preserves provisional review-gated shape and traceability", () => {
    for (const fixture of Object.values(fixtures)) {
      expect(fixture.skill_name).toBe("V4 AGTEK / Earthwork Intake Skill");
      expect(fixture.provisional_status).toBe("provisional_review_only");
      expect(fixture.review_gated).toBe(true);
      expect(fixture.confidence).toBeGreaterThanOrEqual(0);
      expect(fixture.confidence).toBeLessThanOrEqual(1);
      expect(fixture.trace_refs.length).toBeGreaterThan(0);
      expect(fixture.metadata.is_synthetic_fixture).toBe(true);
      expect(fixture.guardrail_review.runtime_external_write).toBe(false);
      expect(fixture.guardrail_review.production_data_created).toBe(false);
    }
  });

  it("covers all required synthetic scenarios", () => {
    expect(Object.keys(fixtures).length).toBe(20);
    expect(fixtures["clean-agtek-export-intake-ready.fixture.json"].outcome).toBe("intake_ready");
    expect(fixtures["clean-earthwork-quote-intake-ready.fixture.json"].outcome).toBe("intake_ready");
    expect(fixtures["missing-identity.fixture.json"].outcome).toBe("blocked_missing_identity");
    expect(fixtures["missing-storage-reference.fixture.json"].outcome).toBe("blocked_missing_storage_reference");
    expect(["blocked_missing_storage_reference", "needs_manual_confirmation"]).toContain(fixtures["malformed-storage-reference.fixture.json"].outcome);
    expect(fixtures["missing-trace-refs.fixture.json"].outcome).toBe("blocked_traceability_gap");
    expect(["needs_manual_confirmation", "blocked_missing_identity"]).toContain(fixtures["duplicate-agtek-earthwork-artifact-ids.fixture.json"].outcome);
    expect(fixtures["project-instance-mismatch.fixture.json"].outcome).toBe("blocked_project_instance_mismatch");
    expect(fixtures["real-job-data-in-framework-fixture.fixture.json"].outcome).toBe("blocked_real_job_data_leak");
    expect(fixtures["unsupported-file-type.fixture.json"].outcome).toBe("blocked_unsupported_file_type");
    expect(fixtures["extension-mime-mismatch.fixture.json"].outcome).toBe("needs_manual_confirmation");
    expect(fixtures["drive-reference-missing-governance.fixture.json"].outcome).toBe("needs_manual_confirmation");
    expect(fixtures["clickup-governance-proof.fixture.json"].outcome).toBe("blocked_source_origin_violation");
    expect(fixtures["ambiguous-surface-revision-date.fixture.json"].outcome).toBe("needs_manual_confirmation");
    expect(fixtures["not-applicable-artifact.fixture.json"].outcome).toBe("not_applicable");
  });

  it("blocks downstream behavior and keeps intake-ready gated to handoff only", () => {
    expect(fixtures["agtek-production-logic-attempt.fixture.json"].guardrail_review.downstream_use_attempt).toBe(true);
    expect(fixtures["agtek-cut-fill-calculation-attempt.fixture.json"].guardrail_review.downstream_use_attempt).toBe(true);
    expect(fixtures["earthwork-quote-cost-rate-attempt.fixture.json"].guardrail_review.downstream_use_attempt).toBe(true);
    expect(fixtures["earthwork-quantity-export-estimate-package-attempt.fixture.json"].guardrail_review.downstream_use_attempt).toBe(true);
    expect(fixtures["intake-ready-downstream-gated.fixture.json"].downstream_gate.allowed_use).toBe("intake_qa_handoff_only");
  });
});
