import { FRAMEWORK_VERSION } from "@v4/config";
import type { DepthClass, DrawingSheet, ProjectInstance, SourceDocument, TakeoffItem } from "@v4/domain";
import { allocateRunToDepthBuckets } from "@v4/takeoff-engine";
import type { ProjectManifestInput, SheetIndexEntryInput, UploadedDrawingInput } from "./index.js";

export interface HarvestedSanitaryRunInput {
  candidate_id: string;
  source_sheet_id: string;
  from_structure?: string;
  to_structure?: string;
  length_lf: number;
  diameter_in: number;
  material_type: string;
  slope_percent?: number;
  upstream_depth_ft?: number;
  downstream_depth_ft?: number;
  confidence: number;
  source_page_label?: string;
  source_excerpt?: string;
}

export interface PlanHarvestProvenanceRecord {
  candidate_id: string;
  takeoff_item_ids: string[];
  source_sheet_id: string;
  source_page_label?: string;
  source_excerpt?: string;
  confidence: number;
  harvest_status: "provisional_requires_review";
}

export interface PlanHarvestSandboxResult {
  project: ProjectInstance;
  source_document: SourceDocument;
  drawing_sheets: DrawingSheet[];
  takeoff_items: TakeoffItem[];
  provenance: PlanHarvestProvenanceRecord[];
  harvest_status: "provisional_requires_review";
  next_required_action: "review_takeoff_candidates";
}

export function buildPlanHarvestSandboxResult(input: {
  project: ProjectManifestInput;
  uploaded_drawing: UploadedDrawingInput;
  sheet_index: SheetIndexEntryInput[];
  harvested_runs: HarvestedSanitaryRunInput[];
}): PlanHarvestSandboxResult {
  assertPdfUpload(input.uploaded_drawing);
  assertSheetIndex(input.sheet_index);
  assertHarvestedRuns(input.harvested_runs);

  const project = createHarvestProject(input.project);
  const source_document = createHarvestSourceDocument(project, input.uploaded_drawing);
  const drawing_sheets = createHarvestSheetIndex(project, source_document.source_document_id, input.sheet_index);
  assertRunsReferenceKnownSheets(input.harvested_runs, drawing_sheets);

  const takeoff_items: TakeoffItem[] = [];
  const provenance: PlanHarvestProvenanceRecord[] = [];

  for (const run of input.harvested_runs) {
    const runItems = harvestedRunToTakeoffItems(project, run);
    takeoff_items.push(...runItems);
    provenance.push({
      candidate_id: run.candidate_id,
      takeoff_item_ids: runItems.map((item) => item.takeoff_item_id),
      source_sheet_id: run.source_sheet_id,
      source_page_label: run.source_page_label,
      source_excerpt: run.source_excerpt,
      confidence: run.confidence,
      harvest_status: "provisional_requires_review"
    });
  }

  return {
    project,
    source_document,
    drawing_sheets,
    takeoff_items,
    provenance,
    harvest_status: "provisional_requires_review",
    next_required_action: "review_takeoff_candidates"
  };
}

function createHarvestProject(input: ProjectManifestInput): ProjectInstance {
  return {
    project_instance_id: input.project_instance_id,
    project_code: input.project_code,
    project_name: input.project_name,
    mode: input.mode ?? "quantity_only",
    drive_root_folder_id: input.drive_root_folder_id,
    data_layer: "sandbox",
    source_origin: "project_upload",
    framework_version: FRAMEWORK_VERSION
  };
}

function createHarvestSourceDocument(project: ProjectInstance, upload: UploadedDrawingInput): SourceDocument {
  return {
    project_instance_id: project.project_instance_id,
    source_document_id: createSourceDocumentId(project.project_instance_id, upload.file_name),
    file_name: upload.file_name,
    drive_file_id: upload.drive_file_id,
    doc_type: "drawing_pdf",
    processing_status: "parsed",
    data_layer: "sandbox",
    source_origin: "project_upload",
    framework_version: FRAMEWORK_VERSION
  };
}

function createHarvestSheetIndex(project: ProjectInstance, sourceDocumentId: string, sheets: SheetIndexEntryInput[]): DrawingSheet[] {
  return sheets.map((sheet) => ({
    project_instance_id: project.project_instance_id,
    drawing_sheet_id: `SHEET_${normalizeSheetNumber(sheet.sheet_number)}`,
    source_document_id: sourceDocumentId,
    sheet_number: sheet.sheet_number,
    sheet_title: sheet.sheet_title,
    discipline: sheet.discipline ?? "utilities",
    data_layer: "sandbox",
    source_origin: "project_upload",
    framework_version: FRAMEWORK_VERSION
  }));
}

function harvestedRunToTakeoffItems(project: ProjectInstance, run: HarvestedSanitaryRunInput): TakeoffItem[] {
  const allocations = hasDepths(run)
    ? allocateRunToDepthBuckets({
        length_lf: run.length_lf,
        start_depth_ft: run.upstream_depth_ft,
        end_depth_ft: run.downstream_depth_ft
      })
    : [{ depth_class: undefined, length_lf: run.length_lf }];

  return allocations.map((allocation, index) => ({
    project_instance_id: project.project_instance_id,
    takeoff_item_id: `${run.candidate_id}_${index + 1}`,
    takeoff_run_id: "PLAN_HARVEST_SANDBOX_001",
    source_sheet_id: run.source_sheet_id,
    feature_type: "sanitary_pipe_run",
    quantity: allocation.length_lf,
    uom: "LF",
    diameter_in: run.diameter_in,
    material_type: run.material_type,
    depth_class: allocation.depth_class as DepthClass | undefined,
    confidence: run.confidence,
    review_status: "pending",
    data_layer: "sandbox",
    source_origin: "project_upload",
    framework_version: FRAMEWORK_VERSION
  }));
}

function createSourceDocumentId(projectInstanceId: string, fileName: string): string {
  const normalizedName = fileName.replace(/\.[^.]+$/, "").replace(/[^A-Z0-9]/gi, "_").replace(/_+/g, "_").toUpperCase();
  return `DOC_${projectInstanceId}_${normalizedName}`;
}

function normalizeSheetNumber(sheetNumber: string): string {
  return sheetNumber.trim().replace(/[^A-Z0-9]/gi, "_").replace(/_+/g, "_").toUpperCase();
}

function assertPdfUpload(upload: UploadedDrawingInput): void {
  if (!upload.file_name.toLowerCase().endsWith(".pdf")) throw new Error("uploaded_drawing_must_be_pdf");
  if (!upload.drive_file_id) throw new Error("drive_file_id_required");
  if (upload.mime_type && upload.mime_type !== "application/pdf") throw new Error("uploaded_drawing_mime_type_must_be_pdf");
}

function assertSheetIndex(sheets: SheetIndexEntryInput[]): void {
  if (sheets.length === 0) throw new Error("sheet_index_required");
  const seen = new Set<string>();
  for (const sheet of sheets) {
    const normalized = normalizeSheetNumber(sheet.sheet_number);
    if (!normalized) throw new Error("sheet_number_required");
    if (seen.has(normalized)) throw new Error("duplicate_sheet_number");
    seen.add(normalized);
  }
}

function assertHarvestedRuns(runs: HarvestedSanitaryRunInput[]): void {
  if (runs.length === 0) throw new Error("harvested_runs_required");
  const seen = new Set<string>();
  for (const run of runs) {
    if (!run.candidate_id) throw new Error("harvest_candidate_id_required");
    if (seen.has(run.candidate_id)) throw new Error("duplicate_harvest_candidate_id");
    if (!run.source_sheet_id) throw new Error("harvest_source_sheet_id_required");
    if (run.length_lf <= 0) throw new Error("harvest_length_must_be_positive");
    if (run.diameter_in <= 0) throw new Error("harvest_diameter_must_be_positive");
    if (!run.material_type) throw new Error("harvest_material_type_required");
    if (run.confidence < 0 || run.confidence > 1) throw new Error("harvest_confidence_out_of_range");
    seen.add(run.candidate_id);
  }
}

function assertRunsReferenceKnownSheets(runs: HarvestedSanitaryRunInput[], sheets: DrawingSheet[]): void {
  const sheetIds = new Set(sheets.map((sheet) => sheet.drawing_sheet_id));
  for (const run of runs) {
    if (!sheetIds.has(run.source_sheet_id)) throw new Error("harvest_source_sheet_not_found");
  }
}

function hasDepths(run: HarvestedSanitaryRunInput): run is HarvestedSanitaryRunInput & { upstream_depth_ft: number; downstream_depth_ft: number } {
  return typeof run.upstream_depth_ft === "number" && typeof run.downstream_depth_ft === "number";
}
