import { describe, expect, it } from "vitest";

type Outcome =
  | "restart_snapshot_ready"
  | "needs_source_of_truth_check"
  | "blocked_unverified_claim"
  | "manual_confirmation_required"
  | "continuity_update_candidate"
  | "stale_or_conflicting_context"
  | "handoff_ready";
type SessionMode = "implementation" | "skill_design" | "verification_only" | "continuity_only";
type EvidenceStatus = "present_confirmed" | "present_unconfirmed" | "missing" | "conflicting" | "not_applicable";

type GuardrailReview = {
  no_runtime_external_writes: boolean;
  no_merge_or_checkpoint_authority: boolean;
  no_current_state_update_authority: boolean;
  no_pdf_intelligence: boolean;
  no_real_job_data: boolean;
  no_quantity_cost_rate_outputs: boolean;
  instance_and_document_isolation_preserved: boolean;
  framework_job_data_separation_preserved: boolean;
  compact_restart_focus: boolean;
  review_gated_status: "preserved" | "missing";
};

type Fixture = {
  skill_name: "V4 Continuity / Restart Snapshot Skill";
  session_mode: SessionMode;
  outcome: Outcome;
  confidence: number;
  current_verified_version: string;
  latest_verified_checkpoint: string;
  latest_merged_pr: number | string;
  latest_ci_run_id: number | string;
  latest_ci_status: string;
  latest_ci_conclusion: string;
  merge_sha: string;
  airtable_checkpoint_record_id: string;
  continuity_pr_status: string;
  active_branch: string;
  active_pr: string;
  active_implementation_slice: string;
  active_skill_lane: string;
  source_of_truth_review: Record<string, EvidenceStatus>;
  verified_context: string[];
  provisional_context: string[];
  guardrail_review: GuardrailReview;
  manual_confirmation_required: boolean;
  manual_confirmation_reasons: string[];
  job_project_data_detected: boolean;
  pdf_plan_data_detected: boolean;
  quantity_or_cost_output_detected: boolean;
  external_write_attempt_detected: boolean;
  stale_or_conflicting_claims: string[];
  snapshot_quality: string;
  recommended_next_action: string;
  safe_new_chat_handoff_prompt: string;
  current_state_update_recommendation: string;
  trace_refs: string[];
};

const outcomes: Outcome[] = [
  "restart_snapshot_ready",
  "needs_source_of_truth_check",
  "blocked_unverified_claim",
  "manual_confirmation_required",
  "continuity_update_candidate",
  "stale_or_conflicting_context",
  "handoff_ready"
];
const modes: SessionMode[] = ["implementation", "skill_design", "verification_only", "continuity_only"];
const evidence: EvidenceStatus[] = ["present_confirmed", "present_unconfirmed", "missing", "conflicting", "not_applicable"];
const fixtureNames = [
  "clean-verified.fixture.json",
  "missing-airtable-checkpoint.fixture.json",
  "missing-or-failed-ci.fixture.json",
  "pending-continuity-pr.fixture.json",
  "conflicting-chat-memory.fixture.json",
  "real-job-data-leak.fixture.json",
  "skill-design-lane.fixture.json",
  "implementation-lane-sanitary-chain.fixture.json",
  "oversized-snapshot.fixture.json",
  "handoff-ready.fixture.json",
  "verification-only.fixture.json",
  "stale-snapshot.fixture.json"
];
const forbiddenRuntimeKeys = [
  "merge_execution",
  "airtable_write",
  "current_state_update_execution",
  "verified_authority_granted",
  "quantity_outputs",
  "cost_outputs",
  "labor_records",
  "equipment_records",
  "vendor_records",
  "takeoff_items",
  "export_records"
];

const guardrails: GuardrailReview = {
  no_runtime_external_writes: true,
  no_merge_or_checkpoint_authority: true,
  no_current_state_update_authority: true,
  no_pdf_intelligence: true,
  no_real_job_data: true,
  no_quantity_cost_rate_outputs: true,
  instance_and_document_isolation_preserved: true,
  framework_job_data_separation_preserved: true,
  compact_restart_focus: true,
  review_gated_status: "preserved"
};

const sourceReview: Record<string, EvidenceStatus> = {
  github: "present_confirmed",
  airtable: "present_confirmed",
  google_drive: "not_applicable",
  clickup: "not_applicable",
  chat_history: "present_unconfirmed",
  current_state_md: "present_unconfirmed"
};

const base: Fixture = {
  skill_name: "V4 Continuity / Restart Snapshot Skill",
  session_mode: "implementation",
  outcome: "restart_snapshot_ready",
  confidence: 0.92,
  current_verified_version: "v0.1-pr-review-merge-gate-skill-governance-ci-pass",
  latest_verified_checkpoint: "PR #27 / reco50DGPR0HLofn9",
  latest_merged_pr: 27,
  latest_ci_run_id: 25081439699,
  latest_ci_status: "completed",
  latest_ci_conclusion: "success",
  merge_sha: "9228613af89b1b1177eb9c07b29eb1bf3cedfa6a",
  airtable_checkpoint_record_id: "reco50DGPR0HLofn9",
  continuity_pr_status: "open_unverified",
  active_branch: "feature/continuity-restart-snapshot",
  active_pr: "draft",
  active_implementation_slice: "Sanitary Sewer End-to-End Candidate Chain Fixture",
  active_skill_lane: "governance-skill-tooling",
  source_of_truth_review: sourceReview,
  verified_context: ["PR #27 merged", "CI run 25081439699 success", "Airtable checkpoint reco50DGPR0HLofn9"],
  provisional_context: ["Continuity PR #28 not treated as verified"],
  guardrail_review: guardrails,
  manual_confirmation_required: false,
  manual_confirmation_reasons: [],
  job_project_data_detected: false,
  pdf_plan_data_detected: false,
  quantity_or_cost_output_detected: false,
  external_write_attempt_detected: false,
  stale_or_conflicting_claims: [],
  snapshot_quality: "compact",
  recommended_next_action: "Resume exactly one governed slice.",
  safe_new_chat_handoff_prompt: "Re-check GitHub, Airtable, and current-state evidence before execution.",
  current_state_update_recommendation: "not_authorized",
  trace_refs: ["github:pr-27", "ci:25081439699", "airtable:reco50DGPR0HLofn9"]
};

const fixtures: Record<string, Fixture> = {
  "clean-verified.fixture.json": base,
  "missing-airtable-checkpoint.fixture.json": {
    ...base,
    outcome: "blocked_unverified_claim",
    airtable_checkpoint_record_id: "missing",
    source_of_truth_review: { ...sourceReview, airtable: "missing" },
    manual_confirmation_required: true,
    manual_confirmation_reasons: ["verified_claim_without_airtable_checkpoint"]
  },
  "missing-or-failed-ci.fixture.json": {
    ...base,
    outcome: "blocked_unverified_claim",
    latest_ci_conclusion: "failure",
    source_of_truth_review: { ...sourceReview, github: "present_unconfirmed" },
    manual_confirmation_required: true,
    manual_confirmation_reasons: ["ci_missing_or_failed"]
  },
  "pending-continuity-pr.fixture.json": {
    ...base,
    outcome: "needs_source_of_truth_check",
    continuity_pr_status: "open_ci_pending",
    manual_confirmation_required: true,
    manual_confirmation_reasons: ["continuity_pr_not_confirmed_passed_merged"]
  },
  "conflicting-chat-memory.fixture.json": {
    ...base,
    outcome: "stale_or_conflicting_context",
    source_of_truth_review: { ...sourceReview, chat_history: "conflicting" },
    manual_confirmation_required: true,
    manual_confirmation_reasons: ["source_conflict"],
    stale_or_conflicting_claims: ["chat says PR #28 verified but no merge/checkpoint proof"]
  },
  "real-job-data-leak.fixture.json": {
    ...base,
    outcome: "manual_confirmation_required",
    manual_confirmation_required: true,
    manual_confirmation_reasons: ["real_job_or_pdf_or_quantity_cost_leak_detected"],
    job_project_data_detected: true,
    pdf_plan_data_detected: true,
    quantity_or_cost_output_detected: true
  },
  "skill-design-lane.fixture.json": {
    ...base,
    session_mode: "skill_design",
    active_implementation_slice: "documentation/schema/test-tooling only",
    recommended_next_action: "Stay in skill-design lane and do not change estimating logic."
  },
  "implementation-lane-sanitary-chain.fixture.json": {
    ...base,
    active_implementation_slice: "Sanitary Sewer End-to-End Candidate Chain Fixture",
    recommended_next_action: "Resume exactly one slice: Sanitary Sewer End-to-End Candidate Chain Fixture."
  },
  "oversized-snapshot.fixture.json": {
    ...base,
    outcome: "manual_confirmation_required",
    snapshot_quality: "oversized",
    manual_confirmation_required: true,
    manual_confirmation_reasons: ["snapshot_too_long_requires_condensation"]
  },
  "handoff-ready.fixture.json": {
    ...base,
    outcome: "handoff_ready",
    safe_new_chat_handoff_prompt: "New chat: verify PR #27 evidence, treat PR #28 continuity as unverified, continue only after source-of-truth checks."
  },
  "verification-only.fixture.json": {
    ...base,
    session_mode: "verification_only",
    outcome: "needs_source_of_truth_check",
    manual_confirmation_required: true,
    manual_confirmation_reasons: ["verification_mode_no_authority"],
    recommended_next_action: "Verification-only report; no merge/checkpoint/current-state authority."
  },
  "stale-snapshot.fixture.json": {
    ...base,
    outcome: "needs_source_of_truth_check",
    source_of_truth_review: { ...sourceReview, github: "present_unconfirmed", airtable: "present_unconfirmed" },
    manual_confirmation_required: true,
    manual_confirmation_reasons: ["stale_snapshot_refresh_required"],
    stale_or_conflicting_claims: ["snapshot_age_requires_refresh"]
  }
};

describe("continuity restart snapshot governance", () => {
  it("locks required enums", () => {
    expect(outcomes).toEqual([
      "restart_snapshot_ready",
      "needs_source_of_truth_check",
      "blocked_unverified_claim",
      "manual_confirmation_required",
      "continuity_update_candidate",
      "stale_or_conflicting_context",
      "handoff_ready"
    ]);
    expect(modes).toEqual(["implementation", "skill_design", "verification_only", "continuity_only"]);
    expect(evidence).toEqual(["present_confirmed", "present_unconfirmed", "missing", "conflicting", "not_applicable"]);
  });

  it("contains all required synthetic fixtures and required fields", () => {
    expect(Object.keys(fixtures)).toEqual(fixtureNames);
    for (const fixture of Object.values(fixtures)) {
      expect(fixture.skill_name).toBe("V4 Continuity / Restart Snapshot Skill");
      expect(outcomes).toContain(fixture.outcome);
      expect(modes).toContain(fixture.session_mode);
      expect(fixture.confidence).toBeGreaterThanOrEqual(0);
      expect(fixture.confidence).toBeLessThanOrEqual(1);
      expect(fixture.trace_refs.length).toBeGreaterThan(0);
      for (const key of ["github", "airtable", "google_drive", "clickup", "chat_history", "current_state_md"]) {
        expect(evidence).toContain(fixture.source_of_truth_review[key]!);
      }
    }
  });

  it("blocks unsupported verified claims and bad CI evidence", () => {
    expect(fixtures["missing-airtable-checkpoint.fixture.json"]!.outcome).toBe("blocked_unverified_claim");
    expect(fixtures["missing-or-failed-ci.fixture.json"]!.outcome).toBe("blocked_unverified_claim");
  });

  it("flags pending continuity PRs, source conflicts, and data leakage", () => {
    expect(fixtures["pending-continuity-pr.fixture.json"]!.outcome).toBe("needs_source_of_truth_check");
    expect(fixtures["conflicting-chat-memory.fixture.json"]!.outcome).toBe("stale_or_conflicting_context");
    const leak = fixtures["real-job-data-leak.fixture.json"]!;
    expect(leak.outcome).toBe("manual_confirmation_required");
    expect(leak.job_project_data_detected).toBe(true);
    expect(leak.pdf_plan_data_detected).toBe(true);
    expect(leak.quantity_or_cost_output_detected).toBe(true);
  });

  it("enforces lane constraints and compact restart behavior", () => {
    expect(fixtures["skill-design-lane.fixture.json"]!.session_mode).toBe("skill_design");
    expect(fixtures["skill-design-lane.fixture.json"]!.active_implementation_slice).toContain("documentation/schema/test-tooling");
    expect(fixtures["implementation-lane-sanitary-chain.fixture.json"]!.active_implementation_slice).toBe("Sanitary Sewer End-to-End Candidate Chain Fixture");
    expect(fixtures["oversized-snapshot.fixture.json"]!.snapshot_quality).toBe("oversized");
    expect(fixtures["oversized-snapshot.fixture.json"]!.manual_confirmation_required).toBe(true);
    expect(fixtures["handoff-ready.fixture.json"]!.outcome).toBe("handoff_ready");
  });

  it("keeps verification-only report-gated and preserves all guardrails", () => {
    expect(fixtures["verification-only.fixture.json"]!.session_mode).toBe("verification_only");
    expect(fixtures["verification-only.fixture.json"]!.current_state_update_recommendation).not.toBe("candidate_only");

    for (const fixture of Object.values(fixtures)) {
      expect(fixture.guardrail_review.no_runtime_external_writes).toBe(true);
      expect(fixture.guardrail_review.no_merge_or_checkpoint_authority).toBe(true);
      expect(fixture.guardrail_review.no_current_state_update_authority).toBe(true);
      expect(fixture.guardrail_review.no_pdf_intelligence).toBe(true);
      expect(fixture.guardrail_review.no_quantity_cost_rate_outputs).toBe(true);
      expect(fixture.guardrail_review.review_gated_status).toBe("preserved");
      const outputRecord = fixture as Record<string, unknown>;
      for (const forbidden of forbiddenRuntimeKeys) {
        expect(Object.hasOwn(outputRecord, forbidden)).toBe(false);
      }
    }
  });
});
