import { FRAMEWORK_VERSION } from "@v4/config";
import type { DepthClass, DrawingSheet, ProjectInstance, SourceDocument, TakeoffItem } from "@v4/domain";
import { allocateRunToDepthBuckets } from "@v4/takeoff-engine";

export interface ProjectManifestInput {
  project_instance_id: string;
  project_code: string;
  project_name: string;
  mode?: "quantity_only" | "cost_buildout";
  drive_root_folder_id?: string;
}

export interface SourceDocumentInput {
  source_document_id: string;
  file_name: string;
  drive_file_id?: string;
}

export interface SanitaryRunInput {
  run_id: string;
  source_sheet_id: string;
  from_structure: string;
  to_structure: string;
  length_lf: number;
  diameter_in: number;
  material_type: string;
  slope_percent?: number;
  upstream_depth_ft?: number;
  downstream_depth_ft?: number;
  confidence?: number;
}

export interface VS1AResult {
  project: ProjectInstance;
  source_document: SourceDocument;
  drawing_sheets: DrawingSheet[];
  takeoff_items: TakeoffItem[];
}

export function createProjectInstance(input: ProjectManifestInput): ProjectInstance {
  return {
    project_instance_id: input.project_instance_id,
    project_code: input.project_code,
    project_name: input.project_name,
    mode: input.mode ?? "quantity_only",
    drive_root_folder_id: input.drive_root_folder_id,
    data_layer: "project",
    source_origin: "project_upload",
    framework_version: FRAMEWORK_VERSION
  };
}

export function registerDrawingDocument(project: ProjectInstance, input: SourceDocumentInput): SourceDocument {
  return {
    project_instance_id: project.project_instance_id,
    source_document_id: input.source_document_id,
    file_name: input.file_name,
    drive_file_id: input.drive_file_id,
    doc_type: "drawing_pdf",
    processing_status: "new",
    data_layer: "project",
    source_origin: "project_upload",
    framework_version: project.framework_version
  };
}

export function createDrawingSheet(project: ProjectInstance, source_document_id: string, sheet_number: string, sheet_title?: string): DrawingSheet {
  return {
    project_instance_id: project.project_instance_id,
    drawing_sheet_id: `SHEET_${sheet_number.replace(/[^A-Z0-9]/gi, "_")}`,
    source_document_id,
    sheet_number,
    sheet_title,
    discipline: "utilities",
    data_layer: "project",
    source_origin: "project_upload",
    framework_version: project.framework_version
  };
}

export function sanitaryRunsToTakeoffItems(project: ProjectInstance, runs: SanitaryRunInput[]): TakeoffItem[] {
  return runs.flatMap((run) => {
    const allocations = hasDepths(run)
      ? allocateRunToDepthBuckets({
          length_lf: run.length_lf,
          start_depth_ft: run.upstream_depth_ft,
          end_depth_ft: run.downstream_depth_ft
        })
      : [{ depth_class: undefined, length_lf: run.length_lf }];

    return allocations.map((allocation, index) => ({
      project_instance_id: project.project_instance_id,
      takeoff_item_id: `${run.run_id}_${index + 1}`,
      takeoff_run_id: "TAKEOFF_RUN_001",
      source_sheet_id: run.source_sheet_id,
      feature_type: "sanitary_pipe_run",
      quantity: allocation.length_lf,
      uom: "LF",
      diameter_in: run.diameter_in,
      material_type: run.material_type,
      depth_class: allocation.depth_class as DepthClass | undefined,
      confidence: run.confidence ?? 0.8,
      review_status: "pending",
      data_layer: "project",
      source_origin: "project_upload",
      framework_version: project.framework_version
    }));
  });
}

export function buildVS1AResult(input: {
  project: ProjectManifestInput;
  source_document: SourceDocumentInput;
  sheets: Array<{ sheet_number: string; sheet_title?: string }>;
  runs: SanitaryRunInput[];
}): VS1AResult {
  const project = createProjectInstance(input.project);
  const source_document = registerDrawingDocument(project, input.source_document);
  const drawing_sheets = input.sheets.map((sheet) => createDrawingSheet(project, source_document.source_document_id, sheet.sheet_number, sheet.sheet_title));
  const takeoff_items = sanitaryRunsToTakeoffItems(project, input.runs);
  return { project, source_document, drawing_sheets, takeoff_items };
}

function hasDepths(run: SanitaryRunInput): run is SanitaryRunInput & { upstream_depth_ft: number; downstream_depth_ft: number } {
  return typeof run.upstream_depth_ft === "number" && typeof run.downstream_depth_ft === "number";
}
