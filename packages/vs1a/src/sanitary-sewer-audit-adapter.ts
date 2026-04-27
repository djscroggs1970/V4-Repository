import type { SewerExtractionAuditCandidateInput } from "./sewer-extraction-audit.js";
import type { BuildSanitarySewerExtractionCandidatesResult, SanitaryPipeRunCandidateRecord } from "./sanitary-sewer-extraction-candidates.js";

export interface SanitarySewerAuditAdapterCandidateInput extends SewerExtractionAuditCandidateInput {
  trace_refs: string[];
}

export interface BuildSanitarySewerAuditAdapterResult {
  project_instance_id: string;
  source_document_id: string;
  drawing_sheet_index: Array<{ source_sheet_id: string }>;
  audit_candidates: SanitarySewerAuditAdapterCandidateInput[];
  source_candidate_ids: string[];
  skipped_context_candidate_ids: string[];
  completeness_claim: "not_claimed";
  audit_ready: boolean;
  next_required_action: "run_sewer_extraction_audit" | "add_pipe_candidates_before_audit";
  takeoff_items: [];
  quantity_summaries: [];
  quantity_exports: [];
}

export function buildSanitarySewerAuditAdapterResult(
  input: BuildSanitarySewerExtractionCandidatesResult
): BuildSanitarySewerAuditAdapterResult {
  assertInputConsistency(input);
  const drawing_sheet_index = dedupe(input.selected_sheet_ids.map((sheetId) => sheetId.trim()).filter(Boolean)).map((sheetId) => ({ source_sheet_id: sheetId }));
  if (drawing_sheet_index.length === 0) throw new Error("adapter_selected_sheet_ids_required");

  const seenAuditCandidateIds = new Set<string>();
  const audit_candidates = input.pipe_candidates.map((candidate) => {
    assertPipeCandidate(candidate, input, seenAuditCandidateIds);
    return toAuditCandidateInput(candidate);
  });

  const source_candidate_ids = dedupe([
    ...input.pipe_candidates.map((candidate) => candidate.candidate_id),
    ...input.structure_candidates.map((candidate) => candidate.candidate_id),
    ...input.profile_candidates.map((candidate) => candidate.candidate_id)
  ]);

  const skipped_context_candidate_ids = dedupe([
    ...input.structure_candidates.map((candidate) => candidate.candidate_id),
    ...input.profile_candidates.map((candidate) => candidate.candidate_id)
  ]);

  return {
    project_instance_id: input.project_instance_id,
    source_document_id: input.source_document_id,
    drawing_sheet_index,
    audit_candidates,
    source_candidate_ids,
    skipped_context_candidate_ids,
    completeness_claim: "not_claimed",
    audit_ready: audit_candidates.length > 0,
    next_required_action: audit_candidates.length > 0 ? "run_sewer_extraction_audit" : "add_pipe_candidates_before_audit",
    takeoff_items: [],
    quantity_summaries: [],
    quantity_exports: []
  };
}

function assertInputConsistency(input: BuildSanitarySewerExtractionCandidatesResult): void {
  const projectInstanceId = input.project_instance_id?.trim();
  const sourceDocumentId = input.source_document_id?.trim();
  if (!projectInstanceId) throw new Error("adapter_project_instance_id_required");
  if (!sourceDocumentId) throw new Error("adapter_source_document_id_required");

  const allCandidates = [...input.pipe_candidates, ...input.structure_candidates, ...input.profile_candidates];
  for (const candidate of allCandidates) {
    if (candidate.project_instance_id !== projectInstanceId) throw new Error("adapter_project_instance_id_mismatch");
    if (candidate.source_document_id !== sourceDocumentId) throw new Error("adapter_source_document_id_mismatch");
  }
}

function assertPipeCandidate(
  candidate: SanitaryPipeRunCandidateRecord,
  input: BuildSanitarySewerExtractionCandidatesResult,
  seenAuditCandidateIds: Set<string>
): void {
  if (candidate.extraction_scope !== "sanitary_sewer") throw new Error("adapter_non_sanitary_scope");
  if (candidate.quantity_export_ready) throw new Error("adapter_candidate_quantity_export_ready");
  if (candidate.completeness_claim !== "not_claimed") throw new Error("adapter_candidate_completeness_claim_invalid");
  if (!candidate.candidate_id.trim()) throw new Error("adapter_candidate_id_required");
  if (seenAuditCandidateIds.has(candidate.candidate_id)) throw new Error("adapter_duplicate_audit_candidate_id");
  if (candidate.project_instance_id !== input.project_instance_id) throw new Error("adapter_project_instance_id_mismatch");
  if (candidate.source_document_id !== input.source_document_id) throw new Error("adapter_source_document_id_mismatch");
  if (!candidate.source_sheet_id.trim()) throw new Error("adapter_source_sheet_id_required");
  if (!input.selected_sheet_ids.includes(candidate.source_sheet_id)) throw new Error("adapter_candidate_sheet_not_selected");
  if (candidate.trace_refs.length === 0) throw new Error("adapter_trace_refs_required");

  seenAuditCandidateIds.add(candidate.candidate_id);
}

function toAuditCandidateInput(candidate: SanitaryPipeRunCandidateRecord): SanitarySewerAuditAdapterCandidateInput {
  const traceRefs = dedupe(candidate.trace_refs.map((traceRef) => traceRef.trim()).filter(Boolean));
  const classifierTextHints = traceRefs
    .map((traceRef) => ["excerpt:", "note:", "profile:", "detail:", "label:"].find((prefix) => traceRef.startsWith(prefix)) ? traceRef.split(":").slice(1).join(":") : undefined)
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" | ");

  const endpointNotes = [candidate.sanitary_data.from_structure, candidate.sanitary_data.to_structure].filter((value): value is string => Boolean(value));
  const notes = dedupe([
    `candidate_kind:${candidate.candidate_kind}`,
    ...endpointNotes.map((value, index) => `${index === 0 ? "from_structure" : "to_structure"}:${value}`),
    ...traceRefs
  ]).join(" | ");

  return {
    candidate_id: candidate.candidate_id,
    project_instance_id: candidate.project_instance_id,
    source_document_id: candidate.source_document_id,
    source_sheet_id: candidate.source_sheet_id,
    source_page_label: candidate.source_sheet_id,
    source_excerpt: classifierTextHints || candidate.feature_type,
    feature_label: candidate.feature_type,
    material_type: candidate.sanitary_data.material_type,
    diameter_in: candidate.sanitary_data.diameter_in,
    length_lf: candidate.sanitary_data.length_lf,
    slope_percent: candidate.sanitary_data.slope_percent,
    upstream_depth_ft: candidate.sanitary_data.upstream_depth_ft,
    downstream_depth_ft: candidate.sanitary_data.downstream_depth_ft,
    confidence: candidate.confidence,
    notes,
    trace_refs: traceRefs
  };
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}
