import type {
  SewerExtractionAuditDecision,
  SewerExtractionAuditRecord,
  SewerExtractionAuditResult
} from "./sewer-extraction-audit.js";

export type AuditReviewDecision = "approved" | "rejected" | "needs_review";

export interface AuditReviewDecisionInput {
  audit_record_id: string;
  decision: AuditReviewDecision;
  reviewer?: string;
  note?: string;
}

export interface PromotedAuditCandidate {
  audit_record_id: string;
  candidate_id: string;
  project_instance_id: string;
  source_document_id: string;
  source_sheet_id: string;
  material_type: string;
  diameter_in: number;
  length_lf: number;
  promotion_status: "eligible_for_takeoff_review";
  pending_review_stage: "takeoff_review";
  review_status: "pending";
  quantity_export_ready: false;
  trace_refs: string[];
}

export interface BlockedAuditCandidate {
  audit_record_id: string;
  candidate_id: string;
  decision: SewerExtractionAuditDecision;
  review_decision?: AuditReviewDecision;
  blocked_reason_codes: string[];
  trace_refs: string[];
}

export interface AuditReviewPromotionCounts {
  total_records: number;
  reviewed_count: number;
  promoted_count: number;
  blocked_count: number;
  open_count: number;
}

export interface AuditReviewPromotionGateResult {
  audit_id: string;
  project_instance_id: string;
  source_document_id: string;
  review_status: "audit_review_completed" | "audit_review_has_open_items";
  next_required_action: "promote_eligible_candidates_to_takeoff_review" | "resolve_audit_review_flags";
  promoted: PromotedAuditCandidate[];
  blocked: BlockedAuditCandidate[];
  counts: AuditReviewPromotionCounts;
  trace_refs: string[];
}

export function buildAuditReviewPromotionGateResult(input: {
  audit_result: SewerExtractionAuditResult;
  reviews: AuditReviewDecisionInput[];
}): AuditReviewPromotionGateResult {
  assertReviews(input.audit_result.records, input.reviews);

  const reviewByRecordId = new Map(input.reviews.map((review) => [review.audit_record_id, review]));
  const promoted: PromotedAuditCandidate[] = [];
  const blocked: BlockedAuditCandidate[] = [];
  let openCount = 0;

  for (const record of input.audit_result.records) {
    const review = reviewByRecordId.get(record.audit_record_id);

    if (!review) {
      openCount += 1;
      blocked.push({
        audit_record_id: record.audit_record_id,
        candidate_id: record.candidate_id,
        decision: record.decision,
        blocked_reason_codes: ["audit_review_missing"],
        trace_refs: gateTraceRefs(record, input.audit_result.audit_id)
      });
      continue;
    }

    if (review.decision === "needs_review") {
      openCount += 1;
      blocked.push({
        audit_record_id: record.audit_record_id,
        candidate_id: record.candidate_id,
        decision: record.decision,
        review_decision: review.decision,
        blocked_reason_codes: ["audit_review_flagged_needs_review"],
        trace_refs: gateTraceRefs(record, input.audit_result.audit_id)
      });
      continue;
    }

    if (review.decision === "rejected") {
      blocked.push({
        audit_record_id: record.audit_record_id,
        candidate_id: record.candidate_id,
        decision: record.decision,
        review_decision: review.decision,
        blocked_reason_codes: ["audit_review_rejected"],
        trace_refs: gateTraceRefs(record, input.audit_result.audit_id)
      });
      continue;
    }

    const ineligibleReason = blockedReasonForDecision(record.decision);
    if (ineligibleReason) {
      blocked.push({
        audit_record_id: record.audit_record_id,
        candidate_id: record.candidate_id,
        decision: record.decision,
        review_decision: review.decision,
        blocked_reason_codes: [ineligibleReason],
        trace_refs: gateTraceRefs(record, input.audit_result.audit_id)
      });
      continue;
    }

    const snapshot = record.candidate_snapshot;
    const missingRequiredFields: string[] = [];
    if (!snapshot?.material_type?.trim()) missingRequiredFields.push("material_type");
    if (!(typeof snapshot?.diameter_in === "number" && snapshot.diameter_in > 0)) missingRequiredFields.push("diameter_in");
    if (!(typeof snapshot?.length_lf === "number" && snapshot.length_lf > 0)) missingRequiredFields.push("length_lf");
    if (!snapshot?.source_sheet_id?.trim()) missingRequiredFields.push("source_sheet_id");
    if (!snapshot?.project_instance_id?.trim()) missingRequiredFields.push("project_instance_id");
    if (!snapshot?.source_document_id?.trim()) missingRequiredFields.push("source_document_id");

    if (missingRequiredFields.length > 0) {
      blocked.push({
        audit_record_id: record.audit_record_id,
        candidate_id: record.candidate_id,
        decision: record.decision,
        review_decision: review.decision,
        blocked_reason_codes: ["promotion_missing_required_fields", ...missingRequiredFields.map((field) => `missing_${field}`)],
        trace_refs: gateTraceRefs(record, input.audit_result.audit_id)
      });
      continue;
    }

    promoted.push({
      audit_record_id: record.audit_record_id,
      candidate_id: record.candidate_id,
      project_instance_id: snapshot.project_instance_id,
      source_document_id: snapshot.source_document_id,
      source_sheet_id: snapshot.source_sheet_id,
      material_type: snapshot.material_type!,
      diameter_in: snapshot.diameter_in!,
      length_lf: snapshot.length_lf!,
      promotion_status: "eligible_for_takeoff_review",
      pending_review_stage: "takeoff_review",
      review_status: "pending",
      quantity_export_ready: false,
      trace_refs: gateTraceRefs(record, input.audit_result.audit_id)
    });
  }

  const reviewStatus = openCount > 0 ? "audit_review_has_open_items" : "audit_review_completed";

  return {
    audit_id: input.audit_result.audit_id,
    project_instance_id: input.audit_result.project_instance_id,
    source_document_id: input.audit_result.source_document_id,
    review_status: reviewStatus,
    next_required_action: reviewStatus === "audit_review_completed"
      ? "promote_eligible_candidates_to_takeoff_review"
      : "resolve_audit_review_flags",
    promoted,
    blocked,
    counts: {
      total_records: input.audit_result.records.length,
      reviewed_count: input.reviews.length,
      promoted_count: promoted.length,
      blocked_count: blocked.length,
      open_count: openCount
    },
    trace_refs: dedupe([
      input.audit_result.audit_id,
      input.audit_result.project_instance_id,
      input.audit_result.source_document_id,
      ...promoted.flatMap((candidate) => candidate.trace_refs),
      ...blocked.flatMap((candidate) => candidate.trace_refs)
    ])
  };
}

function assertReviews(records: SewerExtractionAuditRecord[], reviews: AuditReviewDecisionInput[]): void {
  const knownIds = new Set(records.map((record) => record.audit_record_id));
  const seen = new Set<string>();

  for (const review of reviews) {
    if (!review.audit_record_id?.trim()) throw new Error("audit_review_record_id_required");
    if (!review.reviewer?.trim()) throw new Error("audit_review_reviewer_required");
    if (!knownIds.has(review.audit_record_id)) throw new Error("audit_review_record_not_found");
    if (seen.has(review.audit_record_id)) throw new Error("duplicate_audit_review");
    if ((review.decision === "rejected" || review.decision === "needs_review") && !review.note?.trim()) {
      throw new Error("audit_review_note_required");
    }
    seen.add(review.audit_record_id);
  }
}

function blockedReasonForDecision(decision: SewerExtractionAuditDecision): string | undefined {
  if (decision === "uncertain_sewer_candidate") return "audit_decision_uncertain_candidate_blocked";
  if (decision === "excluded_non_sewer_item") return "audit_decision_non_sewer_blocked";
  if (decision === "unresolved_plan_question") return "audit_decision_unresolved_question_blocked";
  return undefined;
}

function gateTraceRefs(record: SewerExtractionAuditRecord, auditId: string): string[] {
  return dedupe([
    auditId,
    `audit_record:${record.audit_record_id}`,
    `candidate:${record.candidate_id}`,
    `project:${record.project_instance_id}`,
    `document:${record.source_document_id}`,
    `sheet:${record.source_sheet_id}`,
    ...record.trace_refs
  ]);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}
