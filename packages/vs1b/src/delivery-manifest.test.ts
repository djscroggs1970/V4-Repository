import { describe, expect, it } from "vitest";
import type { ClientPackagePersistenceRecord, ClientPackageReleaseGateRecord } from "./client-package-release-gate.js";
import { buildDeliveryManifest } from "./delivery-manifest.js";

const CLIENT_PACKAGE_PERSISTENCE: ClientPackagePersistenceRecord = {
  persistence_id: "PERSIST_CLIENT_EXPORT_001",
  client_export_package_id: "CLIENT_EXPORT_001",
  package_type: "client_facing_export_package",
  package_status: "persisted_pending_release_gate",
  project_instance_id: "SANDBOX_DELIVERY_001",
  framework_version: "0.1.0",
  storage_root_uri: "drive://V4 Framework",
  storage_path: "project-instances/SANDBOX_DELIVERY_001/client-export-packages/CLIENT_EXPORT_001/CLIENT_EXPORT_001.json",
  content_type: "application/json",
  persisted_at: "2026-04-26T07:00:00.000Z",
  persisted_by: "controlled_validation",
  document_set_id: "DOCSET_DELIVERY_001",
  output_persistence_id: "PERSIST_DOCSET_DELIVERY_001",
  output_review_id: "OUTPUT_REVIEW_DOCSET_DELIVERY_001",
  release_id: "RELEASE_DELIVERY_001",
  estimate_package_id: "ESTIMATE_PACKAGE_DELIVERY_001",
  estimate_package_persistence_id: "PERSIST_ESTIMATE_PACKAGE_DELIVERY_001",
  estimate_review_id: "REVIEW_ESTIMATE_PACKAGE_DELIVERY_001",
  quantity_export_id: "QTY_EXPORT_DELIVERY_001",
  cost_scenario_id: "SCENARIO_DELIVERY_001",
  total_cost: 15160,
  document_count: 2,
  documents: [
    {
      document_id: "DOCSET_DELIVERY_001_ESTIMATE_SUMMARY",
      document_type: "estimate_summary",
      storage_path: "project-instances/SANDBOX_DELIVERY_001/output-documents/DOCSET_DELIVERY_001/DOCSET_DELIVERY_001_ESTIMATE_SUMMARY.md",
      content_type: "text/markdown",
      release_id: "RELEASE_DELIVERY_001",
      package_id: "ESTIMATE_PACKAGE_DELIVERY_001",
      trace_refs: ["RELEASE_DELIVERY_001", "ESTIMATE_PACKAGE_DELIVERY_001", "QTY_EXPORT_DELIVERY_001", "SCENARIO_DELIVERY_001"]
    },
    {
      document_id: "DOCSET_DELIVERY_001_CLIENT_FACING_EXPORT_MANIFEST",
      document_type: "client_facing_export_manifest",
      storage_path: "project-instances/SANDBOX_DELIVERY_001/output-documents/DOCSET_DELIVERY_001/DOCSET_DELIVERY_001_CLIENT_FACING_EXPORT_MANIFEST.json",
      content_type: "application/json",
      release_id: "RELEASE_DELIVERY_001",
      package_id: "ESTIMATE_PACKAGE_DELIVERY_001",
      trace_refs: ["RELEASE_DELIVERY_001", "ESTIMATE_PACKAGE_DELIVERY_001", "QTY_EXPORT_DELIVERY_001", "SCENARIO_DELIVERY_001"]
    }
  ],
  trace_refs: [
    "CLIENT_EXPORT_001",
    "PERSIST_CLIENT_EXPORT_001",
    "DOCSET_DELIVERY_001",
    "PERSIST_DOCSET_DELIVERY_001",
    "OUTPUT_REVIEW_DOCSET_DELIVERY_001",
    "RELEASE_DELIVERY_001",
    "ESTIMATE_PACKAGE_DELIVERY_001",
    "PERSIST_ESTIMATE_PACKAGE_DELIVERY_001",
    "REVIEW_ESTIMATE_PACKAGE_DELIVERY_001",
    "QTY_EXPORT_DELIVERY_001",
    "SCENARIO_DELIVERY_001"
  ],
  next_required_action: "review_client_export_release_gate"
};

const APPROVED_GATE: ClientPackageReleaseGateRecord = {
  release_gate_id: "CLIENT_PACKAGE_GATE_CLIENT_EXPORT_001",
  client_export_package_id: CLIENT_PACKAGE_PERSISTENCE.client_export_package_id,
  client_export_persistence_id: CLIENT_PACKAGE_PERSISTENCE.persistence_id,
  package_type: "client_facing_export_package",
  project_instance_id: CLIENT_PACKAGE_PERSISTENCE.project_instance_id,
  decision: "approved",
  reviewer: "release_reviewer",
  reviewed_at: "2026-04-26T07:05:00.000Z",
  framework_version: "0.1.0",
  external_share_status: "eligible_for_delivery_manifest",
  next_required_action: "generate_delivery_manifest",
  trace_refs: [
    "CLIENT_PACKAGE_GATE_CLIENT_EXPORT_001",
    CLIENT_PACKAGE_PERSISTENCE.client_export_package_id,
    CLIENT_PACKAGE_PERSISTENCE.persistence_id,
    CLIENT_PACKAGE_PERSISTENCE.release_id,
    CLIENT_PACKAGE_PERSISTENCE.estimate_package_id,
    CLIENT_PACKAGE_PERSISTENCE.quantity_export_id,
    CLIENT_PACKAGE_PERSISTENCE.cost_scenario_id
  ]
};

describe("delivery manifest", () => {
  it("builds a delivery manifest from approved client package release gate", () => {
    const manifest = buildDeliveryManifest({
      client_export_persistence: CLIENT_PACKAGE_PERSISTENCE,
      client_package_release_gate: APPROVED_GATE,
      delivery_method: "controlled_download",
      prepared_by: "delivery_coordinator",
      prepared_at: "2026-04-26T07:10:00.000Z",
      intended_recipient: "owner@example.test"
    });

    expect(manifest.delivery_manifest_id).toBe("DELIVERY_MANIFEST_CLIENT_EXPORT_001_20260426T071000000Z");
    expect(manifest.manifest_type).toBe("external_share_delivery_manifest");
    expect(manifest.delivery_status).toBe("prepared_pending_final_transmission_gate");
    expect(manifest.project_instance_id).toBe("SANDBOX_DELIVERY_001");
    expect(manifest.delivery_method).toBe("controlled_download");
    expect(manifest.intended_recipient).toBe("owner@example.test");
    expect(manifest.client_export_package_id).toBe(CLIENT_PACKAGE_PERSISTENCE.client_export_package_id);
    expect(manifest.client_export_persistence_id).toBe(CLIENT_PACKAGE_PERSISTENCE.persistence_id);
    expect(manifest.release_gate_id).toBe(APPROVED_GATE.release_gate_id);
    expect(manifest.release_id).toBe(CLIENT_PACKAGE_PERSISTENCE.release_id);
    expect(manifest.estimate_package_id).toBe(CLIENT_PACKAGE_PERSISTENCE.estimate_package_id);
    expect(manifest.quantity_export_id).toBe(CLIENT_PACKAGE_PERSISTENCE.quantity_export_id);
    expect(manifest.cost_scenario_id).toBe(CLIENT_PACKAGE_PERSISTENCE.cost_scenario_id);
    expect(manifest.total_cost).toBe(15160);
    expect(manifest.document_count).toBe(2);
    expect(manifest.documents[0]!.storage_path).toContain("ESTIMATE_SUMMARY.md");
    expect(manifest.trace_refs).toContain(manifest.delivery_manifest_id);
    expect(manifest.trace_refs).toContain(CLIENT_PACKAGE_PERSISTENCE.client_export_package_id);
    expect(manifest.trace_refs).toContain(APPROVED_GATE.release_gate_id);
    expect(manifest.next_required_action).toBe("persist_delivery_manifest");
  });

  it("rejects rejected release gates", () => {
    expect(() => buildDeliveryManifest({
      client_export_persistence: CLIENT_PACKAGE_PERSISTENCE,
      client_package_release_gate: {
        ...APPROVED_GATE,
        decision: "rejected",
        external_share_status: "blocked_from_delivery_manifest",
        next_required_action: "resolve_client_export_release_gate"
      },
      delivery_method: "controlled_download",
      prepared_by: "delivery_coordinator"
    })).toThrow("delivery_manifest_requires_approved_release_gate");
  });

  it("rejects needs-review release gates", () => {
    expect(() => buildDeliveryManifest({
      client_export_persistence: CLIENT_PACKAGE_PERSISTENCE,
      client_package_release_gate: {
        ...APPROVED_GATE,
        decision: "needs_review",
        external_share_status: "blocked_from_delivery_manifest",
        next_required_action: "resolve_client_export_release_gate"
      },
      delivery_method: "controlled_download",
      prepared_by: "delivery_coordinator"
    })).toThrow("delivery_manifest_requires_approved_release_gate");
  });

  it("rejects package mismatches", () => {
    expect(() => buildDeliveryManifest({
      client_export_persistence: CLIENT_PACKAGE_PERSISTENCE,
      client_package_release_gate: {
        ...APPROVED_GATE,
        client_export_package_id: "OTHER_PACKAGE"
      },
      delivery_method: "controlled_download",
      prepared_by: "delivery_coordinator"
    })).toThrow("delivery_manifest_package_mismatch");
  });

  it("rejects persistence mismatches", () => {
    expect(() => buildDeliveryManifest({
      client_export_persistence: CLIENT_PACKAGE_PERSISTENCE,
      client_package_release_gate: {
        ...APPROVED_GATE,
        client_export_persistence_id: "OTHER_PERSISTENCE"
      },
      delivery_method: "controlled_download",
      prepared_by: "delivery_coordinator"
    })).toThrow("delivery_manifest_persistence_mismatch");
  });

  it("rejects document count mismatch", () => {
    expect(() => buildDeliveryManifest({
      client_export_persistence: {
        ...CLIENT_PACKAGE_PERSISTENCE,
        document_count: 3
      },
      client_package_release_gate: APPROVED_GATE,
      delivery_method: "controlled_download",
      prepared_by: "delivery_coordinator"
    })).toThrow("delivery_manifest_document_count_mismatch");
  });

  it("rejects missing document storage path", () => {
    expect(() => buildDeliveryManifest({
      client_export_persistence: {
        ...CLIENT_PACKAGE_PERSISTENCE,
        documents: [
          { ...CLIENT_PACKAGE_PERSISTENCE.documents[0]!, storage_path: "" },
          CLIENT_PACKAGE_PERSISTENCE.documents[1]!
        ]
      },
      client_package_release_gate: APPROVED_GATE,
      delivery_method: "controlled_download",
      prepared_by: "delivery_coordinator"
    })).toThrow("delivery_manifest_document_storage_path_required");
  });
});
