import { describe, expect, it } from "vitest";
import { buildSanitarySewerExtractionCandidates } from "./sanitary-sewer-extraction-candidates.js";

describe("VS1A sanitary sewer module extraction candidate builder", () => {
  const baseInput = {
    project_instance_id: "PRJ_SAN_001",
    source_document_id: "DOC_SAN_001",
    selected_sheet_ids: ["C3.10", "C3.11", "P3.01"],
    pipe_runs: [],
    structures: [],
    profile_observations: []
  };

  it("happy path creates provisional sanitary pipe candidate", () => {
    const result = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_001",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.89,
        trace_refs: ["sheet:C3.10", "detail:plan_callout_7"],
        from_structure: "SMH-101",
        to_structure: "SMH-102",
        length_lf: 214,
        diameter_in: 8,
        material_type: "PVC",
        slope_percent: 0.41,
        upstream_invert: 100.2,
        downstream_invert: 99.4,
        upstream_rim: 108.1,
        downstream_rim: 107.2,
        upstream_depth_ft: 7.9,
        downstream_depth_ft: 7.8
      }]
    });

    expect(result.pipe_candidates).toHaveLength(1);
    expect(result.pipe_candidates[0]).toMatchObject({
      candidate_id: "SAN_PIPE_001",
      extraction_scope: "sanitary_sewer",
      review_status: "pending",
      completeness_claim: "not_claimed",
      quantity_export_ready: false,
      candidate_kind: "pipe_run"
    });
  });

  it("structure candidate is accepted and remains provisional", () => {
    const result = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      structures: [{
        candidate_id: "SAN_STR_001",
        feature_type: "sanitary_structure",
        source_sheet_id: "C3.10",
        confidence: 0.74,
        trace_refs: ["sheet:C3.10", "label:SMH-101"],
        structure_id: "SMH-101",
        structure_type: "manhole",
        rim_elevation: 108.1,
        invert_elevations: [100.2, 100.0]
      }]
    });

    expect(result.structure_candidates).toHaveLength(1);
    expect(result.structure_candidates[0]?.review_status).toBe("pending");
    expect(result.structure_candidates[0]?.completeness_claim).toBe("not_claimed");
    expect(result.structure_candidates[0]?.quantity_export_ready).toBe(false);
  });

  it("profile observation candidate is accepted and remains provisional", () => {
    const result = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      profile_observations: [{
        candidate_id: "SAN_PROF_001",
        feature_type: "sanitary_profile_observation",
        source_sheet_id: "C3.11",
        confidence: 0.77,
        trace_refs: ["sheet:C3.11", "profile:obs-2"],
        profile_sheet_id: "P3.01",
        station_start: "10+00",
        station_end: "12+14",
        invert_notes: "drop at MH-101",
        rim_notes: "rim ties to FG",
        depth_notes: "depth increases downstream"
      }]
    });

    expect(result.profile_candidates).toHaveLength(1);
    expect(result.profile_candidates[0]?.review_status).toBe("pending");
    expect(result.profile_candidates[0]?.completeness_claim).toBe("not_claimed");
    expect(result.profile_candidates[0]?.quantity_export_ready).toBe(false);
  });

  it("pipe, structure, and profile candidates remain separated", () => {
    const result = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_010",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.8,
        trace_refs: ["sheet:C3.10"],
        from_structure: "SMH-1",
        to_structure: "SMH-2"
      }],
      structures: [{
        candidate_id: "SAN_STR_010",
        feature_type: "sanitary_structure",
        source_sheet_id: "C3.10",
        confidence: 0.7,
        trace_refs: ["sheet:C3.10"],
        structure_id: "SMH-1"
      }],
      profile_observations: [{
        candidate_id: "SAN_PROF_010",
        feature_type: "sanitary_profile_observation",
        source_sheet_id: "C3.11",
        confidence: 0.6,
        trace_refs: ["sheet:C3.11"],
        profile_sheet_id: "P3.01"
      }]
    });

    expect(result.pipe_candidates).toHaveLength(1);
    expect(result.structure_candidates).toHaveLength(1);
    expect(result.profile_candidates).toHaveLength(1);
    expect(result.civil_extraction.candidates_by_scope.sanitary_sewer).toHaveLength(3);
  });

  it("output delegates to shared civil extraction candidate framework", () => {
    const result = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_020",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.51,
        trace_refs: ["sheet:C3.10"],
        from_structure: "SMH-A",
        to_structure: "SMH-B"
      }]
    });

    expect(result.civil_extraction.all_candidates).toHaveLength(1);
    expect(result.civil_extraction.all_candidates[0]?.candidate_id).toBe(result.pipe_candidates[0]?.candidate_id);
    expect(result.civil_extraction.all_candidates[0]?.extraction_scope).toBe("sanitary_sewer");
  });

  it("rejects duplicate sanitary candidate IDs", () => {
    expect(() => buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_DUP_001",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.7,
        trace_refs: ["sheet:C3.10"],
        from_structure: "SMH-A",
        to_structure: "SMH-B"
      }],
      structures: [{
        candidate_id: "SAN_DUP_001",
        feature_type: "sanitary_structure",
        source_sheet_id: "C3.10",
        confidence: 0.7,
        trace_refs: ["sheet:C3.10"]
      }]
    })).toThrow("duplicate_candidate_id");
  });

  it("rejects candidate referencing unselected sheet", () => {
    expect(() => buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_BAD_SHEET",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C9.99",
        confidence: 0.7,
        trace_refs: ["sheet:C9.99"],
        from_structure: "SMH-A",
        to_structure: "SMH-B"
      }]
    })).toThrow("candidate_sheet_not_selected");
  });

  it("rejects invalid confidence", () => {
    expect(() => buildSanitarySewerExtractionCandidates({
      ...baseInput,
      structures: [{
        candidate_id: "SAN_STR_BAD_CONF",
        feature_type: "sanitary_structure",
        source_sheet_id: "C3.10",
        confidence: -0.1,
        trace_refs: ["sheet:C3.10"]
      }]
    })).toThrow("candidate_confidence_out_of_range");
  });

  it("rejects nonpositive length and diameter when provided", () => {
    expect(() => buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_BAD_LEN",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.7,
        trace_refs: ["sheet:C3.10"],
        from_structure: "SMH-A",
        to_structure: "SMH-B",
        length_lf: 0
      }]
    })).toThrow("sanitary_pipe_length_nonpositive");

    expect(() => buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_BAD_DIA",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.7,
        trace_refs: ["sheet:C3.10"],
        from_structure: "SMH-A",
        to_structure: "SMH-B",
        diameter_in: -8
      }]
    })).toThrow("sanitary_pipe_diameter_nonpositive");
  });

  it("output does not create TakeoffItem records", () => {
    const result = buildSanitarySewerExtractionCandidates(baseInput);
    expect(result.takeoff_items).toEqual([]);
    expect(result.civil_extraction.takeoff_items).toEqual([]);
  });

  it("output does not create quantity summary/export", () => {
    const result = buildSanitarySewerExtractionCandidates(baseInput);
    expect(result.quantity_summaries).toEqual([]);
    expect(result.quantity_exports).toEqual([]);
  });

  it("output makes no completeness claim", () => {
    const result = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      structures: [{
        candidate_id: "SAN_STR_200",
        feature_type: "sanitary_structure",
        source_sheet_id: "C3.10",
        confidence: 0.8,
        trace_refs: ["sheet:C3.10"]
      }]
    });

    expect(result.civil_extraction.all_candidates.every((candidate) => candidate.completeness_claim === "not_claimed")).toBe(true);
  });

  it("output is not quantity-export-ready", () => {
    const result = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      profile_observations: [{
        candidate_id: "SAN_PROF_201",
        feature_type: "sanitary_profile_observation",
        source_sheet_id: "C3.11",
        confidence: 0.8,
        trace_refs: ["sheet:C3.11"]
      }]
    });

    expect(result.civil_extraction.all_candidates.every((candidate) => candidate.quantity_export_ready === false)).toBe(true);
  });

  it("plan/profile trace refs are preserved", () => {
    const result = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_TRACE",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.9,
        trace_refs: ["sheet:C3.10", "profile:P3.01", "note:station_10+50"],
        from_structure: "SMH-A",
        to_structure: "SMH-B"
      }]
    });

    expect(result.pipe_candidates[0]?.trace_refs).toEqual(
      expect.arrayContaining(["sheet:C3.10", "profile:P3.01", "note:station_10+50"])
    );
  });

  it("rejects pipe runs missing both endpoint identity and traceability", () => {
    expect(() => buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_BAD_TRACE",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.6,
        trace_refs: []
      }]
    })).toThrow("sanitary_pipe_endpoint_or_trace_required");
  });
});
