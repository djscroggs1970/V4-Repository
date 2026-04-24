import type { DataLayer, DepthClass, ReviewStatus, SourceOrigin, TakeoffMode } from "./enums.js";

export interface BoundaryFields {
  project_instance_id?: string;
  data_layer: DataLayer;
  source_origin: SourceOrigin;
  framework_version: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectInstance extends BoundaryFields {
  project_instance_id: string;
  project_code: string;
  project_name: string;
  mode: TakeoffMode;
  drive_root_folder_id?: string;
}

export interface SourceDocument extends BoundaryFields {
  source_document_id: string;
  file_name: string;
  drive_file_id?: string;
  doc_type: "drawing_pdf" | "quote" | "other";
  processing_status: "new" | "parsed" | "review" | "approved" | "error";
}

export interface DrawingSheet extends BoundaryFields {
  drawing_sheet_id: string;
  source_document_id: string;
  sheet_number: string;
  sheet_title?: string;
  discipline?: string;
}

export interface TakeoffItem extends BoundaryFields {
  takeoff_item_id: string;
  takeoff_run_id: string;
  source_sheet_id: string;
  feature_type: string;
  quantity: number;
  uom: string;
  diameter_in?: number;
  material_type?: string;
  depth_class?: DepthClass;
  confidence: number;
  review_status: ReviewStatus;
}

export interface ProductionRateRule extends BoundaryFields {
  rule_id: string;
  rule_version: string;
  work_type: string;
  material_type: string;
  diameter_in: number;
  depth_class: DepthClass;
  production_uom: string;
  units_per_day: number;
  validation_status: "placeholder" | "validated" | "retired";
}

export interface EstimateLine extends BoundaryFields {
  estimate_line_id: string;
  scenario_id: string;
  takeoff_item_id: string;
  quantity: number;
  uom: string;
  material_cost: number;
  labor_cost: number;
  equipment_cost: number;
  total_cost: number;
  trace_refs: string[];
}
