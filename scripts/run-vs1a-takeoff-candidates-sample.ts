import path from "node:path";
import { pathToFileURL } from "node:url";

type RunnerInput = {
  project: {
    project_instance_id: string;
    project_code: string;
    project_name: string;
  };
  uploaded_drawing: {
    file_name: string;
    drive_file_id: string;
    mime_type?: string;
  };
  sheet_index: Array<{
    sheet_number: string;
    sheet_title?: string;
    discipline?: string;
  }>;
  runs: Array<{
    run_id: string;
    source_sheet_id: string;
    from_structure: string;
    to_structure: string;
    length_lf: number;
    diameter_in: number;
    material_type: string;
    upstream_depth_ft?: number;
    downstream_depth_ft?: number;
  }>;
};

type RunnerResult = {
  project: { project_instance_id: string };
  source_document: { source_document_id: string };
  drawing_sheets: Array<{ drawing_sheet_id: string; project_instance_id?: string }>;
  takeoff_items: Array<{ quantity: number; project_instance_id?: string; source_sheet_id: string }>;
  next_required_action: string;
};

const modulePath = path.join(process.cwd(), "packages", "vs1a", "dist", "index.js");
const loaded = await import(pathToFileURL(modulePath).href) as {
  buildTakeoffCandidateEntryResult: (input: RunnerInput) => RunnerResult;
};

const result = loaded.buildTakeoffCandidateEntryResult({
  project: {
    project_instance_id: "PRJ_TAKEOFF_2026_001",
    project_code: "TAKEOFF",
    project_name: "Takeoff Candidate Sample"
  },
  uploaded_drawing: {
    file_name: "utility-plan.pdf",
    drive_file_id: "drive-file-takeoff-001",
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

console.log(JSON.stringify({
  project_instance_id: result.project.project_instance_id,
  source_document_id: result.source_document.source_document_id,
  drawing_sheet_count: result.drawing_sheets.length,
  takeoff_item_count: result.takeoff_items.length,
  total_lf: round2(result.takeoff_items.reduce((sum, item) => sum + item.quantity, 0)),
  next_required_action: result.next_required_action,
  boundary_ok: result.takeoff_items.every((item) => item.project_instance_id === result.project.project_instance_id),
  source_sheet_ok: result.takeoff_items.every((item) => item.source_sheet_id === "SHEET_C_51")
}, null, 2));

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
