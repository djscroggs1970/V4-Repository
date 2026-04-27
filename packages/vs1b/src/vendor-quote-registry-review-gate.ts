import { FRAMEWORK_VERSION } from "@v4/config";
import type { NormalizedVendorQuoteLine, VendorQuoteIntakeResult } from "./vendor-quote-intake.js";

export type VendorQuoteRegistryReviewDecision = "approved" | "rejected" | "needs_review";
export type VendorQuoteRegistryReviewStatus = "quote_registry_review_completed" | "quote_registry_review_has_open_items";
export type VendorQuoteRegistryNextAction = "merge_approved_quotes_to_cost_input_registry" | "resolve_vendor_quote_review_flags";

export interface VendorQuoteRegistryReviewRow {
  quote_id: string;
  decision: VendorQuoteRegistryReviewDecision;
  reviewer: string;
  note?: string;
}

export interface VendorQuoteRegistryReviewGateInput {
  vendor_quote_intake: VendorQuoteIntakeResult;
  review_rows: VendorQuoteRegistryReviewRow[];
}

export interface ApprovedVendorQuoteForRegistryMerge extends NormalizedVendorQuoteLine {
  registry_merge_status: "eligible_for_registry_merge";
  registry_merge_ready: true;
  requires_registry_review: false;
}

export interface BlockedVendorQuoteRecord extends NormalizedVendorQuoteLine {
  registry_merge_status: "blocked_from_registry_merge";
  registry_merge_ready: false;
  requires_registry_review: true;
  review_decision: "rejected" | "needs_review" | "unreviewed";
  reviewer?: string;
  review_note?: string;
}

export interface VendorQuoteRegistryReviewCounts {
  total_quotes: number;
  reviewed_quotes: number;
  approved_quotes: number;
  rejected_quotes: number;
  needs_review_quotes: number;
  unreviewed_quotes: number;
  blocked_quotes: number;
}

export interface VendorQuoteRegistryReviewGateResult {
  quote_batch_id: string;
  project_instance_id: string;
  source_document_id: string;
  source_file_name: string;
  vendor_name: string;
  framework_version: string;
  review_status: VendorQuoteRegistryReviewStatus;
  next_required_action: VendorQuoteRegistryNextAction;
  approved_for_registry_merge: ApprovedVendorQuoteForRegistryMerge[];
  blocked_quote_records: BlockedVendorQuoteRecord[];
  counts: VendorQuoteRegistryReviewCounts;
  trace_refs: string[];
}

export function buildVendorQuoteRegistryReviewGateResult(input: VendorQuoteRegistryReviewGateInput): VendorQuoteRegistryReviewGateResult {
  assertReviewGateInput(input);

  const reviewByQuoteId = new Map<string, VendorQuoteRegistryReviewRow>();
  for (const row of input.review_rows) {
    if (reviewByQuoteId.has(row.quote_id)) throw new Error("duplicate_vendor_quote_registry_review_row");
    assertReviewRow(row);
    reviewByQuoteId.set(row.quote_id, row);
  }

  const knownQuoteIds = new Set(input.vendor_quote_intake.material_quotes.map((quote) => quote.quote_id));
  for (const row of input.review_rows) {
    if (!knownQuoteIds.has(row.quote_id)) throw new Error("unknown_vendor_quote_registry_review_quote_id");
  }

  const approvedForRegistryMerge: ApprovedVendorQuoteForRegistryMerge[] = [];
  const blockedQuoteRecords: BlockedVendorQuoteRecord[] = [];

  for (const quote of input.vendor_quote_intake.material_quotes) {
    const reviewRow = reviewByQuoteId.get(quote.quote_id);

    if (!reviewRow) {
      blockedQuoteRecords.push({
        ...quote,
        registry_merge_status: "blocked_from_registry_merge",
        registry_merge_ready: false,
        requires_registry_review: true,
        review_decision: "unreviewed"
      });
      continue;
    }

    if (reviewRow.decision === "approved") {
      approvedForRegistryMerge.push({
        ...quote,
        registry_merge_status: "eligible_for_registry_merge",
        registry_merge_ready: true,
        requires_registry_review: false
      });
      continue;
    }

    blockedQuoteRecords.push({
      ...quote,
      registry_merge_status: "blocked_from_registry_merge",
      registry_merge_ready: false,
      requires_registry_review: true,
      review_decision: reviewRow.decision,
      reviewer: reviewRow.reviewer,
      review_note: reviewRow.note
    });
  }

  const counts = buildCounts(input.vendor_quote_intake.material_quotes.length, input.review_rows, blockedQuoteRecords.length, approvedForRegistryMerge.length);
  const hasOpenItems = counts.unreviewed_quotes > 0 || counts.needs_review_quotes > 0;

  return {
    quote_batch_id: input.vendor_quote_intake.quote_batch_id,
    project_instance_id: input.vendor_quote_intake.project_instance_id,
    source_document_id: input.vendor_quote_intake.source_document_id,
    source_file_name: input.vendor_quote_intake.source_file_name,
    vendor_name: input.vendor_quote_intake.vendor_name,
    framework_version: FRAMEWORK_VERSION,
    review_status: hasOpenItems ? "quote_registry_review_has_open_items" : "quote_registry_review_completed",
    next_required_action: hasOpenItems ? "resolve_vendor_quote_review_flags" : "merge_approved_quotes_to_cost_input_registry",
    approved_for_registry_merge: approvedForRegistryMerge,
    blocked_quote_records: blockedQuoteRecords,
    counts,
    trace_refs: dedupeSort([
      input.vendor_quote_intake.quote_batch_id,
      input.vendor_quote_intake.project_instance_id,
      input.vendor_quote_intake.source_document_id,
      ...input.vendor_quote_intake.trace_refs,
      ...approvedForRegistryMerge.flatMap((quote) => quote.trace_refs),
      ...blockedQuoteRecords.flatMap((quote) => quote.trace_refs),
      ...input.review_rows.map((row) => row.quote_id)
    ])
  };
}

function assertReviewGateInput(input: VendorQuoteRegistryReviewGateInput): void {
  if (input.vendor_quote_intake.normalization_status !== "normalized_pending_registry_merge") {
    throw new Error("vendor_quote_intake_must_be_normalized_pending_registry_merge");
  }
  if (input.vendor_quote_intake.registry_merge_ready) throw new Error("vendor_quote_intake_registry_merge_ready_must_be_false");
  if (!input.vendor_quote_intake.requires_registry_review) throw new Error("vendor_quote_intake_requires_registry_review_must_be_true");
}

function assertReviewRow(row: VendorQuoteRegistryReviewRow): void {
  if (!row.quote_id) throw new Error("vendor_quote_registry_review_quote_id_required");
  if (!row.reviewer.trim()) throw new Error("vendor_quote_registry_review_reviewer_required");
  if ((row.decision === "rejected" || row.decision === "needs_review") && !row.note?.trim()) {
    throw new Error("vendor_quote_registry_review_note_required");
  }
}

function buildCounts(
  totalQuotes: number,
  reviewRows: VendorQuoteRegistryReviewRow[],
  blockedQuotes: number,
  approvedQuotes: number
): VendorQuoteRegistryReviewCounts {
  const rejectedQuotes = reviewRows.filter((row) => row.decision === "rejected").length;
  const needsReviewQuotes = reviewRows.filter((row) => row.decision === "needs_review").length;
  const reviewedQuotes = reviewRows.length;

  return {
    total_quotes: totalQuotes,
    reviewed_quotes: reviewedQuotes,
    approved_quotes: approvedQuotes,
    rejected_quotes: rejectedQuotes,
    needs_review_quotes: needsReviewQuotes,
    unreviewed_quotes: totalQuotes - reviewedQuotes,
    blocked_quotes: blockedQuotes
  };
}

function dedupeSort(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}
