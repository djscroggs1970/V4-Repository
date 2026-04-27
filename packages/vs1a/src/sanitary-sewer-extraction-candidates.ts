import {
  buildCivilExtractionCandidates,
  type BuildCivilExtractionCandidatesResult,
  type CivilExtractionCandidateRecord,
  type CivilExtractionCandidateInput
} from "./civil-extraction-candidates.js";

interface SanitaryCandidateCommonInput {
  candidate_id: string;
  feature_type: string;
  source_sheet_id: string;
  confidence: number;
  trace_refs: string[];
}

export interface SanitaryPipeRunCandidateInput extends SanitaryCandidateCommonInput {
  from_structure?: string;
  to_structure?: string;
  length_lf?: number;
  diameter_in?: number;
  material_type?: string;
  slope_percent?: number;
  upstream_invert?: number;
  downstream_invert?: number;
  upstream_rim?: number;
  downstream_rim?: number;
  upstream_depth_ft?: number;
  downstream_depth_ft?: number;
}

export interface SanitaryStructureCandidateInput extends SanitaryCandidateCommonInput {
  structure_id?: string;
  structure_type?: string;
  rim_elevation?: number;
  invert_elevations?: number[];
}

export interface SanitaryProfileObservationCandidateInput extends SanitaryCandidateCommonInput {
  profile_sheet_id?: string;
  station_start?: string;
  station_end?: string;
  invert_notes?: string;
  rim_notes?: string;
  depth_notes?: string;
}

export interface BuildSanitarySewerExtractionCandidatesInput {
  project_instance_id: string;
  source_document_id: string;
  selected_sheet_ids: string[];
  pipe_runs: SanitaryPipeRunCandidateInput[];
  structures: SanitaryStructureCandidateInput[];
  profile_observations: SanitaryProfileObservationCandidateInput[];
}

export interface SanitaryPipeRunCandidateRecord extends CivilExtractionCandidateRecord {
  candidate_kind: "pipe_run";
  sanitary_data: Omit<SanitaryPipeRunCandidateInput, keyof SanitaryCandidateCommonInput>;
}

export interface SanitaryStructureCandidateRecord extends CivilExtractionCandidateRecord {
  candidate_kind: "structure";
  sanitary_data: Omit<SanitaryStructureCandidateInput, keyof SanitaryCandidateCommonInput>;
}

export interface SanitaryProfileObservationCandidateRecord extends CivilExtractionCandidateRecord {
  candidate_kind: "profile_observation";
  sanitary_data: Omit<SanitaryProfileObservationCandidateInput, keyof SanitaryCandidateCommonInput>;
}

export interface BuildSanitarySewerExtractionCandidatesResult {
  project_instance_id: string;
  source_document_id: string;
  selected_sheet_ids: string[];
  pipe_candidates: SanitaryPipeRunCandidateRecord[];
  structure_candidates: SanitaryStructureCandidateRecord[];
  profile_candidates: SanitaryProfileObservationCandidateRecord[];
  civil_extraction: BuildCivilExtractionCandidatesResult;
  takeoff_items: [];
  quantity_summaries: [];
  quantity_exports: [];
}

export function buildSanitarySewerExtractionCandidates(
  input: BuildSanitarySewerExtractionCandidatesInput
): BuildSanitarySewerExtractionCandidatesResult {
  const selectedSheetSet = new Set(input.selected_sheet_ids.map((sheetId) => sheetId.trim()).filter(Boolean));
  const seenCandidateIds = new Set<string>();

  const pipeCandidates = input.pipe_runs.map((candidate) => {
    const normalized = normalizeCommonCandidate(candidate, selectedSheetSet, seenCandidateIds);
    const fromStructure = candidate.from_structure?.trim();
    const toStructure = candidate.to_structure?.trim();

    if (!fromStructure && !toStructure && normalized.trace_refs.length === 0) {
      throw new Error("sanitary_pipe_endpoint_or_trace_required");
    }
    if (candidate.length_lf !== undefined && candidate.length_lf <= 0) {
      throw new Error("sanitary_pipe_length_nonpositive");
    }
    if (candidate.diameter_in !== undefined && candidate.diameter_in <= 0) {
      throw new Error("sanitary_pipe_diameter_nonpositive");
    }

    return {
      civil: normalized,
      sanitary_data: {
        from_structure: fromStructure,
        to_structure: toStructure,
        length_lf: candidate.length_lf,
        diameter_in: candidate.diameter_in,
        material_type: candidate.material_type?.trim(),
        slope_percent: candidate.slope_percent,
        upstream_invert: candidate.upstream_invert,
        downstream_invert: candidate.downstream_invert,
        upstream_rim: candidate.upstream_rim,
        downstream_rim: candidate.downstream_rim,
        upstream_depth_ft: candidate.upstream_depth_ft,
        downstream_depth_ft: candidate.downstream_depth_ft
      }
    };
  });

  const structureCandidates = input.structures.map((candidate) => ({
    civil: normalizeCommonCandidate(candidate, selectedSheetSet, seenCandidateIds),
    sanitary_data: {
      structure_id: candidate.structure_id?.trim(),
      structure_type: candidate.structure_type?.trim(),
      rim_elevation: candidate.rim_elevation,
      invert_elevations: candidate.invert_elevations
    }
  }));

  const profileCandidates = input.profile_observations.map((candidate) => {
    const normalized = normalizeCommonCandidate(candidate, selectedSheetSet, seenCandidateIds);
    const profileSheetId = candidate.profile_sheet_id?.trim();

    if (profileSheetId && !selectedSheetSet.has(profileSheetId)) {
      throw new Error("candidate_sheet_not_selected");
    }

    return {
      civil: normalized,
      sanitary_data: {
        profile_sheet_id: profileSheetId,
        station_start: candidate.station_start?.trim(),
        station_end: candidate.station_end?.trim(),
        invert_notes: candidate.invert_notes?.trim(),
        rim_notes: candidate.rim_notes?.trim(),
        depth_notes: candidate.depth_notes?.trim()
      }
    };
  });

  const civilCandidates: CivilExtractionCandidateInput[] = [
    ...pipeCandidates.map((candidate) => candidate.civil),
    ...structureCandidates.map((candidate) => candidate.civil),
    ...profileCandidates.map((candidate) => candidate.civil)
  ];

  const civilExtraction = buildCivilExtractionCandidates({
    project_instance_id: input.project_instance_id,
    source_document_id: input.source_document_id,
    selected_sheet_ids: input.selected_sheet_ids,
    scope_batches: [{ extraction_scope: "sanitary_sewer", candidates: civilCandidates }]
  });

  const byId = new Map(civilExtraction.all_candidates.map((candidate) => [candidate.candidate_id, candidate]));

  return {
    project_instance_id: civilExtraction.project_instance_id,
    source_document_id: civilExtraction.source_document_id,
    selected_sheet_ids: civilExtraction.selected_sheet_ids,
    pipe_candidates: pipeCandidates.map((candidate) => ({
      ...mustGetCandidate(byId, candidate.civil.candidate_id),
      candidate_kind: "pipe_run",
      sanitary_data: candidate.sanitary_data
    })),
    structure_candidates: structureCandidates.map((candidate) => ({
      ...mustGetCandidate(byId, candidate.civil.candidate_id),
      candidate_kind: "structure",
      sanitary_data: candidate.sanitary_data
    })),
    profile_candidates: profileCandidates.map((candidate) => ({
      ...mustGetCandidate(byId, candidate.civil.candidate_id),
      candidate_kind: "profile_observation",
      sanitary_data: candidate.sanitary_data
    })),
    civil_extraction: civilExtraction,
    takeoff_items: [],
    quantity_summaries: [],
    quantity_exports: []
  };
}

function normalizeCommonCandidate(
  candidate: SanitaryCandidateCommonInput,
  selectedSheetSet: Set<string>,
  seenCandidateIds: Set<string>
): CivilExtractionCandidateInput {
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

  return {
    candidate_id: candidateId,
    feature_type: featureType,
    source_sheet_id: sourceSheetId,
    confidence: candidate.confidence,
    trace_refs: dedupe(candidate.trace_refs.map((traceRef) => traceRef.trim()).filter(Boolean))
  };
}

function mustGetCandidate(byId: Map<string, CivilExtractionCandidateRecord>, candidateId: string): CivilExtractionCandidateRecord {
  const candidate = byId.get(candidateId);
  if (!candidate) throw new Error("missing_shared_candidate_record");
  return candidate;
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}
