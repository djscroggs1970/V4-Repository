import { describe, expect, it } from "vitest";
import type { OutputDocumentGenerationResult } from "./output-document-generation.js";
import {
  buildOutputDocumentPersistenceRecord,
  buildOutputDocumentReviewRecord
} from "./output-document-persistence-review.js";

const OUTPUT_DOCUMENT_SET: OutputDocumentGenerationResult = {
  document_set_id: "DOCSET_RELEASE_001_20260426T040000000Z",
  output_type: "bid_grade_output_document_set",
  document_status: "generated_pending_persistence_review",
  project_instance_id: "SANDBOX_OUTPUT_REVIEW_001",
  framework_version: "0.1.0",
  release_id: "RELEASE_001",
  package_id: "ESTIMATE_PACKAGE_001",
  package_persistence_id: "PERSIST_ESTIMATE_PACKAGE_001",
  review_id: "REVIEW_ESTIMATE_PACKAGE_001",
  quantity_export_id: "QTY_EXPORT_001",
  cost_scenario_id: "SCENARIO_001",
  total_cost: 15160,
  generated_at: "2026-04-26T04:00:00.000Z",
  generated_by: "document_generator",
  document_count: 2,
  documents: [
    {
      document_id: "DOCSET_RELEASE_001_20260426T040000000Z_ESTIMATE_SUMMARY",
      document_type: "estimate_summary",
      document_status: "generated_pending_persistence_review",
      project_instance_id: "SANDBOX_OUTPUT_REVIEW_001",
      release_id: "RELEASE_001",
      package_id: "ESTIMATE_PACKAGE_001",
      title: "Estimate Summary",
      content_type: "text/markdown",
      generated_at: "2026-04-26T04:00:00.000Z",
      generated_by: "document_generator",
      sections: [
        {
          section_id: "summary",
          title: "Estimate Summary",
          content: "Approved release total: $15160.00",
          trace_refs: ["RELEASE_001", "ESTIMATE_PACKAGE_001", "QTY_EXPORT_001", "SCENARIO_001"]
        }
      ],
      trace_refs: [
        "RELEASE_001",
        "ESTIMATE_PACKAGE_001",
        "PERSIST_ESTIMATE_PACKAGE_001",
        "REVIEW_ESTIMATE_PACKAGE_001",
        "QTY_EXPORT_001",
        "SCENARIO_001",
        "RUN-001_1"
      ]
    },
    {
      document_id: "DOCSET_RELEASE_001_20260426T040000000Z_CLIENT_FACING_EXPORT_MANIFEST",
      document_type: "client_facing_export_manifest",
      document_status: "generated_pending_persistence_review",
      project_instance_id: "SANDBOX_OUTPUT_REVIEW_001",
      release_id: "RELEASE_001",
      package_id: "ESTIMATE_PACKAGE_001",
      title: "Client-Facing Export Manifest",
      content_type: "application/json",
      generated_at: "2026-04-26T04:00:00.000Z",
      generated_by: "document_generator",
      sections: [
        {
          section_id: "export_manifest",
          title: "Client-Facing Export Manifest",
          content: "{\"release_id\":\"RELEASE_001\"}",
          trace_refs: ["RELEASE_001", "ESTIMATE_PACKAGE_001", "QTY_EXPORT_001", "SCENARIO_001"]
        }
      ],
      trace_refs: [
        "RELEASE_001",
        "ESTIMATE_PACKAGE_001",
        "PERSIST_ESTIMATE_PACKAGE_001",
        "REVIEW_ESTIMATE_PACKAGE_001",
        "QTY_EXPORT_001",
        "SCENARIO_001",
        "RUN-001_1"
      ]
    }
  ],
  trace_refs: [
    "DOCSET_RELEASE_001_20260426T040000000Z",
    "RELEASE_001",
    "ESTIMATE_PACKAGE_001",
    "PERSIST_ESTIMATE_PACKAGE_001",
    "REVIEW_ESTIMATE_PACKAGE_001",
    "QTY_EXPORT_001",
    "SCENARIO_001",
    "RUN-001_1"
  ],
  next_required_action: "persist_output_documents"
};

function buildPersistence() {
  return buildOutputDocumentPersistenceRecord({
    output_document_set: OUTPUT_DOCUMENT_SET,
    storage_root_uri: "drive://V4 Framework",
    persisted_by: "controlled_validation",
    persisted_at: "2026-04-26T04:05:00.000Z"
  });
}

describe("output document persistence", () => {
  it("builds a persistence record for generated output documents", () => {
    const persistence = buildPersistence();

    expect(persistence.persistence_id).toBe("PERSIST_DOCSET_RELEASE_001_20260426T040000000Z_20260426T040500000Z");
    expect(persistence.document_set_id).toBe(OUTPUT_DOCUMENT_SET.document_set_id);
    expect(persistence.output_type).toBe("bid_grade_output_document_set");
    expect(persistence.document_status).toBe("persisted_pending_review");
    expect(persistence.project_instance_id).toBe(OUTPUT_DOCUMENT_SET.project_instance_id);
    expect(persistence.storage_root_uri).toBe("drive://V4 Framework");
    expect(persistence.storage_path).toBe("project-instances/SANDBOX_OUTPUT_REVIEW_001/output-documents/DOCSET_RELEASE_001_20260426T040000000Z/DOCSET_RELEASE_001_20260426T040000000Z.json");
    expect(persistence.document_count).toBe(2);
    expect(persistence.documents[0]!.storage_path).toBe("project-instances/SANDBOX_OUTPUT_REVIEW_001/output-documents/DOCSET_RELEASE_001_20260426T040000000Z/DOCSET_RELEASE_001_20260426T040000000Z_ESTIMATE_SUMMARY.md");
    expect(persistence.documents[1]!.storage_path).toBe("project-instances/SANDBOX_OUTPUT_REVIEW_001/output-documents/DOCSET_RELEASE_001_20260426T040000000Z/DOCSET_RELEASE_001_20260426T040000000Z_CLIENT_FACING_EXPORT_MANIFEST.json");
    expect(persistence.trace_refs).toContain(OUTPUT_DOCUMENT_SET.document_set_id);
    expect(persistence.trace_refs).toContain(OUTPUT_DOCUMENT_SET.release_id);
    expect(persistence.next_required_action).toBe("review_output_documents");
  });

  it("rejects persistence without storage root", () => {
    expect(() => buildOutputDocumentPersistenceRecord({
      output_document_set: OUTPUT_DOCUMENT_SET,
      storage_root_uri: ""
    })).toThrow("output_document_storage_root_uri_required");
  });

  it("rejects output document count mismatch", () => {
    expect(() => buildOutputDocumentPersistenceRecord({
      output_document_set: {
        ...OUTPUT_DOCUMENT_SET,
        document_count: 3
      },
      storage_root_uri: "drive://V4 Framework"
    })).toThrow("output_document_count_mismatch");
  });

  it("rejects document project instance mismatch", () => {
    expect(() => buildOutputDocumentPersistenceRecord({
      output_document_set: {
        ...OUTPUT_DOCUMENT_SET,
        documents: [
          {
            ...OUTPUT_DOCUMENT_SET.documents[0]!,
            project_instance_id: "OTHER_PROJECT"
          },
          OUTPUT_DOCUMENT_SET.documents[1]!
        ]
      },
      storage_root_uri: "drive://V4 Framework"
    })).toThrow("output_document_project_instance_mismatch");
  });

  it("rejects missing output document set trace", () => {
    expect(() => buildOutputDocumentPersistenceRecord({
      output_document_set: {
        ...OUTPUT_DOCUMENT_SET,
        trace_refs: OUTPUT_DOCUMENT_SET.trace_refs.filter((ref) => ref !== OUTPUT_DOCUMENT_SET.release_id)
      },
      storage_root_uri: "drive://V4 Framework"
    })).toThrow("output_document_set_missing_trace");
  });
});

describe("output document review", () => {
  it("builds an approved review record and marks client export eligible", () => {
    const persistence = buildPersistence();
    const review = buildOutputDocumentReviewRecord({
      output_document_set: OUTPUT_DOCUMENT_SET,
      output_document_persistence: persistence,
      decision: "approved",
      reviewer: "human_reviewer",
      reviewed_at: "2026-04-26T04:10:00.000Z"
    });

    expect(review.output_review_id).toBe("OUTPUT_REVIEW_DOCSET_RELEASE_001_20260426T040000000Z_20260426T041000000Z");
    expect(review.document_set_id).toBe(OUTPUT_DOCUMENT_SET.document_set_id);
    expect(review.persistence_id).toBe(persistence.persistence_id);
    expect(review.project_instance_id).toBe(OUTPUT_DOCUMENT_SET.project_instance_id);
    expect(review.decision).toBe("approved");
    expect(review.client_export_status).toBe("eligible_for_client_facing_export_package");
    expect(review.next_required_action).toBe("assemble_client_facing_export_package");
    expect(review.trace_refs).toContain(OUTPUT_DOCUMENT_SET.document_set_id);
    expect(review.trace_refs).toContain(persistence.persistence_id);
    expect(review.trace_refs).toContain(OUTPUT_DOCUMENT_SET.release_id);
  });

  it("requires notes for rejected reviews", () => {
    expect(() => buildOutputDocumentReviewRecord({
      output_document_set: OUTPUT_DOCUMENT_SET,
      output_document_persistence: buildPersistence(),
      decision: "rejected",
      reviewer: "human_reviewer"
    })).toThrow("output_document_review_note_required");
  });

  it("requires notes for needs-review decisions", () => {
    expect(() => buildOutputDocumentReviewRecord({
      output_document_set: OUTPUT_DOCUMENT_SET,
      output_document_persistence: buildPersistence(),
      decision: "needs_review",
      reviewer: "human_reviewer"
    })).toThrow("output_document_review_note_required");
  });

  it("blocks rejected reviews from client export", () => {
    const review = buildOutputDocumentReviewRecord({
      output_document_set: OUTPUT_DOCUMENT_SET,
      output_document_persistence: buildPersistence(),
      decision: "rejected",
      reviewer: "human_reviewer",
      note: "Missing required client-facing wording."
    });

    expect(review.client_export_status).toBe("blocked_from_client_facing_export_package");
    expect(review.next_required_action).toBe("resolve_output_document_review");
  });

  it("rejects review with persistence mismatch", () => {
    expect(() => buildOutputDocumentReviewRecord({
      output_document_set: OUTPUT_DOCUMENT_SET,
      output_document_persistence: {
        ...buildPersistence(),
        document_set_id: "OTHER_DOCSET"
      },
      decision: "approved",
      reviewer: "human_reviewer"
    })).toThrow("output_document_persistence_mismatch");
  });
});
