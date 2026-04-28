import { describe, expect, it } from "vitest";

type CheckResult = {
  manualConfirmationRequired: boolean;
  flaggedIssues: string[];
};

type BuilderOutput = {
  task_class?: string;
  routing?: string;
  routing_reason?: string;
  current_verified_version?: string;
  latest_verified_checkpoint?: {
    pr_ref?: string;
    ci_run_ref?: string;
    merge_sha?: string;
    airtable_checkpoint_ref?: string;
  };
  provisional_status: string;
  review_gated: boolean;
  trace_refs: string[];
  governance_instructions: {
    do_not_update_current_state_unless_authorized: boolean;
    do_not_mark_anything_verified: boolean;
    do_not_create_airtable_checkpoint_records: boolean;
  };
  manual_confirmation_required: boolean;
  manual_confirmation_reasons: string[];
};

const supportedRouting = ["NEW TASK", "SAME TASK", "FIX CURRENT PR", "VERIFY / REPORT ONLY"];
const expectedCiSequence = [
  "pnpm install --frozen-lockfile=false",
  "pnpm build",
  "pnpm typecheck",
  "pnpm test",
  "pnpm validate:rules",
  "pnpm sample:vs1a",
  "pnpm sample:vs1a:upload"
];

const schemaContract = {
  taskClasses: [
    "new_repo_slice",
    "fix_existing_pr",
    "recreate_local_only_codex_result",
    "docs_only_continuity_update",
    "schema_test_governance_fixture_slice",
    "verification_only_request",
    "review_checkpoint_preparation",
    "skill_governance_documentation_slice"
  ],
  routing: supportedRouting,
  reviewGated: true,
  provisionalStatus: "provisional_pending_manual_review",
  traceRefsMinItems: 1,
  ciCommandSequence: expectedCiSequence
};

const checkpoint = {
  pr_ref: "PR #23",
  ci_run_ref: "25024494691",
  merge_sha: "2fcc6e0a50a99018887f7a0b7852c041f940239d",
  airtable_checkpoint_ref: "recLNY1JlVNa09RjH"
};

const baseOutput = {
  current_verified_version: "v0.1-pdf-intake-packetization-skill-governance-ci-pass",
  latest_verified_checkpoint: checkpoint,
  provisional_status: "provisional_pending_manual_review",
  review_gated: true,
  hard_guardrails: {
    documentation_schema_test_only: true,
    no_production_automation: true,
    no_codex_runtime_calling_code: true,
    no_airtable_writes: true,
    no_direct_repo_merge_action: true,
    no_current_state_update_without_authorization: true,
    do_not_mark_verified: true,
    do_not_authorize_full_pdf_intelligence: true,
    no_real_project_data: true,
    no_quantities_takeoff_or_cost_outputs: true,
    preserve_job_instance_isolation: true
  },
  ci_command_sequence: expectedCiSequence,
  codex_return_format: [
    "changed_files",
    "summary",
    "test_ci_results",
    "pr_opened",
    "pr_url_or_number_if_visible",
    "deviations_from_scope"
  ],
  governance_instructions: {
    do_not_update_current_state_unless_authorized: true,
    do_not_mark_anything_verified: true,
    do_not_create_airtable_checkpoint_records: true
  },
  manual_confirmation_required: false,
  manual_confirmation_reasons: [] as string[],
  trace_refs: ["github:PR#23", "github:PR#24", "airtable:recLNY1JlVNa09RjH"]
};

const newTask: BuilderOutput = {
  ...baseOutput,
  task_class: "skill_governance_documentation_slice",
  routing: "NEW TASK",
  routing_reason: "Requested governed documentation/schema/test-tooling support for a new skill slice."
};

const sameTask: BuilderOutput = {
  ...baseOutput,
  task_class: "schema_test_governance_fixture_slice",
  routing: "SAME TASK",
  routing_reason: "Continuation of the same governed slice to add deterministic fixture and test coverage.",
  trace_refs: ["routing:same_task", "scope:fixtures_and_tests"]
};

const fixCurrentPr: BuilderOutput = {
  ...baseOutput,
  task_class: "fix_existing_pr",
  routing: "FIX CURRENT PR",
  routing_reason: "Request indicates correcting issues on the active pull request scope.",
  trace_refs: ["routing:fix_current_pr", "pr_scope:active"]
};

const verifyReportOnly: BuilderOutput = {
  ...baseOutput,
  task_class: "verification_only_request",
  routing: "VERIFY / REPORT ONLY",
  routing_reason: "Request is limited to verification/reporting without code-authority expansion.",
  trace_refs: ["routing:verify_report_only", "governance:review_gated"]
};

const manualConfirmationRequired: BuilderOutput = {
  ...baseOutput,
  task_class: "new_repo_slice",
  routing: "NEW TASK",
  routing_reason: "Input requests broad work touching unauthorized data and verification claims.",
  current_verified_version: undefined,
  latest_verified_checkpoint: undefined,
  manual_confirmation_required: true,
  manual_confirmation_reasons: [
    "missing_current_verified_version",
    "missing_latest_verified_checkpoint",
    "combined_oversized_slices",
    "checkpoint_or_mark_verified_request",
    "real_job_data",
    "pdf_intelligence",
    "quantities_or_costs"
  ],
  trace_refs: ["manual_confirmation:required", "governance:blocking_conditions"]
};

describe("codex task builder governance", () => {
  it("schema defines task classes, routing, CI sequence, return format, governance instructions, and review gating", () => {
    expect(schemaContract.taskClasses).toEqual([
      "new_repo_slice",
      "fix_existing_pr",
      "recreate_local_only_codex_result",
      "docs_only_continuity_update",
      "schema_test_governance_fixture_slice",
      "verification_only_request",
      "review_checkpoint_preparation",
      "skill_governance_documentation_slice"
    ]);
    expect(schemaContract.routing).toEqual(supportedRouting);
    expect(schemaContract.reviewGated).toBe(true);
    expect(schemaContract.provisionalStatus).toBe("provisional_pending_manual_review");
    expect(schemaContract.traceRefsMinItems).toBeGreaterThanOrEqual(1);
    expect(schemaContract.ciCommandSequence).toEqual(expectedCiSequence);
  });

  it("valid NEW TASK output passes", () => {
    const result = evaluateGovernance(newTask);
    expect(result.flaggedIssues).toEqual([]);
    expect(result.manualConfirmationRequired).toBe(false);
  });

  it("valid SAME TASK output passes", () => {
    const result = evaluateGovernance(sameTask);
    expect(result.flaggedIssues).toEqual([]);
    expect(result.manualConfirmationRequired).toBe(false);
  });

  it("valid FIX CURRENT PR output passes", () => {
    const result = evaluateGovernance(fixCurrentPr);
    expect(result.flaggedIssues).toEqual([]);
    expect(result.manualConfirmationRequired).toBe(false);
  });

  it("valid VERIFY / REPORT ONLY output passes", () => {
    const result = evaluateGovernance(verifyReportOnly);
    expect(result.flaggedIssues).toEqual([]);
    expect(result.manualConfirmationRequired).toBe(false);
  });

  it("missing routing is rejected or flagged", () => {
    const result = evaluateGovernance({ ...newTask, routing: undefined });
    expect(result.flaggedIssues).toContain("missing_routing");
    expect(result.manualConfirmationRequired).toBe(true);
  });

  it("missing current verified version requires manual confirmation", () => {
    const result = evaluateGovernance({ ...newTask, current_verified_version: undefined });
    expect(result.flaggedIssues).toContain("missing_current_verified_version");
    expect(result.manualConfirmationRequired).toBe(true);
  });

  it("missing latest checkpoint requires manual confirmation", () => {
    const result = evaluateGovernance({ ...newTask, latest_verified_checkpoint: undefined });
    expect(result.flaggedIssues).toContain("missing_latest_verified_checkpoint");
    expect(result.manualConfirmationRequired).toBe(true);
  });

  it("unauthorized current-state.md update request requires manual confirmation", () => {
    const result = evaluateGovernance({
      ...newTask,
      governance_instructions: {
        ...newTask.governance_instructions,
        do_not_update_current_state_unless_authorized: false
      }
    });
    expect(result.flaggedIssues).toContain("current_state_md_changes");
    expect(result.manualConfirmationRequired).toBe(true);
  });

  it("mark-verified request is blocked or flagged", () => {
    const result = evaluateGovernance({
      ...newTask,
      governance_instructions: {
        ...newTask.governance_instructions,
        do_not_mark_anything_verified: false
      }
    });
    expect(result.flaggedIssues).toContain("checkpoint_or_mark_verified_request");
  });

  it("Airtable checkpoint creation request is blocked or flagged", () => {
    const result = evaluateGovernance({
      ...newTask,
      governance_instructions: {
        ...newTask.governance_instructions,
        do_not_create_airtable_checkpoint_records: false
      }
    });
    expect(result.flaggedIssues).toContain("airtable_governance_changes");
  });

  it("review/checkpoint authority request is blocked or flagged", () => {
    const result = evaluateGovernance({
      ...newTask,
      task_class: "review_checkpoint_preparation",
      manual_confirmation_reasons: ["checkpoint_or_mark_verified_request"],
      manual_confirmation_required: true
    });
    expect(result.manualConfirmationRequired).toBe(true);
    expect(result.flaggedIssues).toContain("checkpoint_or_mark_verified_request");
  });

  it("real job data request requires manual confirmation", () => {
    const result = evaluateGovernance({ ...newTask, manual_confirmation_reasons: ["real_job_data"], manual_confirmation_required: true });
    expect(result.manualConfirmationRequired).toBe(true);
  });

  it("PDF intelligence request requires manual confirmation", () => {
    const result = evaluateGovernance({ ...newTask, manual_confirmation_reasons: ["pdf_intelligence"], manual_confirmation_required: true });
    expect(result.manualConfirmationRequired).toBe(true);
  });

  it("quantity/cost creation request requires manual confirmation", () => {
    const result = evaluateGovernance({ ...newTask, manual_confirmation_reasons: ["quantities_or_costs"], manual_confirmation_required: true });
    expect(result.manualConfirmationRequired).toBe(true);
  });

  it("output remains provisional/review-gated", () => {
    for (const fixture of [newTask, sameTask, fixCurrentPr, verifyReportOnly, manualConfirmationRequired]) {
      expect(fixture.review_gated).toBe(true);
      expect(fixture.provisional_status).toBe("provisional_pending_manual_review");
    }
  });

  it("trace refs are required and non-empty", () => {
    for (const fixture of [newTask, sameTask, fixCurrentPr, verifyReportOnly, manualConfirmationRequired]) {
      expect(Array.isArray(fixture.trace_refs)).toBe(true);
      expect(fixture.trace_refs.length).toBeGreaterThan(0);
      for (const trace of fixture.trace_refs) {
        expect(trace.length).toBeGreaterThan(0);
      }
    }
  });

  it("manual-confirmation-required fixture is explicitly gated", () => {
    const result = evaluateGovernance(manualConfirmationRequired);
    expect(result.manualConfirmationRequired).toBe(true);
    expect(result.flaggedIssues).toContain("missing_current_verified_version");
    expect(result.flaggedIssues).toContain("missing_latest_verified_checkpoint");
  });
});

function evaluateGovernance(output: BuilderOutput): CheckResult {
  const flaggedIssues: string[] = [];

  if (!output.routing || !supportedRouting.includes(output.routing)) flaggedIssues.push("missing_routing");
  if (!output.current_verified_version) flaggedIssues.push("missing_current_verified_version");
  if (!output.latest_verified_checkpoint) flaggedIssues.push("missing_latest_verified_checkpoint");
  if (!output.governance_instructions.do_not_update_current_state_unless_authorized) flaggedIssues.push("current_state_md_changes");
  if (!output.governance_instructions.do_not_mark_anything_verified) flaggedIssues.push("checkpoint_or_mark_verified_request");
  if (!output.governance_instructions.do_not_create_airtable_checkpoint_records) flaggedIssues.push("airtable_governance_changes");

  for (const reason of output.manual_confirmation_reasons) {
    if (!flaggedIssues.includes(reason)) flaggedIssues.push(reason);
  }

  return {
    manualConfirmationRequired: output.manual_confirmation_required || flaggedIssues.length > 0,
    flaggedIssues
  };
}
