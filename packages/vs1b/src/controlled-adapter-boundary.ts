import { FRAMEWORK_VERSION } from "@v4/config";
import type { DeliveryManifestPersistenceRecord, ExternalTransmissionGateRecord } from "./delivery-transmission-gate.js";

export type ControlledAdapterKind = "manual_offline_package" | "client_portal_placeholder" | "email_placeholder";

export interface ControlledAdapterBoundaryInput {
  delivery_manifest_persistence: DeliveryManifestPersistenceRecord;
  external_transmission_gate: ExternalTransmissionGateRecord;
  adapter_kind: ControlledAdapterKind;
  prepared_by: string;
  prepared_at?: string;
  boundary_id?: string;
}

export interface ControlledAdapterBoundaryRecord {
  boundary_id: string;
  boundary_type: "controlled_adapter_boundary";
  boundary_status: "defined_disabled_pending_governance_enablement";
  project_instance_id: string;
  framework_version: string;
  prepared_at: string;
  prepared_by: string;
  adapter_kind: ControlledAdapterKind;
  execution_enabled: false;
  execution_attempted: false;
  delivery_manifest_id: string;
  delivery_manifest_persistence_id: string;
  external_transmission_gate_id: string;
  client_export_package_id: string;
  release_id: string;
  estimate_package_id: string;
  quantity_export_id: string;
  cost_scenario_id: string;
  trace_refs: string[];
  next_required_action: "governance_enable_adapter_or_stop";
}

export function buildControlledAdapterBoundaryRecord(input: ControlledAdapterBoundaryInput): ControlledAdapterBoundaryRecord {
  assertControlledAdapterBoundaryInput(input);
  const preparedAt = input.prepared_at ?? new Date().toISOString();
  const boundaryId = input.boundary_id ?? createBoundaryId(input.delivery_manifest_persistence.delivery_manifest_id, preparedAt);
  const traceRefs = Array.from(new Set([
    boundaryId,
    input.delivery_manifest_persistence.delivery_manifest_id,
    input.delivery_manifest_persistence.persistence_id,
    input.external_transmission_gate.external_transmission_gate_id,
    input.delivery_manifest_persistence.client_export_package_id,
    input.delivery_manifest_persistence.release_id,
    input.delivery_manifest_persistence.estimate_package_id,
    input.delivery_manifest_persistence.quantity_export_id,
    input.delivery_manifest_persistence.cost_scenario_id,
    ...input.delivery_manifest_persistence.trace_refs,
    ...input.external_transmission_gate.trace_refs
  ])).sort();

  return {
    boundary_id: boundaryId,
    boundary_type: "controlled_adapter_boundary",
    boundary_status: "defined_disabled_pending_governance_enablement",
    project_instance_id: input.delivery_manifest_persistence.project_instance_id,
    framework_version: FRAMEWORK_VERSION,
    prepared_at: preparedAt,
    prepared_by: input.prepared_by,
    adapter_kind: input.adapter_kind,
    execution_enabled: false,
    execution_attempted: false,
    delivery_manifest_id: input.delivery_manifest_persistence.delivery_manifest_id,
    delivery_manifest_persistence_id: input.delivery_manifest_persistence.persistence_id,
    external_transmission_gate_id: input.external_transmission_gate.external_transmission_gate_id,
    client_export_package_id: input.delivery_manifest_persistence.client_export_package_id,
    release_id: input.delivery_manifest_persistence.release_id,
    estimate_package_id: input.delivery_manifest_persistence.estimate_package_id,
    quantity_export_id: input.delivery_manifest_persistence.quantity_export_id,
    cost_scenario_id: input.delivery_manifest_persistence.cost_scenario_id,
    trace_refs: traceRefs,
    next_required_action: "governance_enable_adapter_or_stop"
  };
}

function assertControlledAdapterBoundaryInput(input: ControlledAdapterBoundaryInput): void {
  if (!input.prepared_by.trim()) throw new Error("adapter_boundary_prepared_by_required");
  if (input.delivery_manifest_persistence.manifest_type !== "external_share_delivery_manifest") throw new Error("adapter_boundary_requires_delivery_manifest_persistence");
  if (input.delivery_manifest_persistence.delivery_status !== "persisted_pending_external_transmission_gate") throw new Error("adapter_boundary_requires_persisted_delivery_manifest");
  if (input.delivery_manifest_persistence.next_required_action !== "review_external_transmission_gate") throw new Error("adapter_boundary_requires_gate_review_state");
  if (input.external_transmission_gate.decision !== "approved") throw new Error("adapter_boundary_requires_approved_gate");
  if (input.external_transmission_gate.transmission_status !== "authorized_for_adapter_boundary") throw new Error("adapter_boundary_not_authorized");
  if (input.external_transmission_gate.next_required_action !== "prepare_transmission_adapter_boundary") throw new Error("adapter_boundary_action_required");
  assertAlignment(input.delivery_manifest_persistence, input.external_transmission_gate);
  assertTraceCoverage(input.delivery_manifest_persistence, input.external_transmission_gate);
}

function assertAlignment(persistence: DeliveryManifestPersistenceRecord, gate: ExternalTransmissionGateRecord): void {
  if (gate.delivery_manifest_id !== persistence.delivery_manifest_id) throw new Error("adapter_boundary_manifest_mismatch");
  if (gate.delivery_manifest_persistence_id !== persistence.persistence_id) throw new Error("adapter_boundary_persistence_mismatch");
  if (gate.project_instance_id !== persistence.project_instance_id) throw new Error("adapter_boundary_project_instance_mismatch");
}

function assertTraceCoverage(persistence: DeliveryManifestPersistenceRecord, gate: ExternalTransmissionGateRecord): void {
  const requiredPersistenceRefs = [
    persistence.delivery_manifest_id,
    persistence.persistence_id,
    persistence.client_export_package_id,
    persistence.release_id,
    persistence.estimate_package_id,
    persistence.quantity_export_id,
    persistence.cost_scenario_id
  ];
  for (const ref of requiredPersistenceRefs) {
    if (!persistence.trace_refs.includes(ref)) throw new Error("adapter_boundary_missing_persistence_trace");
  }
  const requiredGateRefs = [
    gate.external_transmission_gate_id,
    persistence.delivery_manifest_id,
    persistence.persistence_id,
    persistence.release_id
  ];
  for (const ref of requiredGateRefs) {
    if (!gate.trace_refs.includes(ref)) throw new Error("adapter_boundary_missing_gate_trace");
  }
}

function createBoundaryId(deliveryManifestId: string, preparedAt: string): string {
  const stamp = preparedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `CONTROLLED_ADAPTER_BOUNDARY_${deliveryManifestId}_${stamp}`;
}
