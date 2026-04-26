export interface SewerExtractionAuditCandidateInput {
  candidate_id: string;
  project_instance_id: string;
  source_document_id: string;
  source_sheet_id: string;
  source_page_label?: string;
  source_excerpt?: string;
  feature_label?: string;
  material_type?: string;
  diameter_in?: number;
  length_lf?: number;
  slope_percent?: number;
  upstream_depth_ft?: number;
  downstream_depth_ft?: number;
  confidence?: number;
  notes?: string;
}

export type SewerExtractionAuditDecision =
  | "found_sewer_run"
  | "uncertain_sewer_candidate"
  | "excluded_non_sewer_item"
  | "unresolved_plan_question";

export type SewerExtractionAuditConfidenceBand = "high" | "medium" | "low" | "unknown";

export interface SewerExtractionAuditRecord {
  audit_record_id: string;
  candidate_id: string;
  project_instance_id: string;
  source_document_id: string;
  source_sheet_id: string;
  decision: SewerExtractionAuditDecision;
  reason_codes: string[];
  confidence_band: SewerExtractionAuditConfidenceBand;
  requires_human_review: true;
  trace_refs: string[];
}

export interface SewerExtractionAuditDecisionCounts {
  found_sewer_run: number;
  uncertain_sewer_candidate: number;
  excluded_non_sewer_item: number;
  unresolved_plan_question: number;
}

export interface SewerExtractionAuditResult {
  audit_id: string;
  project_instance_id: string;
  source_document_id: string;
  audit_status: "provisional_incomplete";
  completeness_claim: "not_claimed";
  next_required_action: "human_review_audit_findings";
  records: SewerExtractionAuditRecord[];
  counts: SewerExtractionAuditDecisionCounts;
  trace_refs: string[];
}

export interface SewerExtractionAuditInput {
  project_instance_id: string;
  source_document_id: string;
  drawing_sheet_index: Array<{ source_sheet_id?: string; drawing_sheet_id?: string }>;
  candidates: SewerExtractionAuditCandidateInput[];
  audit_id?: string;
}

const STRONG_NON_SEWER_TOKENS = [
  "storm",
  "water",
  "domestic water",
  "fire line",
  "gas",
  "electrical",
  "power",
  "telecom",
  "irrigation"
];

const STRONG_SEWER_PATTERNS = [
  /\bsanitary\b/u,
  /\bsewer\b/u,
  /\bss[-\s]?[a-z0-9]*\b/u,
  /\bsan\b/u
];

export function buildSewerExtractionAuditResult(input: SewerExtractionAuditInput): SewerExtractionAuditResult {
  assertAuditInput(input);

  const sheetIds = new Set(input.drawing_sheet_index.map((sheet) => sheet.source_sheet_id ?? sheet.drawing_sheet_id).filter((id): id is string => Boolean(id)));
  const records = input.candidates.map((candidate) => classifyCandidate(candidate, input, sheetIds));
  const counts = countByDecision(records);
  const auditId = input.audit_id ?? createAuditId(input.project_instance_id, input.source_document_id);
  const traceRefs = dedupe([auditId, input.project_instance_id, input.source_document_id, ...records.flatMap((record) => record.trace_refs)]);

  return {
    audit_id: auditId,
    project_instance_id: input.project_instance_id,
    source_document_id: input.source_document_id,
    audit_status: "provisional_incomplete",
    completeness_claim: "not_claimed",
    next_required_action: "human_review_audit_findings",
    records,
    counts,
    trace_refs: traceRefs
  };
}

function classifyCandidate(
  candidate: SewerExtractionAuditCandidateInput,
  input: SewerExtractionAuditInput,
  sheetIds: Set<string>
): SewerExtractionAuditRecord {
  assertCandidate(candidate, input, sheetIds);

  const reasonCodes: string[] = [];
  const combinedText = `${candidate.feature_label ?? ""} ${candidate.source_excerpt ?? ""} ${candidate.notes ?? ""} ${candidate.material_type ?? ""}`.toLowerCase();
  const hasNonSewerSignal = STRONG_NON_SEWER_TOKENS.some((token) => combinedText.includes(token));
  const hasSewerSignal = STRONG_SEWER_PATTERNS.some((pattern) => pattern.test(combinedText));
  const hasRequiredSourceRefs = Boolean(candidate.source_page_label?.trim() || candidate.source_excerpt?.trim());

  const hasLength = typeof candidate.length_lf === "number" && candidate.length_lf > 0;
  const hasDiameter = typeof candidate.diameter_in === "number" && candidate.diameter_in > 0;
  const hasMaterial = Boolean(candidate.material_type?.trim());
  const hasContradiction = hasNonSewerSignal && hasSewerSignal;

  let decision: SewerExtractionAuditDecision;
  if (hasContradiction) {
    decision = "unresolved_plan_question";
    reasonCodes.push("contradictory_utility_signals");
  } else if (!hasRequiredSourceRefs) {
    decision = "unresolved_plan_question";
    reasonCodes.push("missing_critical_source_reference");
  } else if (hasNonSewerSignal) {
    decision = "excluded_non_sewer_item";
    reasonCodes.push("strong_non_sewer_indicator");
  } else if (hasSewerSignal && hasLength && hasDiameter && hasMaterial) {
    decision = "found_sewer_run";
    reasonCodes.push("strong_sewer_indicator_with_required_attributes");
  } else if (hasSewerSignal) {
    decision = "uncertain_sewer_candidate";
    reasonCodes.push("partial_or_ambiguous_sewer_attributes");
  } else {
    decision = "uncertain_sewer_candidate";
    reasonCodes.push("insufficient_signal_for_sewer_classification");
  }

  const traceRefs = buildTraceRefs(candidate);
  if (traceRefs.length === 0) {
    throw new Error("audit_trace_refs_required");
  }

  return {
    audit_record_id: `AUDIT_RECORD_${candidate.candidate_id}`,
    candidate_id: candidate.candidate_id,
    project_instance_id: candidate.project_instance_id,
    source_document_id: candidate.source_document_id,
    source_sheet_id: candidate.source_sheet_id,
    decision,
    reason_codes: reasonCodes,
    confidence_band: toConfidenceBand(candidate.confidence),
    requires_human_review: true,
    trace_refs: traceRefs
  };
}

function assertCandidate(candidate: SewerExtractionAuditCandidateInput, input: SewerExtractionAuditInput, sheetIds: Set<string>): void {
  if (candidate.project_instance_id !== input.project_instance_id) {
    throw new Error("audit_project_instance_id_mismatch");
  }
  if (candidate.source_document_id !== input.source_document_id) {
    throw new Error("audit_source_document_id_mismatch");
  }
  if (!sheetIds.has(candidate.source_sheet_id)) {
    throw new Error("audit_source_sheet_not_found");
  }
}

function toConfidenceBand(confidence: number | undefined): SewerExtractionAuditConfidenceBand {
  if (typeof confidence !== "number") return "unknown";
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

function countByDecision(records: SewerExtractionAuditRecord[]): SewerExtractionAuditDecisionCounts {
  return records.reduce<SewerExtractionAuditDecisionCounts>(
    (acc, record) => {
      acc[record.decision] += 1;
      return acc;
    },
    {
      found_sewer_run: 0,
      uncertain_sewer_candidate: 0,
      excluded_non_sewer_item: 0,
      unresolved_plan_question: 0
    }
  );
}

function buildTraceRefs(candidate: SewerExtractionAuditCandidateInput): string[] {
  return dedupe([
    `project:${candidate.project_instance_id}`,
    `document:${candidate.source_document_id}`,
    `candidate:${candidate.candidate_id}`,
    `sheet:${candidate.source_sheet_id}`,
    candidate.source_page_label?.trim() ? `page:${candidate.source_page_label.trim()}` : undefined,
    candidate.source_excerpt?.trim() ? `excerpt:${candidate.source_excerpt.trim()}` : undefined
  ].filter((value): value is string => Boolean(value)));
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function createAuditId(projectInstanceId: string, sourceDocumentId: string): string {
  return `SEWER_AUDIT_${projectInstanceId}_${sourceDocumentId}`;
}

function assertAuditInput(input: SewerExtractionAuditInput): void {
  if (!input.project_instance_id.trim()) throw new Error("audit_project_instance_id_required");
  if (!input.source_document_id.trim()) throw new Error("audit_source_document_id_required");
  if (input.drawing_sheet_index.length === 0) throw new Error("audit_drawing_sheet_index_required");
  if (input.candidates.length === 0) throw new Error("audit_candidates_required");

  const seenSheets = new Set<string>();
  for (const sheet of input.drawing_sheet_index) {
    const sheetId = sheet.source_sheet_id ?? sheet.drawing_sheet_id;
    if (!sheetId?.trim()) throw new Error("audit_source_sheet_id_required");
    if (seenSheets.has(sheetId)) throw new Error("audit_duplicate_source_sheet_id");
    seenSheets.add(sheetId);
  }

  const seenCandidates = new Set<string>();
  for (const candidate of input.candidates) {
    if (!candidate.candidate_id.trim()) throw new Error("audit_candidate_id_required");
    if (seenCandidates.has(candidate.candidate_id)) throw new Error("audit_duplicate_candidate_id");
    if (!candidate.project_instance_id.trim()) throw new Error("audit_candidate_project_instance_id_required");
    if (!candidate.source_document_id.trim()) throw new Error("audit_candidate_source_document_id_required");
    if (!candidate.source_sheet_id.trim()) throw new Error("audit_candidate_source_sheet_id_required");
    seenCandidates.add(candidate.candidate_id);
  }
}
