export const SUPPORTED_EXTRACTION_SCOPES = [
  "sanitary_sewer",
  "storm_drainage",
  "water",
  "paving_concrete",
  "erosion_control",
  "earthwork_agtek_handoff"
] as const;

export type CivilExtractionScope = (typeof SUPPORTED_EXTRACTION_SCOPES)[number];

export interface CivilExtractionCandidateInput {
  candidate_id: string;
  feature_type: string;
  source_sheet_id: string;
  confidence: number;
  trace_refs: string[];
}

export interface CivilExtractionScopeBatchInput {
  extraction_scope: CivilExtractionScope;
  candidates: CivilExtractionCandidateInput[];
}

export interface BuildCivilExtractionCandidatesInput {
  project_instance_id: string;
  source_document_id: string;
  selected_sheet_ids: string[];
  scope_batches: CivilExtractionScopeBatchInput[];
}

export interface CivilExtractionCandidateRecord {
  project_instance_id: string;
  source_document_id: string;
  extraction_scope: CivilExtractionScope;
  candidate_id: string;
  feature_type: string;
  source_sheet_id: string;
  confidence: number;
  trace_refs: string[];
  review_status: "pending";
  data_layer: "project";
  source_origin: "project_upload";
  completeness_claim: "not_claimed";
  quantity_export_ready: false;
}

export interface BuildCivilExtractionCandidatesResult {
  project_instance_id: string;
  source_document_id: string;
  selected_sheet_ids: string[];
  candidates_by_scope: Partial<Record<CivilExtractionScope, CivilExtractionCandidateRecord[]>>;
  all_candidates: CivilExtractionCandidateRecord[];
  takeoff_items: [];
  trace_refs: string[];
}

export function buildCivilExtractionCandidates(input: BuildCivilExtractionCandidatesInput): BuildCivilExtractionCandidatesResult {
  const projectInstanceId = input.project_instance_id?.trim();
  const sourceDocumentId = input.source_document_id?.trim();

  if (!projectInstanceId) throw new Error("project_instance_id_required");
  if (!sourceDocumentId) throw new Error("source_document_id_required");

  const selectedSheetIds = Array.from(new Set(input.selected_sheet_ids.map((sheetId) => sheetId.trim()).filter(Boolean)));
  if (selectedSheetIds.length === 0) throw new Error("selected_sheet_ids_required");

  const selectedSheetSet = new Set(selectedSheetIds);
  const seenCandidateIds = new Set<string>();
  const candidatesByScope: Partial<Record<CivilExtractionScope, CivilExtractionCandidateRecord[]>> = {};
  const allCandidates: CivilExtractionCandidateRecord[] = [];

  for (const batch of input.scope_batches) {
    if (!SUPPORTED_EXTRACTION_SCOPES.includes(batch.extraction_scope)) {
      throw new Error("unsupported_extraction_scope");
    }

    const scoped: CivilExtractionCandidateRecord[] = [];

    for (const candidate of batch.candidates) {
      const candidateId = candidate.candidate_id?.trim();
      const featureType = candidate.feature_type?.trim();
      const sourceSheetId = candidate.source_sheet_id?.trim();

      if (!candidateId) throw new Error("candidate_id_required");
      if (!featureType) throw new Error("feature_type_required");
      if (!sourceSheetId) throw new Error("candidate_source_sheet_id_required");
      if (!selectedSheetSet.has(sourceSheetId)) throw new Error("candidate_sheet_not_selected");
      if (seenCandidateIds.has(candidateId)) throw new Error("duplicate_candidate_id");
      if (!Number.isFinite(candidate.confidence) || candidate.confidence < 0 || candidate.confidence > 1) {
        throw new Error("candidate_confidence_out_of_range");
      }

      seenCandidateIds.add(candidateId);

      const traceRefs = dedupe([
        `project:${projectInstanceId}`,
        `document:${sourceDocumentId}`,
        `sheet:${sourceSheetId}`,
        ...candidate.trace_refs
      ]);

      const record: CivilExtractionCandidateRecord = {
        project_instance_id: projectInstanceId,
        source_document_id: sourceDocumentId,
        extraction_scope: batch.extraction_scope,
        candidate_id: candidateId,
        feature_type: featureType,
        source_sheet_id: sourceSheetId,
        confidence: candidate.confidence,
        trace_refs: traceRefs,
        review_status: "pending",
        data_layer: "project",
        source_origin: "project_upload",
        completeness_claim: "not_claimed",
        quantity_export_ready: false
      };

      scoped.push(record);
      allCandidates.push(record);
    }

    candidatesByScope[batch.extraction_scope] = scoped;
  }

  return {
    project_instance_id: projectInstanceId,
    source_document_id: sourceDocumentId,
    selected_sheet_ids: selectedSheetIds,
    candidates_by_scope: candidatesByScope,
    all_candidates: allCandidates,
    takeoff_items: [],
    trace_refs: dedupe([
      `project:${projectInstanceId}`,
      `document:${sourceDocumentId}`,
      ...selectedSheetIds.map((sheetId) => `sheet:${sheetId}`),
      ...allCandidates.flatMap((candidate) => candidate.trace_refs)
    ])
  };
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}
