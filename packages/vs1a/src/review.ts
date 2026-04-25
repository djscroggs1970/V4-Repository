import type { TakeoffItem } from "@v4/domain";

export type TakeoffDecision = "approved" | "rejected" | "needs_review";

export interface TakeoffReviewInput {
  takeoff_item_id: string;
  decision: TakeoffDecision;
  reviewer?: string;
  note?: string;
}

export interface TakeoffReviewSummary {
  review_status: "takeoff_review_completed" | "takeoff_review_has_open_items";
  next_required_action: "create_quantity_summary" | "resolve_takeoff_review_flags";
  approved_count: number;
  rejected_count: number;
  needs_review_count: number;
  pending_count: number;
}

export function applyTakeoffReviews(items: TakeoffItem[], reviews: TakeoffReviewInput[]): TakeoffItem[] {
  assertReviews(items, reviews);
  const byId = new Map(reviews.map((review) => [review.takeoff_item_id, review]));

  return items.map((item) => {
    const review = byId.get(item.takeoff_item_id);
    return review ? { ...item, review_status: review.decision } : item;
  });
}

export function summarizeTakeoffReview(items: TakeoffItem[]): TakeoffReviewSummary {
  const approved_count = items.filter((item) => item.review_status === "approved").length;
  const rejected_count = items.filter((item) => item.review_status === "rejected").length;
  const needs_review_count = items.filter((item) => item.review_status === "needs_review").length;
  const pending_count = items.filter((item) => item.review_status === "pending").length;
  const hasOpenItems = needs_review_count + pending_count > 0;

  return {
    review_status: hasOpenItems ? "takeoff_review_has_open_items" : "takeoff_review_completed",
    next_required_action: hasOpenItems ? "resolve_takeoff_review_flags" : "create_quantity_summary",
    approved_count,
    rejected_count,
    needs_review_count,
    pending_count
  };
}

function assertReviews(items: TakeoffItem[], reviews: TakeoffReviewInput[]): void {
  const itemIds = new Set(items.map((item) => item.takeoff_item_id));
  const seen = new Set<string>();

  for (const review of reviews) {
    if (!review.takeoff_item_id) throw new Error("review_takeoff_item_id_required");
    if (!itemIds.has(review.takeoff_item_id)) throw new Error("review_takeoff_item_not_found");
    if (seen.has(review.takeoff_item_id)) throw new Error("duplicate_takeoff_review");
    if ((review.decision === "rejected" || review.decision === "needs_review") && !review.note) {
      throw new Error("review_note_required");
    }
    seen.add(review.takeoff_item_id);
  }
}
