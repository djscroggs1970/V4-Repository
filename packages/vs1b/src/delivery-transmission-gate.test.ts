import { describe, expect, it } from "vitest";
import type { DeliveryManifest } from "./delivery-manifest.js";
import {
  buildDeliveryManifestPersistenceRecord,
  buildExternalTransmissionGateRecord
} from "./delivery-transmission-gate.js";

const DELIVERY_MANIFEST: DeliveryManifest = {
  delivery_manifest_id: "DELIVERY_MANIFEST_001",
  manifest_type: "external_share_delivery_manifest",
  delivery_status: "prepared_pending_final_transmission_gate",
  project_instance_id: "SANDBOX_TRANSMISSION_001",
  framework_version: "0.1.0",
  prepared_at: "2026-04-26T08:00:00.000Z",
  prepared_by: "delivery_coordinator",
  intended_recipient: "owner@example.test",
  delivery_method: "controlled_download",
  client_export_package_id: "CLIENT_EXPORT_001",
  client_export_persistence_id: "PERSIST_CLIENT_EXPORT_001",
  release_gate_id: "CLIENT_PACKAGE_GATE_001",
  release_id: "RELEASE_001",
  estimate_package_id: "ESTIMATE_PACKAGE_001",
  quantity_export_id: "QTY_EXPORT_001",
  cost_scenario_id: "SCENARIO_001",
  total_cost: 15160,
  document_count: 2,
  documents: [
    {
      document_id: "DOC_ESTIMATE_SUMMARY",
      document_type: "estimate_summary",
      storage_path: "project-instances/SANDBOX_TRANSMISSION_001/output-documents/DOC_ESTIMATE_SUMMARY.md",
      content_type: "text/markdown",
      trace_refs: ["RELEASE_001", "ESTIMATE_PACKAGE_001", "QTY_EXPORT_001", "SCENARIO_001"]
    },
    {
      document_id: "DOC_CLIENT_MANIFEST",
      document_type: "client_facing_export_manifest",
      storage_path: "project-instances/SANDBOX_TRANSMISSION_001/output-documents/DOC_CLIENT_MANIFEST.json",
      content_type: "application/json",
      trace_refs: ["RELEASE_001", "ESTIMATE_PACKAGE_001", "QTY_EXPORT_001", "SCENARIO_001"]
    }
  ],
  trace_refs: [
    "DELIVERY_MANIFEST_001",
    "CLIENT_EXPORT_001",
    "PERSIST_CLIENT_EXPORT_001",
    "CLIENT_PACKAGE_GATE_001",
    "RELEASE_001",
    "ESTIMATE_PACKAGE_001",
    "QTY_EXPORT_001",
    "SCENARIO_001"
  ],
  next_required_action: "persist_delivery_manifest"
};

function buildPersistence() {
  return buildDeliveryManifestPersistenceRecord({
    delivery_manifest: DELIVERY_MANIFEST,
    storage_root_uri: "drive://V4 Framework",
    persisted_by: "controlled_validation",
    persisted_at: "2026-04-26T08:05:00.000Z"
  });
}

describe("delivery manifest persistence", () => {
  it("persists a prepared delivery manifest pending external transmission gate", () => {
    const persistence = buildPersistence();

    expect(persistence.persistence_id).toBe("PERSIST_DELIVERY_MANIFEST_001_20260426T080500000Z");
    expect(persistence.delivery_manifest_id).toBe(DELIVERY_MANIFEST.delivery_manifest_id);
    expect(persistence.manifest_type).toBe("external_share_delivery_manifest");
    expect(persistence.delivery_status).toBe("persisted_pending_external_transmission_gate");
    expect(persistence.project_instance_id).toBe(DELIVERY_MANIFEST.project_instance_id);
    expect(persistence.storage_path).toBe("project-instances/SANDBOX_TRANSMISSION_001/delivery-manifests/DELIVERY_MANIFEST_001/DELIVERY_MANIFEST_001.json");
    expect(persistence.document_count).toBe(2);
    expect(persistence.trace_refs).toContain(DELIVERY_MANIFEST.delivery_manifest_id);
    expect(persistence.trace_refs).toContain(DELIVERY_MANIFEST.release_id);
    expect(persistence.next_required_action).toBe("review_external_transmission_gate");
  });

  it("rejects missing storage root", () => {
    expect(() => buildDeliveryManifestPersistenceRecord({
      delivery_manifest: DELIVERY_MANIFEST,
      storage_root_uri: ""
    })).toThrow("delivery_persistence_storage_root_uri_required");
  });

  it("rejects manifests not pending final transmission gate", () => {
    expect(() => buildDeliveryManifestPersistenceRecord({
      delivery_manifest: {
        ...DELIVERY_MANIFEST,
        delivery_status: "sent" as never
      },
      storage_root_uri: "drive://V4 Framework"
    })).toThrow("delivery_manifest_must_be_prepared_pending_final_transmission_gate");
  });

  it("rejects missing manifest trace", () => {
    expect(() => buildDeliveryManifestPersistenceRecord({
      delivery_manifest: {
        ...DELIVERY_MANIFEST,
        trace_refs: DELIVERY_MANIFEST.trace_refs.filter((ref) => ref !== DELIVERY_MANIFEST.release_id)
      },
      storage_root_uri: "drive://V4 Framework"
    })).toThrow("delivery_persistence_missing_manifest_trace");
  });

  it("rejects document storage path gaps", () => {
    expect(() => buildDeliveryManifestPersistenceRecord({
      delivery_manifest: {
        ...DELIVERY_MANIFEST,
        documents: [{ ...DELIVERY_MANIFEST.documents[0]!, storage_path: "" }, DELIVERY_MANIFEST.documents[1]!]
      },
      storage_root_uri: "drive://V4 Framework"
    })).toThrow("delivery_persistence_document_storage_path_required");
  });
});

describe("external transmission gate", () => {
  it("approves a persisted delivery manifest for adapter boundary preparation", () => {
    const persistence = buildPersistence();
    const gate = buildExternalTransmissionGateRecord({
      delivery_manifest: DELIVERY_MANIFEST,
      delivery_manifest_persistence: persistence,
      decision: "approved",
      reviewer: "final_release_reviewer",
      reviewed_at: "2026-04-26T08:10:00.000Z"
    });

    expect(gate.external_transmission_gate_id).toBe("EXTERNAL_TRANSMISSION_GATE_DELIVERY_MANIFEST_001_20260426T081000000Z");
    expect(gate.delivery_manifest_id).toBe(DELIVERY_MANIFEST.delivery_manifest_id);
    expect(gate.delivery_manifest_persistence_id).toBe(persistence.persistence_id);
    expect(gate.decision).toBe("approved");
    expect(gate.transmission_status).toBe("authorized_for_adapter_boundary");
    expect(gate.next_required_action).toBe("prepare_transmission_adapter_boundary");
    expect(gate.trace_refs).toContain(DELIVERY_MANIFEST.delivery_manifest_id);
    expect(gate.trace_refs).toContain(persistence.persistence_id);
  });

  it("requires notes for rejected external transmission gates", () => {
    expect(() => buildExternalTransmissionGateRecord({
      delivery_manifest: DELIVERY_MANIFEST,
      delivery_manifest_persistence: buildPersistence(),
      decision: "rejected",
      reviewer: "final_release_reviewer"
    })).toThrow("external_transmission_gate_note_required");
  });

  it("requires notes for needs-review external transmission gates", () => {
    expect(() => buildExternalTransmissionGateRecord({
      delivery_manifest: DELIVERY_MANIFEST,
      delivery_manifest_persistence: buildPersistence(),
      decision: "needs_review",
      reviewer: "final_release_reviewer"
    })).toThrow("external_transmission_gate_note_required");
  });

  it("blocks rejected gates from transmission", () => {
    const gate = buildExternalTransmissionGateRecord({
      delivery_manifest: DELIVERY_MANIFEST,
      delivery_manifest_persistence: buildPersistence(),
      decision: "rejected",
      reviewer: "final_release_reviewer",
      note: "Recipient package needs correction."
    });

    expect(gate.transmission_status).toBe("blocked_from_transmission");
    expect(gate.next_required_action).toBe("resolve_external_transmission_gate");
  });

  it("rejects persistence manifest mismatches", () => {
    expect(() => buildExternalTransmissionGateRecord({
      delivery_manifest: DELIVERY_MANIFEST,
      delivery_manifest_persistence: {
        ...buildPersistence(),
        delivery_manifest_id: "OTHER_MANIFEST"
      },
      decision: "approved",
      reviewer: "final_release_reviewer"
    })).toThrow("delivery_persistence_manifest_mismatch");
  });
});
