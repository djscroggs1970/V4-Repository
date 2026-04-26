import { FRAMEWORK_VERSION } from "@v4/config";
import type { ClientExportPackageDocument, ClientExportPackageManifest } from "./client-export-package.js";

export type ClientPackageGateDecision = "approved" | "rejected" | "needs_review";

export interface ClientPackagePersistenceInput {
  client_export_package: ClientExportPackageManifest;
  storage_root_uri: string;
  persisted_by?: string;
  persisted_at?: string;
}

export interface ClientPackagePersistenceRecord {
  persistence_id: string;
  client_export_package_id: string;
  package_type: "client_facing_export_package";
  package_status: "persisted_pending_release_gate";
  project_instance_id: string;
  framework_version: string;
  storage_root_uri: string;
  storage_path: string;
  content_type: "application/json";
  persisted_at: string;
  persisted_by?: string;
  document_set_id: string;
  output_persistence_id: string;
  output_review_id: string;
  release_id: string;
  estimate_package_id: string;
  estimate_package_persistence_id: string;
  estimate_review_id: string;
  quantity_export_id: string;
  cost_scenario_id: string;
  total_cost: number;
  document_count: number;
  documents: ClientExportPackageDocument[];
  trace_refs: string[];
  next_required_action: "review_client_export_release_gate";
}

export interface ClientPackageReleaseGateInput {
  client_export_package: ClientExportPackageManifest;
  client_export_persistence: ClientPackagePersistenceRecord;
  decision: ClientPackageGateDecision;
  reviewer: string;
  reviewed_at?: string;
  note?: string;
}

export interface ClientPackageReleaseGateRecord {
  release_gate_id: string;
  client_export_package_id: string;
  client_export_persistence_id: string;
  package_type: "client_facing_export_package";
  project_instance_id: string;
  decision: ClientPackageGateDecision;
  reviewer: string;
  reviewed_at: string;
  note?: string;
  framework_version: string;
  external_share_status: "eligible_for_delivery_manifest" | "blocked_from_delivery_manifest";
  next_required_action: "generate_delivery_manifest" | "resolve_client_export_release_gate";
  trace_refs: string[];
}

export function buildClientPackagePersistenceRecord(input: ClientPackagePersistenceInput): ClientPackagePersistenceRecord {
  assertPersistenceInput(input);
  const persistedAt = input.persisted_at ?? new Date().toISOString();
  const traceRefs = Array.from(new Set([
    input.client_export_package.client_export_package_id,
    input.client_export_package.document_set_id,
    input.client_export_package.output_persistence_id,
    input.client_export_package.output_review_id,
    input.client_export_package.release_id,
    input.client_export_package.estimate_package_id,
    input.client_export_package.estimate_package_persistence_id,
    input.client_export_package.estimate_review_id,
    input.client_export_package.quantity_export_id,
    input.client_export_package.cost_scenario_id,
    ...input.client_export_package.trace_refs,
    ...input.client_export_package.documents.flatMap((document) => document.trace_refs)
  ])).sort();

  return {
    persistence_id: createPersistenceId(input.client_export_package.client_export_package_id, persistedAt),
    client_export_package_id: input.client_export_package.client_export_package_id,
    package_type: "client_facing_export_package",
    package_status: "persisted_pending_release_gate",
    project_instance_id: input.client_export_package.project_instance_id,
    framework_version: FRAMEWORK_VERSION,
    storage_root_uri: input.storage_root_uri,
    storage_path: createStoragePath(input.client_export_package),
    content_type: "application/json",
    persisted_at: persistedAt,
    persisted_by: input.persisted_by,
    document_set_id: input.client_export_package.document_set_id,
    output_persistence_id: input.client_export_package.output_persistence_id,
    output_review_id: input.client_export_package.output_review_id,
    release_id: input.client_export_package.release_id,
    estimate_package_id: input.client_export_package.estimate_package_id,
    estimate_package_persistence_id: input.client_export_package.estimate_package_persistence_id,
    estimate_review_id: input.client_export_package.estimate_review_id,
    quantity_export_id: input.client_export_package.quantity_export_id,
    cost_scenario_id: input.client_export_package.cost_scenario_id,
    total_cost: input.client_export_package.total_cost,
    document_count: input.client_export_package.document_count,
    documents: input.client_export_package.documents.map((document) => ({ ...document, trace_refs: [...document.trace_refs] })),
    trace_refs: traceRefs,
    next_required_action: "review_client_export_release_gate"
  };
}

export function buildClientPackageReleaseGateRecord(input: ClientPackageReleaseGateInput): ClientPackageReleaseGateRecord {
  assertReleaseGateInput(input);
  const reviewedAt = input.reviewed_at ?? new Date().toISOString();
  const approved = input.decision === "approved";
  const releaseGateId = createReleaseGateId(input.client_export_package.client_export_package_id, reviewedAt);
  const traceRefs = Array.from(new Set([
    releaseGateId,
    input.client_export_package.client_export_package_id,
    input.client_export_persistence.persistence_id,
    input.client_export_package.document_set_id,
    input.client_export_package.output_persistence_id,
    input.client_export_package.output_review_id,
    input.client_export_package.release_id,
    input.client_export_package.estimate_package_id,
    input.client_export_package.estimate_package_persistence_id,
    input.client_export_package.estimate_review_id,
    input.client_export_package.quantity_export_id,
    input.client_export_package.cost_scenario_id,
    ...input.client_export_package.trace_refs,
    ...input.client_export_persistence.trace_refs
  ])).sort();

  return {
    release_gate_id: releaseGateId,
    client_export_package_id: input.client_export_package.client_export_package_id,
    client_export_persistence_id: input.client_export_persistence.persistence_id,
    package_type: "client_facing_export_package",
    project_instance_id: input.client_export_package.project_instance_id,
    decision: input.decision,
    reviewer: input.reviewer,
    reviewed_at: reviewedAt,
    note: input.note,
    framework_version: FRAMEWORK_VERSION,
    external_share_status: approved ? "eligible_for_delivery_manifest" : "blocked_from_delivery_manifest",
    next_required_action: approved ? "generate_delivery_manifest" : "resolve_client_export_release_gate",
    trace_refs: traceRefs
  };
}

function assertPersistenceInput(input: ClientPackagePersistenceInput): void {
  if (!input.storage_root_uri.trim()) throw new Error("client_package_storage_root_uri_required");
  if (input.client_export_package.package_type !== "client_facing_export_package") throw new Error("client_package_type_required");
  if (input.client_export_package.package_status !== "assembled_pending_distribution_gate") throw new Error("client_package_must_be_assembled_pending_distribution_gate");
  if (input.client_export_package.next_required_action !== "persist_client_export_package") throw new Error("client_package_persistence_action_required");
  if (input.client_export_package.document_count <= 0) throw new Error("client_package_document_count_required");
  if (input.client_export_package.documents.length !== input.client_export_package.document_count) throw new Error("client_package_document_count_mismatch");
  assertPackageTraceCoverage(input.client_export_package);
  assertPackageDocuments(input.client_export_package);
}

function assertReleaseGateInput(input: ClientPackageReleaseGateInput): void {
  if (!input.reviewer.trim()) throw new Error("client_package_gate_reviewer_required");
  if ((input.decision === "rejected" || input.decision === "needs_review") && !input.note?.trim()) throw new Error("client_package_gate_note_required");
  if (input.client_export_persistence.package_status !== "persisted_pending_release_gate") throw new Error("client_package_must_be_persisted_pending_release_gate");
  if (input.client_export_persistence.next_required_action !== "review_client_export_release_gate") throw new Error("client_package_gate_action_required");
  assertPersistenceAlignment(input.client_export_package, input.client_export_persistence);
  if (!input.client_export_persistence.trace_refs.includes(input.client_export_package.client_export_package_id)) throw new Error("client_package_gate_missing_package_trace");
  if (!input.client_export_persistence.trace_refs.includes(input.client_export_package.release_id)) throw new Error("client_package_gate_missing_release_trace");
}

function assertPersistenceAlignment(clientPackage: ClientExportPackageManifest, persistence: ClientPackagePersistenceRecord): void {
  if (persistence.client_export_package_id !== clientPackage.client_export_package_id) throw new Error("client_package_persistence_package_mismatch");
  if (persistence.project_instance_id !== clientPackage.project_instance_id) throw new Error("client_package_project_instance_mismatch");
  if (persistence.document_set_id !== clientPackage.document_set_id) throw new Error("client_package_document_set_mismatch");
  if (persistence.output_persistence_id !== clientPackage.output_persistence_id) throw new Error("client_package_output_persistence_mismatch");
  if (persistence.output_review_id !== clientPackage.output_review_id) throw new Error("client_package_output_review_mismatch");
  if (persistence.release_id !== clientPackage.release_id) throw new Error("client_package_release_mismatch");
  if (persistence.estimate_package_id !== clientPackage.estimate_package_id) throw new Error("client_package_estimate_package_mismatch");
  if (persistence.quantity_export_id !== clientPackage.quantity_export_id) throw new Error("client_package_quantity_export_mismatch");
  if (persistence.cost_scenario_id !== clientPackage.cost_scenario_id) throw new Error("client_package_cost_scenario_mismatch");
}

function assertPackageTraceCoverage(clientPackage: ClientExportPackageManifest): void {
  const requiredRefs = [
    clientPackage.client_export_package_id,
    clientPackage.document_set_id,
    clientPackage.output_persistence_id,
    clientPackage.output_review_id,
    clientPackage.release_id,
    clientPackage.estimate_package_id,
    clientPackage.estimate_package_persistence_id,
    clientPackage.estimate_review_id,
    clientPackage.quantity_export_id,
    clientPackage.cost_scenario_id
  ];
  for (const ref of requiredRefs) {
    if (!clientPackage.trace_refs.includes(ref)) throw new Error("client_package_missing_trace");
  }
}

function assertPackageDocuments(clientPackage: ClientExportPackageManifest): void {
  const documentIds = new Set<string>();
  for (const document of clientPackage.documents) {
    if (documentIds.has(document.document_id)) throw new Error("duplicate_client_package_document_id");
    documentIds.add(document.document_id);
    if (!document.storage_path.trim()) throw new Error("client_package_document_storage_path_required");
    if (document.release_id !== clientPackage.release_id) throw new Error("client_package_document_release_mismatch");
    if (document.package_id !== clientPackage.estimate_package_id) throw new Error("client_package_document_estimate_package_mismatch");
    if (!document.trace_refs.includes(clientPackage.release_id)) throw new Error("client_package_document_missing_release_trace");
    if (!document.trace_refs.includes(clientPackage.estimate_package_id)) throw new Error("client_package_document_missing_estimate_package_trace");
  }
}

function createStoragePath(clientPackage: ClientExportPackageManifest): string {
  return [
    "project-instances",
    clientPackage.project_instance_id,
    "client-export-packages",
    clientPackage.client_export_package_id,
    `${clientPackage.client_export_package_id}.json`
  ].join("/");
}

function createPersistenceId(packageId: string, persistedAt: string): string {
  const stamp = persistedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `PERSIST_${packageId}_${stamp}`;
}

function createReleaseGateId(packageId: string, reviewedAt: string): string {
  const stamp = reviewedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `CLIENT_PACKAGE_GATE_${packageId}_${stamp}`;
}
