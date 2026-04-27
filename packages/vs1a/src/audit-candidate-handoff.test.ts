import { describe, expect, it } from "vitest";
import { buildAuditCandidateTakeoffHandoff } from "./audit-candidate-handoff.js";
import type { AuditReviewPromotionGateResult, PromotedAuditCandidate } from "./audit-review-gate.js";

function createPromotedCandidate(overrides?: Partial<PromotedAuditCandidate>): PromotedAuditCandidate {
  return {
    audit_record_id: "AUDIT_RECORD_CAND-001",
    candidate_id: "CAND-001",
    project_instance_id: "PRJ_AUDIT_001",
    source_document_id: "DOC_AUDIT_001",
    source_sheet_id: "SHEET_C_50",
    material_type: "PVC_C900_DR18",
    diameter_in: 8,
    length_lf: 100,
    promotion_status: "eligible_for_takeoff_review",
    pending_review_stage: "takeoff_review",
    review_status: "pending",
    quantity_export_ready: false,
    trace_refs: ["candidate:CAND-001", "audit_record:AUDIT_RECORD_CAND-001", "sheet:SHEET_C_50", "candidate:CAND-001"],
    ...overrides
  };
}

function createGateResult(promoted: PromotedAuditCandidate[]): AuditReviewPromotionGateResult {
  return {
    audit_id: "SEWER_AUDIT_001",
    project_instance_id: "PRJ_AUDIT_001",
    source_document_id: "DOC_AUDIT_001",
    review_status: "audit_review_completed",
    next_required_action: "promote_eligible_candidates_to_takeoff_review",
    promoted,
    blocked: [],
    counts: {
      total_records: promoted.length,
      reviewed_count: promoted.length,
      promoted_count: promoted.length,
      blocked_count: 0,
      open_count: 0
    },
    trace_refs: ["SEWER_AUDIT_001", "project:PRJ_AUDIT_001", "document:DOC_AUDIT_001"]
  };
}

describe("VS1A audit candidate handoff", () => {
  it("converts one promoted candidate into one pending TakeoffItem", () => {
    const result = buildAuditCandidateTakeoffHandoff({ gate_result: createGateResult([createPromotedCandidate()]) });

    expect(result.takeoff_items).toHaveLength(1);
    expect(result.takeoff_items[0]).toMatchObject({
      project_instance_id: "PRJ_AUDIT_001",
      source_sheet_id: "SHEET_C_50",
      feature_type: "sanitary_pipe_run",
      quantity: 100,
      uom: "LF",
      diameter_in: 8,
      material_type: "PVC_C900_DR18",
      review_status: "pending",
      source_origin: "project_upload",
      data_layer: "project"
    });
    expect(result.review_status).toBe("takeoff_candidates_created_pending_review");
    expect(result.next_required_action).toBe("review_takeoff_candidates");
    expect(result.quantity_export_ready).toBe(false);
    expect("trace_refs" in result.takeoff_items[0]!).toBe(false);
  });

  it("rejects gate results with open review items before handoff", () => {
    const gate = createGateResult([createPromotedCandidate()]);
    gate.review_status = "audit_review_has_open_items";
    gate.next_required_action = "resolve_audit_review_flags";

    expect(() => buildAuditCandidateTakeoffHandoff({ gate_result: gate })).toThrow("audit_handoff_requires_completed_gate");
  });

  it("converts multiple promoted candidates and dedupes trace refs", () => {
    const result = buildAuditCandidateTakeoffHandoff({
      gate_result: createGateResult([
        createPromotedCandidate(),
        createPromotedCandidate({
          audit_record_id: "AUDIT_RECORD_CAND-002",
          candidate_id: "CAND-002",
          source_sheet_id: "SHEET_C_51",
          length_lf: 55,
          trace_refs: ["candidate:CAND-002", "candidate:CAND-002", "sheet:SHEET_C_51"]
        })
      ])
    });

    expect(result.takeoff_items).toHaveLength(2);
    expect(result.records).toHaveLength(2);
    expect(result.trace_refs.filter((ref) => ref === "candidate:CAND-002")).toHaveLength(1);
    expect(result.records[0]?.trace_refs).toContain("audit:SEWER_AUDIT_001");
  });

  it("rejects duplicate promoted candidate IDs", () => {
    expect(() => buildAuditCandidateTakeoffHandoff({
      gate_result: createGateResult([
        createPromotedCandidate(),
        createPromotedCandidate({ audit_record_id: "AUDIT_RECORD_CAND-009", candidate_id: "CAND-001" })
      ])
    })).toThrow("duplicate_handoff_candidate_id");
  });

  it("rejects missing required handoff fields", () => {
    expect(() => buildAuditCandidateTakeoffHandoff({
      gate_result: createGateResult([createPromotedCandidate({ material_type: "" })])
    })).toThrow("handoff_material_type_required");
  });

  it("rejects project instance mismatch", () => {
    expect(() => buildAuditCandidateTakeoffHandoff({
      gate_result: createGateResult([createPromotedCandidate({ project_instance_id: "PRJ_AUDIT_002" })])
    })).toThrow("handoff_project_instance_mismatch");
  });

  it("rejects source document mismatch", () => {
    expect(() => buildAuditCandidateTakeoffHandoff({
      gate_result: createGateResult([createPromotedCandidate({ source_document_id: "DOC_AUDIT_002" })])
    })).toThrow("handoff_source_document_mismatch");
  });

  it("rejects ineligible promotion status", () => {
    const candidate = { ...createPromotedCandidate(), promotion_status: "blocked" } as unknown as PromotedAuditCandidate;
    expect(() => buildAuditCandidateTakeoffHandoff({ gate_result: createGateResult([candidate]) })).toThrow(
      "handoff_candidate_not_eligible_for_takeoff_review"
    );
  });

  it("rejects candidates not pending takeoff review state", () => {
    expect(() => buildAuditCandidateTakeoffHandoff({
      gate_result: createGateResult([
        { ...createPromotedCandidate(), pending_review_stage: "other" as never }
      ])
    })).toThrow("handoff_candidate_not_in_takeoff_review_stage");

    expect(() => buildAuditCandidateTakeoffHandoff({
      gate_result: createGateResult([
        { ...createPromotedCandidate(), review_status: "approved" as never }
      ])
    })).toThrow("handoff_candidate_review_status_not_pending");

    expect(() => buildAuditCandidateTakeoffHandoff({
      gate_result: createGateResult([
        { ...createPromotedCandidate(), quantity_export_ready: true as never }
      ])
    })).toThrow("handoff_candidate_quantity_export_ready_not_allowed");
  });

  it("output remains pending takeoff review and quantity_export_ready false", () => {
    const result = buildAuditCandidateTakeoffHandoff({ gate_result: createGateResult([createPromotedCandidate()]) });

    expect(result.review_status).toBe("takeoff_candidates_created_pending_review");
    expect(result.next_required_action).toBe("review_takeoff_candidates");
    expect(result.quantity_export_ready).toBe(false);
    expect(result.takeoff_items.every((item) => item.review_status === "pending")).toBe(true);
  });

  it("result cannot be used as approved quantity output", () => {
    const result = buildAuditCandidateTakeoffHandoff({ gate_result: createGateResult([createPromotedCandidate()]) });

    expect(result.next_required_action).not.toBe("create_quantity_summary");
    expect(result.quantity_export_ready).toBe(false);
    expect(result.takeoff_items.some((item) => item.review_status === "approved")).toBe(false);
  });
});
