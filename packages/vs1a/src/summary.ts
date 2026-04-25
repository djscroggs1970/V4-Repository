import type { DepthClass, TakeoffItem } from "@v4/domain";

export interface QuantitySummaryLine {
  project_instance_id?: string;
  material_type: string;
  diameter_in: number;
  depth_class?: DepthClass;
  uom: string;
  quantity: number;
  source_takeoff_item_ids: string[];
}

export interface QuantitySummaryResult {
  lines: QuantitySummaryLine[];
  excluded_count: number;
  approved_count: number;
  next_required_action: "export_quantity_summary" | "resolve_takeoff_review_flags";
}

export function buildQuantitySummary(items: TakeoffItem[]): QuantitySummaryResult {
  const approvedItems = items.filter((item) => item.review_status === "approved");
  const openItems = items.filter((item) => item.review_status === "pending" || item.review_status === "needs_review");
  const grouped = new Map<string, QuantitySummaryLine>();

  for (const item of approvedItems) {
    assertSummarizable(item);
    const key = [item.project_instance_id ?? "", item.material_type ?? "", item.diameter_in ?? "", item.depth_class ?? "", item.uom].join("|");
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity = round2(existing.quantity + item.quantity);
      existing.source_takeoff_item_ids.push(item.takeoff_item_id);
    } else {
      grouped.set(key, {
        project_instance_id: item.project_instance_id,
        material_type: item.material_type!,
        diameter_in: item.diameter_in!,
        depth_class: item.depth_class,
        uom: item.uom,
        quantity: round2(item.quantity),
        source_takeoff_item_ids: [item.takeoff_item_id]
      });
    }
  }

  return {
    lines: Array.from(grouped.values()).sort(compareSummaryLines),
    excluded_count: items.length - approvedItems.length,
    approved_count: approvedItems.length,
    next_required_action: openItems.length > 0 ? "resolve_takeoff_review_flags" : "export_quantity_summary"
  };
}

function assertSummarizable(item: TakeoffItem): void {
  if (!item.material_type) throw new Error("summary_material_type_required");
  if (!item.diameter_in) throw new Error("summary_diameter_required");
  if (item.quantity <= 0) throw new Error("summary_quantity_must_be_positive");
  if (!item.uom) throw new Error("summary_uom_required");
}

function compareSummaryLines(a: QuantitySummaryLine, b: QuantitySummaryLine): number {
  return [
    a.material_type.localeCompare(b.material_type),
    a.diameter_in - b.diameter_in,
    (a.depth_class ?? "").localeCompare(b.depth_class ?? ""),
    a.uom.localeCompare(b.uom)
  ].find((value) => value !== 0) ?? 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
