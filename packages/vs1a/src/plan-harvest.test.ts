import { describe, expect, it } from "vitest";
import {
  applyTakeoffReviews,
  buildPlanHarvestSandboxResult,
  buildQuantityExport,
  buildQuantitySummary
} from "./index.js";

const SHEET_INDEX = [
  { sheet_number: "C-50", sheet_title: "Utility Plan", discipline: "utilities" },
  { sheet_number: "C-51", sheet_title: "Sanitary Profiles", discipline: "utilities" }
];

const HARVESTED_RUNS = [
  {
    candidate_id: "HARVEST-SS-001",
    source_sheet_id: "SHEET_C_51",
    from_structure: "SS-1",
    to_structure: "SS-2",
    length_lf: 28,
    diameter_in: 8,
    material_type: "PVC_C900_DR18",
    slope_percent: 0.5,
    upstream_depth_ft: 12.6,
    downstream_depth_ft: 10.07,
    confidence: 0.91,
    source_page_label: "C-51",
    source_excerpt: "28-FT OF 8-IN SANITARY PIPE @ 0.50%"
  },
  {
    candidate_id: "HARVEST-SS-002",
    source_sheet_id: "SHEET_C_51",
    from_structure: "SS-2",
    to_structure: "SS-3",
    length_lf: 110,
    diameter_in: 8,
    material_type: "PVC_C900_DR18",
    slope_percent: 0.5,
    upstream_depth_ft: 10.07,
    downstream_depth_ft: 5.14,
    confidence: 0.88,
    source_page_label: "C-51",
    source_excerpt: "110-FT OF 8-IN SANITARY PIPE @ 0.50%"
  }
];

describe("VS1A plan harvest sandbox", () => {
  it("creates provisional sandbox takeoff candidates with provenance and review gates", () => {
    const harvest = buildPlanHarvestSandboxResult({
      project: {
        project_instance_id: "SANDBOX_PLAN_HARVEST_001",
        project_code: "PLAN_HARVEST_SANDBOX",
        project_name: "Plan Harvest Sandbox"
      },
      uploaded_drawing: {
        file_name: "controlled-plan-harvest.pdf",
        drive_file_id: "drive-controlled-plan-harvest",
        mime_type: "application/pdf"
      },
      sheet_index: SHEET_INDEX,
      harvested_runs: HARVESTED_RUNS
    });

    expect(harvest.harvest_status).toBe("provisional_requires_review");
    expect(harvest.next_required_action).toBe("review_takeoff_candidates");
    expect(harvest.project.data_layer).toBe("sandbox");
    expect(harvest.source_document.processing_status).toBe("parsed");
    expect(harvest.drawing_sheets.every((sheet) => sheet.data_layer === "sandbox")).toBe(true);
    expect(harvest.takeoff_items.every((item) => item.data_layer === "sandbox")).toBe(true);
    expect(harvest.takeoff_items.every((item) => item.review_status === "pending")).toBe(true);
    expect(harvest.takeoff_items.every((item) => item.project_instance_id === "SANDBOX_PLAN_HARVEST_001")).toBe(true);
    expect(harvest.provenance).toHaveLength(HARVESTED_RUNS.length);
    expect(harvest.provenance.every((record) => record.harvest_status === "provisional_requires_review")).toBe(true);
  });

  it("blocks harvested quantities from export until reviewed and approved", () => {
    const harvest = buildPlanHarvestSandboxResult({
      project: {
        project_instance_id: "SANDBOX_PLAN_HARVEST_002",
        project_code: "PLAN_HARVEST_SANDBOX",
        project_name: "Plan Harvest Export Gate Sandbox"
      },
      uploaded_drawing: {
        file_name: "controlled-plan-harvest.pdf",
        drive_file_id: "drive-controlled-plan-harvest",
        mime_type: "application/pdf"
      },
      sheet_index: SHEET_INDEX,
      harvested_runs: HARVESTED_RUNS
    });

    const unreviewedSummary = buildQuantitySummary(harvest.takeoff_items);
    expect(unreviewedSummary.next_required_action).toBe("resolve_takeoff_review_flags");
    expect(() => buildQuantityExport({
      project_instance_id: harvest.project.project_instance_id,
      source_document_id: harvest.source_document.source_document_id,
      summary: unreviewedSummary
    })).toThrow("quantity_summary_not_ready_for_export");

    const reviewed = applyTakeoffReviews(harvest.takeoff_items, harvest.takeoff_items.map((item) => ({
      takeoff_item_id: item.takeoff_item_id,
      decision: "approved" as const,
      reviewer: "harvest_validation"
    })));
    const approvedSummary = buildQuantitySummary(reviewed);
    const approvedTotal = Math.round(approvedSummary.lines.reduce((sum, line) => sum + line.quantity, 0) * 100) / 100;

    expect(approvedSummary.next_required_action).toBe("export_quantity_summary");
    expect(approvedTotal).toBe(138);
    expect(buildQuantityExport({
      project_instance_id: harvest.project.project_instance_id,
      source_document_id: harvest.source_document.source_document_id,
      summary: approvedSummary,
      generated_at: "2026-04-25T03:00:00.000Z"
    }).export_type).toBe("quantity_only");
  });

  it("rejects harvested candidates that reference unknown sheets", () => {
    expect(() => buildPlanHarvestSandboxResult({
      project: {
        project_instance_id: "SANDBOX_PLAN_HARVEST_003",
        project_code: "PLAN_HARVEST_SANDBOX",
        project_name: "Unknown Sheet Harvest Sandbox"
      },
      uploaded_drawing: {
        file_name: "controlled-plan-harvest.pdf",
        drive_file_id: "drive-controlled-plan-harvest"
      },
      sheet_index: SHEET_INDEX,
      harvested_runs: [
        {
          ...HARVESTED_RUNS[0]!,
          source_sheet_id: "SHEET_C_99"
        }
      ]
    })).toThrow("harvest_source_sheet_not_found");
  });

  it("rejects harvested candidates with out-of-range confidence", () => {
    expect(() => buildPlanHarvestSandboxResult({
      project: {
        project_instance_id: "SANDBOX_PLAN_HARVEST_004",
        project_code: "PLAN_HARVEST_SANDBOX",
        project_name: "Bad Confidence Harvest Sandbox"
      },
      uploaded_drawing: {
        file_name: "controlled-plan-harvest.pdf",
        drive_file_id: "drive-controlled-plan-harvest"
      },
      sheet_index: SHEET_INDEX,
      harvested_runs: [
        {
          ...HARVESTED_RUNS[0]!,
          confidence: 1.5
        }
      ]
    })).toThrow("harvest_confidence_out_of_range");
  });
});
