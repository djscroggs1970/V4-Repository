import { FRAMEWORK_VERSION } from "@v4/config";
import type { DeliveryManifest, DeliveryManifestDocument } from "./delivery-manifest.js";

export type TransmissionGateDecision = "approved" | "rejected" | "needs_review";

export interface DeliveryManifestPersistenceInput {
  delivery_manifest: DeliveryManifest;
  storage_root_uri: string;
  persisted_by?: string;
  persisted_at?: string;
}

export interface DeliveryManifestPersistenceRecord {
  persistence_id: string;
  delivery_manifest_id: string;
  manifest_type: "external_share_delivery_manifest";
  delivery_status: "persisted_pending_external_transmission_gate";
  project_instance_id: string;
  framework_version: string;
  storage_root_uri: string;
  storage_path: string;
  content_type: "application/json";
  persisted_at: string;
  persisted_by?: string;
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
  next_required_action: "review_external_transmission_gate";
}

export interface ExternalTransmissionGateInput {
  delivery_manifest: DeliveryManifest;
  delivery_manifest_persistence: DeliveryManifestPersistenceRecord;
  decision: TransmissionGateDecision;
  reviewer: string;
  reviewed_at?: string;
  note?: string;
}

export interface ExternalTransmissionGateRecord {
  external_transmission_gate_id: string;
  delivery_manifest_id: string;
  delivery_manifest_persistence_id: string;
  manifest_type: "external_share_delivery_manifest";
  project_instance_id: string;
  decision: TransmissionGateDecision;
  reviewer: string;
  reviewed_at: string;
  note?: string;
  framework_version: string;
  transmission_status: "authorized_for_adapter_boundary" | "blocked_from_transmission";
  next_required_action: "prepare_transmission_adapter_boundary" | "resolve_external_transmission_gate";
  trace_refs: string[];
}

export function buildDeliveryManifestPersistenceRecord(input: DeliveryManifestPersistenceInput): DeliveryManifestPersistenceRecord {
  assertPersistenceInput(input);
  const persistedAt = input.persisted_at ?? new Date().toISOString();
  const traceRefs = Array.from(new Set([
    input.delivery_manifest.delivery_manifest_id,
    input.delivery_manifest.client_export_package_id,
    input.delivery_manifest.client_export_persistence_id,
    input.delivery_manifest.release_gate_id,
    input.delivery_manifest.release_id,
    input.delivery_manifest.estimate_package_id,
    input.delivery_manifest.quantity_export_id,
    input.delivery_manifest.cost_scenario_id,
    ...input.delivery_manifest.trace_refs,
    ...input.delivery_manifest.documents.flatMap((document) => document.trace_refs)
  ])).sort();

  return {
    persistence_id: createPersistenceId(input.delivery_manifest.delivery_manifest_id, persistedAt),
    delivery_manifest_id: input.delivery_manifest.delivery_manifest_id,
    manifest_type: "external_share_delivery_manifest",
    delivery_status: "persisted_pending_external_transmission_gate",
    project_instance_id: input.delivery_manifest.project_instance_id,
    framework_version: FRAMEWORK_VERSION,
    storage_root_uri: input.storage_root_uri,
    storage_path: createStoragePath(input.delivery_manifest),
    content_type: "application/json",
    persisted_at: persistedAt,
    persisted_by: input.persisted_by,
    client_export_package_id: input.delivery_manifest.client_export_package_id,
    client_export_persistence_id: input.delivery_manifest.client_export_persistence_id,
    release_gate_id: input.delivery_manifest.release_gate_id,
    release_id: input.delivery_manifest.release_id,
    estimate_package_id: input.delivery_manifest.estimate_package_id,
    quantity_export_id: input.delivery_manifest.quantity_export_id,
    cost_scenario_id: input.delivery_manifest.cost_scenario_id,
    total_cost: input.delivery_manifest.total_cost,
    document_count: input.delivery_manifest.document_count,
    documents: input.delivery_manifest.documents.map((document) => ({ ...document, trace_refs: [...document.trace_refs] })),
    trace_refs: traceRefs,
    next_required_action: "review_external_transmission_gate"
  };
}

export function buildExternalTransmissionGateRecord(input: ExternalTransmissionGateInput): ExternalTransmissionGateRecord {
  assertTransmissionGateInput(input);
  const reviewedAt = input.reviewed_at ?? new Date().toISOString();
  const approved = input.decision === "approved";
  const externalTransmissionGateId = createTransmissionGateId(input.delivery_manifest.delivery_manifest_id, reviewedAt);
  const traceRefs = Array.from(new Set([
    externalTransmissionGateId,
    input.delivery_manifest.delivery_manifest_id,
    input.delivery_manifest_persistence.persistence_id,
    input.delivery_manifest.client_export_package_id,
    input.delivery_manifest.client_export_persistence_id,
    input.delivery_manifest.release_gate_id,
    input.delivery_manifest.release_id,
    input.delivery_manifest.estimate_package_id,
    input.delivery_manifest.quantity_export_id,
    input.delivery_manifest.cost_scenario_id,
    ...input.delivery_manifest.trace_refs,
    ...input.delivery_manifest_persistence.trace_refs
  ])).sort();

  return {
    external_transmission_gate_id: externalTransmissionGateId,
    delivery_manifest_id: input.delivery_manifest.delivery_manifest_id,
    delivery_manifest_persistence_id: input.delivery_manifest_persistence.persistence_id,
    manifest_type: "external_share_delivery_manifest",
    project_instance_id: input.delivery_manifest.project_instance_id,
    decision: input.decision,
    reviewer: input.reviewer,
    reviewed_at: reviewedAt,
    note: input.note,
    framework_version: FRAMEWORK_VERSION,
    transmission_status: approved ? "authorized_for_adapter_boundary" : "blocked_from_transmission",
    next_required_action: approved ? "prepare_transmission_adapter_boundary" : "resolve_external_transmission_gate",
    trace_refs: traceRefs
  };
}

function assertPersistenceInput(input: DeliveryManifestPersistenceInput): void {
  if (!input.storage_root_uri.trim()) throw new Error("delivery_persistence_storage_root_uri_required");
  if (input.delivery_manifest.manifest_type !== "external_share_delivery_manifest") throw new Error("delivery_persistence_manifest_type_required");
  if (input.delivery_manifest.delivery_status !== "prepared_pending_final_transmission_gate") throw new Error("delivery_manifest_must_be_prepared_pending_final_transmission_gate");
  if (input.delivery_manifest.next_required_action !== "persist_delivery_manifest") throw new Error("delivery_persistence_action_required");
  if (input.delivery_manifest.document_count <= 0) throw new Error("delivery_persistence_document_count_required");
  if (input.delivery_manifest.documents.length !== input.delivery_manifest.document_count) throw new Error("delivery_persistence_document_count_mismatch");
  assertDeliveryManifestTraceCoverage(input.delivery_manifest);
  assertDeliveryManifestDocuments(input.delivery_manifest);
}

function assertTransmissionGateInput(input: ExternalTransmissionGateInput): void {
  if (!input.reviewer.trim()) throw new Error("external_transmission_gate_reviewer_required");
  if ((input.decision === "rejected" || input.decision === "needs_review") && !input.note?.trim()) throw new Error("external_transmission_gate_note_required");
  if (input.delivery_manifest_persistence.delivery_status !== "persisted_pending_external_transmission_gate") throw new Error("delivery_manifest_must_be_persisted_pending_external_transmission_gate");
  if (input.delivery_manifest_persistence.next_required_action !== "review_external_transmission_gate") throw new Error("external_transmission_gate_action_required");
  assertPersistenceAlignment(input.delivery_manifest, input.delivery_manifest_persistence);
  if (!input.delivery_manifest_persistence.trace_refs.includes(input.delivery_manifest.delivery_manifest_id)) throw new Error("external_transmission_gate_missing_manifest_trace");
  if (!input.delivery_manifest_persistence.trace_refs.includes(input.delivery_manifest.release_id)) throw new Error("external_transmission_gate_missing_release_trace");
}

function assertPersistenceAlignment(deliveryManifest: DeliveryManifest, persistence: DeliveryManifestPersistenceRecord): void {
  if (persistence.delivery_manifest_id !== deliveryManifest.delivery_manifest_id) throw new Error("delivery_persistence_manifest_mismatch");
  if (persistence.project_instance_id !== deliveryManifest.project_instance_id) throw new Error("delivery_persistence_project_instance_mismatch");
  if (persistence.client_export_package_id !== deliveryManifest.client_export_package_id) throw new Error("delivery_persistence_client_export_package_mismatch");
  if (persistence.client_export_persistence_id !== deliveryManifest.client_export_persistence_id) throw new Error("delivery_persistence_client_export_persistence_mismatch");
  if (persistence.release_gate_id !== deliveryManifest.release_gate_id) throw new Error("delivery_persistence_release_gate_mismatch");
  if (persistence.release_id !== deliveryManifest.release_id) throw new Error("delivery_persistence_release_mismatch");
  if (persistence.estimate_package_id !== deliveryManifest.estimate_package_id) throw new Error("delivery_persistence_estimate_package_mismatch");
  if (persistence.quantity_export_id !== deliveryManifest.quantity_export_id) throw new Error("delivery_persistence_quantity_export_mismatch");
  if (persistence.cost_scenario_id !== deliveryManifest.cost_scenario_id) throw new Error("delivery_persistence_cost_scenario_mismatch");
}

function assertDeliveryManifestTraceCoverage(deliveryManifest: DeliveryManifest): void {
  const requiredRefs = [
    deliveryManifest.delivery_manifest_id,
    deliveryManifest.client_export_package_id,
    deliveryManifest.client_export_persistence_id,
    deliveryManifest.release_gate_id,
    deliveryManifest.release_id,
    deliveryManifest.estimate_package_id,
    deliveryManifest.quantity_export_id,
    deliveryManifest.cost_scenario_id
  ];
  for (const ref of requiredRefs) {
    if (!deliveryManifest.trace_refs.includes(ref)) throw new Error("delivery_persistence_missing_manifest_trace");
  }
}

function assertDeliveryManifestDocuments(deliveryManifest: DeliveryManifest): void {
  const documentIds = new Set<string>();
  for (const document of deliveryManifest.documents) {
    if (documentIds.has(document.document_id)) throw new Error("duplicate_delivery_persistence_document_id");
    documentIds.add(document.document_id);
    if (!document.storage_path.trim()) throw new Error("delivery_persistence_document_storage_path_required");
    if (!document.trace_refs.includes(deliveryManifest.release_id)) throw new Error("delivery_persistence_document_missing_release_trace");
    if (!document.trace_refs.includes(deliveryManifest.estimate_package_id)) throw new Error("delivery_persistence_document_missing_estimate_package_trace");
  }
}

function createStoragePath(deliveryManifest: DeliveryManifest): string {
  return [
    "project-instances",
    deliveryManifest.project_instance_id,
    "delivery-manifests",
    deliveryManifest.delivery_manifest_id,
    `${deliveryManifest.delivery_manifest_id}.json`
  ].join("/");
}

function createPersistenceId(deliveryManifestId: string, persistedAt: string): string {
  const stamp = persistedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `PERSIST_${deliveryManifestId}_${stamp}`;
}

function createTransmissionGateId(deliveryManifestId: string, reviewedAt: string): string {
  const stamp = reviewedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `EXTERNAL_TRANSMISSION_GATE_${deliveryManifestId}_${stamp}`;
}
