import { describe, expect, it } from "vitest";
import { buildCivilExtractionCandidates } from "./civil-extraction-candidates.js";

describe("VS1A shared civil extraction candidate framework", () => {
  it("happy path creates provisional candidates for one scope", () => {
    const result = buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "DOC_001",
      selected_sheet_ids: ["SHEET_C_10"],
      scope_batches: [{
        extraction_scope: "sanitary_sewer",
        candidates: [{
          candidate_id: "CAND_SAN_001",
          feature_type: "sanitary_pipe_run",
          source_sheet_id: "SHEET_C_10",
          confidence: 0.83,
          trace_refs: ["project:PRJ_001", "document:DOC_001", "sheet:SHEET_C_10", "candidate:CAND_SAN_001"]
        }]
      }]
    });

    expect(result.all_candidates).toHaveLength(1);
    expect(result.candidates_by_scope.sanitary_sewer).toHaveLength(1);
    expect(result.all_candidates[0]).toMatchObject({
      extraction_scope: "sanitary_sewer",
      review_status: "pending",
      data_layer: "project",
      source_origin: "project_upload",
      completeness_claim: "not_claimed",
      quantity_export_ready: false
    });
  });

  it("multiple scopes remain separated", () => {
    const result = buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "DOC_001",
      selected_sheet_ids: ["SHEET_U_1", "SHEET_W_1"],
      scope_batches: [
        {
          extraction_scope: "storm_drainage",
          candidates: [{
            candidate_id: "CAND_STRM_001",
            feature_type: "storm_pipe_run",
            source_sheet_id: "SHEET_U_1",
            confidence: 0.62,
            trace_refs: ["candidate:CAND_STRM_001"]
          }]
        },
        {
          extraction_scope: "water",
          candidates: [{
            candidate_id: "CAND_WATER_001",
            feature_type: "water_pipe_run",
            source_sheet_id: "SHEET_W_1",
            confidence: 0.57,
            trace_refs: ["candidate:CAND_WATER_001"]
          }]
        }
      ]
    });

    expect(result.candidates_by_scope.storm_drainage).toHaveLength(1);
    expect(result.candidates_by_scope.water).toHaveLength(1);
    expect(result.candidates_by_scope.storm_drainage?.[0]?.extraction_scope).toBe("storm_drainage");
    expect(result.candidates_by_scope.water?.[0]?.extraction_scope).toBe("water");
  });

  it("rejects duplicate candidate IDs", () => {
    expect(() => buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "DOC_001",
      selected_sheet_ids: ["SHEET_1"],
      scope_batches: [
        {
          extraction_scope: "sanitary_sewer",
          candidates: [{
            candidate_id: "CAND_001",
            feature_type: "sanitary_pipe_run",
            source_sheet_id: "SHEET_1",
            confidence: 0.9,
            trace_refs: []
          }]
        },
        {
          extraction_scope: "storm_drainage",
          candidates: [{
            candidate_id: "CAND_001",
            feature_type: "storm_pipe_run",
            source_sheet_id: "SHEET_1",
            confidence: 0.5,
            trace_refs: []
          }]
        }
      ]
    })).toThrow("duplicate_candidate_id");
  });

  it("rejects candidate referencing unselected sheet", () => {
    expect(() => buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "DOC_001",
      selected_sheet_ids: ["SHEET_ALLOWED"],
      scope_batches: [{
        extraction_scope: "sanitary_sewer",
        candidates: [{
          candidate_id: "CAND_001",
          feature_type: "sanitary_pipe_run",
          source_sheet_id: "SHEET_OTHER",
          confidence: 0.7,
          trace_refs: []
        }]
      }]
    })).toThrow("candidate_sheet_not_selected");
  });

  it("rejects missing selected sheets", () => {
    expect(() => buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "DOC_001",
      selected_sheet_ids: [],
      scope_batches: []
    })).toThrow("selected_sheet_ids_required");
  });

  it("rejects missing project and document identity", () => {
    expect(() => buildCivilExtractionCandidates({
      project_instance_id: "",
      source_document_id: "DOC_001",
      selected_sheet_ids: ["SHEET_1"],
      scope_batches: []
    })).toThrow("project_instance_id_required");

    expect(() => buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "",
      selected_sheet_ids: ["SHEET_1"],
      scope_batches: []
    })).toThrow("source_document_id_required");
  });

  it("rejects unsupported extraction scopes", () => {
    expect(() => buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "DOC_001",
      selected_sheet_ids: ["SHEET_1"],
      scope_batches: [{
        extraction_scope: "landscape" as never,
        candidates: []
      }]
    })).toThrow("unsupported_extraction_scope");
  });

  it("rejects invalid confidence", () => {
    expect(() => buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "DOC_001",
      selected_sheet_ids: ["SHEET_1"],
      scope_batches: [{
        extraction_scope: "sanitary_sewer",
        candidates: [{
          candidate_id: "CAND_001",
          feature_type: "sanitary_pipe_run",
          source_sheet_id: "SHEET_1",
          confidence: 1.2,
          trace_refs: []
        }]
      }]
    })).toThrow("candidate_confidence_out_of_range");
  });

  it("output is not quantity-export-ready", () => {
    const result = buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "DOC_001",
      selected_sheet_ids: ["SHEET_1"],
      scope_batches: [{
        extraction_scope: "sanitary_sewer",
        candidates: [{
          candidate_id: "CAND_001",
          feature_type: "sanitary_pipe_run",
          source_sheet_id: "SHEET_1",
          confidence: 0.8,
          trace_refs: []
        }]
      }]
    });

    expect(result.all_candidates.every((candidate) => candidate.quantity_export_ready === false)).toBe(true);
  });

  it("output makes no completeness claim", () => {
    const result = buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "DOC_001",
      selected_sheet_ids: ["SHEET_1"],
      scope_batches: [{
        extraction_scope: "sanitary_sewer",
        candidates: [{
          candidate_id: "CAND_001",
          feature_type: "sanitary_pipe_run",
          source_sheet_id: "SHEET_1",
          confidence: 0.8,
          trace_refs: []
        }]
      }]
    });

    expect(result.all_candidates.every((candidate) => candidate.completeness_claim === "not_claimed")).toBe(true);
  });

  it("output does not create TakeoffItem records", () => {
    const result = buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "DOC_001",
      selected_sheet_ids: ["SHEET_1"],
      scope_batches: [{
        extraction_scope: "sanitary_sewer",
        candidates: [{
          candidate_id: "CAND_001",
          feature_type: "sanitary_pipe_run",
          source_sheet_id: "SHEET_1",
          confidence: 0.8,
          trace_refs: []
        }]
      }]
    });

    expect(result.takeoff_items).toEqual([]);
  });

  it("sanitary sewer candidate can be represented without claiming full sewer takeoff", () => {
    const result = buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "DOC_001",
      selected_sheet_ids: ["SHEET_SAN_1"],
      scope_batches: [{
        extraction_scope: "sanitary_sewer",
        candidates: [{
          candidate_id: "CAND_SAN_001",
          feature_type: "sanitary_pipe_run",
          source_sheet_id: "SHEET_SAN_1",
          confidence: 0.51,
          trace_refs: []
        }]
      }]
    });

    expect(result.candidates_by_scope.sanitary_sewer?.[0]?.completeness_claim).toBe("not_claimed");
  });

  it("accepts framework scopes for storm/water/paving/erosion/earthwork", () => {
    const result = buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "DOC_001",
      selected_sheet_ids: ["SHEET_1"],
      scope_batches: [
        {
          extraction_scope: "storm_drainage",
          candidates: [{ candidate_id: "C1", feature_type: "storm_pipe_run", source_sheet_id: "SHEET_1", confidence: 0.3, trace_refs: [] }]
        },
        {
          extraction_scope: "water",
          candidates: [{ candidate_id: "C2", feature_type: "water_pipe_run", source_sheet_id: "SHEET_1", confidence: 0.3, trace_refs: [] }]
        },
        {
          extraction_scope: "paving_concrete",
          candidates: [{ candidate_id: "C3", feature_type: "paving_area", source_sheet_id: "SHEET_1", confidence: 0.3, trace_refs: [] }]
        },
        {
          extraction_scope: "erosion_control",
          candidates: [{ candidate_id: "C4", feature_type: "erosion_bmp", source_sheet_id: "SHEET_1", confidence: 0.3, trace_refs: [] }]
        },
        {
          extraction_scope: "earthwork_agtek_handoff",
          candidates: [{ candidate_id: "C5", feature_type: "earthwork_surface", source_sheet_id: "SHEET_1", confidence: 0.3, trace_refs: [] }]
        }
      ]
    });

    expect(result.candidates_by_scope.storm_drainage).toHaveLength(1);
    expect(result.candidates_by_scope.water).toHaveLength(1);
    expect(result.candidates_by_scope.paving_concrete).toHaveLength(1);
    expect(result.candidates_by_scope.erosion_control).toHaveLength(1);
    expect(result.candidates_by_scope.earthwork_agtek_handoff).toHaveLength(1);
  });

  it("preserves project/document/sheet trace refs", () => {
    const result = buildCivilExtractionCandidates({
      project_instance_id: "PRJ_001",
      source_document_id: "DOC_001",
      selected_sheet_ids: ["SHEET_1"],
      scope_batches: [{
        extraction_scope: "sanitary_sewer",
        candidates: [{
          candidate_id: "CAND_001",
          feature_type: "sanitary_pipe_run",
          source_sheet_id: "SHEET_1",
          confidence: 0.75,
          trace_refs: ["project:PRJ_001", "document:DOC_001", "sheet:SHEET_1"]
        }]
      }]
    });

    const candidate = result.all_candidates[0]!;
    expect(candidate.trace_refs).toContain("project:PRJ_001");
    expect(candidate.trace_refs).toContain("document:DOC_001");
    expect(candidate.trace_refs).toContain("sheet:SHEET_1");
  });
});
