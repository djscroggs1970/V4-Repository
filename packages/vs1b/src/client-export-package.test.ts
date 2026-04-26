import { describe, expect, it } from "vitest";
import type { OutputDocumentGenerationResult } from "./output-document-generation.js";
import type { OutputDocumentPersistenceRecord, OutputDocumentReviewRecord } from "./output-document-persistence-review.js";
import { buildClientExportPackageManifest } from "./client-export-package.js";

const OUTPUT_DOCUMENT_SET: OutputDocumentGenerationResult = {
  document_set_id: "DOCSET_CLIENT_EXPORT_001",
  output_type: "bid_grade_output_document_set",
  document_status: "generated_pending_persistence_review",
  project_instance_id: "SANDBOX_CLIENT_EXPORT_001",
  framework_version: "0.1.0",
  release_id: "RELEASE_CLIENT_EXPORT_001",
  package_id: "ESTIMATE_PACKAGE_CLIENT_EXPORT_001",
  package_persistence_id: "PERSIST_ESTIMATE_PACKAGE_CLIENT_EXPORT_001",
  review_id: "REVIEW_ESTIMATE_PACKAGE_CLIENT_EXPORT_001",
  quantity_export_id: "QTY_EXPORT_CLIENT_EXPORT_001",
  cost_scenario_id: "SCENARIO_CLIENT_EXPORT_001",
  total_cost: 15160,
  generated_at: "2026-04-26T05:00:00.000Z",
  generated_by: "document_generator",
  document_count: 2,
  documents: [
    {
      document_id: "DOCSET_CLIENT_EXPORT_001_ESTIMATE_SUMMARY",
      document_type: "estimate_summary",
      document_status: "generated_pending_persistence_review",
      project_instance_id: "SANDBOX_CLIENT_EXPORT_001",
      release_id: "RELEASE_CLIENT_EXPORT_001",
      package_id: "ESTIMATE_PACKAGE_CLIENT_EXPORT_001",
      title: "Estimate Summary",
      content_type: "text/markdown",
      generated_at: "2026-04-26T05:00:00.000Z",
      generated_by: "document_generator",
      sections: [],
      trace_refs: [
        "RELEASE_CLIENT_EXPORT_001",
        "ESTIMATE_PACKAGE_CLIENT_EXPORT_001",
        "QTY_EXPORT_CLIENT_EXPORT_001",
        "SCENARIO_CLIENT_EXPORT_001",
        "RUN-001_1"
      ]
    },
    {
      document_id: "DOCSET_CLIENT_EXPORT_001_CLIENT_FACING_EXPORT_MANIFEST",
      document_type: "client_facing_export_manifest",
      document_status: "generated_pending_persistence_review",
      project_instance_id: "SANDBOX_CLIENT_EXPORT_001",
      release_id: "RELEASE_CLIENT_EXPORT_001",
      package_id: "ESTIMATE_PACKAGE_CLIENT_EXPORT_001",
      title: "Client-Facing Export Manifest",
      content_type: "application/json",
      generated_at: "2026-04-26T05:00:00.000Z",
      generated_by: "document_generator",
      sections: [],
      trace_refs: [
        "RELEASE_CLIENT_EXPORT_001",
        "ESTIMATE_PACKAGE_CLIENT_EXPORT_001",
        "QTY_EXPORT_CLIENT_EXPORT_001",
        "SCENARIO_CLIENT_EXPORT_001",
        "RUN-001_1"
      ]
    }
  ],
  trace_refs: [
    "DOCSET_CLIENT_EXPORT_001",
    "RELEASE_CLIENT_EXPORT_001",
    "ESTIMATE_PACKAGE_CLIENT_EXPORT_001",
    "PERSIST_ESTIMATE_PACKAGE_CLIENT_EXPORT_001",
    "REVIEW_ESTIMATE_PACKAGE_CLIENT_EXPORT_001",
    "QTY_EXPORT_CLIENT_EXPORT_001",
    "SCENARIO_CLIENT_EXPORT_001",
    "RUN-001_1"
  ],
  next_required_action: "persist_output_documents"
};

const OUTPUT_PERSISTENCE: OutputDocumentPersistenceRecord = {
  persistence_id: "PERSIST_DOCSET_CLIENT_EXPORT_001",
  document_set_id: OUTPUT_DOCUMENT_SET.document_set_id,
  output_type: "bid_grade_output_document_set",
  document_status: "persisted_pending_review",
  project_instance_id: OUTPUT_DOCUMENT_SET.project_instance_id,
  framework_version: "0.1.0",
  storage_root_uri: "drive://V4 Framework",
  storage_path: "project-instances/SANDBOX_CLIENT_EXPORT_001/output-documents/DOCSET_CLIENT_EXPORT_001/DOCSET_CLIENT_EXPORT_001.json",
  content_type: "application/json",
  persisted_at: "2026-04-26T05:05:00.000Z",
  persisted_by: "controlled_validation",
  release_id: OUTPUT_DOCUMENT_SET.release_id,
  package_id: OUTPUT_DOCUMENT_SET.package_id,
  package_persistence_id: OUTPUT_DOCUMENT_SET.package_persistence_id,
  review_id: OUTPUT_DOCUMENT_SET.review_id,
  quantity_export_id: OUTPUT_DOCUMENT_SET.quantity_export_id,
  cost_scenario_id: OUTPUT_DOCUMENT_SET.cost_scenario_id,
  total_cost: OUTPUT_DOCUMENT_SET.total_cost,
  document_count: 2,
  documents: [
    {
      document_id: "DOCSET_CLIENT_EXPORT_001_ESTIMATE_SUMMARY",
      document_type: "estimate_summary",
      project_instance_id: OUTPUT_DOCUMENT_SET.project_instance_id,
      release_id: OUTPUT_DOCUMENT_SET.release_id,
      package_id: OUTPUT_DOCUMENT_SET.package_id,
      storage_path: "project-instances/SANDBOX_CLIENT_EXPORT_001/output-documents/DOCSET_CLIENT_EXPORT_001/DOCSET_CLIENT_EXPORT_001_ESTIMATE_SUMMARY.md",
      content_type: "text/markdown",
      trace_refs: [OUTPUT_DOCUMENT_SET.release_id, OUTPUT_DOCUMENT_SET.package_id, OUTPUT_DOCUMENT_SET.quantity_export_id, OUTPUT_DOCUMENT_SET.cost_scenario_id]
    },
    {
      document_id: "DOCSET_CLIENT_EXPORT_001_CLIENT_FACING_EXPORT_MANIFEST",
      document_type: "client_facing_export_manifest",
      project_instance_id: OUTPUT_DOCUMENT_SET.project_instance_id,
      release_id: OUTPUT_DOCUMENT_SET.release_id,
      package_id: OUTPUT_DOCUMENT_SET.package_id,
      storage_path: "project-instances/SANDBOX_CLIENT_EXPORT_001/output-documents/DOCSET_CLIENT_EXPORT_001/DOCSET_CLIENT_EXPORT_001_CLIENT_FACING_EXPORT_MANIFEST.json",
      content_type: "application/json",
      trace_refs: [OUTPUT_DOCUMENT_SET.release_id, OUTPUT_DOCUMENT_SET.package_id, OUTPUT_DOCUMENT_SET.quantity_export_id, OUTPUT_DOCUMENT_SET.cost_scenario_id]
    }
  ],
  trace_refs: [
    OUTPUT_DOCUMENT_SET.document_set_id,
    OUTPUT_DOCUMENT_SET.release_id,
    OUTPUT_DOCUMENT_SET.package_id,
    OUTPUT_DOCUMENT_SET.package_persistence_id,
    OUTPUT_DOCUMENT_SET.review_id,
    OUTPUT_DOCUMENT_SET.quantity_export_id,
    OUTPUT_DOCUMENT_SET.cost_scenario_id
  ],
  next_required_action: "review_output_documents"
};

const APPROVED_OUTPUT_REVIEW: OutputDocumentReviewRecord = {
  output_review_id: "OUTPUT_REVIEW_DOCSET_CLIENT_EXPORT_001",
  document_set_id: OUTPUT_DOCUMENT_SET.document_set_id,
  persistence_id: OUTPUT_PERSISTENCE.persistence_id,
  project_instance_id: OUTPUT_DOCUMENT_SET.project_instance_id,
  decision: "approved",
  reviewer: "human_reviewer",
  reviewed_at: "2026-04-26T05:10:00.000Z",
  framework_version: "0.1.0",
  client_export_status: "eligible_for_client_facing_export_package",
  next_required_action: "assemble_client_facing_export_package",
  trace_refs: [
    OUTPUT_DOCUMENT_SET.document_set_id,
    OUTPUT_PERSISTENCE.persistence_id,
    OUTPUT_DOCUMENT_SET.release_id,
    OUTPUT_DOCUMENT_SET.package_id,
    OUTPUT_DOCUMENT_SET.package_persistence_id,
    OUTPUT_DOCUMENT_SET.review_id,
    OUTPUT_DOCUMENT_SET.quantity_export_id,
    OUTPUT_DOCUMENT_SET.cost_scenario_id
  ]
};

describe("client export package", () => {
  it("assembles a client-facing export package from persisted and approved output documents", () => {
    const manifest = buildClientExportPackageManifest({
      output_document_set: OUTPUT_DOCUMENT_SET,
      output_document_persistence: OUTPUT_PERSISTENCE,
      output_document_review: APPROVED_OUTPUT_REVIEW,
      assembled_by: "release_manager",
      assembled_at: "2026-04-26T05:15:00.000Z"
    });

    expect(manifest.client_export_package_id).toBe("CLIENT_EXPORT_DOCSET_CLIENT_EXPORT_001_20260426T051500000Z");
    expect(manifest.package_type).toBe("client_facing_export_package");
    expect(manifest.package_status).toBe("assembled_pending_distribution_gate");
    expect(manifest.project_instance_id).toBe("SANDBOX_CLIENT_EXPORT_001");
    expect(manifest.document_set_id).toBe(OUTPUT_DOCUMENT_SET.document_set_id);
    expect(manifest.output_persistence_id).toBe(OUTPUT_PERSISTENCE.persistence_id);
    expect(manifest.output_review_id).toBe(APPROVED_OUTPUT_REVIEW.output_review_id);
    expect(manifest.release_id).toBe(OUTPUT_DOCUMENT_SET.release_id);
    expect(manifest.estimate_package_id).toBe(OUTPUT_DOCUMENT_SET.package_id);
    expect(manifest.quantity_export_id).toBe(OUTPUT_DOCUMENT_SET.quantity_export_id);
    expect(manifest.cost_scenario_id).toBe(OUTPUT_DOCUMENT_SET.cost_scenario_id);
    expect(manifest.total_cost).toBe(15160);
    expect(manifest.document_count).toBe(2);
    expect(manifest.documents[0]!.storage_path).toContain("ESTIMATE_SUMMARY.md");
    expect(manifest.documents[1]!.storage_path).toContain("CLIENT_FACING_EXPORT_MANIFEST.json");
    expect(manifest.trace_refs).toContain(manifest.client_export_package_id);
    expect(manifest.trace_refs).toContain(OUTPUT_PERSISTENCE.persistence_id);
    expect(manifest.trace_refs).toContain(APPROVED_OUTPUT_REVIEW.output_review_id);
    expect(manifest.next_required_action).toBe("persist_client_export_package");
  });

  it("rejects rejected output document reviews", () => {
    expect(() => buildClientExportPackageManifest({
      output_document_set: OUTPUT_DOCUMENT_SET,
      output_document_persistence: OUTPUT_PERSISTENCE,
      output_document_review: {
        ...APPROVED_OUTPUT_REVIEW,
        decision: "rejected",
        client_export_status: "blocked_from_client_facing_export_package",
        next_required_action: "resolve_output_document_review"
      },
      assembled_by: "release_manager"
    })).toThrow("client_export_requires_approved_output_review");
  });

  it("rejects needs-review output document reviews", () => {
    expect(() => buildClientExportPackageManifest({
      output_document_set: OUTPUT_DOCUMENT_SET,
      output_document_persistence: OUTPUT_PERSISTENCE,
      output_document_review: {
        ...APPROVED_OUTPUT_REVIEW,
        decision: "needs_review",
        client_export_status: "blocked_from_client_facing_export_package",
        next_required_action: "resolve_output_document_review"
      },
      assembled_by: "release_manager"
    })).toThrow("client_export_requires_approved_output_review");
  });

  it("rejects document set mismatches", () => {
    expect(() => buildClientExportPackageManifest({
      output_document_set: OUTPUT_DOCUMENT_SET,
      output_document_persistence: {
        ...OUTPUT_PERSISTENCE,
        document_set_id: "OTHER_DOCSET"
      },
      output_document_review: APPROVED_OUTPUT_REVIEW,
      assembled_by: "release_manager"
    })).toThrow("client_export_document_set_mismatch");
  });

  it("rejects project instance mismatches", () => {
    expect(() => buildClientExportPackageManifest({
      output_document_set: OUTPUT_DOCUMENT_SET,
      output_document_persistence: {
        ...OUTPUT_PERSISTENCE,
        project_instance_id: "OTHER_PROJECT"
      },
      output_document_review: APPROVED_OUTPUT_REVIEW,
      assembled_by: "release_manager"
    })).toThrow("client_export_project_instance_mismatch");
  });

  it("rejects missing persisted document coverage", () => {
    expect(() => buildClientExportPackageManifest({
      output_document_set: OUTPUT_DOCUMENT_SET,
      output_document_persistence: {
        ...OUTPUT_PERSISTENCE,
        document_count: 1,
        documents: [OUTPUT_PERSISTENCE.documents[0]!]
      },
      output_document_review: APPROVED_OUTPUT_REVIEW,
      assembled_by: "release_manager"
    })).toThrow("client_export_missing_persisted_document");
  });

  it("rejects missing document storage paths", () => {
    expect(() => buildClientExportPackageManifest({
      output_document_set: OUTPUT_DOCUMENT_SET,
      output_document_persistence: {
        ...OUTPUT_PERSISTENCE,
        documents: [
          {
            ...OUTPUT_PERSISTENCE.documents[0]!,
            storage_path: ""
          },
          OUTPUT_PERSISTENCE.documents[1]!
        ]
      },
      output_document_review: APPROVED_OUTPUT_REVIEW,
      assembled_by: "release_manager"
    })).toThrow("client_export_document_storage_path_required");
  });
});
