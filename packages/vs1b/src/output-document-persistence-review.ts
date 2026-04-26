import { FRAMEWORK_VERSION } from "@v4/config";
import type { OutputDocumentGenerationResult } from "./output-document-generation.js";

export type OutputDocumentReviewDecision = "approved" | "rejected" | "needs_review";

export interface OutputDocumentPersistenceInput {
  output_document_set: OutputDocumentGenerationResult;
  storage_root_uri: string;
  persisted_by?: string;
  persisted_at?: string;
}

export interface PersistedOutputDocumentRecord {
  document_id: string;
  document_type: string;
  project_instance_id: string;
  release_id: string;
  package_id: string;
  storage_path: string;
  content_type: "text/markdown" | "application/json";
  trace_refs: string[];
}

export interface OutputDocumentPersistenceRecord {
  persistence_id: string;
  document_set_id: string;
  output_type: "bid_grade_output_document_set";
  document_status: "persisted_pending_review";
  project_instance_id: string;
  framework_version: string;
  storage_root_uri: string;
  storage_path: string;
  content_type: "application/json";
  persisted_at: string;
  persisted_by?: string;
  release_id: string;
  package_id: string;
  package_persistence_id: string;
  review_id: string;
  quantity_export_id: string;
  cost_scenario_id: string;
  total_cost: number;
  document_count: number;
  documents: PersistedOutputDocumentRecord[];
  trace_refs: string[];
  next_required_action: "review_output_documents";
}

export interface OutputDocumentReviewInput {
  output_document_set: OutputDocumentGenerationResult;
  output_document_persistence: OutputDocumentPersistenceRecord;
  decision: OutputDocumentReviewDecision;
  reviewer: string;
  reviewed_at?: string;
  note?: string;
}

export interface OutputDocumentReviewRecord {
  output_review_id: string;
  document_set_id: string;
  persistence_id: string;
  project_instance_id: string;
  decision: OutputDocumentReviewDecision;
  reviewer: string;
  reviewed_at: string;
  note?: string;
  framework_version: string;
  client_export_status: "eligible_for_client_facing_export_package" | "blocked_from_client_facing_export_package";
  next_required_action: "assemble_client_facing_export_package" | "resolve_output_document_review";
  trace_refs: string[];
}

export function buildOutputDocumentPersistenceRecord(input: OutputDocumentPersistenceInput): OutputDocumentPersistenceRecord {
  assertPersistenceInput(input);
  const persistedAt = input.persisted_at ?? new Date().toISOString();
  const storagePath = createDocumentSetStoragePath(input.output_document_set);
  const documents = input.output_document_set.documents.map((document) => ({
    document_id: document.document_id,
    document_type: document.document_type,
    project_instance_id: document.project_instance_id,
    release_id: document.release_id,
    package_id: document.package_id,
    storage_path: createDocumentStoragePath(input.output_document_set, document.document_id, document.content_type),
    content_type: document.content_type,
    trace_refs: [...document.trace_refs]
  }));
  const traceRefs = Array.from(new Set([
    input.output_document_set.document_set_id,
    input.output_document_set.release_id,
    input.output_document_set.package_id,
    input.output_document_set.package_persistence_id,
    input.output_document_set.review_id,
    input.output_document_set.quantity_export_id,
    input.output_document_set.cost_scenario_id,
    ...input.output_document_set.trace_refs,
    ...documents.flatMap((document) => document.trace_refs)
  ])).sort();

  return {
    persistence_id: createPersistenceId(input.output_document_set.document_set_id, persistedAt),
    document_set_id: input.output_document_set.document_set_id,
    output_type: input.output_document_set.output_type,
    document_status: "persisted_pending_review",
    project_instance_id: input.output_document_set.project_instance_id,
    framework_version: FRAMEWORK_VERSION,
    storage_root_uri: input.storage_root_uri,
    storage_path: storagePath,
    content_type: "application/json",
    persisted_at: persistedAt,
    persisted_by: input.persisted_by,
    release_id: input.output_document_set.release_id,
    package_id: input.output_document_set.package_id,
    package_persistence_id: input.output_document_set.package_persistence_id,
    review_id: input.output_document_set.review_id,
    quantity_export_id: input.output_document_set.quantity_export_id,
    cost_scenario_id: input.output_document_set.cost_scenario_id,
    total_cost: input.output_document_set.total_cost,
    document_count: documents.length,
    documents,
    trace_refs: traceRefs,
    next_required_action: "review_output_documents"
  };
}

export function buildOutputDocumentReviewRecord(input: OutputDocumentReviewInput): OutputDocumentReviewRecord {
  assertReviewInput(input);
  const reviewedAt = input.reviewed_at ?? new Date().toISOString();
  const approved = input.decision === "approved";
  const traceRefs = Array.from(new Set([
    input.output_document_set.document_set_id,
    input.output_document_persistence.persistence_id,
    input.output_document_set.release_id,
    input.output_document_set.package_id,
    input.output_document_set.package_persistence_id,
    input.output_document_set.review_id,
    input.output_document_set.quantity_export_id,
    input.output_document_set.cost_scenario_id,
    ...input.output_document_set.trace_refs,
    ...input.output_document_persistence.trace_refs
  ])).sort();

  return {
    output_review_id: createReviewId(input.output_document_set.document_set_id, reviewedAt),
    document_set_id: input.output_document_set.document_set_id,
    persistence_id: input.output_document_persistence.persistence_id,
    project_instance_id: input.output_document_set.project_instance_id,
    decision: input.decision,
    reviewer: input.reviewer,
    reviewed_at: reviewedAt,
    note: input.note,
    framework_version: FRAMEWORK_VERSION,
    client_export_status: approved ? "eligible_for_client_facing_export_package" : "blocked_from_client_facing_export_package",
    next_required_action: approved ? "assemble_client_facing_export_package" : "resolve_output_document_review",
    trace_refs: traceRefs
  };
}

function assertPersistenceInput(input: OutputDocumentPersistenceInput): void {
  if (!input.storage_root_uri.trim()) throw new Error("output_document_storage_root_uri_required");
  if (input.output_document_set.output_type !== "bid_grade_output_document_set") throw new Error("output_document_set_type_required");
  if (input.output_document_set.document_status !== "generated_pending_persistence_review") throw new Error("output_document_set_must_be_generated_pending_persistence_review");
  if (input.output_document_set.next_required_action !== "persist_output_documents") throw new Error("output_document_persistence_action_required");
  if (input.output_document_set.document_count <= 0) throw new Error("output_document_count_required");
  if (input.output_document_set.documents.length !== input.output_document_set.document_count) throw new Error("output_document_count_mismatch");
  assertDocumentAlignment(input.output_document_set);
  assertTraceCoverage(input.output_document_set);
}

function assertDocumentAlignment(outputDocumentSet: OutputDocumentGenerationResult): void {
  const documentIds = new Set<string>();
  for (const document of outputDocumentSet.documents) {
    if (documentIds.has(document.document_id)) throw new Error("duplicate_output_document_id");
    documentIds.add(document.document_id);
    if (document.document_status !== "generated_pending_persistence_review") throw new Error("output_document_not_pending_persistence_review");
    if (document.project_instance_id !== outputDocumentSet.project_instance_id) throw new Error("output_document_project_instance_mismatch");
    if (document.release_id !== outputDocumentSet.release_id) throw new Error("output_document_release_mismatch");
    if (document.package_id !== outputDocumentSet.package_id) throw new Error("output_document_package_mismatch");
  }
}

function assertTraceCoverage(outputDocumentSet: OutputDocumentGenerationResult): void {
  const requiredRefs = [
    outputDocumentSet.document_set_id,
    outputDocumentSet.release_id,
    outputDocumentSet.package_id,
    outputDocumentSet.package_persistence_id,
    outputDocumentSet.review_id,
    outputDocumentSet.quantity_export_id,
    outputDocumentSet.cost_scenario_id
  ];

  for (const ref of requiredRefs) {
    if (!outputDocumentSet.trace_refs.includes(ref)) throw new Error("output_document_set_missing_trace");
  }

  for (const document of outputDocumentSet.documents) {
    if (!document.trace_refs.includes(outputDocumentSet.release_id)) throw new Error("output_document_missing_release_trace");
    if (!document.trace_refs.includes(outputDocumentSet.package_id)) throw new Error("output_document_missing_package_trace");
    if (!document.trace_refs.includes(outputDocumentSet.quantity_export_id)) throw new Error("output_document_missing_quantity_export_trace");
    if (!document.trace_refs.includes(outputDocumentSet.cost_scenario_id)) throw new Error("output_document_missing_cost_scenario_trace");
  }
}

function assertReviewInput(input: OutputDocumentReviewInput): void {
  if (!input.reviewer.trim()) throw new Error("output_document_reviewer_required");
  if (input.output_document_persistence.document_set_id !== input.output_document_set.document_set_id) throw new Error("output_document_persistence_mismatch");
  if (input.output_document_persistence.project_instance_id !== input.output_document_set.project_instance_id) throw new Error("output_document_project_instance_mismatch");
  if (input.output_document_persistence.release_id !== input.output_document_set.release_id) throw new Error("output_document_release_mismatch");
  if (input.output_document_persistence.document_status !== "persisted_pending_review") throw new Error("output_documents_must_be_persisted_pending_review");
  if (input.output_document_persistence.next_required_action !== "review_output_documents") throw new Error("output_document_review_action_required");
  if ((input.decision === "rejected" || input.decision === "needs_review") && !input.note?.trim()) throw new Error("output_document_review_note_required");
  if (!input.output_document_persistence.trace_refs.includes(input.output_document_set.release_id)) throw new Error("output_document_review_missing_release_trace");
  if (!input.output_document_persistence.trace_refs.includes(input.output_document_set.document_set_id)) throw new Error("output_document_review_missing_document_set_trace");
}

function createDocumentSetStoragePath(outputDocumentSet: OutputDocumentGenerationResult): string {
  return [
    "project-instances",
    outputDocumentSet.project_instance_id,
    "output-documents",
    outputDocumentSet.document_set_id,
    `${outputDocumentSet.document_set_id}.json`
  ].join("/");
}

function createDocumentStoragePath(outputDocumentSet: OutputDocumentGenerationResult, documentId: string, contentType: string): string {
  const extension = contentType === "application/json" ? "json" : "md";
  return [
    "project-instances",
    outputDocumentSet.project_instance_id,
    "output-documents",
    outputDocumentSet.document_set_id,
    `${documentId}.${extension}`
  ].join("/");
}

function createPersistenceId(documentSetId: string, persistedAt: string): string {
  const stamp = persistedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `PERSIST_${documentSetId}_${stamp}`;
}

function createReviewId(documentSetId: string, reviewedAt: string): string {
  const stamp = reviewedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `OUTPUT_REVIEW_${documentSetId}_${stamp}`;
}
