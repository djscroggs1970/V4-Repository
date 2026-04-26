import { describe, expect, it } from "vitest";
import type { ClientExportPackageManifest } from "./client-export-package.js";
import {
  buildClientPackagePersistenceRecord,
  buildClientPackageReleaseGateRecord
} from "./client-package-release-gate.js";

const CLIENT_PACKAGE: ClientExportPackageManifest = {
  client_export_package_id: "CLIENT_EXPORT_DOCSET_001_20260426T060000000Z",
  package_type: "client_facing_export_package",
  package_status: "assembled_pending_distribution_gate",
  project_instance_id: "SANDBOX_CLIENT_GATE_001",
  framework_version: "0.1.0",
  assembled_at: "2026-04-26T06:00:00.000Z",
  assembled_by: "release_manager",
  document_set_id: "DOCSET_CLIENT_GATE_001",
  output_persistence_id: "PERSIST_DOCSET_CLIENT_GATE_001",
  output_review_id: "OUTPUT_REVIEW_DOCSET_CLIENT_GATE_001",
  release_id: "RELEASE_CLIENT_GATE_001",
  estimate_package_id: "ESTIMATE_PACKAGE_CLIENT_GATE_001",
  estimate_package_persistence_id: "PERSIST_ESTIMATE_PACKAGE_CLIENT_GATE_001",
  estimate_review_id: "REVIEW_ESTIMATE_PACKAGE_CLIENT_GATE_001",
  quantity_export_id: "QTY_EXPORT_CLIENT_GATE_001",
  cost_scenario_id: "SCENARIO_CLIENT_GATE_001",
  total_cost: 15160,
  document_count: 2,
  documents: [
    {
      document_id: "DOCSET_CLIENT_GATE_001_ESTIMATE_SUMMARY",
      document_type: "estimate_summary",
      storage_path: "project-instances/SANDBOX_CLIENT_GATE_001/output-documents/DOCSET_CLIENT_GATE_001/DOCSET_CLIENT_GATE_001_ESTIMATE_SUMMARY.md",
      content_type: "text/markdown",
      release_id: "RELEASE_CLIENT_GATE_001",
      package_id: "ESTIMATE_PACKAGE_CLIENT_GATE_001",
      trace_refs: ["RELEASE_CLIENT_GATE_001", "ESTIMATE_PACKAGE_CLIENT_GATE_001", "QTY_EXPORT_CLIENT_GATE_001", "SCENARIO_CLIENT_GATE_001"]
    },
    {
      document_id: "DOCSET_CLIENT_GATE_001_CLIENT_FACING_EXPORT_MANIFEST",
      document_type: "client_facing_export_manifest",
      storage_path: "project-instances/SANDBOX_CLIENT_GATE_001/output-documents/DOCSET_CLIENT_GATE_001/DOCSET_CLIENT_GATE_001_CLIENT_FACING_EXPORT_MANIFEST.json",
      content_type: "application/json",
      release_id: "RELEASE_CLIENT_GATE_001",
      package_id: "ESTIMATE_PACKAGE_CLIENT_GATE_001",
      trace_refs: ["RELEASE_CLIENT_GATE_001", "ESTIMATE_PACKAGE_CLIENT_GATE_001", "QTY_EXPORT_CLIENT_GATE_001", "SCENARIO_CLIENT_GATE_001"]
    }
  ],
  trace_refs: [
    "CLIENT_EXPORT_DOCSET_001_20260426T060000000Z",
    "DOCSET_CLIENT_GATE_001",
    "PERSIST_DOCSET_CLIENT_GATE_001",
    "OUTPUT_REVIEW_DOCSET_CLIENT_GATE_001",
    "RELEASE_CLIENT_GATE_001",
    "ESTIMATE_PACKAGE_CLIENT_GATE_001",
    "PERSIST_ESTIMATE_PACKAGE_CLIENT_GATE_001",
    "REVIEW_ESTIMATE_PACKAGE_CLIENT_GATE_001",
    "QTY_EXPORT_CLIENT_GATE_001",
    "SCENARIO_CLIENT_GATE_001"
  ],
  next_required_action: "persist_client_export_package"
};

function buildPersistence() {
  return buildClientPackagePersistenceRecord({
    client_export_package: CLIENT_PACKAGE,
    storage_root_uri: "drive://V4 Framework",
    persisted_by: "controlled_validation",
    persisted_at: "2026-04-26T06:05:00.000Z"
  });
}

describe("client package persistence", () => {
  it("persists an assembled client export package pending release gate", () => {
    const persistence = buildPersistence();

    expect(persistence.persistence_id).toBe("PERSIST_CLIENT_EXPORT_DOCSET_001_20260426T060000000Z_20260426T060500000Z");
    expect(persistence.client_export_package_id).toBe(CLIENT_PACKAGE.client_export_package_id);
    expect(persistence.package_type).toBe("client_facing_export_package");
    expect(persistence.package_status).toBe("persisted_pending_release_gate");
    expect(persistence.project_instance_id).toBe(CLIENT_PACKAGE.project_instance_id);
    expect(persistence.storage_path).toBe("project-instances/SANDBOX_CLIENT_GATE_001/client-export-packages/CLIENT_EXPORT_DOCSET_001_20260426T060000000Z/CLIENT_EXPORT_DOCSET_001_20260426T060000000Z.json");
    expect(persistence.document_count).toBe(2);
    expect(persistence.documents[0]!.storage_path).toContain("ESTIMATE_SUMMARY.md");
    expect(persistence.trace_refs).toContain(CLIENT_PACKAGE.client_export_package_id);
    expect(persistence.trace_refs).toContain(CLIENT_PACKAGE.release_id);
    expect(persistence.next_required_action).toBe("review_client_export_release_gate");
  });

  it("rejects missing storage root", () => {
    expect(() => buildClientPackagePersistenceRecord({
      client_export_package: CLIENT_PACKAGE,
      storage_root_uri: ""
    })).toThrow("client_package_storage_root_uri_required");
  });

  it("rejects packages not pending distribution gate", () => {
    expect(() => buildClientPackagePersistenceRecord({
      client_export_package: {
        ...CLIENT_PACKAGE,
        package_status: "distributed" as never
      },
      storage_root_uri: "drive://V4 Framework"
    })).toThrow("client_package_must_be_assembled_pending_distribution_gate");
  });

  it("rejects missing package trace", () => {
    expect(() => buildClientPackagePersistenceRecord({
      client_export_package: {
        ...CLIENT_PACKAGE,
        trace_refs: CLIENT_PACKAGE.trace_refs.filter((ref) => ref !== CLIENT_PACKAGE.release_id)
      },
      storage_root_uri: "drive://V4 Framework"
    })).toThrow("client_package_missing_trace");
  });

  it("rejects document storage path gaps", () => {
    expect(() => buildClientPackagePersistenceRecord({
      client_export_package: {
        ...CLIENT_PACKAGE,
        documents: [{ ...CLIENT_PACKAGE.documents[0]!, storage_path: "" }, CLIENT_PACKAGE.documents[1]!]
      },
      storage_root_uri: "drive://V4 Framework"
    })).toThrow("client_package_document_storage_path_required");
  });
});

describe("client package release gate", () => {
  it("approves a persisted client export package for delivery manifest generation", () => {
    const persistence = buildPersistence();
    const gate = buildClientPackageReleaseGateRecord({
      client_export_package: CLIENT_PACKAGE,
      client_export_persistence: persistence,
      decision: "approved",
      reviewer: "release_reviewer",
      reviewed_at: "2026-04-26T06:10:00.000Z"
    });

    expect(gate.release_gate_id).toBe("CLIENT_PACKAGE_GATE_CLIENT_EXPORT_DOCSET_001_20260426T060000000Z_20260426T061000000Z");
    expect(gate.client_export_package_id).toBe(CLIENT_PACKAGE.client_export_package_id);
    expect(gate.client_export_persistence_id).toBe(persistence.persistence_id);
    expect(gate.decision).toBe("approved");
    expect(gate.external_share_status).toBe("eligible_for_delivery_manifest");
    expect(gate.next_required_action).toBe("generate_delivery_manifest");
    expect(gate.trace_refs).toContain(CLIENT_PACKAGE.client_export_package_id);
    expect(gate.trace_refs).toContain(persistence.persistence_id);
  });

  it("requires notes for rejected release gates", () => {
    expect(() => buildClientPackageReleaseGateRecord({
      client_export_package: CLIENT_PACKAGE,
      client_export_persistence: buildPersistence(),
      decision: "rejected",
      reviewer: "release_reviewer"
    })).toThrow("client_package_gate_note_required");
  });

  it("requires notes for needs-review release gates", () => {
    expect(() => buildClientPackageReleaseGateRecord({
      client_export_package: CLIENT_PACKAGE,
      client_export_persistence: buildPersistence(),
      decision: "needs_review",
      reviewer: "release_reviewer"
    })).toThrow("client_package_gate_note_required");
  });

  it("blocks rejected release gates from delivery manifest", () => {
    const gate = buildClientPackageReleaseGateRecord({
      client_export_package: CLIENT_PACKAGE,
      client_export_persistence: buildPersistence(),
      decision: "rejected",
      reviewer: "release_reviewer",
      note: "Client export package requires correction."
    });

    expect(gate.external_share_status).toBe("blocked_from_delivery_manifest");
    expect(gate.next_required_action).toBe("resolve_client_export_release_gate");
  });

  it("rejects persistence package mismatches", () => {
    expect(() => buildClientPackageReleaseGateRecord({
      client_export_package: CLIENT_PACKAGE,
      client_export_persistence: {
        ...buildPersistence(),
        client_export_package_id: "OTHER_PACKAGE"
      },
      decision: "approved",
      reviewer: "release_reviewer"
    })).toThrow("client_package_persistence_package_mismatch");
  });
});
