import { FRAMEWORK_VERSION } from "@v4/config";
import type { EstimatePackageOutput } from "./estimate-package.js";
import type { EstimatePackagePersistenceRecord } from "./estimate-package-persistence.js";

export type EstimatePackageReviewDecision = "approved" | "rejected" | "needs_review";

export interface EstimatePackageReviewInput {
  estimate_package: EstimatePackageOutput;
  estimate_package_persistence: EstimatePackagePersistenceRecord;
  decision: EstimatePackageReviewDecision;
  reviewer: string;
  reviewed_at?: string;
  note?: string;
}

export interface EstimatePackageReviewRecord {
  review_id: string;
  package_id: string;
  package_persistence_id: string;
  project_instance_id: string;
  decision: EstimatePackageReviewDecision;
  reviewer: string;
  reviewed_at: string;
  note?: string;
  framework_version: string;
  client_release_status: "eligible_for_bid_grade_output" | "blocked_from_bid_grade_output";
  next_required_action: "release_bid_grade_output" | "resolve_estimate_package_review";
  trace_refs: string[];
}

export function buildEstimatePackageReviewRecord(input: EstimatePackageReviewInput): EstimatePackageReviewRecord {
  assertReviewInput(input);
  const reviewedAt = input.reviewed_at ?? new Date().toISOString();
  const approved = input.decision === "approved";

  return {
    review_id: createReviewId(input.estimate_package.package_id, reviewedAt),
    package_id: input.estimate_package.package_id,
    package_persistence_id: input.estimate_package_persistence.persistence_id,
    project_instance_id: input.estimate_package.project_instance_id,
    decision: input.decision,
    reviewer: input.reviewer,
    reviewed_at: reviewedAt,
    note: input.note,
    framework_version: FRAMEWORK_VERSION,
    client_release_status: approved ? "eligible_for_bid_grade_output" : "blocked_from_bid_grade_output",
    next_required_action: approved ? "release_bid_grade_output" : "resolve_estimate_package_review",
    trace_refs: Array.from(new Set([
      input.estimate_package.package_id,
      input.estimate_package_persistence.persistence_id,
      input.estimate_package.quantity_export_id,
      input.estimate_package.cost_scenario_id,
      ...input.estimate_package.trace_manifest.trace_refs,
      ...input.estimate_package_persistence.trace_refs
    ])).sort()
  };
}

function assertReviewInput(input: EstimatePackageReviewInput): void {
  if (!input.reviewer.trim()) throw new Error("estimate_package_reviewer_required");
  if (input.estimate_package.review_status !== "ready_for_human_review") throw new Error("estimate_package_must_be_ready_for_human_review");
  if (input.estimate_package_persistence.package_id !== input.estimate_package.package_id) throw new Error("estimate_package_persistence_mismatch");
  if (input.estimate_package_persistence.project_instance_id !== input.estimate_package.project_instance_id) throw new Error("estimate_package_project_instance_mismatch");
  if (!input.estimate_package_persistence.trace_refs.includes(input.estimate_package.quantity_export_id)) throw new Error("estimate_package_missing_quantity_export_trace");
  if ((input.decision === "rejected" || input.decision === "needs_review") && !input.note?.trim()) {
    throw new Error("estimate_package_review_note_required");
  }
}

function createReviewId(packageId: string, reviewedAt: string): string {
  const stamp = reviewedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `REVIEW_${packageId}_${stamp}`;
}
