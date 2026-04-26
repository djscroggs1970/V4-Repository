import { describe, expect, it } from "vitest";
import { buildSewerExtractionAuditResult } from "./sewer-extraction-audit.js";

const BASE_INPUT = {
  project_instance_id: "PRJ_AUDIT_001",
  source_document_id: "DOC_AUDIT_001",
  drawing_sheet_index: [
    { drawing_sheet_id: "SHEET_C_50" },
    { drawing_sheet_id: "SHEET_C_51" }
  ]
};

describe("VS1A sewer extraction completeness audit harness", () => {
  it("classifies a found sanitary profile run", () => {
    const result = buildSewerExtractionAuditResult({
      ...BASE_INPUT,
      candidates: [
        {
          candidate_id: "CAND-001",
          project_instance_id: "PRJ_AUDIT_001",
          source_document_id: "DOC_AUDIT_001",
          source_sheet_id: "SHEET_C_51",
          source_page_label: "C-51",
          source_excerpt: "36 LF 8-IN SANITARY SEWER @ 0.50%",
          feature_label: "Sanitary profile run",
          material_type: "PVC_C900_DR18",
          diameter_in: 8,
          length_lf: 36,
          slope_percent: 0.5,
          confidence: 0.92
        }
      ]
    });

    expect(result.records[0]?.decision).toBe("found_sewer_run");
    expect(result.records[0]?.reason_codes).toContain("strong_sewer_indicator_with_required_attributes");
    expect(result.records[0]?.confidence_band).toBe("high");
    expect(result.counts.found_sewer_run).toBe(1);
  });

  it("classifies ambiguous utility line as uncertain", () => {
    const result = buildSewerExtractionAuditResult({
      ...BASE_INPUT,
      candidates: [
        {
          candidate_id: "CAND-002",
          project_instance_id: "PRJ_AUDIT_001",
          source_document_id: "DOC_AUDIT_001",
          source_sheet_id: "SHEET_C_50",
          source_page_label: "C-50",
          source_excerpt: "utility crossing at station 10+00",
          feature_label: "possible sewer run",
          confidence: 0.61
        }
      ]
    });

    expect(result.records[0]?.decision).toBe("uncertain_sewer_candidate");
    expect(result.records[0]?.reason_codes).toContain("partial_or_ambiguous_sewer_attributes");
    expect(result.records[0]?.confidence_band).toBe("medium");
  });

  it("classifies storm and water lines as excluded non-sewer", () => {
    const result = buildSewerExtractionAuditResult({
      ...BASE_INPUT,
      candidates: [
        {
          candidate_id: "CAND-003",
          project_instance_id: "PRJ_AUDIT_001",
          source_document_id: "DOC_AUDIT_001",
          source_sheet_id: "SHEET_C_50",
          source_page_label: "C-50",
          source_excerpt: "12-IN STORM DRAIN LINE",
          feature_label: "storm utility"
        },
        {
          candidate_id: "CAND-004",
          project_instance_id: "PRJ_AUDIT_001",
          source_document_id: "DOC_AUDIT_001",
          source_sheet_id: "SHEET_C_50",
          source_page_label: "C-50",
          source_excerpt: "8-IN DOMESTIC WATER MAIN",
          feature_label: "water utility"
        }
      ]
    });

    expect(result.records.every((record) => record.decision === "excluded_non_sewer_item")).toBe(true);
    expect(result.records.every((record) => record.reason_codes.includes("strong_non_sewer_indicator"))).toBe(true);
    expect(result.counts.excluded_non_sewer_item).toBe(2);
  });

  it("classifies contradiction or missing critical source references as unresolved", () => {
    const result = buildSewerExtractionAuditResult({
      ...BASE_INPUT,
      candidates: [
        {
          candidate_id: "CAND-005",
          project_instance_id: "PRJ_AUDIT_001",
          source_document_id: "DOC_AUDIT_001",
          source_sheet_id: "SHEET_C_51",
          source_page_label: "C-51",
          source_excerpt: "SANITARY STORM TIE-IN",
          feature_label: "sanitary storm"
        },
        {
          candidate_id: "CAND-006",
          project_instance_id: "PRJ_AUDIT_001",
          source_document_id: "DOC_AUDIT_001",
          source_sheet_id: "SHEET_C_51",
          feature_label: "sanitary run with missing trace"
        }
      ]
    });

    expect(result.records.every((record) => record.decision === "unresolved_plan_question")).toBe(true);
    expect(result.records[0]?.reason_codes).toContain("contradictory_utility_signals");
    expect(result.records[1]?.reason_codes).toContain("missing_critical_source_reference");
    expect(result.counts.unresolved_plan_question).toBe(2);
  });

  it("does not treat ordinary words containing ss as sewer indicators", () => {
    const result = buildSewerExtractionAuditResult({
      ...BASE_INPUT,
      candidates: [
        {
          candidate_id: "CAND-SS-FALSE-POSITIVE",
          project_instance_id: "PRJ_AUDIT_001",
          source_document_id: "DOC_AUDIT_001",
          source_sheet_id: "SHEET_C_50",
          source_page_label: "C-50",
          source_excerpt: "cross access easement near utility corridor",
          feature_label: "access note"
        }
      ]
    });

    expect(result.records[0]?.decision).toBe("uncertain_sewer_candidate");
    expect(result.records[0]?.reason_codes).toContain("insufficient_signal_for_sewer_classification");
  });

  it("rejects unknown sheet ids", () => {
    expect(() => buildSewerExtractionAuditResult({
      ...BASE_INPUT,
      candidates: [
        {
          candidate_id: "CAND-007",
          project_instance_id: "PRJ_AUDIT_001",
          source_document_id: "DOC_AUDIT_001",
          source_sheet_id: "SHEET_C_99",
          source_page_label: "C-99",
          source_excerpt: "possible sanitary"
        }
      ]
    })).toThrow("audit_source_sheet_not_found");
  });

  it("rejects project_instance_id mismatch", () => {
    expect(() => buildSewerExtractionAuditResult({
      ...BASE_INPUT,
      candidates: [
        {
          candidate_id: "CAND-008",
          project_instance_id: "PRJ_AUDIT_999",
          source_document_id: "DOC_AUDIT_001",
          source_sheet_id: "SHEET_C_50",
          source_page_label: "C-50",
          source_excerpt: "sanitary"
        }
      ]
    })).toThrow("audit_project_instance_id_mismatch");
  });

  it("rejects source_document_id mismatch", () => {
    expect(() => buildSewerExtractionAuditResult({
      ...BASE_INPUT,
      candidates: [
        {
          candidate_id: "CAND-009",
          project_instance_id: "PRJ_AUDIT_001",
          source_document_id: "DOC_AUDIT_999",
          source_sheet_id: "SHEET_C_50",
          source_page_label: "C-50",
          source_excerpt: "sanitary"
        }
      ]
    })).toThrow("audit_source_document_id_mismatch");
  });

  it("always returns no completeness claim, provisional status, and human review gate", () => {
    const result = buildSewerExtractionAuditResult({
      ...BASE_INPUT,
      candidates: [
        {
          candidate_id: "CAND-010",
          project_instance_id: "PRJ_AUDIT_001",
          source_document_id: "DOC_AUDIT_001",
          source_sheet_id: "SHEET_C_51",
          source_page_label: "C-51",
          source_excerpt: "possible sewer"
        }
      ]
    });

    expect(result.completeness_claim).toBe("not_claimed");
    expect(result.audit_status).toBe("provisional_incomplete");
    expect(result.next_required_action).toBe("human_review_audit_findings");
    expect(result.records.every((record) => record.requires_human_review)).toBe(true);
  });

  it("preserves project, document, sheet, candidate, page, and excerpt traces", () => {
    const result = buildSewerExtractionAuditResult({
      ...BASE_INPUT,
      audit_id: "SEWER_AUDIT_TEST_001",
      candidates: [
        {
          candidate_id: "CAND-011",
          project_instance_id: "PRJ_AUDIT_001",
          source_document_id: "DOC_AUDIT_001",
          source_sheet_id: "SHEET_C_51",
          source_page_label: "C-51",
          source_excerpt: "8-IN SANITARY SEWER"
        }
      ]
    });

    expect(result.trace_refs).toContain("SEWER_AUDIT_TEST_001");
    expect(result.records[0]?.trace_refs).toContain("project:PRJ_AUDIT_001");
    expect(result.records[0]?.trace_refs).toContain("document:DOC_AUDIT_001");
    expect(result.records[0]?.trace_refs).toContain("sheet:SHEET_C_51");
    expect(result.records[0]?.trace_refs).toContain("candidate:CAND-011");
    expect(result.records[0]?.trace_refs).toContain("page:C-51");
    expect(result.records[0]?.trace_refs).toContain("excerpt:8-IN SANITARY SEWER");
  });
});
