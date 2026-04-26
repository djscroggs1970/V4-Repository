import { describe, expect, it } from "vitest";
import type { BidGradeReleaseManifest } from "./bid-grade-release-gate.js";
import { buildOutputDocumentGenerationResult } from "./output-document-generation.js";

const RELEASE_MANIFEST: BidGradeReleaseManifest = {
  release_id: "RELEASE_ESTIMATE_PACKAGE_001_20260426T030000000Z",
  release_type: "bid_grade_release_manifest",
  release_status: "ready_for_output_document_generation",
  project_instance_id: "SANDBOX_OUTPUT_001",
  framework_version: "0.1.0",
  released_at: "2026-04-26T03:00:00.000Z",
  released_by: "release_manager",
  package_id: "ESTIMATE_PACKAGE_001",
  package_persistence_id: "PERSIST_ESTIMATE_PACKAGE_001",
  review_id: "REVIEW_ESTIMATE_PACKAGE_001",
  quantity_export_id: "QTY_EXPORT_OUTPUT_001",
  cost_scenario_id: "SCENARIO_OUTPUT_001",
  total_cost: 15160,
  storage_paths: {
    quantity_export_path: "project-instances/SANDBOX_OUTPUT_001/exports/quantity-only/QTY_EXPORT_OUTPUT_001.json",
    cost_scenario_path: "project-instances/SANDBOX_OUTPUT_001/cost-scenarios/SCENARIO_OUTPUT_001/SCENARIO_OUTPUT_001.json",
    estimate_package_path: "project-instances/SANDBOX_OUTPUT_001/estimate-packages/ESTIMATE_PACKAGE_001/ESTIMATE_PACKAGE_001.json"
  },
  trace_manifest: {
    quantity_export_id: "QTY_EXPORT_OUTPUT_001",
    quantity_export_persistence_id: "PERSIST_QTY_EXPORT_OUTPUT_001",
    cost_scenario_id: "SCENARIO_OUTPUT_001",
    cost_scenario_output_id: "SCENARIO_OUTPUT_MANIFEST_001",
    cost_scenario_persistence_id: "PERSIST_SCENARIO_OUTPUT_001",
    source_document_id: "DOC_OUTPUT_001",
    registry_id: "REGISTRY_OUTPUT_001",
    registry_version: "2026.04.26",
    source_takeoff_item_ids: ["RUN-001_1", "RUN-002_1"],
    trace_refs: [
      "2026.04.26",
      "DOC_OUTPUT_001",
      "PERSIST_QTY_EXPORT_OUTPUT_001",
      "PERSIST_SCENARIO_OUTPUT_001",
      "QTY_EXPORT_OUTPUT_001",
      "REGISTRY_OUTPUT_001",
      "RUN-001_1",
      "RUN-002_1",
      "SCENARIO_OUTPUT_001",
      "SCENARIO_OUTPUT_MANIFEST_001"
    ],
    package_id: "ESTIMATE_PACKAGE_001",
    package_persistence_id: "PERSIST_ESTIMATE_PACKAGE_001",
    review_id: "REVIEW_ESTIMATE_PACKAGE_001",
    release_trace_refs: [
      "2026.04.26",
      "DOC_OUTPUT_001",
      "ESTIMATE_PACKAGE_001",
      "PERSIST_ESTIMATE_PACKAGE_001",
      "PERSIST_QTY_EXPORT_OUTPUT_001",
      "PERSIST_SCENARIO_OUTPUT_001",
      "QTY_EXPORT_OUTPUT_001",
      "REGISTRY_OUTPUT_001",
      "RELEASE_ESTIMATE_PACKAGE_001_20260426T030000000Z",
      "REVIEW_ESTIMATE_PACKAGE_001",
      "RUN-001_1",
      "RUN-002_1",
      "SCENARIO_OUTPUT_001",
      "SCENARIO_OUTPUT_MANIFEST_001"
    ]
  },
  next_required_action: "generate_output_documents"
};

describe("output document generation", () => {
  it("generates the default bid-grade output document set from a release manifest", () => {
    const result = buildOutputDocumentGenerationResult({
      release_manifest: RELEASE_MANIFEST,
      generated_by: "document_generator",
      generated_at: "2026-04-26T03:10:00.000Z"
    });

    expect(result.document_set_id).toBe("DOCSET_RELEASE_ESTIMATE_PACKAGE_001_20260426T030000000Z_20260426T031000000Z");
    expect(result.output_type).toBe("bid_grade_output_document_set");
    expect(result.document_status).toBe("generated_pending_persistence_review");
    expect(result.project_instance_id).toBe("SANDBOX_OUTPUT_001");
    expect(result.release_id).toBe(RELEASE_MANIFEST.release_id);
    expect(result.package_id).toBe(RELEASE_MANIFEST.package_id);
    expect(result.package_persistence_id).toBe(RELEASE_MANIFEST.package_persistence_id);
    expect(result.review_id).toBe(RELEASE_MANIFEST.review_id);
    expect(result.quantity_export_id).toBe(RELEASE_MANIFEST.quantity_export_id);
    expect(result.cost_scenario_id).toBe(RELEASE_MANIFEST.cost_scenario_id);
    expect(result.total_cost).toBe(15160);
    expect(result.document_count).toBe(4);
    expect(result.next_required_action).toBe("persist_output_documents");
    expect(result.documents.map((document) => document.document_type)).toEqual([
      "estimate_summary",
      "cost_breakdown",
      "quantity_cost_trace_exhibit",
      "client_facing_export_manifest"
    ]);
    expect(result.documents.every((document) => document.project_instance_id === RELEASE_MANIFEST.project_instance_id)).toBe(true);
    expect(result.documents.every((document) => document.release_id === RELEASE_MANIFEST.release_id)).toBe(true);
    expect(result.trace_refs).toContain(RELEASE_MANIFEST.release_id);
    expect(result.trace_refs).toContain(RELEASE_MANIFEST.package_id);
    expect(result.trace_refs).toContain(RELEASE_MANIFEST.quantity_export_id);
    expect(result.trace_refs).toContain("RUN-001_1");
  });

  it("generates only requested document types", () => {
    const result = buildOutputDocumentGenerationResult({
      release_manifest: RELEASE_MANIFEST,
      generated_by: "document_generator",
      generated_at: "2026-04-26T03:10:00.000Z",
      requested_document_types: ["estimate_summary", "quantity_cost_trace_exhibit"]
    });

    expect(result.document_count).toBe(2);
    expect(result.documents.map((document) => document.document_type)).toEqual(["estimate_summary", "quantity_cost_trace_exhibit"]);
  });

  it("creates readable estimate summary sections", () => {
    const result = buildOutputDocumentGenerationResult({
      release_manifest: RELEASE_MANIFEST,
      generated_by: "document_generator",
      requested_document_types: ["estimate_summary"],
      generated_at: "2026-04-26T03:10:00.000Z"
    });

    expect(result.documents[0]!.title).toBe("Estimate Summary");
    expect(result.documents[0]!.content_type).toBe("text/markdown");
    expect(result.documents[0]!.sections[0]!.content).toContain("$15160.00");
    expect(result.documents[0]!.sections[1]!.content).toContain(RELEASE_MANIFEST.quantity_export_id);
  });

  it("creates a JSON client-facing export manifest document", () => {
    const result = buildOutputDocumentGenerationResult({
      release_manifest: RELEASE_MANIFEST,
      generated_by: "document_generator",
      requested_document_types: ["client_facing_export_manifest"],
      generated_at: "2026-04-26T03:10:00.000Z"
    });

    expect(result.documents[0]!.title).toBe("Client-Facing Export Manifest");
    expect(result.documents[0]!.content_type).toBe("application/json");
    expect(result.documents[0]!.sections[0]!.content).toContain(RELEASE_MANIFEST.release_id);
    expect(result.documents[0]!.sections[0]!.content).toContain("trace_ref_count");
  });

  it("rejects release manifests that are not ready for document generation", () => {
    expect(() => buildOutputDocumentGenerationResult({
      release_manifest: {
        ...RELEASE_MANIFEST,
        release_status: "blocked_from_output_document_generation" as never
      },
      generated_by: "document_generator"
    })).toThrow("output_document_release_not_ready");
  });

  it("rejects missing release trace coverage", () => {
    expect(() => buildOutputDocumentGenerationResult({
      release_manifest: {
        ...RELEASE_MANIFEST,
        trace_manifest: {
          ...RELEASE_MANIFEST.trace_manifest,
          release_trace_refs: RELEASE_MANIFEST.trace_manifest.release_trace_refs.filter((ref) => ref !== RELEASE_MANIFEST.quantity_export_id)
        }
      },
      generated_by: "document_generator"
    })).toThrow("output_document_missing_release_trace");
  });

  it("rejects missing takeoff trace coverage", () => {
    expect(() => buildOutputDocumentGenerationResult({
      release_manifest: {
        ...RELEASE_MANIFEST,
        trace_manifest: {
          ...RELEASE_MANIFEST.trace_manifest,
          release_trace_refs: RELEASE_MANIFEST.trace_manifest.release_trace_refs.filter((ref) => ref !== "RUN-001_1")
        }
      },
      generated_by: "document_generator"
    })).toThrow("output_document_missing_takeoff_trace");
  });

  it("rejects duplicate requested document types", () => {
    expect(() => buildOutputDocumentGenerationResult({
      release_manifest: RELEASE_MANIFEST,
      generated_by: "document_generator",
      requested_document_types: ["estimate_summary", "estimate_summary"]
    })).toThrow("duplicate_output_document_type");
  });
});
