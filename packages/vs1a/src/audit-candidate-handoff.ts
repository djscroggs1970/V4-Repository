import { FRAMEWORK_VERSION } from "@v4/config";
import type { TakeoffItem } from "@v4/domain";
import type { AuditReviewPromotionGateResult, PromotedAuditCandidate } from "./audit-review-gate.js";

export interface TakeoffCandidateHandoffRecord {
  audit_record_id: string;
  candidate_id: string;
  source_sheet_id: string;
  takeoff_item_id: string;
  trace_refs: string[];
}

export interface TakeoffCandidateHandoffResult {
  audit_id: string;
  project_instance_id: string;
  source_document_id: string;
  review_status: "takeoff_candidates_created_pending_review";
  next_required_action: "review_takeoff_candidates";
  quantity_export_ready: false;
  takeoff_items: TakeoffItem[];
  records: TakeoffCandidateHandoffRecord[];
  trace_refs: string[];
}

export function buildAuditCandidateTakeoffHandoff(input: {
  gate_result: AuditReviewPromotionGateResult;
} | {
  audit_id: string;
  project_instance_id: string;
  source_document_id: string;
  promoted_candidates: PromotedAuditCandidate[];
}): TakeoffCandidateHandoffResult {
  const base = "gate_result" in input
    ? {
        audit_id: input.gate_result.audit_id,
        project_instance_id: input.gate_result.project_instance_id,
        source_document_id: input.gate_result.source_document_id,
        promoted_candidates: input.gate_result.promoted
      }
    : input;

  if ("gate_result" in input && input.gate_result.review_status !== "audit_review_completed") {
    throw new Error("audit_handoff_requires_completed_gate");
  }

  assertPromotedCandidates(base.audit_id, base.project_instance_id, base.source_document_id, base.promoted_candidates);

  const takeoff_items: TakeoffItem[] = [];
  const records: TakeoffCandidateHandoffRecord[] = [];

  for (const candidate of base.promoted_candidates) {
    const takeoff_item_id = `AUDIT_CAND_${candidate.candidate_id}`;
    takeoff_items.push({
      project_instance_id: candidate.project_instance_id,
      takeoff_item_id,
      takeoff_run_id: `AUDIT_HANDOFF_${base.audit_id}`,
      source_sheet_id: candidate.source_sheet_id,
      feature_type: "sanitary_pipe_run",
      quantity: candidate.length_lf,
      uom: "LF",
      diameter_in: candidate.diameter_in,
      material_type: candidate.material_type,
      confidence: 0.8,
      review_status: "pending",
      data_layer: "project",
      source_origin: "project_upload",
      framework_version: FRAMEWORK_VERSION
    });

    records.push({
      audit_record_id: candidate.audit_record_id,
      candidate_id: candidate.candidate_id,
      source_sheet_id: candidate.source_sheet_id,
      takeoff_item_id,
      trace_refs: dedupe([
        `audit:${base.audit_id}`,
        `audit_record:${candidate.audit_record_id}`,
        `candidate:${candidate.candidate_id}`,
        `project:${candidate.project_instance_id}`,
        `document:${candidate.source_document_id}`,
        `sheet:${candidate.source_sheet_id}`,
        ...candidate.trace_refs
      ])
    });
  }

  return {
    audit_id: base.audit_id,
    project_instance_id: base.project_instance_id,
    source_document_id: base.source_document_id,
    review_status: "takeoff_candidates_created_pending_review",
    next_required_action: "review_takeoff_candidates",
    quantity_export_ready: false,
    takeoff_items,
    records,
    trace_refs: dedupe([
      `audit:${base.audit_id}`,
      `project:${base.project_instance_id}`,
      `document:${base.source_document_id}`,
      ...records.flatMap((record) => record.trace_refs)
    ])
  };
}

function assertPromotedCandidates(
  auditId: string,
  projectInstanceId: string,
  sourceDocumentId: string,
  promoted: PromotedAuditCandidate[]
): void {
  const seen = new Set<string>();

  for (const candidate of promoted) {
    if (candidate.promotion_status !== "eligible_for_takeoff_review") throw new Error("handoff_candidate_not_eligible_for_takeoff_review");
    if (candidate.pending_review_stage !== "takeoff_review") throw new Error("handoff_candidate_not_in_takeoff_review_stage");
    if (candidate.review_status !== "pending") throw new Error("handoff_candidate_review_status_not_pending");
    if (candidate.quantity_export_ready !== false) throw new Error("handoff_candidate_quantity_export_ready_not_allowed");

    if (!candidate.audit_record_id?.trim()) throw new Error("handoff_audit_record_id_required");
    if (!candidate.candidate_id?.trim()) throw new Error("handoff_candidate_id_required");
    if (!candidate.project_instance_id?.trim()) throw new Error("handoff_project_instance_id_required");
    if (!candidate.source_document_id?.trim()) throw new Error("handoff_source_document_id_required");
    if (!candidate.source_sheet_id?.trim()) throw new Error("handoff_source_sheet_id_required");
    if (!candidate.material_type?.trim()) throw new Error("handoff_material_type_required");
    if (!(candidate.diameter_in > 0)) throw new Error("handoff_diameter_must_be_positive");
    if (!(candidate.length_lf > 0)) throw new Error("handoff_length_must_be_positive");

    if (candidate.project_instance_id !== projectInstanceId) throw new Error("handoff_project_instance_mismatch");
    if (candidate.source_document_id !== sourceDocumentId) throw new Error("handoff_source_document_mismatch");
    if (seen.has(candidate.candidate_id)) throw new Error("duplicate_handoff_candidate_id");

    seen.add(candidate.candidate_id);
  }

  if (!auditId.trim()) throw new Error("handoff_audit_id_required");
  if (!projectInstanceId.trim()) throw new Error("handoff_project_instance_id_required");
  if (!sourceDocumentId.trim()) throw new Error("handoff_source_document_id_required");
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}
