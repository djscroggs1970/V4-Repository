import { describe, expect, it } from "vitest";
import type { QuantityExportObject } from "@v4/vs1a";
import { buildCostBuildout } from "./index.js";

const QUANTITY_EXPORT: QuantityExportObject = {
  export_id: "QTY_EXPORT_SANDBOX_COST_001_20260425T030000000Z",
  export_type: "quantity_only",
  project_instance_id: "SANDBOX_COST_001",
  source_document_id: "DOC_SANDBOX_COST_001_CONTROLLED_PLAN",
  framework_version: "0.1.0",
  generated_at: "2026-04-25T03:00:00.000Z",
  line_count: 2,
  source_takeoff_item_ids: ["RUN-001_1", "RUN-002_1"],
  lines: [
    {
      project_instance_id: "SANDBOX_COST_001",
      material_type: "PVC_C900_DR18",
      diameter_in: 8,
      depth_class: "A_0_5",
      uom: "LF",
      quantity: 100,
      source_takeoff_item_ids: ["RUN-001_1"]
    },
    {
      project_instance_id: "SANDBOX_COST_001",
      material_type: "PVC_C900_DR18",
      diameter_in: 8,
      depth_class: "B_5_8",
      uom: "LF",
      quantity: 80,
      source_takeoff_item_ids: ["RUN-002_1"]
    }
  ]
};

const MATERIAL_QUOTES = [
  {
    quote_id: "MAT-PVC-8-LF-001",
    material_type: "PVC_C900_DR18",
    diameter_in: 8,
    unit_cost: 32,
    uom: "LF"
  }
];

const LABOR_RATES = [
  {
    labor_rate_id: "LAB-CREW-PIPE-001",
    crew_code: "PIPE_CREW_STANDARD",
    cost_per_day: 2800
  }
];

const EQUIPMENT_RATES = [
  {
    equipment_rate_id: "EQ-PIPE-001",
    equipment_code: "PIPE_EQUIPMENT_STANDARD",
    cost_per_day: 1900
  }
];

const PRODUCTION_RATES = [
  {
    production_rate_id: "PROD-PVC-8-A-001",
    work_type: "sanitary_pipe_run" as const,
    material_type: "PVC_C900_DR18",
    diameter_in: 8,
    depth_class: "A_0_5" as const,
    production_uom: "LF",
    units_per_day: 100,
    crew_code: "PIPE_CREW_STANDARD",
    equipment_code: "PIPE_EQUIPMENT_STANDARD",
    validation_status: "validated" as const
  },
  {
    production_rate_id: "PROD-PVC-8-B-001",
    work_type: "sanitary_pipe_run" as const,
    material_type: "PVC_C900_DR18",
    diameter_in: 8,
    depth_class: "B_5_8" as const,
    production_uom: "LF",
    units_per_day: 80,
    crew_code: "PIPE_CREW_STANDARD",
    equipment_code: "PIPE_EQUIPMENT_STANDARD",
    validation_status: "validated" as const
  }
];

describe("VS1B cost buildout", () => {
  it("builds cost lines from approved quantity export using controlled cost inputs", () => {
    const result = buildCostBuildout({
      quantity_export: QUANTITY_EXPORT,
      material_quotes: MATERIAL_QUOTES,
      labor_rates: LABOR_RATES,
      equipment_rates: EQUIPMENT_RATES,
      production_rates: PRODUCTION_RATES,
      scenario_id: "SCENARIO_COST_001",
      generated_at: "2026-04-25T03:05:00.000Z"
    });

    expect(result.project_instance_id).toBe("SANDBOX_COST_001");
    expect(result.source_export_id).toBe(QUANTITY_EXPORT.export_id);
    expect(result.line_count).toBe(2);
    expect(result.subtotal_material_cost).toBe(5760);
    expect(result.subtotal_labor_cost).toBe(5600);
    expect(result.subtotal_equipment_cost).toBe(3800);
    expect(result.total_cost).toBe(15160);
    expect(result.lines[0]).toMatchObject({
      estimate_line_id: "SCENARIO_COST_001_LINE_001",
      material_type: "PVC_C900_DR18",
      diameter_in: 8,
      depth_class: "A_0_5",
      quantity: 100,
      material_cost: 3200,
      labor_cost: 2800,
      equipment_cost: 1900,
      total_cost: 7900,
      production_days: 1,
      material_quote_id: "MAT-PVC-8-LF-001",
      production_rate_id: "PROD-PVC-8-A-001"
    });
    expect(result.lines.flatMap((line) => line.source_takeoff_item_ids)).toEqual(["RUN-001_1", "RUN-002_1"]);
    expect(result.lines.every((line) => line.trace_refs.includes(QUANTITY_EXPORT.export_id))).toBe(true);
  });

  it("rejects placeholder production rates", () => {
    expect(() => buildCostBuildout({
      quantity_export: QUANTITY_EXPORT,
      material_quotes: MATERIAL_QUOTES,
      labor_rates: LABOR_RATES,
      equipment_rates: EQUIPMENT_RATES,
      production_rates: [
        {
          ...PRODUCTION_RATES[0]!,
          validation_status: "placeholder"
        }
      ],
      scenario_id: "SCENARIO_COST_002"
    })).toThrow("production_rate_must_be_validated");
  });

  it("rejects cost buildout when a material quote is missing", () => {
    expect(() => buildCostBuildout({
      quantity_export: QUANTITY_EXPORT,
      material_quotes: [],
      labor_rates: LABOR_RATES,
      equipment_rates: EQUIPMENT_RATES,
      production_rates: PRODUCTION_RATES,
      scenario_id: "SCENARIO_COST_003"
    })).toThrow("material_quotes_required");
  });
});
