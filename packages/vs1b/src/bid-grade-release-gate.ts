import { FRAMEWORK_VERSION } from "@v4/config";
import type { EstimatePackageOutput, EstimateTraceManifest } from "./estimate-package.js";
import type { EstimatePackagePersistenceRecord } from "./estimate-package-persistence.js";
import type { EstimatePackageReviewRecord } from "./estimate-package-review.js";

export interface BidGradeReleaseGateInput {
  estimate_package: EstimatePackageOutput;
  estimate_package_persistence: EstimatePackagePersistenceRecord;
  estimate_package_review: EstimatePackageReviewRecord;
  released_by: string;
  released_at?: string;
}

export interface BidGradeReleaseTraceManifest extends EstimateTraceManifest {
  package_id: string;
  package_persistence_id: string;
  review_id: string;
  release_trace_refs: string[];
}

export interface BidGradeReleaseManifest {
  release_id: string;
  release_type: "bid_grade_release_manifest";
  release_status: "ready_for_output_document_generation";
  project_instance_id: string;
  framework_version: string;
  released_at: string;
  released_by: string;
  package_id: string;
  package_persistence_id: string;
  review_id: string;
  quantity_export_id: string;
  cost_scenario_id: string;
  total_cost: number;
  storage_paths: {
    quantity_export_path: string;
    cost_scenario_path: string;
    estimate_package_path: string;
  };
  trace_manifest: BidGradeReleaseTraceManifest;
  next_required_action: "generate_output_documents";
}

export function buildBidGradeReleaseManifest(input: BidGradeReleaseGateInput): BidGradeReleaseManifest {
  assertBidGradeReleaseGateInput(input);
  const releasedAt = input.released_at ?? new Date().toISOString();
  const releaseTraceRefs = Array.from(new Set([
    input.estimate_package.package_id,
    input.estimate_package_persistence.persistence_id,
    input.estimate_package_review.review_id,
    input.estimate_package.quantity_export_id,
    input.estimate_package.cost_scenario_id,
    ...input.estimate_package.trace_manifest.trace_refs,
    ...input.estimate_package_persistence.trace_refs,
    ...input.estimate_package_review.trace_refs
  ])).sort();

  return {
    release_id: createReleaseId(input.estimate_package.package_id, releasedAt),
    release_type: "bid_grade_release_manifest",
    release_status: "ready_for_output_document_generation",
    project_instance_id: input.estimate_package.project_instance_id,
    framework_version: FRAMEWORK_VERSION,
    released_at: releasedAt,
    released_by: input.released_by,
    package_id: input.estimate_package.package_id,
    package_persistence_id: input.estimate_package_persistence.persistence_id,
    review_id: input.estimate_package_review.review_id,
    quantity_export_id: input.estimate_package.quantity_export_id,
    cost_scenario_id: input.estimate_package.cost_scenario_id,
    total_cost: input.estimate_package.total_cost,
    storage_paths: {
      quantity_export_path: input.estimate_package.storage_paths.quantity_export_path,
      cost_scenario_path: input.estimate_package.storage_paths.cost_scenario_path,
      estimate_package_path: input.estimate_package_persistence.storage_path
    },
    trace_manifest: {
      ...input.estimate_package.trace_manifest,
      package_id: input.estimate_package.package_id,
      package_persistence_id: input.estimate_package_persistence.persistence_id,
      review_id: input.estimate_package_review.review_id,
      release_trace_refs: releaseTraceRefs
    },
    next_required_action: "generate_output_documents"
  };
}

function assertBidGradeReleaseGateInput(input: BidGradeReleaseGateInput): void {
  if (!input.released_by.trim()) throw new Error("bid_grade_released_by_required");
  assertApprovedReview(input.estimate_package_review);
  assertPackageAlignment(input);
  assertStoragePaths(input);
  assertTraceCoverage(input);
}

function assertApprovedReview(review: EstimatePackageReviewRecord): void {
  if (review.decision !== "approved") throw new Error("bid_grade_release_requires_approved_review");
  if (review.client_release_status !== "eligible_for_bid_grade_output") throw new Error("bid_grade_release_not_eligible");
  if (review.next_required_action !== "release_bid_grade_output") throw new Error("bid_grade_release_action_required");
}

function assertPackageAlignment(input: BidGradeReleaseGateInput): void {
  const estimatePackage = input.estimate_package;
  const persistence = input.estimate_package_persistence;
  const review = input.estimate_package_review;

  if (estimatePackage.package_type !== "human_review_estimate_package") throw new Error("bid_grade_release_package_type_required");
  if (estimatePackage.review_status !== "ready_for_human_review") throw new Error("bid_grade_release_package_not_ready_for_review");
  if (persistence.package_type !== estimatePackage.package_type) throw new Error("bid_grade_release_package_persistence_mismatch");
  if (persistence.review_status !== estimatePackage.review_status) throw new Error("bid_grade_release_package_persistence_mismatch");
  if (persistence.package_id !== estimatePackage.package_id) throw new Error("bid_grade_release_package_persistence_mismatch");
  if (review.package_id !== estimatePackage.package_id) throw new Error("bid_grade_release_review_package_mismatch");
  if (review.package_persistence_id !== persistence.persistence_id) throw new Error("bid_grade_release_review_persistence_mismatch");
  if (persistence.project_instance_id !== estimatePackage.project_instance_id) throw new Error("bid_grade_release_project_instance_mismatch");
  if (review.project_instance_id !== estimatePackage.project_instance_id) throw new Error("bid_grade_release_project_instance_mismatch");
  if (persistence.quantity_export_id !== estimatePackage.quantity_export_id) throw new Error("bid_grade_release_quantity_export_mismatch");
  if (persistence.cost_scenario_id !== estimatePackage.cost_scenario_id) throw new Error("bid_grade_release_cost_scenario_mismatch");
}

function assertStoragePaths(input: BidGradeReleaseGateInput): void {
  if (!input.estimate_package.storage_paths.quantity_export_path.trim()) throw new Error("bid_grade_release_quantity_export_path_required");
  if (!input.estimate_package.storage_paths.cost_scenario_path.trim()) throw new Error("bid_grade_release_cost_scenario_path_required");
  if (!input.estimate_package_persistence.storage_path.trim()) throw new Error("bid_grade_release_estimate_package_path_required");
}

function assertTraceCoverage(input: BidGradeReleaseGateInput): void {
  const estimatePackage = input.estimate_package;
  const persistence = input.estimate_package_persistence;
  const review = input.estimate_package_review;
  const requiredRefs = [
    estimatePackage.quantity_export_id,
    estimatePackage.cost_scenario_id,
    estimatePackage.trace_manifest.quantity_export_persistence_id,
    estimatePackage.trace_manifest.cost_scenario_output_id,
    estimatePackage.trace_manifest.cost_scenario_persistence_id,
    estimatePackage.trace_manifest.source_document_id,
    estimatePackage.trace_manifest.registry_id,
    estimatePackage.trace_manifest.registry_version
  ];

  for (const ref of requiredRefs) {
    if (!estimatePackage.trace_manifest.trace_refs.includes(ref)) throw new Error("bid_grade_release_missing_package_trace");
  }

  for (const sourceTakeoffItemId of estimatePackage.trace_manifest.source_takeoff_item_ids) {
    if (!estimatePackage.trace_manifest.trace_refs.includes(sourceTakeoffItemId)) throw new Error("bid_grade_release_missing_takeoff_trace");
  }

  if (!persistence.trace_refs.includes(estimatePackage.quantity_export_id)) throw new Error("bid_grade_release_missing_quantity_export_trace");
  if (!persistence.trace_refs.includes(estimatePackage.cost_scenario_id)) throw new Error("bid_grade_release_missing_cost_scenario_trace");
  if (!persistence.trace_refs.includes(estimatePackage.trace_manifest.registry_id)) throw new Error("bid_grade_release_missing_registry_trace");
  if (!review.trace_refs.includes(estimatePackage.package_id)) throw new Error("bid_grade_release_missing_review_trace");
  if (!review.trace_refs.includes(persistence.persistence_id)) throw new Error("bid_grade_release_missing_review_trace");
  if (!review.trace_refs.includes(estimatePackage.quantity_export_id)) throw new Error("bid_grade_release_missing_quantity_export_trace");
  if (!review.trace_refs.includes(estimatePackage.cost_scenario_id)) throw new Error("bid_grade_release_missing_cost_scenario_trace");
}

function createReleaseId(packageId: string, releasedAt: string): string {
  const stamp = releasedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `RELEASE_${packageId}_${stamp}`;
}
