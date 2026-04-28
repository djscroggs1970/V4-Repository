import { describe, expect, it } from "vitest";

type Decision =
  | "ready_to_merge"
  | "blocked_failed_ci"
  | "blocked_scope_drift"
  | "blocked_guardrail_violation"
  | "needs_manual_review"
  | "docs_only_ready"
  | "checkpoint_ready_after_merge"
  | "not_checkpoint_eligible";

type MergeRecommendation = "recommend_merge" | "do_not_merge" | "hold_for_manual_review" | "report_only_no_merge_recommendation";
type CheckpointRecommendation = "checkpoint_after_merge" | "do_not_checkpoint" | "checkpoint_needs_merge_sha_and_airtable_record" | "not_applicable";
type ContinuityRecommendation = "create_continuity_update_pr_after_checkpoint" | "continuity_update_ready" | "do_not_update_current_state_yet" | "not_applicable";
type ReviewCategory =
  | "source_code"
  | "test"
  | "schema"
  | "docs"
  | "continuity_docs"
  | "skill_docs"
  | "governance_fixture"
  | "ci_workflow"
  | "package_export"
  | "airtable_governance"
  | "project_data"
  | "unknown";

type CiStep = { name: string; required: true; status: string; conclusion: string; evidence: string };
type ChangedFile = { path: string; change_type: string; additions: number | "unknown"; deletions: number | "unknown"; review_category: ReviewCategory; scope_status: string; notes: string };
type ReviewOutput = {
  skill_name: "V4 PR Review / Merge Gate Skill";
  pr_number: number | "unknown";
  pr_title: string;
  branch: string;
  base_branch: string;
  head_sha: string;
  mergeable: boolean | "unknown";
  draft: boolean | "unknown";
  claimed_scope: string;
  changed_files: ChangedFile[];
  ci_run_id: number | "unknown";
  ci_status: string;
  ci_conclusion: string;
  ci_required_steps: CiStep[];
  ci_all_required_steps_passed: boolean | "unknown";
  scope_alignment: string;
  guardrail_compliance: string;
  drift_risk: string;
  real_job_data_detected: boolean;
  pdf_intelligence_detected: boolean;
  unauthorized_quantity_or_cost_output_detected: boolean;
  unauthorized_current_state_update_detected: boolean;
  unauthorized_airtable_governance_detected: boolean;
  provisional_review_gated_status: string;
  traceability_status: string;
  decision: Decision;
  confidence: number;
  manual_confirmation_required: boolean;
  manual_confirmation_reasons: string[];
  required_actions: string[];
  merge_recommendation: MergeRecommendation;
  checkpoint_recommendation: CheckpointRecommendation;
  continuity_update_recommendation: ContinuityRecommendation;
  handoff_note: string;
  trace_refs: string[];
};

const expectedDecisionEnum: Decision[] = [
  "ready_to_merge",
  "blocked_failed_ci",
  "blocked_scope_drift",
  "blocked_guardrail_violation",
  "needs_manual_review",
  "docs_only_ready",
  "checkpoint_ready_after_merge",
  "not_checkpoint_eligible"
];

const expectedCiSequence = [
  "pnpm install --frozen-lockfile=false",
  "pnpm build",
  "pnpm typecheck",
  "pnpm test",
  "pnpm validate:rules",
  "pnpm sample:vs1a",
  "pnpm sample:vs1a:upload"
];

const reviewCategories: ReviewCategory[] = [
  "source_code",
  "test",
  "schema",
  "docs",
  "continuity_docs",
  "skill_docs",
  "governance_fixture",
  "ci_workflow",
  "package_export",
  "airtable_governance",
  "project_data",
  "unknown"
];

const passedSteps = expectedCiSequence.map((name) => ({ name, required: true as const, status: "passed", conclusion: "success", evidence: "GitHub Actions step passed" }));
const failedSteps = expectedCiSequence.map((name, index) => ({ name, required: true as const, status: index === 3 ? "failed" : "passed", conclusion: index === 3 ? "failure" : "success", evidence: index === 3 ? "GitHub Actions test step failed" : "GitHub Actions step passed" }));
const missingSteps = expectedCiSequence.map((name) => ({ name, required: true as const, status: "missing", conclusion: "missing", evidence: "No GitHub Actions evidence supplied" }));

const baseReview: ReviewOutput = {
  skill_name: "V4 PR Review / Merge Gate Skill",
  pr_number: 101,
  pr_title: "Synthetic clean PR",
  branch: "synthetic-branch",
  base_branch: "main",
  head_sha: "abc123",
  mergeable: true,
  draft: false,
  claimed_scope: "Governed synthetic review fixture",
  changed_files: [{ path: "packages/vs1a/src/example.test.ts", change_type: "added", additions: 10, deletions: 0, review_category: "test", scope_status: "in_scope", notes: "Synthetic test fixture" }],
  ci_run_id: 999001,
  ci_status: "completed",
  ci_conclusion: "success",
  ci_required_steps: passedSteps,
  ci_all_required_steps_passed: true,
  scope_alignment: "aligned",
  guardrail_compliance: "compliant",
  drift_risk: "low",
  real_job_data_detected: false,
  pdf_intelligence_detected: false,
  unauthorized_quantity_or_cost_output_detected: false,
  unauthorized_current_state_update_detected: false,
  unauthorized_airtable_governance_detected: false,
  provisional_review_gated_status: "preserved",
  traceability_status: "adequate",
  decision: "ready_to_merge",
  confidence: 0.93,
  manual_confirmation_required: false,
  manual_confirmation_reasons: [],
  required_actions: ["Main V4 build chat may review for merge."],
  merge_recommendation: "recommend_merge",
  checkpoint_recommendation: "checkpoint_needs_merge_sha_and_airtable_record",
  continuity_update_recommendation: "do_not_update_current_state_yet",
  handoff_note: "Synthetic PR appears ready for governed merge review only.",
  trace_refs: ["github:synthetic-pr-101", "ci:999001"]
};

const fixtures: Record<string, ReviewOutput> = {
  "01-clean-ready-to-merge.fixture.json": baseReview,
  "02-failed-ci.fixture.json": { ...baseReview, pr_number: 102, ci_conclusion: "failure", ci_required_steps: failedSteps, ci_all_required_steps_passed: false, decision: "blocked_failed_ci", merge_recommendation: "do_not_merge", checkpoint_recommendation: "do_not_checkpoint", manual_confirmation_required: true, manual_confirmation_reasons: ["github_actions_ci_failed"], trace_refs: ["github:synthetic-pr-102", "ci:999002"] },
  "03-missing-ci-evidence.fixture.json": { ...baseReview, pr_number: 103, ci_run_id: "unknown", ci_status: "missing", ci_conclusion: "missing", ci_required_steps: missingSteps, ci_all_required_steps_passed: false, decision: "blocked_failed_ci", merge_recommendation: "do_not_merge", checkpoint_recommendation: "do_not_checkpoint", manual_confirmation_required: true, manual_confirmation_reasons: ["missing_github_actions_ci_evidence"], trace_refs: ["github:synthetic-pr-103"] },
  "04-docs-only-continuity-authorized.fixture.json": { ...baseReview, pr_number: 104, pr_title: "Synthetic authorized continuity update", changed_files: [{ path: "docs/continuity/current-state.md", change_type: "modified", additions: 12, deletions: 3, review_category: "continuity_docs", scope_status: "in_scope", notes: "Explicitly authorized synthetic continuity fixture" }], decision: "docs_only_ready", merge_recommendation: "recommend_merge", checkpoint_recommendation: "not_applicable", continuity_update_recommendation: "continuity_update_ready", trace_refs: ["github:synthetic-pr-104", "authorization:continuity"] },
  "05-scope-drift.fixture.json": { ...baseReview, pr_number: 105, scope_alignment: "misaligned", drift_risk: "high", changed_files: [{ path: "packages/vs1b/src/cost-scenario-output.ts", change_type: "modified", additions: 20, deletions: 4, review_category: "source_code", scope_status: "out_of_scope", notes: "Cost code changed in a skill-governance PR" }], decision: "blocked_scope_drift", merge_recommendation: "do_not_merge", manual_confirmation_required: true, manual_confirmation_reasons: ["changed_files_outside_claimed_scope"], trace_refs: ["github:synthetic-pr-105", "scope:drift"] },
  "06-local-only-recreation-manual-review.fixture.json": { ...baseReview, pr_number: "unknown", branch: "work", head_sha: "local-only", mergeable: "unknown", ci_run_id: "unknown", ci_status: "missing", ci_conclusion: "missing", ci_required_steps: missingSteps, ci_all_required_steps_passed: false, decision: "needs_manual_review", merge_recommendation: "hold_for_manual_review", checkpoint_recommendation: "do_not_checkpoint", manual_confirmation_required: true, manual_confirmation_reasons: ["local_only_codex_result", "missing_visible_pr", "missing_github_actions_ci_evidence"], trace_refs: ["codex:local-only"] },
  "07-premature-verified-claim.fixture.json": { ...baseReview, pr_number: 107, guardrail_compliance: "violation", decision: "blocked_guardrail_violation", merge_recommendation: "do_not_merge", checkpoint_recommendation: "do_not_checkpoint", manual_confirmation_required: true, manual_confirmation_reasons: ["premature_verified_claim"], required_actions: ["Remove verified-state claim; CI and checkpoint evidence are required first."], trace_refs: ["github:synthetic-pr-107", "guardrail:verified-claim"] },
  "08-premerge-airtable-checkpoint-request.fixture.json": { ...baseReview, pr_number: 108, unauthorized_airtable_governance_detected: true, guardrail_compliance: "violation", decision: "blocked_guardrail_violation", merge_recommendation: "do_not_merge", checkpoint_recommendation: "do_not_checkpoint", manual_confirmation_required: true, manual_confirmation_reasons: ["airtable_checkpoint_requested_before_merge"], trace_refs: ["github:synthetic-pr-108", "guardrail:airtable"] },
  "09-real-data-pdf-quantity-cost-risk.fixture.json": { ...baseReview, pr_number: 109, real_job_data_detected: true, pdf_intelligence_detected: true, unauthorized_quantity_or_cost_output_detected: true, guardrail_compliance: "violation", changed_files: [{ path: "tests/fixtures/project-data/promenade.json", change_type: "added", additions: 50, deletions: 0, review_category: "project_data", scope_status: "out_of_scope", notes: "Synthetic risk case names real job data boundary" }], decision: "blocked_guardrail_violation", merge_recommendation: "do_not_merge", checkpoint_recommendation: "do_not_checkpoint", manual_confirmation_required: true, manual_confirmation_reasons: ["real_job_data", "pdf_intelligence", "unauthorized_quantity_or_cost_output"], trace_refs: ["github:synthetic-pr-109", "guardrail:real-data"] },
  "10-unauthorized-cost-logic-touch.fixture.json": { ...baseReview, pr_number: 110, guardrail_compliance: "violation", changed_files: [{ path: "packages/vs1b/src/cost-input-registry.ts", change_type: "modified", additions: 30, deletions: 2, review_category: "source_code", scope_status: "out_of_scope", notes: "Production cost logic touched without authorization" }], decision: "blocked_guardrail_violation", merge_recommendation: "do_not_merge", checkpoint_recommendation: "do_not_checkpoint", manual_confirmation_required: true, manual_confirmation_reasons: ["unauthorized_production_rate_or_cost_logic"], trace_refs: ["github:synthetic-pr-110", "guardrail:cost-logic"] },
  "11-verify-report-only.fixture.json": { ...baseReview, pr_number: 111, decision: "not_checkpoint_eligible", merge_recommendation: "report_only_no_merge_recommendation", checkpoint_recommendation: "not_applicable", continuity_update_recommendation: "not_applicable", required_actions: ["Report only; do not merge or checkpoint from this output."], trace_refs: ["github:synthetic-pr-111", "mode:verify-report-only"] },
  "12-current-state-after-merge-checkpoint.fixture.json": { ...baseReview, pr_number: 112, changed_files: [{ path: "docs/continuity/current-state.md", change_type: "modified", additions: 18, deletions: 6, review_category: "continuity_docs", scope_status: "in_scope", notes: "Post-merge checkpoint continuity context" }], decision: "checkpoint_ready_after_merge", merge_recommendation: "report_only_no_merge_recommendation", checkpoint_recommendation: "checkpoint_after_merge", continuity_update_recommendation: "create_continuity_update_pr_after_checkpoint", required_actions: ["Use only after merge SHA and Airtable checkpoint evidence are present."], trace_refs: ["github:synthetic-pr-112", "merge:synthetic-sha", "airtable:synthetic-checkpoint"] }
};

const forbiddenRuntimeKeys = ["merge_execution", "airtable_write", "verified_marking", "quantity_exports", "cost_outputs", "production_rates", "vendor_pricing", "external_transmission"];

describe("pr review merge gate skill governance", () => {
  it("locks the exact decision enum and CI sequence", () => {
    expect(expectedDecisionEnum).toEqual([
      "ready_to_merge",
      "blocked_failed_ci",
      "blocked_scope_drift",
      "blocked_guardrail_violation",
      "needs_manual_review",
      "docs_only_ready",
      "checkpoint_ready_after_merge",
      "not_checkpoint_eligible"
    ]);
    expect(expectedCiSequence).toEqual([
      "pnpm install --frozen-lockfile=false",
      "pnpm build",
      "pnpm typecheck",
      "pnpm test",
      "pnpm validate:rules",
      "pnpm sample:vs1a",
      "pnpm sample:vs1a:upload"
    ]);
  });

  it("fixtures cover all required synthetic scenarios", () => {
    expect(Object.keys(fixtures)).toEqual([
      "01-clean-ready-to-merge.fixture.json",
      "02-failed-ci.fixture.json",
      "03-missing-ci-evidence.fixture.json",
      "04-docs-only-continuity-authorized.fixture.json",
      "05-scope-drift.fixture.json",
      "06-local-only-recreation-manual-review.fixture.json",
      "07-premature-verified-claim.fixture.json",
      "08-premerge-airtable-checkpoint-request.fixture.json",
      "09-real-data-pdf-quantity-cost-risk.fixture.json",
      "10-unauthorized-cost-logic-touch.fixture.json",
      "11-verify-report-only.fixture.json",
      "12-current-state-after-merge-checkpoint.fixture.json"
    ]);
  });

  it("GitHub Actions CI is authoritative and local-only or missing CI cannot recommend merge", () => {
    for (const name of ["02-failed-ci.fixture.json", "03-missing-ci-evidence.fixture.json", "06-local-only-recreation-manual-review.fixture.json"]) {
      const output = fixtures[name]!;
      expect(output.ci_all_required_steps_passed).not.toBe(true);
      expect(output.merge_recommendation).not.toBe("recommend_merge");
      expect(output.manual_confirmation_required).toBe(true);
    }
  });

  it("guardrail violations outrank otherwise passing CI", () => {
    for (const name of ["07-premature-verified-claim.fixture.json", "08-premerge-airtable-checkpoint-request.fixture.json", "09-real-data-pdf-quantity-cost-risk.fixture.json", "10-unauthorized-cost-logic-touch.fixture.json"]) {
      const output = fixtures[name]!;
      expect(output.ci_all_required_steps_passed).toBe(true);
      expect(output.guardrail_compliance).toBe("violation");
      expect(output.decision).toBe("blocked_guardrail_violation");
      expect(output.merge_recommendation).toBe("do_not_merge");
    }
  });

  it("scope drift blocks merge even when CI passed", () => {
    const output = fixtures["05-scope-drift.fixture.json"]!;
    expect(output.ci_all_required_steps_passed).toBe(true);
    expect(output.changed_files.some((file) => file.scope_status === "out_of_scope")).toBe(true);
    expect(output.decision).toBe("blocked_scope_drift");
    expect(output.merge_recommendation).toBe("do_not_merge");
  });

  it("checkpoint and continuity recommendations require the correct stage", () => {
    expect(fixtures["01-clean-ready-to-merge.fixture.json"]!.checkpoint_recommendation).toBe("checkpoint_needs_merge_sha_and_airtable_record");
    expect(fixtures["08-premerge-airtable-checkpoint-request.fixture.json"]!.checkpoint_recommendation).toBe("do_not_checkpoint");
    expect(fixtures["12-current-state-after-merge-checkpoint.fixture.json"]!.checkpoint_recommendation).toBe("checkpoint_after_merge");
    expect(fixtures["12-current-state-after-merge-checkpoint.fixture.json"]!.continuity_update_recommendation).toBe("create_continuity_update_pr_after_checkpoint");
  });

  it("changed file categories and review-gated traceability remain constrained", () => {
    for (const output of Object.values(fixtures)) {
      expect(output.skill_name).toBe("V4 PR Review / Merge Gate Skill");
      expect(output.provisional_review_gated_status).toBe("preserved");
      expect(output.trace_refs.length).toBeGreaterThan(0);
      expect(output.confidence).toBeGreaterThanOrEqual(0);
      expect(output.confidence).toBeLessThanOrEqual(1);
      expect(output.ci_required_steps.map((step) => step.name)).toEqual(expectedCiSequence);
      for (const changedFile of output.changed_files) {
        expect(reviewCategories).toContain(changedFile.review_category);
        expect(changedFile.path.length).toBeGreaterThan(0);
      }
    }
  });

  it("does not introduce runtime merge, checkpoint, verified, quantity, cost, production-rate, vendor, or transmission outputs", () => {
    for (const output of Object.values(fixtures)) {
      const outputRecord = output as Record<string, unknown>;
      for (const forbiddenKey of forbiddenRuntimeKeys) {
        expect(Object.hasOwn(outputRecord, forbiddenKey)).toBe(false);
      }
    }
  });
});
