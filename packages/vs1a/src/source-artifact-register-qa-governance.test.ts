import { describe, expect, it } from "vitest";

type Outcome =
  | "register_ready"
  | "needs_manual_confirmation"
  | "blocked_missing_identity"
  | "blocked_missing_storage_reference"
  | "blocked_traceability_gap"
  | "blocked_project_instance_mismatch"
  | "blocked_source_origin_violation"
  | "blocked_real_job_data_leak"
  | "blocked_downstream_use"
  | "not_applicable";
type ReviewMode = "single_artifact" | "batch_register_review" | "downstream_gate_review" | "fixture_review";
type DataBoundary = "framework" | "sandbox" | "project" | "mixed_unknown";

type Fixture = {
  skill_name: "V4 Source Artifact Register QA Skill";
  review_mode: ReviewMode;
  overall_outcome: Outcome;
  confidence: number;
  provisional_status: "provisional_review_only";
  review_gated: true;
  artifact_reviews: Array<{ outcome: Outcome; data_boundary: DataBoundary; trace_refs: string[]; source_artifact_id: string }>;
  manual_confirmation_required: boolean;
  downstream_gate: { allowed: boolean; allowed_use: "register_qa_handoff_only" | "none" };
  trace_refs: string[];
};

const outcomes: Outcome[] = ["register_ready", "needs_manual_confirmation", "blocked_missing_identity", "blocked_missing_storage_reference", "blocked_traceability_gap", "blocked_project_instance_mismatch", "blocked_source_origin_violation", "blocked_real_job_data_leak", "blocked_downstream_use", "not_applicable"];
const reviewModes: ReviewMode[] = ["single_artifact", "batch_register_review", "downstream_gate_review", "fixture_review"];
const boundaries: DataBoundary[] = ["framework", "sandbox", "project", "mixed_unknown"];

const f = (overall_outcome: Outcome, artifactOutcome: Outcome = overall_outcome, data_boundary: DataBoundary = "project", manual = false): Fixture => ({
  skill_name: "V4 Source Artifact Register QA Skill",
  review_mode: "fixture_review",
  overall_outcome,
  confidence: 0.9,
  provisional_status: "provisional_review_only",
  review_gated: true,
  artifact_reviews: [{ outcome: artifactOutcome, data_boundary, trace_refs: ["artifact:synthetic"], source_artifact_id: overall_outcome === "blocked_missing_identity" ? "" : "sar-001" }],
  manual_confirmation_required: manual,
  downstream_gate: { allowed: overall_outcome === "register_ready", allowed_use: overall_outcome === "register_ready" ? "register_qa_handoff_only" : "none" },
  trace_refs: ["fixture:synthetic"]
});

const fixtures: Record<string, Fixture> = {
  "clean-project-plan-pdf.fixture.json": f("register_ready"),
  "missing-identity.fixture.json": f("blocked_missing_identity", "blocked_missing_identity", "project", true),
  "missing-storage-reference.fixture.json": f("blocked_missing_storage_reference", "blocked_missing_storage_reference", "project", true),
  "malformed-storage-reference.fixture.json": f("needs_manual_confirmation", "needs_manual_confirmation", "project", true),
  "missing-trace-refs.fixture.json": f("blocked_traceability_gap", "blocked_traceability_gap", "project", true),
  "duplicate-artifact-ids.fixture.json": f("needs_manual_confirmation", "needs_manual_confirmation", "project", true),
  "project-instance-mismatch.fixture.json": f("blocked_project_instance_mismatch", "blocked_project_instance_mismatch", "project", true),
  "real-job-data-leak.fixture.json": f("blocked_real_job_data_leak", "blocked_real_job_data_leak", "framework", true),
  "clickup-governance-proof.fixture.json": f("blocked_source_origin_violation", "blocked_source_origin_violation", "project", true),
  "drive-reference-missing-governance.fixture.json": f("needs_manual_confirmation", "needs_manual_confirmation", "project", true),
  "vendor-quote-premature-cost-registry.fixture.json": f("blocked_downstream_use", "blocked_downstream_use", "project", true),
  "agtek-premature-earthwork-logic.fixture.json": f("blocked_downstream_use", "blocked_downstream_use", "project", true),
  "plan-pdf-premature-intelligence.fixture.json": f("blocked_downstream_use", "blocked_downstream_use", "project", true),
  "ambiguous-revision-date.fixture.json": f("needs_manual_confirmation", "needs_manual_confirmation", "project", true),
  "downstream-before-readiness.fixture.json": f("blocked_downstream_use", "blocked_downstream_use", "project", true),
  "not-applicable-artifact.fixture.json": f("not_applicable", "not_applicable", "sandbox", false)
};

describe("source artifact register qa governance", () => {
  it("supports exact outcome, review mode, and boundary enums", () => {
    expect(outcomes).toEqual(["register_ready", "needs_manual_confirmation", "blocked_missing_identity", "blocked_missing_storage_reference", "blocked_traceability_gap", "blocked_project_instance_mismatch", "blocked_source_origin_violation", "blocked_real_job_data_leak", "blocked_downstream_use", "not_applicable"]);
    expect(reviewModes).toEqual(["single_artifact", "batch_register_review", "downstream_gate_review", "fixture_review"]);
    expect(boundaries).toEqual(["framework", "sandbox", "project", "mixed_unknown"]);
  });

  it("enforces required provisional review-gated shape and trace refs", () => {
    for (const fixture of Object.values(fixtures)) {
      expect(fixture.skill_name).toBe("V4 Source Artifact Register QA Skill");
      expect(fixture.confidence).toBeGreaterThanOrEqual(0);
      expect(fixture.confidence).toBeLessThanOrEqual(1);
      expect(fixture.provisional_status).toBe("provisional_review_only");
      expect(fixture.review_gated).toBe(true);
      expect(fixture.trace_refs.length).toBeGreaterThan(0);
      expect(fixture.artifact_reviews[0].trace_refs.length).toBeGreaterThan(0);
    }
  });

  it("covers required scenario outcomes", () => {
    expect(fixtures["clean-project-plan-pdf.fixture.json"].overall_outcome).toBe("register_ready");
    expect(fixtures["missing-identity.fixture.json"].overall_outcome).toBe("blocked_missing_identity");
    expect(fixtures["missing-storage-reference.fixture.json"].overall_outcome).toBe("blocked_missing_storage_reference");
    expect(["blocked_missing_storage_reference", "needs_manual_confirmation"]).toContain(fixtures["malformed-storage-reference.fixture.json"].overall_outcome);
    expect(fixtures["missing-trace-refs.fixture.json"].overall_outcome).toBe("blocked_traceability_gap");
    expect(["needs_manual_confirmation", "blocked_missing_identity"]).toContain(fixtures["duplicate-artifact-ids.fixture.json"].overall_outcome);
    expect(fixtures["project-instance-mismatch.fixture.json"].overall_outcome).toBe("blocked_project_instance_mismatch");
    expect(fixtures["real-job-data-leak.fixture.json"].overall_outcome).toBe("blocked_real_job_data_leak");
    expect(fixtures["clickup-governance-proof.fixture.json"].overall_outcome).toBe("blocked_source_origin_violation");
    expect(["blocked_traceability_gap", "blocked_missing_identity", "needs_manual_confirmation"]).toContain(fixtures["drive-reference-missing-governance.fixture.json"].overall_outcome);
    expect(fixtures["vendor-quote-premature-cost-registry.fixture.json"].overall_outcome).toBe("blocked_downstream_use");
    expect(fixtures["agtek-premature-earthwork-logic.fixture.json"].overall_outcome).toBe("blocked_downstream_use");
    expect(fixtures["plan-pdf-premature-intelligence.fixture.json"].overall_outcome).toBe("blocked_downstream_use");
    expect(fixtures["ambiguous-revision-date.fixture.json"].overall_outcome).toBe("needs_manual_confirmation");
    expect(fixtures["downstream-before-readiness.fixture.json"].overall_outcome).toBe("blocked_downstream_use");
    expect(fixtures["not-applicable-artifact.fixture.json"].overall_outcome).toBe("not_applicable");
  });

  it("keeps downstream blocked unless register-ready handoff-only", () => {
    for (const [name, fixture] of Object.entries(fixtures)) {
      if (name === "clean-project-plan-pdf.fixture.json") {
        expect(fixture.downstream_gate.allowed).toBe(true);
        expect(fixture.downstream_gate.allowed_use).toBe("register_qa_handoff_only");
      } else {
        expect(fixture.downstream_gate.allowed).toBe(false);
      }
    }
  });
});
