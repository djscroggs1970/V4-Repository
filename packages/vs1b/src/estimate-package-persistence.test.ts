import { describe, expect, it } from "vitest";
import type { QuantityExportObject } from "@v4/vs1a";
import {
  buildCostBuildout,
  buildCostInputRegistry,
  buildCostScenarioOutputManifest,
  buildCostScenarioPersistenceRecord,
  buildEstimatePackageOutput,
  buildEstimatePackagePersistenceRecord,
  buildEstimatePackageReviewRecord
} from "./index.js";

const quantityExport: QuantityExportObject = {
  export_id: "QTY_EXPORT_SANDBOX_PACKAGE_001_20260425T040000000Z",
  export_type: "quantity_only",
  project_instance_id: "SANDBOX_PACKAGE_001",
  source_document_id: "DOC_SANDBOX_PACKAGE_001_CONTROLLED_PLAN",
  framework_version: "0.1.0",
  generated_at: "2026-04-25T04:00:00.000Z",
  line_count: 1,
  source_takeoff_item_ids: ["RUN-001_1"],
  lines: [
    {
      project_instance_id: "SANDBOX_PACKAGE_001",
      material_type: "PVC_C900_DR18",
      diameter_in: 8,
      depth_class: "A_0_5",
      uom: "LF",
      quantity: 100,
      source_takeoff_item_ids: ["RUN-001_1"]
    }
  ]
};

const quantityPersistence = {
  persistence_id: "PERSIST_QTY_EXPORT_SANDBOX_PACKAGE_001",
  project_instance_id: "SANDBOX_PACKAGE_001",
  export_id: quantityExport.export_id,
  export_type: "quantity_only" as const,
  storage_root_uri: "drive://V4 Framework",
  storage_path: `project-instances/${quantityExport.project_instance_id}/exports/quantity-only/${quantityExport.export_id}.json`,
  content_type: "application/json" as const,
  persisted_at: "2026-04-25T04:01:00.000Z",
  framework_version: "0.1.0",
  source_document_id: quantityExport.source_document_id,
  source_takeoff_item_ids: [...quantityExport.source_takeoff_item_ids]
};

const materialQuotes = [
  {
    quote_id: "MAT-PVC-8-LF-001",
    material_type: "PVC_C900_DR18",
    diameter_in: 8,
    unit_cost: 32,
    uom: "LF"
  }
];

const laborRates = [
  {
    labor_rate_id: "LAB-CREW-PIPE-001",
    crew_code: "PIPE_CREW_STANDARD",
    cost_per_day: 2800
  }
];

const equipmentRates = [
  {
    equipment_rate_id: "EQ-PIPE-001",
    equipment_code: "PIPE_EQUIPMENT_STANDARD",
    cost_per_day: 1900
  }
];

const productionRates = [
  {
    production_rate_id: "PROD-PVC-8-A-001",
    work_type: "sanitary_pipe_run" as const,
    material_type: "PVC_C900_DR18",
    diameter_in: 8,
    depth_class: "A_0_5" as const,
    production_uom: "LF",
    units_per_day: 100,
    crew_code: "PIPE_CREW_STANDARD",
    equipment_code: "PIPE_EQUIPMENT_STANDARD",
    validation_status: "validated" as const
  }
];

function buildEstimatePackage() {
  const registry = buildCostInputRegistry({
    registry_id: "REGISTRY_PACKAGE_INPUTS_001",
    registry_version: "2026.04.25",
    material_quotes: materialQuotes,
    labor_rates: laborRates,
    equipment_rates: equipmentRates,
    production_rates: productionRates
  });
  const scenario = buildCostBuildout({
    quantity_export: quantityExport,
    material_quotes: materialQuotes,
    labor_rates: laborRates,
    equipment_rates: equipmentRates,
    production_rates: productionRates,
    scenario_id: "SCENARIO_PACKAGE_001",
    generated_at: "2026-04-25T04:05:00.000Z"
  });
  const scenarioOutput = buildCostScenarioOutputManifest({
    cost_buildout: scenario,
    cost_input_registry: registry,
    storage_root_uri: "drive://V4 Framework",
    persisted_at: "2026-04-25T04:06:00.000Z"
  });
  const scenarioPersistence = buildCostScenarioPersistenceRecord({
    scenario_output_manifest: scenarioOutput,
    persisted_by: "controlled_validation",
    confirmed_at: "2026-04-25T04:07:00.000Z"
  });

  return buildEstimatePackageOutput({
    package_id: "ESTIMATE_PACKAGE_PERSIST_001",
    quantity_export: quantityExport,
    quantity_export_persistence: quantityPersistence,
    cost_buildout: scenario,
    cost_scenario_output: scenarioOutput,
    cost_scenario_persistence: scenarioPersistence,
    prepared_by: "controlled_validation",
    prepared_at: "2026-04-25T04:08:00.000Z"
  });
}

function buildEstimatePackagePersistence() {
  return buildEstimatePackagePersistenceRecord({
    estimate_package: buildEstimatePackage(),
    storage_root_uri: "drive://V4 Framework",
    persisted_by: "controlled_validation",
    persisted_at: "2026-04-25T04:09:00.000Z"
  });
}

describe("estimate package persistence", () => {
  it("builds a project-isolated persistence record for a human-review estimate package", () => {
    const estimatePackage = buildEstimatePackage();
    const persistence = buildEstimatePackagePersistenceRecord({
      estimate_package: estimatePackage,
      storage_root_uri: "drive://V4 Framework",
      persisted_by: "controlled_validation",
      persisted_at: "2026-04-25T04:09:00.000Z"
    });

    expect(persistence.package_id).toBe("ESTIMATE_PACKAGE_PERSIST_001");
    expect(persistence.package_type).toBe("human_review_estimate_package");
    expect(persistence.review_status).toBe("ready_for_human_review");
    expect(persistence.project_instance_id).toBe("SANDBOX_PACKAGE_001");
    expect(persistence.storage_root_uri).toBe("drive://V4 Framework");
    expect(persistence.storage_path).toBe("project-instances/SANDBOX_PACKAGE_001/estimate-packages/ESTIMATE_PACKAGE_PERSIST_001/ESTIMATE_PACKAGE_PERSIST_001.json");
    expect(persistence.content_type).toBe("application/json");
    expect(persistence.quantity_export_id).toBe(quantityExport.export_id);
    expect(persistence.cost_scenario_id).toBe("SCENARIO_PACKAGE_001");
    expect(persistence.total_cost).toBe(7900);
    expect(persistence.trace_refs).toContain(quantityExport.export_id);
    expect(persistence.trace_refs).toContain("REGISTRY_PACKAGE_INPUTS_001");
  });

  it("rejects persistence without a storage root", () => {
    expect(() => buildEstimatePackagePersistenceRecord({
      estimate_package: buildEstimatePackage(),
      storage_root_uri: ""
    })).toThrow("storage_root_uri_required");
  });

  it("rejects persistence when package trace omits registry", () => {
    const estimatePackage = buildEstimatePackage();
    expect(() => buildEstimatePackagePersistenceRecord({
      estimate_package: {
        ...estimatePackage,
        trace_manifest: {
          ...estimatePackage.trace_manifest,
          trace_refs: estimatePackage.trace_manifest.trace_refs.filter((ref) => ref !== estimatePackage.trace_manifest.registry_id)
        }
      },
      storage_root_uri: "drive://V4 Framework"
    })).toThrow("estimate_package_missing_registry_trace");
  });
});

describe("estimate package human review workflow", () => {
  it("marks an approved estimate package eligible for bid-grade output", () => {
    const estimatePackage = buildEstimatePackage();
    const persistence = buildEstimatePackagePersistence();
    const review = buildEstimatePackageReviewRecord({
      estimate_package: estimatePackage,
      estimate_package_persistence: persistence,
      decision: "approved",
      reviewer: "senior_estimator",
      reviewed_at: "2026-04-25T04:15:00.000Z"
    });

    expect(review.package_id).toBe("ESTIMATE_PACKAGE_PERSIST_001");
    expect(review.package_persistence_id).toBe(persistence.persistence_id);
    expect(review.project_instance_id).toBe("SANDBOX_PACKAGE_001");
    expect(review.decision).toBe("approved");
    expect(review.client_release_status).toBe("eligible_for_bid_grade_output");
    expect(review.next_required_action).toBe("release_bid_grade_output");
    expect(review.trace_refs).toContain(estimatePackage.package_id);
    expect(review.trace_refs).toContain(persistence.persistence_id);
    expect(review.trace_refs).toContain(quantityExport.export_id);
  });

  it("blocks rejected estimate packages from bid-grade output and requires a note", () => {
    const estimatePackage = buildEstimatePackage();
    const persistence = buildEstimatePackagePersistence();
    const review = buildEstimatePackageReviewRecord({
      estimate_package: estimatePackage,
      estimate_package_persistence: persistence,
      decision: "rejected",
      reviewer: "senior_estimator",
      note: "Material quote is stale.",
      reviewed_at: "2026-04-25T04:16:00.000Z"
    });

    expect(review.decision).toBe("rejected");
    expect(review.client_release_status).toBe("blocked_from_bid_grade_output");
    expect(review.next_required_action).toBe("resolve_estimate_package_review");

    expect(() => buildEstimatePackageReviewRecord({
      estimate_package: estimatePackage,
      estimate_package_persistence: persistence,
      decision: "rejected",
      reviewer: "senior_estimator"
    })).toThrow("estimate_package_review_note_required");
  });

  it("blocks needs-review estimate packages from bid-grade output and requires a note", () => {
    const estimatePackage = buildEstimatePackage();
    const persistence = buildEstimatePackagePersistence();
    const review = buildEstimatePackageReviewRecord({
      estimate_package: estimatePackage,
      estimate_package_persistence: persistence,
      decision: "needs_review",
      reviewer: "senior_estimator",
      note: "Confirm production rate against job constraints.",
      reviewed_at: "2026-04-25T04:17:00.000Z"
    });

    expect(review.decision).toBe("needs_review");
    expect(review.client_release_status).toBe("blocked_from_bid_grade_output");
    expect(review.next_required_action).toBe("resolve_estimate_package_review");
  });

  it("rejects review records with mismatched persistence", () => {
    expect(() => buildEstimatePackageReviewRecord({
      estimate_package: buildEstimatePackage(),
      estimate_package_persistence: {
        ...buildEstimatePackagePersistence(),
        package_id: "OTHER_PACKAGE"
      },
      decision: "approved",
      reviewer: "senior_estimator"
    })).toThrow("estimate_package_persistence_mismatch");
  });
});
