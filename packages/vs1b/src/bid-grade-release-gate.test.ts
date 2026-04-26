import { describe, expect, it } from "vitest";
import type { EstimatePackageOutput } from "./estimate-package.js";
import type { EstimatePackagePersistenceRecord } from "./estimate-package-persistence.js";
import type { EstimatePackageReviewRecord } from "./estimate-package-review.js";
import { buildBidGradeReleaseManifest } from "./bid-grade-release-gate.js";

const PACKAGE: EstimatePackageOutput = {
  package_id: "ESTIMATE_PACKAGE_RELEASE_001",
  package_type: "human_review_estimate_package",
  review_status: "ready_for_human_review",
  project_instance_id: "SANDBOX_RELEASE_001",
  framework_version: "0.1.0",
  prepared_at: "2026-04-25T06:00:00.000Z",
  prepared_by: "controlled_validation",
  quantity_export_id: "QTY_EXPORT_RELEASE_001",
  cost_scenario_id: "SCENARIO_RELEASE_001",
  total_quantity_lines: 2,
  total_cost_lines: 2,
  total_cost: 15160,
  storage_paths: {
    quantity_export_path: "project-instances/SANDBOX_RELEASE_001/exports/quantity-only/QTY_EXPORT_RELEASE_001.json",
    cost_scenario_path: "project-instances/SANDBOX_RELEASE_001/cost-scenarios/SCENARIO_RELEASE_001/SCENARIO_RELEASE_001.json"
  },
  trace_manifest: {
    quantity_export_id: "QTY_EXPORT_RELEASE_001",
    quantity_export_persistence_id: "PERSIST_QTY_EXPORT_RELEASE_001",
    cost_scenario_id: "SCENARIO_RELEASE_001",
    cost_scenario_output_id: "SCENARIO_OUTPUT_RELEASE_001",
    cost_scenario_persistence_id: "PERSIST_SCENARIO_RELEASE_001",
    source_document_id: "DOC_RELEASE_001",
    registry_id: "REGISTRY_RELEASE_001",
    registry_version: "2026.04.25",
    source_takeoff_item_ids: ["RUN-001_1", "RUN-002_1"],
    trace_refs: [
      "2026.04.25",
      "DOC_RELEASE_001",
      "PERSIST_QTY_EXPORT_RELEASE_001",
      "PERSIST_SCENARIO_RELEASE_001",
      "QTY_EXPORT_RELEASE_001",
      "REGISTRY_RELEASE_001",
      "RUN-001_1",
      "RUN-002_1",
      "SCENARIO_OUTPUT_RELEASE_001",
      "SCENARIO_RELEASE_001"
    ]
  }
};

const PERSISTENCE: EstimatePackagePersistenceRecord = {
  persistence_id: "PERSIST_ESTIMATE_PACKAGE_RELEASE_001",
  package_id: PACKAGE.package_id,
  package_type: "human_review_estimate_package",
  review_status: "ready_for_human_review",
  project_instance_id: PACKAGE.project_instance_id,
  storage_root_uri: "drive://V4 Framework",
  storage_path: "project-instances/SANDBOX_RELEASE_001/estimate-packages/ESTIMATE_PACKAGE_RELEASE_001/ESTIMATE_PACKAGE_RELEASE_001.json",
  content_type: "application/json",
  persisted_at: "2026-04-25T06:01:00.000Z",
  persisted_by: "controlled_validation",
  framework_version: "0.1.0",
  quantity_export_id: PACKAGE.quantity_export_id,
  cost_scenario_id: PACKAGE.cost_scenario_id,
  total_cost: PACKAGE.total_cost,
  trace_refs: [...PACKAGE.trace_manifest.trace_refs]
};

const APPROVED_REVIEW: EstimatePackageReviewRecord = {
  review_id: "REVIEW_ESTIMATE_PACKAGE_RELEASE_001",
  package_id: PACKAGE.package_id,
  package_persistence_id: PERSISTENCE.persistence_id,
  project_instance_id: PACKAGE.project_instance_id,
  decision: "approved",
  reviewer: "human_reviewer",
  reviewed_at: "2026-04-25T06:05:00.000Z",
  framework_version: "0.1.0",
  client_release_status: "eligible_for_bid_grade_output",
  next_required_action: "release_bid_grade_output",
  trace_refs: [
    PACKAGE.package_id,
    PERSISTENCE.persistence_id,
    PACKAGE.quantity_export_id,
    PACKAGE.cost_scenario_id,
    ...PACKAGE.trace_manifest.trace_refs
  ]
};

describe("bid-grade release gate", () => {
  it("builds a release manifest from an approved human-review record", () => {
    const manifest = buildBidGradeReleaseManifest({
      estimate_package: PACKAGE,
      estimate_package_persistence: PERSISTENCE,
      estimate_package_review: APPROVED_REVIEW,
      released_by: "release_manager",
      released_at: "2026-04-25T06:10:00.000Z"
    });

    expect(manifest.release_id).toBe("RELEASE_ESTIMATE_PACKAGE_RELEASE_001_20260425T061000000Z");
    expect(manifest.release_type).toBe("bid_grade_release_manifest");
    expect(manifest.release_status).toBe("ready_for_output_document_generation");
    expect(manifest.project_instance_id).toBe("SANDBOX_RELEASE_001");
    expect(manifest.package_id).toBe(PACKAGE.package_id);
    expect(manifest.package_persistence_id).toBe(PERSISTENCE.persistence_id);
    expect(manifest.review_id).toBe(APPROVED_REVIEW.review_id);
    expect(manifest.quantity_export_id).toBe(PACKAGE.quantity_export_id);
    expect(manifest.cost_scenario_id).toBe(PACKAGE.cost_scenario_id);
    expect(manifest.total_cost).toBe(15160);
    expect(manifest.storage_paths.quantity_export_path).toBe(PACKAGE.storage_paths.quantity_export_path);
    expect(manifest.storage_paths.cost_scenario_path).toBe(PACKAGE.storage_paths.cost_scenario_path);
    expect(manifest.storage_paths.estimate_package_path).toBe(PERSISTENCE.storage_path);
    expect(manifest.next_required_action).toBe("generate_output_documents");
    expect(manifest.trace_manifest.package_id).toBe(PACKAGE.package_id);
    expect(manifest.trace_manifest.package_persistence_id).toBe(PERSISTENCE.persistence_id);
    expect(manifest.trace_manifest.review_id).toBe(APPROVED_REVIEW.review_id);
    expect(manifest.trace_manifest.source_takeoff_item_ids).toEqual(["RUN-001_1", "RUN-002_1"]);
    expect(manifest.trace_manifest.release_trace_refs).toContain(PACKAGE.package_id);
    expect(manifest.trace_manifest.release_trace_refs).toContain(PERSISTENCE.persistence_id);
    expect(manifest.trace_manifest.release_trace_refs).toContain(APPROVED_REVIEW.review_id);
    expect(manifest.trace_manifest.release_trace_refs).toContain("RUN-001_1");
  });

  it("rejects a rejected human-review record", () => {
    expect(() => buildBidGradeReleaseManifest({
      estimate_package: PACKAGE,
      estimate_package_persistence: PERSISTENCE,
      estimate_package_review: {
        ...APPROVED_REVIEW,
        decision: "rejected",
        client_release_status: "blocked_from_bid_grade_output",
        next_required_action: "resolve_estimate_package_review"
      },
      released_by: "release_manager"
    })).toThrow("bid_grade_release_requires_approved_review");
  });

  it("rejects a needs-review human-review record", () => {
    expect(() => buildBidGradeReleaseManifest({
      estimate_package: PACKAGE,
      estimate_package_persistence: PERSISTENCE,
      estimate_package_review: {
        ...APPROVED_REVIEW,
        decision: "needs_review",
        client_release_status: "blocked_from_bid_grade_output",
        next_required_action: "resolve_estimate_package_review"
      },
      released_by: "release_manager"
    })).toThrow("bid_grade_release_requires_approved_review");
  });

  it("rejects package and review package ID mismatches", () => {
    expect(() => buildBidGradeReleaseManifest({
      estimate_package: PACKAGE,
      estimate_package_persistence: PERSISTENCE,
      estimate_package_review: {
        ...APPROVED_REVIEW,
        package_id: "OTHER_PACKAGE"
      },
      released_by: "release_manager"
    })).toThrow("bid_grade_release_review_package_mismatch");
  });

  it("rejects project instance mismatches", () => {
    expect(() => buildBidGradeReleaseManifest({
      estimate_package: PACKAGE,
      estimate_package_persistence: {
        ...PERSISTENCE,
        project_instance_id: "OTHER_PROJECT"
      },
      estimate_package_review: APPROVED_REVIEW,
      released_by: "release_manager"
    })).toThrow("bid_grade_release_project_instance_mismatch");
  });

  it("rejects missing quantity export trace", () => {
    expect(() => buildBidGradeReleaseManifest({
      estimate_package: PACKAGE,
      estimate_package_persistence: {
        ...PERSISTENCE,
        trace_refs: PERSISTENCE.trace_refs.filter((ref) => ref !== PACKAGE.quantity_export_id)
      },
      estimate_package_review: APPROVED_REVIEW,
      released_by: "release_manager"
    })).toThrow("bid_grade_release_missing_quantity_export_trace");
  });

  it("rejects missing takeoff trace coverage", () => {
    expect(() => buildBidGradeReleaseManifest({
      estimate_package: {
        ...PACKAGE,
        trace_manifest: {
          ...PACKAGE.trace_manifest,
          trace_refs: PACKAGE.trace_manifest.trace_refs.filter((ref) => ref !== "RUN-001_1")
        }
      },
      estimate_package_persistence: PERSISTENCE,
      estimate_package_review: APPROVED_REVIEW,
      released_by: "release_manager"
    })).toThrow("bid_grade_release_missing_takeoff_trace");
  });

  it("rejects missing estimate package storage path", () => {
    expect(() => buildBidGradeReleaseManifest({
      estimate_package: PACKAGE,
      estimate_package_persistence: {
        ...PERSISTENCE,
        storage_path: ""
      },
      estimate_package_review: APPROVED_REVIEW,
      released_by: "release_manager"
    })).toThrow("bid_grade_release_estimate_package_path_required");
  });
});
