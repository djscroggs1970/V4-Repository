import { describe, expect, it } from "vitest";
import { applyTakeoffReviews, buildQuantityExport, buildQuantityExportPersistenceRecord, buildQuantitySummary, buildSheetIndexCreationResult, buildTakeoffCandidateEntryResult, buildUploadRegistrationResult, buildVS1AResult, summarizeTakeoffReview } from "./index.js";

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

  it("summarizes only approved takeoff items and preserves source item IDs", () => {
    const candidate = buildTakeoffCandidateEntryResult({
      project: {
        project_instance_id: "PRJ_TEST_2026_009",
        project_code: "TEST",
        project_name: "Quantity Summary Test"
      },
      uploaded_drawing: {
        file_name: "utility-plan.pdf",
        drive_file_id: "drive-file-009"
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
          material_type: "PVC_C900_DR18",
          upstream_depth_ft: 4,
          downstream_depth_ft: 4
        },
        {
          run_id: "RUN-002",
          source_sheet_id: "SHEET_C_51",
          from_structure: "MH-2",
          to_structure: "MH-3",
          length_lf: 50,
          diameter_in: 8,
          material_type: "PVC_C900_DR18",
          upstream_depth_ft: 4,
          downstream_depth_ft: 4
        },
        {
          run_id: "RUN-003",
          source_sheet_id: "SHEET_C_51",
          from_structure: "MH-3",
          to_structure: "MH-4",
          length_lf: 25,
          diameter_in: 8,
          material_type: "PVC_C900_DR18",
          upstream_depth_ft: 7,
          downstream_depth_ft: 7
        },
        {
          run_id: "RUN-004",
          source_sheet_id: "SHEET_C_51",
          from_structure: "MH-4",
          to_structure: "MH-5",
          length_lf: 10,
          diameter_in: 10,
          material_type: "PVC_C900_DR18",
          upstream_depth_ft: 4,
          downstream_depth_ft: 4
        }
      ]
    });

    const reviewed = applyTakeoffReviews(candidate.takeoff_items, [
      { takeoff_item_id: "RUN-001_1", decision: "approved" },
      { takeoff_item_id: "RUN-002_1", decision: "approved" },
      { takeoff_item_id: "RUN-003_1", decision: "rejected", note: "Not in contract scope" },
      { takeoff_item_id: "RUN-004_1", decision: "needs_review", note: "Confirm diameter" }
    ]);
    const summary = buildQuantitySummary(reviewed);

    expect(summary.approved_count).toBe(2);
    expect(summary.excluded_count).toBe(reviewed.length - 2);
    expect(summary.lines).toHaveLength(1);
    expect(summary.lines[0]).toMatchObject({
      project_instance_id: "PRJ_TEST_2026_009",
      material_type: "PVC_C900_DR18",
      diameter_in: 8,
      depth_class: "A_0_5",
      uom: "LF",
      quantity: 150
    });
    expect(summary.lines[0]?.source_takeoff_item_ids).toEqual(["RUN-001_1", "RUN-002_1"]);
    expect(summary.next_required_action).toBe("resolve_takeoff_review_flags");
  });

  it("groups quantity summary by material diameter depth class and unit", () => {
    const candidate = buildTakeoffCandidateEntryResult({
      project: {
        project_instance_id: "PRJ_TEST_2026_010",
        project_code: "TEST",
        project_name: "Quantity Grouping Test"
      },
      uploaded_drawing: {
        file_name: "utility-plan.pdf",
        drive_file_id: "drive-file-010"
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
          material_type: "PVC_C900_DR18",
          upstream_depth_ft: 4,
          downstream_depth_ft: 4
        },
        {
          run_id: "RUN-002",
          source_sheet_id: "SHEET_C_51",
          from_structure: "MH-2",
          to_structure: "MH-3",
          length_lf: 40,
          diameter_in: 8,
          material_type: "PVC_C900_DR18",
          upstream_depth_ft: 7,
          downstream_depth_ft: 7
        },
        {
          run_id: "RUN-003",
          source_sheet_id: "SHEET_C_51",
          from_structure: "MH-3",
          to_structure: "MH-4",
          length_lf: 20,
          diameter_in: 10,
          material_type: "PVC_C900_DR18",
          upstream_depth_ft: 4,
          downstream_depth_ft: 4
        }
      ]
    });

    const reviewed = applyTakeoffReviews(candidate.takeoff_items, candidate.takeoff_items.map((item) => ({
      takeoff_item_id: item.takeoff_item_id,
      decision: "approved" as const
    })));
    const summary = buildQuantitySummary(reviewed);

    expect(summary.lines).toHaveLength(3);
    expect(summary.lines.map((line) => `${line.material_type}|${line.diameter_in}|${line.depth_class}|${line.uom}`)).toEqual([
      "PVC_C900_DR18|8|A_0_5|LF",
      "PVC_C900_DR18|8|B_5_8|LF",
      "PVC_C900_DR18|10|A_0_5|LF"
    ]);
    expect(summary.next_required_action).toBe("export_quantity_summary");
  });

  it("builds a quantity-only export from a ready summary", () => {
    const candidate = buildTakeoffCandidateEntryResult({
      project: {
        project_instance_id: "PRJ_TEST_2026_011",
        project_code: "TEST",
        project_name: "Quantity Export Test"
      },
      uploaded_drawing: {
        file_name: "utility-plan.pdf",
        drive_file_id: "drive-file-011"
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
          material_type: "PVC_C900_DR18",
          upstream_depth_ft: 4,
          downstream_depth_ft: 4
        }
      ]
    });
    const reviewed = applyTakeoffReviews(candidate.takeoff_items, [
      { takeoff_item_id: "RUN-001_1", decision: "approved" }
    ]);
    const summary = buildQuantitySummary(reviewed);
    const exported = buildQuantityExport({
      project_instance_id: candidate.project.project_instance_id,
      source_document_id: candidate.source_document.source_document_id,
      summary,
      generated_at: "2026-04-24T21:30:00.000Z"
    });

    expect(exported.export_type).toBe("quantity_only");
    expect(exported.project_instance_id).toBe("PRJ_TEST_2026_011");
    expect(exported.source_document_id).toBe(candidate.source_document.source_document_id);
    expect(exported.framework_version).toBeTruthy();
    expect(exported.generated_at).toBe("2026-04-24T21:30:00.000Z");
    expect(exported.line_count).toBe(1);
    expect(exported.source_takeoff_item_ids).toEqual(["RUN-001_1"]);
    expect(exported.lines[0]?.source_takeoff_item_ids).toEqual(["RUN-001_1"]);
  });

  it("rejects quantity export when summary has open review items", () => {
    const candidate = buildTakeoffCandidateEntryResult({
      project: {
        project_instance_id: "PRJ_TEST_2026_012",
        project_code: "TEST",
        project_name: "Quantity Export Block Test"
      },
      uploaded_drawing: {
        file_name: "utility-plan.pdf",
        drive_file_id: "drive-file-012"
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
    const summary = buildQuantitySummary(candidate.takeoff_items);

    expect(() => buildQuantityExport({
      project_instance_id: candidate.project.project_instance_id,
      source_document_id: candidate.source_document.source_document_id,
      summary
    })).toThrow("quantity_summary_not_ready_for_export");
  });

  it("builds a project-isolated export persistence record", () => {
    const candidate = buildTakeoffCandidateEntryResult({
      project: {
        project_instance_id: "PRJ_TEST_2026_013",
        project_code: "TEST",
        project_name: "Export Persistence Test"
      },
      uploaded_drawing: {
        file_name: "utility-plan.pdf",
        drive_file_id: "drive-file-013"
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
          material_type: "PVC_C900_DR18",
          upstream_depth_ft: 4,
          downstream_depth_ft: 4
        }
      ]
    });
    const reviewed = applyTakeoffReviews(candidate.takeoff_items, [
      { takeoff_item_id: "RUN-001_1", decision: "approved" }
    ]);
    const summary = buildQuantitySummary(reviewed);
    const exported = buildQuantityExport({
      project_instance_id: candidate.project.project_instance_id,
      source_document_id: candidate.source_document.source_document_id,
      summary,
      generated_at: "2026-04-24T21:45:00.000Z"
    });
    const persistence = buildQuantityExportPersistenceRecord({
      export_object: exported,
      storage_root_uri: "drive://V4 Framework",
      persisted_at: "2026-04-24T21:46:00.000Z"
    });

    expect(persistence.project_instance_id).toBe("PRJ_TEST_2026_013");
    expect(persistence.export_id).toBe(exported.export_id);
    expect(persistence.storage_root_uri).toBe("drive://V4 Framework");
    expect(persistence.storage_path).toBe(`project-instances/${exported.project_instance_id}/exports/quantity-only/${exported.export_id}.json`);
    expect(persistence.content_type).toBe("application/json");
    expect(persistence.framework_version).toBe(exported.framework_version);
    expect(persistence.source_document_id).toBe(exported.source_document_id);
    expect(persistence.source_takeoff_item_ids).toEqual(["RUN-001_1"]);
  });

  it("rejects export persistence without a storage root", () => {
    const readyExport = buildQuantityExport({
      project_instance_id: "PRJ_TEST_2026_014",
      source_document_id: "DOC_TEST",
      generated_at: "2026-04-24T21:50:00.000Z",
      summary: {
        approved_count: 1,
        excluded_count: 0,
        next_required_action: "export_quantity_summary",
        lines: [
          {
            project_instance_id: "PRJ_TEST_2026_014",
            material_type: "PVC_C900_DR18",
            diameter_in: 8,
            depth_class: "A_0_5",
            uom: "LF",
            quantity: 100,
            source_takeoff_item_ids: ["RUN-001_1"]
          }
        ]
      }
    });

    expect(() => buildQuantityExportPersistenceRecord({
      export_object: readyExport,
      storage_root_uri: ""
    })).toThrow("storage_root_uri_required");
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
