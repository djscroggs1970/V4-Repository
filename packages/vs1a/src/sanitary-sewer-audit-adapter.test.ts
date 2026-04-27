import { describe, expect, it } from "vitest";
import { buildSewerExtractionAuditResult } from "./sewer-extraction-audit.js";
import { buildSanitarySewerAuditAdapterResult } from "./sanitary-sewer-audit-adapter.js";
import { buildSanitarySewerExtractionCandidates } from "./sanitary-sewer-extraction-candidates.js";

describe("VS1A sanitary sewer candidate audit adapter", () => {
  const baseInput = {
    project_instance_id: "PRJ_SAN_ADAPT_001",
    source_document_id: "DOC_SAN_ADAPT_001",
    selected_sheet_ids: ["C3.10", "C3.11", "P3.01"],
    pipe_runs: [],
    structures: [],
    profile_observations: []
  };

  it("happy path converts sanitary pipe candidate into audit candidate input", () => {
    const candidates = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_ADAPT_001",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.91,
        trace_refs: ["sheet:C3.10", "excerpt:8-IN SANITARY SEWER", "detail:plan_callout_1"],
        from_structure: "SMH-101",
        to_structure: "SMH-102",
        material_type: "PVC",
        diameter_in: 8,
        length_lf: 120,
        slope_percent: 0.4,
        upstream_depth_ft: 9.8,
        downstream_depth_ft: 8.9
      }]
    });

    const result = buildSanitarySewerAuditAdapterResult(candidates);
    expect(result.audit_candidates).toHaveLength(1);
    expect(result.audit_candidates[0]).toMatchObject({
      candidate_id: "SAN_PIPE_ADAPT_001",
      project_instance_id: "PRJ_SAN_ADAPT_001",
      source_document_id: "DOC_SAN_ADAPT_001",
      source_sheet_id: "C3.10",
      material_type: "PVC",
      diameter_in: 8,
      length_lf: 120,
      slope_percent: 0.4,
      upstream_depth_ft: 9.8,
      downstream_depth_ft: 8.9,
      confidence: 0.91,
      trace_refs: ["document:DOC_SAN_ADAPT_001", "sheet:C3.10", "excerpt:8-IN SANITARY SEWER", "detail:plan_callout_1", "project:PRJ_SAN_ADAPT_001"]
    });
    expect(result.audit_ready).toBe(true);
    expect(result.next_required_action).toBe("run_sewer_extraction_audit");
  });

  it("drawing sheet index is built from selected sheets", () => {
    const candidates = buildSanitarySewerExtractionCandidates(baseInput);
    const result = buildSanitarySewerAuditAdapterResult(candidates);
    expect(result.drawing_sheet_index).toEqual([
      { source_sheet_id: "C3.10" },
      { source_sheet_id: "C3.11" },
      { source_sheet_id: "P3.01" }
    ]);
  });

  it("structure/profile candidates are skipped as context, not converted into found pipe runs", () => {
    const candidates = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      structures: [{
        candidate_id: "SAN_STR_ADAPT_001",
        feature_type: "sanitary_structure",
        source_sheet_id: "C3.10",
        confidence: 0.6,
        trace_refs: ["sheet:C3.10", "label:SMH-101"],
        structure_id: "SMH-101"
      }],
      profile_observations: [{
        candidate_id: "SAN_PROF_ADAPT_001",
        feature_type: "sanitary_profile_observation",
        source_sheet_id: "C3.11",
        confidence: 0.65,
        trace_refs: ["sheet:C3.11", "note:station_10+50"],
        profile_sheet_id: "P3.01"
      }]
    });

    const result = buildSanitarySewerAuditAdapterResult(candidates);
    expect(result.audit_candidates).toHaveLength(0);
    expect(result.skipped_context_candidate_ids).toEqual(["SAN_STR_ADAPT_001", "SAN_PROF_ADAPT_001"]);
    expect(result.audit_ready).toBe(false);
    expect(result.next_required_action).toBe("add_pipe_candidates_before_audit");
  });

  it("adapter keeps completeness_claim not_claimed and does not create takeoff or exports", () => {
    const candidates = buildSanitarySewerExtractionCandidates(baseInput);
    const result = buildSanitarySewerAuditAdapterResult(candidates);

    expect(result.completeness_claim).toBe("not_claimed");
    expect(result.takeoff_items).toEqual([]);
    expect(result.quantity_summaries).toEqual([]);
    expect(result.quantity_exports).toEqual([]);
  });

  it("adapter does not call promotion/handoff and remains adapter-only output", () => {
    const candidates = buildSanitarySewerExtractionCandidates(baseInput);
    const result = buildSanitarySewerAuditAdapterResult(candidates);
    expect("promoted_candidates" in result).toBe(false);
    expect("takeoff_candidate_handoff" in result).toBe(false);
  });

  it("rejects duplicate audit candidate IDs", () => {
    const candidates = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "DUP_PIPE_SOURCE",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.7,
        trace_refs: ["sheet:C3.10"],
        from_structure: "SMH-A",
        to_structure: "SMH-B"
      }]
    });
    candidates.pipe_candidates = [
      {
        ...candidates.pipe_candidates[0],
        candidate_id: "DUP_PIPE_ID"
      },
      {
        ...candidates.pipe_candidates[0],
        candidate_id: "DUP_PIPE_ID"
      }
    ];

    expect(() => buildSanitarySewerAuditAdapterResult(candidates)).toThrow("adapter_duplicate_audit_candidate_id");
  });

  it("rejects missing trace refs", () => {
    const candidates = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_TRACE_REQUIRED",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.7,
        trace_refs: ["sheet:C3.10"],
        from_structure: "SMH-A",
        to_structure: "SMH-B"
      }]
    });

    candidates.pipe_candidates[0] = {
      ...candidates.pipe_candidates[0],
      trace_refs: []
    };

    expect(() => buildSanitarySewerAuditAdapterResult(candidates)).toThrow("adapter_trace_refs_required");
  });

  it("rejects non-sanitary scope", () => {
    const candidates = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_SCOPE",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.8,
        trace_refs: ["sheet:C3.10"],
        from_structure: "SMH-A",
        to_structure: "SMH-B"
      }]
    });

    candidates.pipe_candidates[0] = {
      ...candidates.pipe_candidates[0],
      extraction_scope: "storm_drainage"
    } as never;

    expect(() => buildSanitarySewerAuditAdapterResult(candidates)).toThrow("adapter_non_sanitary_scope");
  });

  it("rejects quantity-export-ready candidate", () => {
    const candidates = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_QTY_READY",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.8,
        trace_refs: ["sheet:C3.10"],
        from_structure: "SMH-A",
        to_structure: "SMH-B"
      }]
    });

    candidates.pipe_candidates[0] = {
      ...candidates.pipe_candidates[0],
      quantity_export_ready: true
    } as never;

    expect(() => buildSanitarySewerAuditAdapterResult(candidates)).toThrow("adapter_candidate_quantity_export_ready");
  });

  it("rejects candidate with completeness claim other than not_claimed", () => {
    const candidates = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_CLAIM",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.8,
        trace_refs: ["sheet:C3.10"],
        from_structure: "SMH-A",
        to_structure: "SMH-B"
      }]
    });

    candidates.pipe_candidates[0] = {
      ...candidates.pipe_candidates[0],
      completeness_claim: "partial"
    } as never;

    expect(() => buildSanitarySewerAuditAdapterResult(candidates)).toThrow("adapter_candidate_completeness_claim_invalid");
  });

  it("rejects project/document mismatch", () => {
    const candidates = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_MISMATCH",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.7,
        trace_refs: ["sheet:C3.10"],
        from_structure: "SMH-A",
        to_structure: "SMH-B"
      }]
    });

    candidates.pipe_candidates[0] = {
      ...candidates.pipe_candidates[0],
      project_instance_id: "PRJ_OTHER"
    };
    expect(() => buildSanitarySewerAuditAdapterResult(candidates)).toThrow("adapter_project_instance_id_mismatch");
  });

  it("pipe fields and trace refs are preserved", () => {
    const candidates = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_PRESERVE",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.73,
        trace_refs: ["sheet:C3.10", "note:sanitary_profile_confirmed"],
        material_type: "DIP",
        diameter_in: 10,
        length_lf: 88,
        slope_percent: 0.2,
        upstream_depth_ft: 6.5,
        downstream_depth_ft: 5.5,
        from_structure: "SMH-1",
        to_structure: "SMH-2"
      }]
    });

    const result = buildSanitarySewerAuditAdapterResult(candidates);
    expect(result.audit_candidates[0]).toMatchObject({
      material_type: "DIP",
      diameter_in: 10,
      length_lf: 88,
      slope_percent: 0.2,
      upstream_depth_ft: 6.5,
      downstream_depth_ft: 5.5,
      confidence: 0.73,
      trace_refs: ["document:DOC_SAN_ADAPT_001", "sheet:C3.10", "note:sanitary_profile_confirmed", "project:PRJ_SAN_ADAPT_001"]
    });
  });

  it("output can be passed into buildSewerExtractionAuditResult without bypassing human review", () => {
    const candidates = buildSanitarySewerExtractionCandidates({
      ...baseInput,
      pipe_runs: [{
        candidate_id: "SAN_PIPE_TO_AUDIT",
        feature_type: "sanitary_pipe_run",
        source_sheet_id: "C3.10",
        confidence: 0.85,
        trace_refs: ["sheet:C3.10", "excerpt:8-IN SANITARY SEWER"],
        material_type: "PVC",
        diameter_in: 8,
        length_lf: 40,
        from_structure: "SMH-1",
        to_structure: "SMH-2"
      }]
    });

    const adapted = buildSanitarySewerAuditAdapterResult(candidates);
    const auditResult = buildSewerExtractionAuditResult({
      project_instance_id: adapted.project_instance_id,
      source_document_id: adapted.source_document_id,
      drawing_sheet_index: adapted.drawing_sheet_index,
      candidates: adapted.audit_candidates
    });

    expect(auditResult.records).toHaveLength(1);
    expect(auditResult.records[0]?.requires_human_review).toBe(true);
    expect(auditResult.completeness_claim).toBe("not_claimed");
    expect(auditResult.next_required_action).toBe("human_review_audit_findings");
  });
});
