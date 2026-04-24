import type { DepthClass, ProductionRateRule, TakeoffItem } from "@v4/domain";

export interface RateResolution {
  status: "resolved" | "unresolved";
  rule?: ProductionRateRule;
  reason?: string;
}

export function resolveProductionRate(
  item: Pick<TakeoffItem, "material_type" | "diameter_in" | "depth_class">,
  rules: ProductionRateRule[]
): RateResolution {
  if (!item.material_type || !item.diameter_in || !item.depth_class) {
    return { status: "unresolved", reason: "missing_input" };
  }

  const match = rules.find((rule) =>
    rule.material_type === item.material_type &&
    rule.diameter_in === item.diameter_in &&
    rule.depth_class === item.depth_class &&
    rule.validation_status !== "retired"
  );

  return match ? { status: "resolved", rule: match } : { status: "unresolved", reason: "no_matching_rule" };
}

export function depthClassFromFeet(depthFt: number): DepthClass {
  if (depthFt <= 5) return "A_0_5";
  if (depthFt <= 8) return "B_5_8";
  if (depthFt <= 10) return "C_8_10";
  if (depthFt <= 12) return "D_10_12";
  return "E_OVER_12";
}
