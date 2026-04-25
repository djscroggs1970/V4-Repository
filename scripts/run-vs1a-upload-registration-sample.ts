import path from "node:path";
import { pathToFileURL } from "node:url";

interface UploadRegistrationInput {
  project: {
    project_instance_id: string;
    project_code: string;
    project_name: string;
    mode?: "quantity_only" | "cost_buildout";
  };
  uploaded_drawing: {
    file_name: string;
    drive_file_id: string;
    mime_type?: string;
    size_bytes?: number;
    uploaded_at?: string;
  };
}

interface UploadRegistrationResult {
  project: { project_instance_id: string };
  source_document: {
    project_instance_id?: string;
    source_document_id: string;
    processing_status: string;
  };
  drawing_sheets: unknown[];
  takeoff_items: unknown[];
  next_required_action: string;
}

const builtModulePath = path.join(process.cwd(), "packages", "vs1a", "dist", "index.js");
const { buildUploadRegistrationResult } = await import(pathToFileURL(builtModulePath).href) as {
  buildUploadRegistrationResult: (input: UploadRegistrationInput) => UploadRegistrationResult;
};

const result = buildUploadRegistrationResult({
  project: {
    project_instance_id: "PRJ_UPLOAD_2026_001",
    project_code: "UPLOAD",
    project_name: "Upload Registration Sample"
  },
  uploaded_drawing: {
    file_name: "utility-plan.pdf",
    drive_file_id: "drive-file-upload-001",
    mime_type: "application/pdf"
  }
});

console.log(JSON.stringify({
  project_instance_id: result.project.project_instance_id,
  source_document_id: result.source_document.source_document_id,
  source_status: result.source_document.processing_status,
  drawing_sheet_count: result.drawing_sheets.length,
  takeoff_item_count: result.takeoff_items.length,
  next_required_action: result.next_required_action,
  boundary_ok: result.source_document.project_instance_id === result.project.project_instance_id
}, null, 2));
