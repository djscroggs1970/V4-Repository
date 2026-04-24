import type { EstimateLine, ProductionRateRule, TakeoffItem } from "@v4/domain";

export interface UnitCosts {
  material_unit_cost?: number;
  labor_daily_cost?: number;
  equipment_daily_cost?: number;
}

export function buildEstimateLine(input: {
  scenario_id: string;
  item: TakeoffItem;
  rule?: ProductionRateRule;
  unitCosts: UnitCosts;
}): EstimateLine {
  const materialCost = input.item.quantity * (input.unitCosts.material_unit_cost ?? 0);
  const productionDays = input.rule ? input.item.quantity / input.rule.units_per_day : 0;
  const laborCost = productionDays * (input.unitCosts.labor_daily_cost ?? 0);
  const equipmentCost = productionDays * (input.unitCosts.equipment_daily_cost ?? 0);

  return {
    estimate_line_id: `EL_${input.item.takeoff_item_id}`,
    scenario_id: input.scenario_id,
    takeoff_item_id: input.item.takeoff_item_id,
    quantity: input.item.quantity,
    uom: input.item.uom,
    material_cost: round2(materialCost),
    labor_cost: round2(laborCost),
    equipment_cost: round2(equipmentCost),
    total_cost: round2(materialCost + laborCost + equipmentCost),
    trace_refs: [input.item.takeoff_item_id, input.rule?.rule_id].filter(Boolean) as string[],
    project_instance_id: input.item.project_instance_id,
    data_layer: input.item.data_layer,
    source_origin: input.item.source_origin,
    framework_version: input.item.framework_version
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
