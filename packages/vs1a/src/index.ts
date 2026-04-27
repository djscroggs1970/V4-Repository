import { FRAMEWORK_VERSION } from "@v4/config";
import type { DepthClass, DrawingSheet, ProjectInstance, SourceDocument, TakeoffItem } from "@v4/domain";
import { allocateRunToDepthBuckets } from "@v4/takeoff-engine";
export { applyTakeoffReviews, summarizeTakeoffReview } from "./review.js";
export type { TakeoffDecision, TakeoffReviewInput, TakeoffReviewSummary } from "./review.js";
export { buildQuantitySummary } from "./summary.js";
export type { QuantitySummaryLine, QuantitySummaryResult } from "./summary.js";
export { buildQuantityExport } from "./quantity-export.js";
export type { QuantityExportInput, QuantityExportObject } from "./quantity-export.js";
export { buildQuantityExportPersistenceRecord } from "./export-persistence.js";
export type { QuantityExportPersistenceInput, QuantityExportPersistenceRecord } from "./export-persistence.js";
export { buildPlanHarvestSandboxResult } from "./plan-harvest.js";
export type { HarvestedSanitaryRunInput, PlanHarvestProvenanceRecord, PlanHarvestSandboxResult } from "./plan-harvest.js";
export { buildSewerExtractionAuditResult } from "./sewer-extraction-audit.js";
export { buildAuditReviewPromotionGateResult } from "./audit-review-gate.js";
export { buildAuditCandidateTakeoffHandoff } from "./audit-candidate-handoff.js";
export { buildCivilExtractionCandidates } from "./civil-extraction-candidates.js";
export { buildSanitarySewerExtractionCandidates } from "./sanitary-sewer-extraction-candidates.js";
export type { TakeoffCandidateHandoffRecord, TakeoffCandidateHandoffResult } from "./audit-candidate-handoff.js";
export type {
  BuildCivilExtractionCandidatesInput,
  BuildCivilExtractionCandidatesResult,
  CivilExtractionCandidateInput,
  CivilExtractionCandidateRecord,
  CivilExtractionScope,
  CivilExtractionScopeBatchInput
} from "./civil-extraction-candidates.js";
export type {
  BuildSanitarySewerExtractionCandidatesInput,
  BuildSanitarySewerExtractionCandidatesResult,
  SanitaryPipeRunCandidateInput,
  SanitaryPipeRunCandidateRecord,
  SanitaryProfileObservationCandidateInput,
  SanitaryProfileObservationCandidateRecord,
  SanitaryStructureCandidateInput,
  SanitaryStructureCandidateRecord
} from "./sanitary-sewer-extraction-candidates.js";
export type {
  AuditReviewDecision,
  AuditReviewDecisionInput,
  AuditReviewPromotionCounts,
  AuditReviewPromotionGateResult,
  BlockedAuditCandidate,
  PromotedAuditCandidate
} from "./audit-review-gate.js";
export type {
  SewerExtractionAuditCandidateInput,
  SewerExtractionAuditCandidateSnapshot,
  SewerExtractionAuditConfidenceBand,
  SewerExtractionAuditDecision,
  SewerExtractionAuditDecisionCounts,
  SewerExtractionAuditInput,
  SewerExtractionAuditRecord,
  SewerExtractionAuditResult
} from "./sewer-extraction-audit.js";

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

export interface UploadedDrawingInput {
  file_name: string;
  drive_file_id: string;
  mime_type?: string;
  size_bytes?: number;
  uploaded_at?: string;
}

export interface SheetIndexEntryInput {
  sheet_number: string;
  sheet_title?: string;
  discipline?: string;
}

export interface DocumentRegistrationResult {
  project: ProjectInstance;
  source_document: SourceDocument;
  drawing_sheets: DrawingSheet[];
  takeoff_items: TakeoffItem[];
  review_status: "registered_pending_sheet_index";
  next_required_action: "create_sheet_index";
}

export interface SheetIndexCreationResult {
  project: ProjectInstance;
  source_document: SourceDocument;
  drawing_sheets: DrawingSheet[];
  takeoff_items: TakeoffItem[];
  review_status: "sheet_index_created_pending_takeoff";
  next_required_action: "create_takeoff_candidates";
}

export interface TakeoffCandidateEntryResult {
  project: ProjectInstance;
  source_document: SourceDocument;
  drawing_sheets: DrawingSheet[];
  takeoff_items: TakeoffItem[];
  review_status: "takeoff_candidates_created_pending_review";
  next_required_action: "review_takeoff_candidates";
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

export function registerUploadedDrawing(project: ProjectInstance, upload: UploadedDrawingInput): SourceDocument {
  assertPdfUpload(upload);
  return registerDrawingDocument(project, {
    source_document_id: createSourceDocumentId(project.project_instance_id, upload.file_name),
    file_name: upload.file_name,
    drive_file_id: upload.drive_file_id
  });
}

export function buildUploadRegistrationResult(input: {
  project: ProjectManifestInput;
  uploaded_drawing: UploadedDrawingInput;
}): DocumentRegistrationResult {
  const project = createProjectInstance(input.project);
  const source_document = registerUploadedDrawing(project, input.uploaded_drawing);
  return {
    project,
    source_document,
    drawing_sheets: [],
    takeoff_items: [],
    review_status: "registered_pending_sheet_index",
    next_required_action: "create_sheet_index"
  };
}

export function buildSheetIndexCreationResult(input: {
  project: ProjectManifestInput;
  uploaded_drawing: UploadedDrawingInput;
  sheet_index: SheetIndexEntryInput[];
}): SheetIndexCreationResult {
  const project = createProjectInstance(input.project);
  const source_document = registerUploadedDrawing(project, input.uploaded_drawing);
  const drawing_sheets = createSheetIndex(project, source_document.source_document_id, input.sheet_index);
  return {
    project,
    source_document,
    drawing_sheets,
    takeoff_items: [],
    review_status: "sheet_index_created_pending_takeoff",
    next_required_action: "create_takeoff_candidates"
  };
}

export function buildTakeoffCandidateEntryResult(input: {
  project: ProjectManifestInput;
  uploaded_drawing: UploadedDrawingInput;
  sheet_index: SheetIndexEntryInput[];
  runs: SanitaryRunInput[];
}): TakeoffCandidateEntryResult {
  const project = createProjectInstance(input.project);
  const source_document = registerUploadedDrawing(project, input.uploaded_drawing);
  const drawing_sheets = createSheetIndex(project, source_document.source_document_id, input.sheet_index);
  assertRunsReferenceKnownSheets(input.runs, drawing_sheets);
  const takeoff_items = sanitaryRunsToTakeoffItems(project, input.runs);
  return {
    project,
    source_document,
    drawing_sheets,
    takeoff_items,
    review_status: "takeoff_candidates_created_pending_review",
    next_required_action: "review_takeoff_candidates"
  };
}

export function createDrawingSheet(project: ProjectInstance, source_document_id: string, sheet_number: string, sheet_title?: string, discipline = "utilities"): DrawingSheet {
  const normalizedSheetNumber = normalizeSheetNumber(sheet_number);
  return {
    project_instance_id: project.project_instance_id,
    drawing_sheet_id: `SHEET_${normalizedSheetNumber}`,
    source_document_id,
    sheet_number,
    sheet_title,
    discipline,
    data_layer: "project",
    source_origin: "project_upload",
    framework_version: project.framework_version
  };
}

export function createSheetIndex(project: ProjectInstance, source_document_id: string, sheets: SheetIndexEntryInput[]): DrawingSheet[] {
  assertSheetIndex(sheets);
  return sheets.map((sheet) => createDrawingSheet(project, source_document_id, sheet.sheet_number, sheet.sheet_title, sheet.discipline ?? "utilities"));
}

export function sanitaryRunsToTakeoffItems(project: ProjectInstance, runs: SanitaryRunInput[]): TakeoffItem[] {
  assertSanitaryRuns(runs);
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
  assertRunsReferenceKnownSheets(input.runs, drawing_sheets);
  const takeoff_items = sanitaryRunsToTakeoffItems(project, input.runs);
  return { project, source_document, drawing_sheets, takeoff_items };
}

function createSourceDocumentId(projectInstanceId: string, fileName: string): string {
  const normalizedName = fileName.replace(/\.[^.]+$/, "").replace(/[^A-Z0-9]/gi, "_").replace(/_+/g, "_").toUpperCase();
  return `DOC_${projectInstanceId}_${normalizedName}`;
}

function normalizeSheetNumber(sheetNumber: string): string {
  return sheetNumber.trim().replace(/[^A-Z0-9]/gi, "_").replace(/_+/g, "_").toUpperCase();
}

function assertPdfUpload(upload: UploadedDrawingInput): void {
  if (!upload.file_name.toLowerCase().endsWith(".pdf")) {
    throw new Error("uploaded_drawing_must_be_pdf");
  }
  if (!upload.drive_file_id) {
    throw new Error("drive_file_id_required");
  }
  if (upload.mime_type && upload.mime_type !== "application/pdf") {
    throw new Error("uploaded_drawing_mime_type_must_be_pdf");
  }
}

function assertSheetIndex(sheets: SheetIndexEntryInput[]): void {
  if (sheets.length === 0) {
    throw new Error("sheet_index_required");
  }

  const seen = new Set<string>();
  for (const sheet of sheets) {
    const normalized = normalizeSheetNumber(sheet.sheet_number);
    if (!normalized) {
      throw new Error("sheet_number_required");
    }
    if (seen.has(normalized)) {
      throw new Error("duplicate_sheet_number");
    }
    seen.add(normalized);
  }
}

function assertSanitaryRuns(runs: SanitaryRunInput[]): void {
  if (runs.length === 0) {
    throw new Error("takeoff_candidates_required");
  }

  const seen = new Set<string>();
  for (const run of runs) {
    if (!run.run_id) throw new Error("run_id_required");
    if (seen.has(run.run_id)) throw new Error("duplicate_run_id");
    if (!run.source_sheet_id) throw new Error("source_sheet_id_required");
    if (run.length_lf <= 0) throw new Error("run_length_must_be_positive");
    if (run.diameter_in <= 0) throw new Error("diameter_must_be_positive");
    if (!run.material_type) throw new Error("material_type_required");
    seen.add(run.run_id);
  }
}

function assertRunsReferenceKnownSheets(runs: SanitaryRunInput[], sheets: DrawingSheet[]): void {
  const sheetIds = new Set(sheets.map((sheet) => sheet.drawing_sheet_id));
  for (const run of runs) {
    if (!sheetIds.has(run.source_sheet_id)) {
      throw new Error("run_source_sheet_not_found");
    }
  }
}

function hasDepths(run: SanitaryRunInput): run is SanitaryRunInput & { upstream_depth_ft: number; downstream_depth_ft: number } {
  return typeof run.upstream_depth_ft === "number" && typeof run.downstream_depth_ft === "number";
}
