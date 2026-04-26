import { FRAMEWORK_VERSION } from "@v4/config";
import type { ClientPackagePersistenceRecord, ClientPackageReleaseGateRecord } from "./client-package-release-gate.js";

export type DeliveryMethod = "controlled_download" | "sealed_package" | "manual_delivery";

export interface DeliveryManifestInput {
  client_export_persistence: ClientPackagePersistenceRecord;
  client_package_release_gate: ClientPackageReleaseGateRecord;
  delivery_method: DeliveryMethod;
  prepared_by: string;
  prepared_at?: string;
  delivery_manifest_id?: string;
  intended_recipient?: string;
}

export interface DeliveryManifestDocument {
  document_id: string;
  document_type: string;
  storage_path: string;
  content_type: "text/markdown" | "application/json";
  trace_refs: string[];
}

export interface DeliveryManifest {
  delivery_manifest_id: string;
  manifest_type: "external_share_delivery_manifest";
  delivery_status: "prepared_pending_final_transmission_gate";
  project_instance_id: string;
  framework_version: string;
  prepared_at: string;
  prepared_by: string;
  intended_recipient?: string;
  delivery_method: DeliveryMethod;
  client_export_package_id: string;
  client_export_persistence_id: string;
  release_gate_id: string;
  release_id: string;
  estimate_package_id: string;
  quantity_export_id: string;
  cost_scenario_id: string;
  total_cost: number;
  document_count: number;
  documents: DeliveryManifestDocument[];
  trace_refs: string[];
  next_required_action: "persist_delivery_manifest";
}

export function buildDeliveryManifest(input: DeliveryManifestInput): DeliveryManifest {
  assertDeliveryManifestInput(input);
  const preparedAt = input.prepared_at ?? new Date().toISOString();
  const deliveryManifestId = input.delivery_manifest_id ?? createDeliveryManifestId(input.client_export_persistence.client_export_package_id, preparedAt);
  const documents = input.client_export_persistence.documents.map((document) => ({
    document_id: document.document_id,
    document_type: document.document_type,
    storage_path: document.storage_path,
    content_type: document.content_type,
    trace_refs: [...document.trace_refs]
  }));
  const traceRefs = Array.from(new Set([
    deliveryManifestId,
    input.client_export_persistence.client_export_package_id,
    input.client_export_persistence.persistence_id,
    input.client_package_release_gate.release_gate_id,
    input.client_export_persistence.release_id,
    input.client_export_persistence.estimate_package_id,
    input.client_export_persistence.quantity_export_id,
    input.client_export_persistence.cost_scenario_id,
    ...input.client_export_persistence.trace_refs,
    ...input.client_package_release_gate.trace_refs,
    ...documents.flatMap((document) => document.trace_refs)
  ])).sort();

  return {
    delivery_manifest_id: deliveryManifestId,
    manifest_type: "external_share_delivery_manifest",
    delivery_status: "prepared_pending_final_transmission_gate",
    project_instance_id: input.client_export_persistence.project_instance_id,
    framework_version: FRAMEWORK_VERSION,
    prepared_at: preparedAt,
    prepared_by: input.prepared_by,
    intended_recipient: input.intended_recipient,
    delivery_method: input.delivery_method,
    client_export_package_id: input.client_export_persistence.client_export_package_id,
    client_export_persistence_id: input.client_export_persistence.persistence_id,
    release_gate_id: input.client_package_release_gate.release_gate_id,
    release_id: input.client_export_persistence.release_id,
    estimate_package_id: input.client_export_persistence.estimate_package_id,
    quantity_export_id: input.client_export_persistence.quantity_export_id,
    cost_scenario_id: input.client_export_persistence.cost_scenario_id,
    total_cost: input.client_export_persistence.total_cost,
    document_count: documents.length,
    documents,
    trace_refs: traceRefs,
    next_required_action: "persist_delivery_manifest"
  };
}

function assertDeliveryManifestInput(input: DeliveryManifestInput): void {
  if (!input.prepared_by.trim()) throw new Error("delivery_manifest_prepared_by_required");
  if (input.client_export_persistence.package_type !== "client_facing_export_package") throw new Error("delivery_manifest_requires_client_package_persistence");
  if (input.client_export_persistence.package_status !== "persisted_pending_release_gate") throw new Error("delivery_manifest_requires_persisted_client_package");
  if (input.client_export_persistence.next_required_action !== "review_client_export_release_gate") throw new Error("delivery_manifest_requires_release_gate_action");
  if (input.client_package_release_gate.decision !== "approved") throw new Error("delivery_manifest_requires_approved_release_gate");
  if (input.client_package_release_gate.external_share_status !== "eligible_for_delivery_manifest") throw new Error("delivery_manifest_not_eligible");
  if (input.client_package_release_gate.next_required_action !== "generate_delivery_manifest") throw new Error("delivery_manifest_action_required");
  assertAlignment(input.client_export_persistence, input.client_package_release_gate);
  assertDocuments(input.client_export_persistence);
  assertTraceCoverage(input.client_export_persistence, input.client_package_release_gate);
}

function assertAlignment(persistence: ClientPackagePersistenceRecord, gate: ClientPackageReleaseGateRecord): void {
  if (gate.client_export_package_id !== persistence.client_export_package_id) throw new Error("delivery_manifest_package_mismatch");
  if (gate.client_export_persistence_id !== persistence.persistence_id) throw new Error("delivery_manifest_persistence_mismatch");
  if (gate.project_instance_id !== persistence.project_instance_id) throw new Error("delivery_manifest_project_instance_mismatch");
}

function assertDocuments(persistence: ClientPackagePersistenceRecord): void {
  if (persistence.document_count <= 0) throw new Error("delivery_manifest_document_count_required");
  if (persistence.documents.length !== persistence.document_count) throw new Error("delivery_manifest_document_count_mismatch");
  const seen = new Set<string>();
  for (const document of persistence.documents) {
    if (seen.has(document.document_id)) throw new Error("duplicate_delivery_manifest_document_id");
    seen.add(document.document_id);
    if (!document.storage_path.trim()) throw new Error("delivery_manifest_document_storage_path_required");
    if (!document.trace_refs.includes(persistence.release_id)) throw new Error("delivery_manifest_document_missing_release_trace");
    if (!document.trace_refs.includes(persistence.estimate_package_id)) throw new Error("delivery_manifest_document_missing_estimate_package_trace");
  }
}

function assertTraceCoverage(persistence: ClientPackagePersistenceRecord, gate: ClientPackageReleaseGateRecord): void {
  const requiredPersistenceRefs = [
    persistence.client_export_package_id,
    persistence.persistence_id,
    persistence.release_id,
    persistence.estimate_package_id,
    persistence.quantity_export_id,
    persistence.cost_scenario_id
  ];
  for (const ref of requiredPersistenceRefs) {
    if (!persistence.trace_refs.includes(ref)) throw new Error("delivery_manifest_missing_persistence_trace");
  }
  const requiredGateRefs = [
    gate.release_gate_id,
    persistence.client_export_package_id,
    persistence.persistence_id,
    persistence.release_id
  ];
  for (const ref of requiredGateRefs) {
    if (!gate.trace_refs.includes(ref)) throw new Error("delivery_manifest_missing_gate_trace");
  }
}

function createDeliveryManifestId(packageId: string, preparedAt: string): string {
  const stamp = preparedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `DELIVERY_MANIFEST_${packageId}_${stamp}`;
}
