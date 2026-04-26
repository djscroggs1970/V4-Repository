import { describe, expect, it } from "vitest";
import type { DeliveryManifestPersistenceRecord, ExternalTransmissionGateRecord } from "./delivery-transmission-gate.js";
import { buildControlledAdapterBoundaryRecord } from "./controlled-adapter-boundary.js";

const DELIVERY_PERSISTENCE: DeliveryManifestPersistenceRecord = {
  persistence_id: "PERSIST_DELIVERY_MANIFEST_001",
  delivery_manifest_id: "DELIVERY_MANIFEST_001",
  manifest_type: "external_share_delivery_manifest",
  delivery_status: "persisted_pending_external_transmission_gate",
  project_instance_id: "SANDBOX_ADAPTER_001",
  framework_version: "0.1.0",
  storage_root_uri: "drive://V4 Framework",
  storage_path: "project-instances/SANDBOX_ADAPTER_001/delivery-manifests/DELIVERY_MANIFEST_001/DELIVERY_MANIFEST_001.json",
  content_type: "application/json",
  persisted_at: "2026-04-26T09:00:00.000Z",
  persisted_by: "controlled_validation",
  client_export_package_id: "CLIENT_EXPORT_001",
  client_export_persistence_id: "PERSIST_CLIENT_EXPORT_001",
  release_gate_id: "CLIENT_PACKAGE_GATE_001",
  release_id: "RELEASE_001",
  estimate_package_id: "ESTIMATE_PACKAGE_001",
  quantity_export_id: "QTY_EXPORT_001",
  cost_scenario_id: "SCENARIO_001",
  total_cost: 15160,
  document_count: 2,
  documents: [],
  trace_refs: [
    "DELIVERY_MANIFEST_001",
    "PERSIST_DELIVERY_MANIFEST_001",
    "CLIENT_EXPORT_001",
    "RELEASE_001",
    "ESTIMATE_PACKAGE_001",
    "QTY_EXPORT_001",
    "SCENARIO_001"
  ],
  next_required_action: "review_external_transmission_gate"
};

const APPROVED_GATE: ExternalTransmissionGateRecord = {
  external_transmission_gate_id: "EXTERNAL_TRANSMISSION_GATE_DELIVERY_MANIFEST_001",
  delivery_manifest_id: DELIVERY_PERSISTENCE.delivery_manifest_id,
  delivery_manifest_persistence_id: DELIVERY_PERSISTENCE.persistence_id,
  manifest_type: "external_share_delivery_manifest",
  project_instance_id: DELIVERY_PERSISTENCE.project_instance_id,
  decision: "approved",
  reviewer: "final_release_reviewer",
  reviewed_at: "2026-04-26T09:05:00.000Z",
  framework_version: "0.1.0",
  transmission_status: "authorized_for_adapter_boundary",
  next_required_action: "prepare_transmission_adapter_boundary",
  trace_refs: [
    "EXTERNAL_TRANSMISSION_GATE_DELIVERY_MANIFEST_001",
    DELIVERY_PERSISTENCE.delivery_manifest_id,
    DELIVERY_PERSISTENCE.persistence_id,
    DELIVERY_PERSISTENCE.release_id,
    DELIVERY_PERSISTENCE.estimate_package_id
  ]
};

describe("controlled adapter boundary", () => {
  it("defines a disabled adapter boundary from an approved gate", () => {
    const boundary = buildControlledAdapterBoundaryRecord({
      delivery_manifest_persistence: DELIVERY_PERSISTENCE,
      external_transmission_gate: APPROVED_GATE,
      adapter_kind: "manual_offline_package",
      prepared_by: "integration_designer",
      prepared_at: "2026-04-26T09:10:00.000Z"
    });

    expect(boundary.boundary_id).toBe("CONTROLLED_ADAPTER_BOUNDARY_DELIVERY_MANIFEST_001_20260426T091000000Z");
    expect(boundary.boundary_type).toBe("controlled_adapter_boundary");
    expect(boundary.boundary_status).toBe("defined_disabled_pending_governance_enablement");
    expect(boundary.project_instance_id).toBe("SANDBOX_ADAPTER_001");
    expect(boundary.adapter_kind).toBe("manual_offline_package");
    expect(boundary.execution_enabled).toBe(false);
    expect(boundary.execution_attempted).toBe(false);
    expect(boundary.delivery_manifest_id).toBe(DELIVERY_PERSISTENCE.delivery_manifest_id);
    expect(boundary.delivery_manifest_persistence_id).toBe(DELIVERY_PERSISTENCE.persistence_id);
    expect(boundary.external_transmission_gate_id).toBe(APPROVED_GATE.external_transmission_gate_id);
    expect(boundary.trace_refs).toContain(boundary.boundary_id);
    expect(boundary.trace_refs).toContain(APPROVED_GATE.external_transmission_gate_id);
    expect(boundary.next_required_action).toBe("governance_enable_adapter_or_stop");
  });

  it("rejects rejected external transmission gates", () => {
    expect(() => buildControlledAdapterBoundaryRecord({
      delivery_manifest_persistence: DELIVERY_PERSISTENCE,
      external_transmission_gate: {
        ...APPROVED_GATE,
        decision: "rejected",
        transmission_status: "blocked_from_transmission",
        next_required_action: "resolve_external_transmission_gate"
      },
      adapter_kind: "manual_offline_package",
      prepared_by: "integration_designer"
    })).toThrow("adapter_boundary_requires_approved_gate");
  });

  it("rejects needs-review external transmission gates", () => {
    expect(() => buildControlledAdapterBoundaryRecord({
      delivery_manifest_persistence: DELIVERY_PERSISTENCE,
      external_transmission_gate: {
        ...APPROVED_GATE,
        decision: "needs_review",
        transmission_status: "blocked_from_transmission",
        next_required_action: "resolve_external_transmission_gate"
      },
      adapter_kind: "manual_offline_package",
      prepared_by: "integration_designer"
    })).toThrow("adapter_boundary_requires_approved_gate");
  });

  it("rejects manifest mismatches", () => {
    expect(() => buildControlledAdapterBoundaryRecord({
      delivery_manifest_persistence: DELIVERY_PERSISTENCE,
      external_transmission_gate: {
        ...APPROVED_GATE,
        delivery_manifest_id: "OTHER_MANIFEST"
      },
      adapter_kind: "manual_offline_package",
      prepared_by: "integration_designer"
    })).toThrow("adapter_boundary_manifest_mismatch");
  });

  it("rejects persistence mismatches", () => {
    expect(() => buildControlledAdapterBoundaryRecord({
      delivery_manifest_persistence: DELIVERY_PERSISTENCE,
      external_transmission_gate: {
        ...APPROVED_GATE,
        delivery_manifest_persistence_id: "OTHER_PERSISTENCE"
      },
      adapter_kind: "manual_offline_package",
      prepared_by: "integration_designer"
    })).toThrow("adapter_boundary_persistence_mismatch");
  });

  it("rejects missing gate trace", () => {
    expect(() => buildControlledAdapterBoundaryRecord({
      delivery_manifest_persistence: DELIVERY_PERSISTENCE,
      external_transmission_gate: {
        ...APPROVED_GATE,
        trace_refs: APPROVED_GATE.trace_refs.filter((ref) => ref !== APPROVED_GATE.external_transmission_gate_id)
      },
      adapter_kind: "manual_offline_package",
      prepared_by: "integration_designer"
    })).toThrow("adapter_boundary_missing_gate_trace");
  });
});
