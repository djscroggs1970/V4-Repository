import { buildUploadRegistrationResult } from "@v4/vs1a";

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
