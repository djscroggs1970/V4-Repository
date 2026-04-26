import { describe, expect, it } from "vitest";
import { buildAuditReviewPromotionGateResult } from "./audit-review-gate.js";
import type { SewerExtractionAuditResult } from "./sewer-extraction-audit.js";

function createAuditResult(overrides?: Partial<SewerExtractionAuditResult>): SewerExtractionAuditResult {
  const base: SewerExtractionAuditResult = {
    audit_id: "SEWER_AUDIT_001",
    project_instance_id: "PRJ_AUDIT_001",
    source_document_id: "DOC_AUDIT_001",
    audit_status: "provisional_incomplete",
    completeness_claim: "not_claimed",
    next_required_action: "human_review_audit_findings",
    counts: {
      found_sewer_run: 1,
      uncertain_sewer_candidate: 0,
      excluded_non_sewer_item: 0,
      unresolved_plan_question: 0
    },
    records: [
      {
        audit_record_id: "AUDIT_RECORD_CAND-001",
        candidate_id: "CAND-001",
        project_instance_id: "PRJ_AUDIT_001",
        source_document_id: "DOC_AUDIT_001",
        source_sheet_id: "SHEET_C_50",
        decision: "found_sewer_run",
        reason_codes: ["strong_sewer_indicator_with_required_attributes"],
        confidence_band: "high",
        requires_human_review: true,
        trace_refs: ["candidate:CAND-001", "candidate:CAND-001", "sheet:SHEET_C_50"],
        candidate_snapshot: {
          candidate_id: "CAND-001",
          project_instance_id: "PRJ_AUDIT_001",
          source_document_id: "DOC_AUDIT_001",
          source_sheet_id: "SHEET_C_50",
          material_type: "PVC_C900_DR18",
          diameter_in: 8,
          length_lf: 100
        }
      }
    ],
    trace_refs: ["SEWER_AUDIT_001", "project:PRJ_AUDIT_001", "document:DOC_AUDIT_001"]
  };

  return { ...base, ...overrides };
}

describe("VS1A audit review gate", () => {
  it("approved found_sewer_run promotes to pending takeoff review", () => {
    const result = buildAuditReviewPromotionGateResult({
      audit_result: createAuditResult(),
      reviews: [
        {
          audit_record_id: "AUDIT_RECORD_CAND-001",
          decision: "approved",
          reviewer: "qa.reviewer"
        }
      ]
    });

    expect(result.review_status).toBe("audit_review_completed");
    expect(result.promoted).toHaveLength(1);
    expect(result.promoted[0]?.promotion_status).toBe("eligible_for_takeoff_review");
    expect(result.promoted[0]?.pending_review_stage).toBe("takeoff_review");
    expect(result.promoted[0]?.review_status).toBe("pending");
  });

  it("found_sewer_run with missing material/diameter/length is blocked", () => {
    const audit_result = createAuditResult();
    audit_result.records[0]!.candidate_snapshot.material_type = undefined;
    audit_result.records[0]!.candidate_snapshot.diameter_in = undefined;
    audit_result.records[0]!.candidate_snapshot.length_lf = undefined;

    const result = buildAuditReviewPromotionGateResult({
      audit_result,
      reviews: [{ audit_record_id: "AUDIT_RECORD_CAND-001", decision: "approved", reviewer: "qa.reviewer" }]
    });

    expect(result.promoted).toHaveLength(0);
    expect(result.blocked[0]?.blocked_reason_codes).toContain("missing_material_type");
    expect(result.blocked[0]?.blocked_reason_codes).toContain("missing_diameter_in");
    expect(result.blocked[0]?.blocked_reason_codes).toContain("missing_length_lf");
  });

  it("uncertain_sewer_candidate remains blocked even if approved", () => {
    const result = buildAuditReviewPromotionGateResult({
      audit_result: createAuditResult({
        counts: { found_sewer_run: 0, uncertain_sewer_candidate: 1, excluded_non_sewer_item: 0, unresolved_plan_question: 0 },
        records: [{ ...createAuditResult().records[0]!, decision: "uncertain_sewer_candidate" }]
      }),
      reviews: [{ audit_record_id: "AUDIT_RECORD_CAND-001", decision: "approved", reviewer: "qa.reviewer" }]
    });

    expect(result.promoted).toHaveLength(0);
    expect(result.blocked[0]?.blocked_reason_codes).toContain("audit_decision_uncertain_candidate_blocked");
  });

  it("excluded_non_sewer_item remains blocked even if approved", () => {
    const result = buildAuditReviewPromotionGateResult({
      audit_result: createAuditResult({
        counts: { found_sewer_run: 0, uncertain_sewer_candidate: 0, excluded_non_sewer_item: 1, unresolved_plan_question: 0 },
        records: [{ ...createAuditResult().records[0]!, decision: "excluded_non_sewer_item" }]
      }),
      reviews: [{ audit_record_id: "AUDIT_RECORD_CAND-001", decision: "approved", reviewer: "qa.reviewer" }]
    });

    expect(result.promoted).toHaveLength(0);
    expect(result.blocked[0]?.blocked_reason_codes).toContain("audit_decision_non_sewer_blocked");
  });

  it("unresolved_plan_question remains blocked even if approved", () => {
    const result = buildAuditReviewPromotionGateResult({
      audit_result: createAuditResult({
        counts: { found_sewer_run: 0, uncertain_sewer_candidate: 0, excluded_non_sewer_item: 0, unresolved_plan_question: 1 },
        records: [{ ...createAuditResult().records[0]!, decision: "unresolved_plan_question" }]
      }),
      reviews: [{ audit_record_id: "AUDIT_RECORD_CAND-001", decision: "approved", reviewer: "qa.reviewer" }]
    });

    expect(result.promoted).toHaveLength(0);
    expect(result.blocked[0]?.blocked_reason_codes).toContain("audit_decision_unresolved_question_blocked");
  });

  it("rejected requires note", () => {
    expect(() => buildAuditReviewPromotionGateResult({
      audit_result: createAuditResult(),
      reviews: [{ audit_record_id: "AUDIT_RECORD_CAND-001", decision: "rejected", reviewer: "qa.reviewer" }]
    })).toThrow("audit_review_note_required");
  });

  it("needs_review requires note", () => {
    expect(() => buildAuditReviewPromotionGateResult({
      audit_result: createAuditResult(),
      reviews: [{ audit_record_id: "AUDIT_RECORD_CAND-001", decision: "needs_review", reviewer: "qa.reviewer" }]
    })).toThrow("audit_review_note_required");
  });

  it("reviewer is required", () => {
    expect(() => buildAuditReviewPromotionGateResult({
      audit_result: createAuditResult(),
      reviews: [{ audit_record_id: "AUDIT_RECORD_CAND-001", decision: "approved" }]
    })).toThrow("audit_review_reviewer_required");
  });

  it("duplicate review rows rejected", () => {
    expect(() => buildAuditReviewPromotionGateResult({
      audit_result: createAuditResult(),
      reviews: [
        { audit_record_id: "AUDIT_RECORD_CAND-001", decision: "approved", reviewer: "qa.reviewer" },
        { audit_record_id: "AUDIT_RECORD_CAND-001", decision: "approved", reviewer: "qa.reviewer2" }
      ]
    })).toThrow("duplicate_audit_review");
  });

  it("unknown audit_record_id rejected", () => {
    expect(() => buildAuditReviewPromotionGateResult({
      audit_result: createAuditResult(),
      reviews: [{ audit_record_id: "AUDIT_RECORD_UNKNOWN", decision: "approved", reviewer: "qa.reviewer" }]
    })).toThrow("audit_review_record_not_found");
  });

  it("unreviewed records keep review_status audit_review_has_open_items", () => {
    const result = buildAuditReviewPromotionGateResult({
      audit_result: createAuditResult({
        counts: { found_sewer_run: 2, uncertain_sewer_candidate: 0, excluded_non_sewer_item: 0, unresolved_plan_question: 0 },
        records: [
          createAuditResult().records[0]!,
          { ...createAuditResult().records[0]!, audit_record_id: "AUDIT_RECORD_CAND-002", candidate_id: "CAND-002" }
        ]
      }),
      reviews: [{ audit_record_id: "AUDIT_RECORD_CAND-001", decision: "approved", reviewer: "qa.reviewer" }]
    });

    expect(result.review_status).toBe("audit_review_has_open_items");
    expect(result.next_required_action).toBe("resolve_audit_review_flags");
  });

  it("project_instance_id and source_document_id are preserved", () => {
    const result = buildAuditReviewPromotionGateResult({
      audit_result: createAuditResult(),
      reviews: [{ audit_record_id: "AUDIT_RECORD_CAND-001", decision: "approved", reviewer: "qa.reviewer" }]
    });

    expect(result.project_instance_id).toBe("PRJ_AUDIT_001");
    expect(result.source_document_id).toBe("DOC_AUDIT_001");
    expect(result.promoted[0]?.project_instance_id).toBe("PRJ_AUDIT_001");
    expect(result.promoted[0]?.source_document_id).toBe("DOC_AUDIT_001");
  });

  it("trace refs are preserved/deduped", () => {
    const result = buildAuditReviewPromotionGateResult({
      audit_result: createAuditResult(),
      reviews: [{ audit_record_id: "AUDIT_RECORD_CAND-001", decision: "approved", reviewer: "qa.reviewer" }]
    });

    expect(result.promoted[0]?.trace_refs.filter((ref) => ref === "candidate:CAND-001")).toHaveLength(1);
    expect(result.trace_refs.filter((ref) => ref === "candidate:CAND-001")).toHaveLength(1);
    expect(result.promoted[0]?.trace_refs).toContain("audit_record:AUDIT_RECORD_CAND-001");
  });

  it("promoted candidates are not quantity-export-ready", () => {
    const result = buildAuditReviewPromotionGateResult({
      audit_result: createAuditResult(),
      reviews: [{ audit_record_id: "AUDIT_RECORD_CAND-001", decision: "approved", reviewer: "qa.reviewer" }]
    });

    expect(result.promoted[0]?.quantity_export_ready).toBe(false);
  });
});
