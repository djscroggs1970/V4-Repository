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
};

type RunnerResult = {
  project: { project_instance_id: string };
  source_document: { source_document_id: string };
  drawing_sheets: Array<{ project_instance_id?: string; source_document_id: string }>;
  takeoff_items: unknown[];
  next_required_action: string;
};

const modulePath = path.join(process.cwd(), "packages", "vs1a", "dist", "index.js");
const loaded = await import(pathToFileURL(modulePath).href) as {
  buildSheetIndexCreationResult: (input: RunnerInput) => RunnerResult;
};

const result = loaded.buildSheetIndexCreationResult({
  project: {
    project_instance_id: "PRJ_SHEETS_2026_001",
    project_code: "SHEETS",
    project_name: "Sheets Sample"
  },
  uploaded_drawing: {
    file_name: "utility-plan.pdf",
    drive_file_id: "drive-file-sheets-001",
    mime_type: "application/pdf"
  },
  sheet_index: [
    { sheet_number: "C-50", sheet_title: "Utility Plan", discipline: "utilities" },
    { sheet_number: "C-51", sheet_title: "Sanitary Profiles", discipline: "utilities" }
  ]
});

console.log(JSON.stringify({
  project_instance_id: result.project.project_instance_id,
  source_document_id: result.source_document.source_document_id,
  drawing_sheet_count: result.drawing_sheets.length,
  takeoff_item_count: result.takeoff_items.length,
  next_required_action: result.next_required_action,
  boundary_ok: result.drawing_sheets.every((sheet) => sheet.project_instance_id === result.project.project_instance_id),
  source_link_ok: result.drawing_sheets.every((sheet) => sheet.source_document_id === result.source_document.source_document_id)
}, null, 2));
