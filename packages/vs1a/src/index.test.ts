import { describe, expect, it } from "vitest";
import { buildVS1AResult } from "./index.js";

describe("VS1A quantity pipeline", () => {
  it("creates isolated project takeoff records", () => {
    const result = buildVS1AResult({
      project: {
        project_instance_id: "PRJ_PROMENADE_2026_001",
        project_code: "PROMENADE",
        project_name: "The Promenade"
      },
      source_document: {
        source_document_id: "DOC_PROMENADE_UTILITIES",
        file_name: "05_The_Promenade_Utilities_Water_Sanitary_C-50_to_C-52.pdf"
      },
      sheets: [
        { sheet_number: "C-50", sheet_title: "Utility Plan" },
        { sheet_number: "C-51", sheet_title: "Sanitary Profiles" }
      ],
      runs: [
        {
          run_id: "RUN-SSA-01",
          source_sheet_id: "SHEET_C_51",
          from_structure: "SSA1",
          to_structure: "SSA2",
          length_lf: 28,
          diameter_in: 8,
          material_type: "PVC_C900_DR18",
          upstream_depth_ft: 12.8,
          downstream_depth_ft: 10.07
        }
      ]
    });

    expect(result.project.project_instance_id).toBe("PRJ_PROMENADE_2026_001");
    expect(result.source_document.doc_type).toBe("drawing_pdf");
    expect(result.drawing_sheets).toHaveLength(2);
    expect(result.takeoff_items.length).toBeGreaterThan(0);
    expect(result.takeoff_items.every((item) => item.project_instance_id === "PRJ_PROMENADE_2026_001")).toBe(true);
    expect(result.takeoff_items.every((item) => item.data_layer === "project")).toBe(true);
  });
});
