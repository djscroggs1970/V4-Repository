import { describe, expect, it } from "vitest";
import {
  applyTakeoffReviews,
  buildQuantityExport,
  buildQuantityExportPersistenceRecord,
  buildQuantitySummary,
  buildTakeoffCandidateEntryResult
} from "./index.js";

const CONTROLLED_PLAN_SHEET_INDEX = [
  { sheet_number: "C-00", sheet_title: "Cover", discipline: "general" },
  { sheet_number: "C-01", sheet_title: "Notes", discipline: "general" },
  { sheet_number: "C-02", sheet_title: "Zoning Conditions", discipline: "general" },
  { sheet_number: "C-10", sheet_title: "Existing Conditions and Boundary Survey", discipline: "survey" },
  { sheet_number: "C-11", sheet_title: "Demolition Plan and Existing Tree Canopy and Tree Removal Plan", discipline: "demolition" },
  { sheet_number: "C-20", sheet_title: "Preliminary Plat", discipline: "site" },
  { sheet_number: "C-21", sheet_title: "Site Plan", discipline: "site" },
  { sheet_number: "C-30", sheet_title: "Grading Plan", discipline: "grading" },
  { sheet_number: "C-31", sheet_title: "Wall Profiles", discipline: "grading" },
  { sheet_number: "C-32", sheet_title: "Roadway Profiles", discipline: "grading" },
  { sheet_number: "C-40", sheet_title: "Stormwater Management Plan", discipline: "storm" },
  { sheet_number: "C-41", sheet_title: "Stormwater Management Profiles", discipline: "storm" },
  { sheet_number: "C-42", sheet_title: "Stormwater Management Profiles", discipline: "storm" },
  { sheet_number: "C-43", sheet_title: "Stormwater Management Easements", discipline: "storm" },
  { sheet_number: "C-44", sheet_title: "Pond Details", discipline: "storm" },
  { sheet_number: "C-50", sheet_title: "Utility Plan", discipline: "utilities" },
  { sheet_number: "C-51", sheet_title: "Sanitary Profiles", discipline: "utilities" },
  { sheet_number: "C-52", sheet_title: "Utility Easements", discipline: "utilities" },
  { sheet_number: "C-60", sheet_title: "ES&PC Cover", discipline: "erosion_control" },
  { sheet_number: "C-61", sheet_title: "ES&PC Notes", discipline: "erosion_control" },
  { sheet_number: "C-62", sheet_title: "ES&PC Plan Initial Phase", discipline: "erosion_control" },
  { sheet_number: "C-63", sheet_title: "ES&PC Plan Intermediate Phase", discipline: "erosion_control" },
  { sheet_number: "C-64", sheet_title: "ES&PC Plan Final Phase", discipline: "erosion_control" },
  { sheet_number: "C-65", sheet_title: "ES&PC Details", discipline: "erosion_control" },
  { sheet_number: "C-66", sheet_title: "ES&PC Details", discipline: "erosion_control" },
  { sheet_number: "C-67", sheet_title: "ES&PC Details", discipline: "erosion_control" },
  { sheet_number: "C-70", sheet_title: "Tree Protection and Landscape Plan", discipline: "landscape" },
  { sheet_number: "C-71", sheet_title: "Tree Protection and Landscape Plan Notes", discipline: "landscape" },
  { sheet_number: "C-72", sheet_title: "Vegetated Buffer Planting Plan", discipline: "landscape" },
  { sheet_number: "D-1", sheet_title: "Construction Details", discipline: "details" },
  { sheet_number: "D-2", sheet_title: "Construction Details", discipline: "details" },
  { sheet_number: "D-3", sheet_title: "Construction Details", discipline: "details" },
  { sheet_number: "D-4", sheet_title: "Construction Details", discipline: "details" },
  { sheet_number: "D-5", sheet_title: "Construction Details", discipline: "details" },
  { sheet_number: "D-6", sheet_title: "Construction Details", discipline: "details" }
];

const CONTROLLED_SANITARY_RUNS = [
  {
    run_id: "VALIDATION-SS-001",
    source_sheet_id: "SHEET_C_51",
    from_structure: "SS-1",
    to_structure: "SS-2",
    length_lf: 28,
    diameter_in: 8,
    material_type: "PVC_C900_DR18",
    slope_percent: 0.5,
    upstream_depth_ft: 12.6,
    downstream_depth_ft: 10.07,
    confidence: 0.95
  },
  {
    run_id: "VALIDATION-SS-002",
    source_sheet_id: "SHEET_C_51",
    from_structure: "SS-2",
    to_structure: "SS-3",
    length_lf: 110,
    diameter_in: 8,
    material_type: "PVC_C900_DR18",
    slope_percent: 0.5,
    upstream_depth_ft: 10.07,
    downstream_depth_ft: 5.14,
    confidence: 0.95
  },
  {
    run_id: "VALIDATION-SS-003",
    source_sheet_id: "SHEET_C_51",
    from_structure: "SS-3",
    to_structure: "SS-4",
    length_lf: 76,
    diameter_in: 8,
    material_type: "DIP_P401_CLASS_350",
    slope_percent: 0.5,
    upstream_depth_ft: 5.14,
    downstream_depth_ft: 3.37,
    confidence: 0.95
  },
  {
    run_id: "VALIDATION-SS-004",
    source_sheet_id: "SHEET_C_51",
    from_structure: "SS-4",
    to_structure: "SS-5",
    length_lf: 142,
    diameter_in: 8,
    material_type: "DIP_P401_CLASS_350",
    slope_percent: 0.5,
    upstream_depth_ft: 3.37,
    downstream_depth_ft: 6.14,
    confidence: 0.95
  }
];

describe("VS1A controlled real-plan-style validation fixture", () => {
  it("runs anonymized plan-derived sheet index and manually structured sanitary profile quantities through VS1A", () => {
    const candidate = buildTakeoffCandidateEntryResult({
      project: {
        project_instance_id: "SANDBOX_CONTROLLED_PLAN_VALIDATION_001",
        project_code: "CONTROLLED_PLAN_SANDBOX",
        project_name: "Controlled Real-Plan-Style Validation"
      },
      uploaded_drawing: {
        file_name: "controlled-civil-plan-validation.pdf",
        drive_file_id: "source-tab-controlled-plan-validation",
        mime_type: "application/pdf"
      },
      sheet_index: CONTROLLED_PLAN_SHEET_INDEX,
      runs: CONTROLLED_SANITARY_RUNS
    });

    expect(candidate.drawing_sheets).toHaveLength(CONTROLLED_PLAN_SHEET_INDEX.length);
    expect(candidate.drawing_sheets.map((sheet) => sheet.drawing_sheet_id)).toContain("SHEET_C_50");
    expect(candidate.drawing_sheets.map((sheet) => sheet.drawing_sheet_id)).toContain("SHEET_C_51");
    expect(candidate.takeoff_items.every((item) => item.project_instance_id === "SANDBOX_CONTROLLED_PLAN_VALIDATION_001")).toBe(true);
    expect(candidate.takeoff_items.every((item) => item.source_sheet_id === "SHEET_C_51")).toBe(true);

    const reviewed = applyTakeoffReviews(candidate.takeoff_items, candidate.takeoff_items.map((item) => ({
      takeoff_item_id: item.takeoff_item_id,
      decision: "approved" as const,
      reviewer: "controlled_validation"
    })));
    const summary = buildQuantitySummary(reviewed);
    const totalLf = round2(summary.lines.reduce((sum, line) => sum + line.quantity, 0));
    const pvcLf = round2(summary.lines
      .filter((line) => line.material_type === "PVC_C900_DR18")
      .reduce((sum, line) => sum + line.quantity, 0));
    const dipLf = round2(summary.lines
      .filter((line) => line.material_type === "DIP_P401_CLASS_350")
      .reduce((sum, line) => sum + line.quantity, 0));

    expect(summary.next_required_action).toBe("export_quantity_summary");
    expect(totalLf).toBe(356);
    expect(pvcLf).toBe(138);
    expect(dipLf).toBe(218);
    expect(new Set(summary.lines.map((line) => line.depth_class)).size).toBeGreaterThan(1);
    expect(summary.lines.flatMap((line) => line.source_takeoff_item_ids).length).toBe(reviewed.length);

    const exported = buildQuantityExport({
      project_instance_id: candidate.project.project_instance_id,
      source_document_id: candidate.source_document.source_document_id,
      summary,
      generated_at: "2026-04-25T02:40:00.000Z"
    });
    const persistence = buildQuantityExportPersistenceRecord({
      export_object: exported,
      storage_root_uri: "drive://V4 Framework",
      persisted_at: "2026-04-25T02:41:00.000Z"
    });

    expect(exported.export_type).toBe("quantity_only");
    expect(exported.project_instance_id).toBe("SANDBOX_CONTROLLED_PLAN_VALIDATION_001");
    expect(exported.line_count).toBe(summary.lines.length);
    expect(persistence.storage_path).toBe(`project-instances/${exported.project_instance_id}/exports/quantity-only/${exported.export_id}.json`);
  });
});

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
