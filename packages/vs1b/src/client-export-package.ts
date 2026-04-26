import { FRAMEWORK_VERSION } from "@v4/config";
import type { OutputDocumentGenerationResult } from "./output-document-generation.js";
import type { OutputDocumentPersistenceRecord, OutputDocumentReviewRecord, PersistedOutputDocumentRecord } from "./output-document-persistence-review.js";

export interface ClientExportPackageInput {
  output_document_set: OutputDocumentGenerationResult;
  output_document_persistence: OutputDocumentPersistenceRecord;
  output_document_review: OutputDocumentReviewRecord;
  assembled_by: string;
  assembled_at?: string;
  package_id?: string;
}

export interface ClientExportPackageDocument {
  document_id: string;
  document_type: string;
  storage_path: string;
  content_type: "text/markdown" | "application/json";
  release_id: string;
  package_id: string;
  trace_refs: string[];
}

export interface ClientExportPackageManifest {
  client_export_package_id: string;
  package_type: "client_facing_export_package";
  package_status: "assembled_pending_distribution_gate";
  project_instance_id: string;
  framework_version: string;
  assembled_at: string;
  assembled_by: string;
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
  next_required_action: "persist_client_export_package";
}

export function buildClientExportPackageManifest(input: ClientExportPackageInput): ClientExportPackageManifest {
  assertClientExportPackageInput(input);
  const assembledAt = input.assembled_at ?? new Date().toISOString();
  const clientExportPackageId = input.package_id ?? createClientExportPackageId(input.output_document_set.document_set_id, assembledAt);
  const documents = input.output_document_persistence.documents.map((document) => buildClientExportPackageDocument(document));
  const traceRefs = Array.from(new Set([
    clientExportPackageId,
    input.output_document_set.document_set_id,
    input.output_document_persistence.persistence_id,
    input.output_document_review.output_review_id,
    input.output_document_set.release_id,
    input.output_document_set.package_id,
    input.output_document_set.package_persistence_id,
    input.output_document_set.review_id,
    input.output_document_set.quantity_export_id,
    input.output_document_set.cost_scenario_id,
    ...input.output_document_set.trace_refs,
    ...input.output_document_persistence.trace_refs,
    ...input.output_document_review.trace_refs,
    ...documents.flatMap((document) => document.trace_refs)
  ])).sort();

  return {
    client_export_package_id: clientExportPackageId,
    package_type: "client_facing_export_package",
    package_status: "assembled_pending_distribution_gate",
    project_instance_id: input.output_document_set.project_instance_id,
    framework_version: FRAMEWORK_VERSION,
    assembled_at: assembledAt,
    assembled_by: input.assembled_by,
    document_set_id: input.output_document_set.document_set_id,
    output_persistence_id: input.output_document_persistence.persistence_id,
    output_review_id: input.output_document_review.output_review_id,
    release_id: input.output_document_set.release_id,
    estimate_package_id: input.output_document_set.package_id,
    estimate_package_persistence_id: input.output_document_set.package_persistence_id,
    estimate_review_id: input.output_document_set.review_id,
    quantity_export_id: input.output_document_set.quantity_export_id,
    cost_scenario_id: input.output_document_set.cost_scenario_id,
    total_cost: input.output_document_set.total_cost,
    document_count: documents.length,
    documents,
    trace_refs: traceRefs,
    next_required_action: "persist_client_export_package"
  };
}

function assertClientExportPackageInput(input: ClientExportPackageInput): void {
  if (!input.assembled_by.trim()) throw new Error("client_export_package_assembled_by_required");
  if (input.output_document_set.output_type !== "bid_grade_output_document_set") throw new Error("client_export_requires_output_document_set");
  if (input.output_document_persistence.output_type !== "bid_grade_output_document_set") throw new Error("client_export_requires_output_document_persistence");
  if (input.output_document_persistence.document_status !== "persisted_pending_review") throw new Error("client_export_requires_persisted_documents");
  if (input.output_document_review.decision !== "approved") throw new Error("client_export_requires_approved_output_review");
  if (input.output_document_review.client_export_status !== "eligible_for_client_facing_export_package") throw new Error("client_export_not_eligible");
  if (input.output_document_review.next_required_action !== "assemble_client_facing_export_package") throw new Error("client_export_action_required");
  assertAlignment(input);
  assertDocumentCoverage(input);
  assertTraceCoverage(input);
}

function assertAlignment(input: ClientExportPackageInput): void {
  const set = input.output_document_set;
  const persistence = input.output_document_persistence;
  const review = input.output_document_review;
  if (persistence.document_set_id !== set.document_set_id) throw new Error("client_export_document_set_mismatch");
  if (review.document_set_id !== set.document_set_id) throw new Error("client_export_document_set_mismatch");
  if (review.persistence_id !== persistence.persistence_id) throw new Error("client_export_persistence_mismatch");
  if (persistence.project_instance_id !== set.project_instance_id) throw new Error("client_export_project_instance_mismatch");
  if (review.project_instance_id !== set.project_instance_id) throw new Error("client_export_project_instance_mismatch");
  if (persistence.release_id !== set.release_id) throw new Error("client_export_release_mismatch");
  if (persistence.package_id !== set.package_id) throw new Error("client_export_package_mismatch");
  if (persistence.quantity_export_id !== set.quantity_export_id) throw new Error("client_export_quantity_export_mismatch");
  if (persistence.cost_scenario_id !== set.cost_scenario_id) throw new Error("client_export_cost_scenario_mismatch");
}

function assertDocumentCoverage(input: ClientExportPackageInput): void {
  const generatedIds = new Set(input.output_document_set.documents.map((document) => document.document_id));
  const persistedIds = new Set(input.output_document_persistence.documents.map((document) => document.document_id));
  if (generatedIds.size !== input.output_document_set.document_count) throw new Error("client_export_generated_document_count_mismatch");
  if (persistedIds.size !== input.output_document_persistence.document_count) throw new Error("client_export_persisted_document_count_mismatch");
  for (const generatedId of generatedIds) {
    if (!persistedIds.has(generatedId)) throw new Error("client_export_missing_persisted_document");
  }
  for (const document of input.output_document_persistence.documents) {
    if (!document.storage_path.trim()) throw new Error("client_export_document_storage_path_required");
    if (document.project_instance_id !== input.output_document_set.project_instance_id) throw new Error("client_export_document_project_instance_mismatch");
    if (document.release_id !== input.output_document_set.release_id) throw new Error("client_export_document_release_mismatch");
    if (document.package_id !== input.output_document_set.package_id) throw new Error("client_export_document_package_mismatch");
  }
}

function assertTraceCoverage(input: ClientExportPackageInput): void {
  const requiredRefs = [
    input.output_document_set.document_set_id,
    input.output_document_persistence.persistence_id,
    input.output_document_review.output_review_id,
    input.output_document_set.release_id,
    input.output_document_set.package_id,
    input.output_document_set.package_persistence_id,
    input.output_document_set.review_id,
    input.output_document_set.quantity_export_id,
    input.output_document_set.cost_scenario_id
  ];
  for (const ref of requiredRefs) {
    if (ref === input.output_document_review.output_review_id) continue;
    if (!input.output_document_review.trace_refs.includes(ref) && !input.output_document_persistence.trace_refs.includes(ref) && !input.output_document_set.trace_refs.includes(ref)) {
      throw new Error("client_export_missing_trace");
    }
  }
  if (!input.output_document_review.trace_refs.includes(input.output_document_persistence.persistence_id)) throw new Error("client_export_missing_review_trace");
  if (!input.output_document_review.trace_refs.includes(input.output_document_set.document_set_id)) throw new Error("client_export_missing_review_trace");
  for (const document of input.output_document_persistence.documents) {
    if (!document.trace_refs.includes(input.output_document_set.release_id)) throw new Error("client_export_document_missing_release_trace");
    if (!document.trace_refs.includes(input.output_document_set.package_id)) throw new Error("client_export_document_missing_package_trace");
  }
}

function buildClientExportPackageDocument(document: PersistedOutputDocumentRecord): ClientExportPackageDocument {
  return {
    document_id: document.document_id,
    document_type: document.document_type,
    storage_path: document.storage_path,
    content_type: document.content_type,
    release_id: document.release_id,
    package_id: document.package_id,
    trace_refs: [...document.trace_refs]
  };
}

function createClientExportPackageId(documentSetId: string, assembledAt: string): string {
  const stamp = assembledAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `CLIENT_EXPORT_${documentSetId}_${stamp}`;
}
