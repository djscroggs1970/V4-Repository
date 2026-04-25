import { describe, expect, it } from "vitest";
import { applyTakeoffReviews, buildSheetIndexCreationResult, buildTakeoffCandidateEntryResult, buildUploadRegistrationResult, buildVS1AResult, summarizeTakeoffReview } from "./index.js";

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

  it("registers uploaded drawing without extracting sheets or runs", () => {
    const result = buildUploadRegistrationResult({
      project: {
        project_instance_id: "PRJ_TEST_2026_001",
        project_code: "TEST",
        project_name: "Upload Registration Test"
      },
      uploaded_drawing: {
        file_name: "utility-plan.pdf",
        drive_file_id: "drive-file-001",
        mime_type: "application/pdf"
      }
    });

    expect(result.project.project_instance_id).toBe("PRJ_TEST_2026_001");
    expect(result.source_document.file_name).toBe("utility-plan.pdf");
    expect(result.source_document.drive_file_id).toBe("drive-file-001");
    expect(result.source_document.processing_status).toBe("new");
    expect(result.drawing_sheets).toHaveLength(0);
    expect(result.takeoff_items).toHaveLength(0);
    expect(result.next_required_action).toBe("create_sheet_index");
  });

  it("creates controlled sheet index after upload registration", () => {
    const result = buildSheetIndexCreationResult({
      project: {
        project_instance_id: "PRJ_TEST_2026_003",
        project_code: "TEST",
        project_name: "Sheet Index Test"
      },
      uploaded_drawing: {
        file_name: "utility-plan.pdf",
        drive_file_id: "drive-file-003",
        mime_type: "application/pdf"
      },
      sheet_index: [
        { sheet_number: "C-50", sheet_title: "Utility Plan", discipline: "utilities" },
        { sheet_number: "C-51", sheet_title: "Sanitary Profiles", discipline: "utilities" }
      ]
    });

    expect(result.project.project_instance_id).toBe("PRJ_TEST_2026_003");
    expect(result.drawing_sheets).toHaveLength(2);
    expect(result.drawing_sheets[0]?.source_document_id).toBe(result.source_document.source_document_id);
    expect(result.drawing_sheets.every((sheet) => sheet.project_instance_id === "PRJ_TEST_2026_003")).toBe(true);
    expect(result.takeoff_items).toHaveLength(0);
    expect(result.next_required_action).toBe("create_takeoff_candidates");
  });

  it("creates controlled takeoff candidates from reviewed sheet records", () => {
    const result = buildTakeoffCandidateEntryResult({
      project: {
        project_instance_id: "PRJ_TEST_2026_005",
        project_code: "TEST",
        project_name: "Takeoff Candidate Test"
      },
      uploaded_drawing: {
        file_name: "utility-plan.pdf",
        drive_file_id: "drive-file-005",
        mime_type: "application/pdf"
      },
      sheet_index: [
        { sheet_number: "C-51", sheet_title: "Sanitary Profiles", discipline: "utilities" }
      ],
      runs: [
        {
          run_id: "RUN-001",
          source_sheet_id: "SHEET_C_51",
          from_structure: "MH-1",
          to_structure: "MH-2",
          length_lf: 100,
          diameter_in: 8,
          material_type: "PVC_C900_DR18",
          upstream_depth_ft: 9,
          downstream_depth_ft: 6
        }
      ]
    });

    expect(result.project.project_instance_id).toBe("PRJ_TEST_2026_005");
    expect(result.drawing_sheets).toHaveLength(1);
    expect(result.takeoff_items.length).toBeGreaterThan(0);
    expect(result.takeoff_items.every((item) => item.project_instance_id === "PRJ_TEST_2026_005")).toBe(true);
    expect(result.takeoff_items.every((item) => item.source_sheet_id === "SHEET_C_51")).toBe(true);
    expect(result.takeoff_items.every((item) => item.review_status === "pending")).toBe(true);
    expect(result.next_required_action).toBe("review_takeoff_candidates");
  });

  it("applies takeoff review decisions and summarizes next action", () => {
    const candidate = buildTakeoffCandidateEntryResult({
      project: {
        project_instance_id: "PRJ_TEST_2026_007",
        project_code: "TEST",
        project_name: "Takeoff Review Test"
      },
      uploaded_drawing: {
        file_name: "utility-plan.pdf",
        drive_file_id: "drive-file-007"
      },
      sheet_index: [
        { sheet_number: "C-51" }
      ],
      runs: [
        {
          run_id: "RUN-001",
          source_sheet_id: "SHEET_C_51",
          from_structure: "MH-1",
          to_structure: "MH-2",
          length_lf: 100,
          diameter_in: 8,
          material_type: "PVC_C900_DR18"
        }
      ]
    });

    const reviewed = applyTakeoffReviews(candidate.takeoff_items, [
      { takeoff_item_id: candidate.takeoff_items[0]!.takeoff_item_id, decision: "approved", reviewer: "estimator" }
    ]);
    const summary = summarizeTakeoffReview(reviewed);

    expect(reviewed[0]?.review_status).toBe("approved");
    expect(summary.approved_count).toBe(1);
    expect(summary.next_required_action).toBe("create_quantity_summary");
  });

  it("requires notes for rejected or flagged takeoff reviews", () => {
    const candidate = buildTakeoffCandidateEntryResult({
      project: {
        project_instance_id: "PRJ_TEST_2026_008",
        project_code: "TEST",
        project_name: "Takeoff Review Note Test"
      },
      uploaded_drawing: {
        file_name: "utility-plan.pdf",
        drive_file_id: "drive-file-008"
      },
      sheet_index: [
        { sheet_number: "C-51" }
      ],
      runs: [
        {
          run_id: "RUN-001",
          source_sheet_id: "SHEET_C_51",
          from_structure: "MH-1",
          to_structure: "MH-2",
          length_lf: 100,
          diameter_in: 8,
          material_type: "PVC_C900_DR18"
        }
      ]
    });

    expect(() => applyTakeoffReviews(candidate.takeoff_items, [
      { takeoff_item_id: candidate.takeoff_items[0]!.takeoff_item_id, decision: "rejected" }
    ])).toThrow("review_note_required");
  });

  it("rejects takeoff candidates that reference unknown sheets", () => {
    expect(() => buildTakeoffCandidateEntryResult({
      project: {
        project_instance_id: "PRJ_TEST_2026_006",
        project_code: "TEST",
        project_name: "Unknown Sheet Test"
      },
      uploaded_drawing: {
        file_name: "utility-plan.pdf",
        drive_file_id: "drive-file-006"
      },
      sheet_index: [
        { sheet_number: "C-51" }
      ],
      runs: [
        {
          run_id: "RUN-001",
          source_sheet_id: "SHEET_C_99",
          from_structure: "MH-1",
          to_structure: "MH-2",
          length_lf: 100,
          diameter_in: 8,
          material_type: "PVC_C900_DR18"
        }
      ]
    })).toThrow("run_source_sheet_not_found");
  });

  it("rejects duplicate sheet numbers", () => {
    expect(() => buildSheetIndexCreationResult({
      project: {
        project_instance_id: "PRJ_TEST_2026_004",
        project_code: "TEST",
        project_name: "Duplicate Sheet Test"
      },
      uploaded_drawing: {
        file_name: "utility-plan.pdf",
        drive_file_id: "drive-file-004"
      },
      sheet_index: [
        { sheet_number: "C-50" },
        { sheet_number: "C 50" }
      ]
    })).toThrow("duplicate_sheet_number");
  });

  it("rejects non-pdf uploads", () => {
    expect(() => buildUploadRegistrationResult({
      project: {
        project_instance_id: "PRJ_TEST_2026_002",
        project_code: "TEST",
        project_name: "Bad Upload Test"
      },
      uploaded_drawing: {
        file_name: "utility-plan.xlsx",
        drive_file_id: "drive-file-002"
      }
    })).toThrow("uploaded_drawing_must_be_pdf");
  });
});
