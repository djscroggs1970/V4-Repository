import { describe, expect, it } from "vitest";
import type { ProductionRateRule } from "@v4/domain";
import { depthClassFromFeet, resolveProductionRate } from "./index.js";

const baseRule: ProductionRateRule = {
  rule_id: "PRR_PVC_8_A",
  rule_version: "v0.1-placeholder",
  work_type: "pvc_gravity_sewer",
  material_type: "PVC_C900_DR18",
  diameter_in: 8,
  depth_class: "A_0_5",
  production_uom: "LF_DAY",
  units_per_day: 250,
  validation_status: "placeholder",
  data_layer: "framework",
  source_origin: "framework_seed",
  framework_version: "v0.1-bootstrap"
};

describe("resolveProductionRate", () => {
  it("resolves matching rule", () => {
    const result = resolveProductionRate({ material_type: "PVC_C900_DR18", diameter_in: 8, depth_class: "A_0_5" }, [baseRule]);
    expect(result.status).toBe("resolved");
    expect(result.rule?.rule_id).toBe("PRR_PVC_8_A");
  });

  it("returns unresolved for missing input", () => {
    const result = resolveProductionRate({ material_type: "PVC_C900_DR18" }, [baseRule]);
    expect(result.status).toBe("unresolved");
  });

  it("classifies depth", () => {
    expect(depthClassFromFeet(4.9)).toBe("A_0_5");
    expect(depthClassFromFeet(8.1)).toBe("C_8_10");
    expect(depthClassFromFeet(12.1)).toBe("E_OVER_12");
  });
});
