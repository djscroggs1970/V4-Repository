import { FRAMEWORK_VERSION } from "@v4/config";
import type { QuantityExportObject, QuantityExportPersistenceRecord } from "@v4/vs1a";
import type { CostBuildoutResult } from "./index.js";
import type { CostScenarioOutputManifest } from "./cost-scenario-output.js";
import type { CostScenarioPersistenceRecord } from "./cost-scenario-persistence.js";

export interface EstimatePackageInput {
  package_id: string;
  quantity_export: QuantityExportObject;
  quantity_export_persistence: QuantityExportPersistenceRecord;
  cost_buildout: CostBuildoutResult;
  cost_scenario_output: CostScenarioOutputManifest;
  cost_scenario_persistence: CostScenarioPersistenceRecord;
  prepared_by?: string;
  prepared_at?: string;
}

export interface EstimateTraceManifest {
  quantity_export_id: string;
  quantity_export_persistence_id: string;
  cost_scenario_id: string;
  cost_scenario_output_id: string;
  cost_scenario_persistence_id: string;
  source_document_id: string;
  registry_id: string;
  registry_version: string;
  source_takeoff_item_ids: string[];
  trace_refs: string[];
}

export interface EstimatePackageOutput {
  package_id: string;
  package_type: "human_review_estimate_package";
  review_status: "ready_for_human_review";
  project_instance_id: string;
  framework_version: string;
  prepared_at: string;
  prepared_by?: string;
  quantity_export_id: string;
  cost_scenario_id: string;
  total_quantity_lines: number;
  total_cost_lines: number;
  total_cost: number;
  storage_paths: {
    quantity_export_path: string;
    cost_scenario_path: string;
  };
  trace_manifest: EstimateTraceManifest;
}

export function buildEstimatePackageOutput(input: EstimatePackageInput): EstimatePackageOutput {
  assertEstimatePackageInput(input);
  const preparedAt = input.prepared_at ?? new Date().toISOString();
  const traceRefs = Array.from(new Set([
    input.quantity_export.export_id,
    input.quantity_export_persistence.persistence_id,
    input.cost_buildout.scenario_id,
    input.cost_scenario_output.scenario_output_id,
    input.cost_scenario_persistence.persistence_id,
    input.quantity_export.source_document_id,
    input.cost_scenario_output.registry_id,
    input.cost_scenario_output.registry_version,
    ...input.quantity_export.source_takeoff_item_ids,
    ...input.cost_scenario_output.trace_refs,
    ...input.cost_scenario_persistence.trace_refs
  ])).sort();

  return {
    package_id: input.package_id,
    package_type: "human_review_estimate_package",
    review_status: "ready_for_human_review",
    project_instance_id: input.quantity_export.project_instance_id,
    framework_version: FRAMEWORK_VERSION,
    prepared_at: preparedAt,
    prepared_by: input.prepared_by,
    quantity_export_id: input.quantity_export.export_id,
    cost_scenario_id: input.cost_buildout.scenario_id,
    total_quantity_lines: input.quantity_export.line_count,
    total_cost_lines: input.cost_buildout.line_count,
    total_cost: input.cost_buildout.total_cost,
    storage_paths: {
      quantity_export_path: input.quantity_export_persistence.storage_path,
      cost_scenario_path: input.cost_scenario_persistence.storage_path
    },
    trace_manifest: {
      quantity_export_id: input.quantity_export.export_id,
      quantity_export_persistence_id: input.quantity_export_persistence.persistence_id,
      cost_scenario_id: input.cost_buildout.scenario_id,
      cost_scenario_output_id: input.cost_scenario_output.scenario_output_id,
      cost_scenario_persistence_id: input.cost_scenario_persistence.persistence_id,
      source_document_id: input.quantity_export.source_document_id,
      registry_id: input.cost_scenario_output.registry_id,
      registry_version: input.cost_scenario_output.registry_version,
      source_takeoff_item_ids: [...input.quantity_export.source_takeoff_item_ids],
      trace_refs: traceRefs
    }
  };
}

function assertEstimatePackageInput(input: EstimatePackageInput): void {
  if (!input.package_id) throw new Error("estimate_package_id_required");
  assertProjectInstanceAlignment(input);
  assertQuantityExportPersistenceAlignment(input);
  assertCostScenarioAlignment(input);
  assertTraceCoverage(input);
}

function assertProjectInstanceAlignment(input: EstimatePackageInput): void {
  const projectInstanceId = input.quantity_export.project_instance_id;
  if (input.quantity_export_persistence.project_instance_id !== projectInstanceId) throw new Error("estimate_package_project_instance_mismatch");
  if (input.cost_buildout.project_instance_id !== projectInstanceId) throw new Error("estimate_package_project_instance_mismatch");
  if (input.cost_scenario_output.project_instance_id !== projectInstanceId) throw new Error("estimate_package_project_instance_mismatch");
  if (input.cost_scenario_persistence.project_instance_id !== projectInstanceId) throw new Error("estimate_package_project_instance_mismatch");
}

function assertQuantityExportPersistenceAlignment(input: EstimatePackageInput): void {
  if (input.quantity_export_persistence.export_id !== input.quantity_export.export_id) throw new Error("quantity_export_persistence_mismatch");
  if (input.quantity_export_persistence.source_document_id !== input.quantity_export.source_document_id) throw new Error("quantity_export_persistence_mismatch");
  if (!input.quantity_export_persistence.storage_path.trim()) throw new Error("quantity_export_storage_path_required");
}

function assertCostScenarioAlignment(input: EstimatePackageInput): void {
  if (input.cost_buildout.source_export_id !== input.quantity_export.export_id) throw new Error("cost_buildout_source_export_mismatch");
  if (input.cost_scenario_output.source_export_id !== input.quantity_export.export_id) throw new Error("cost_scenario_source_export_mismatch");
  if (input.cost_scenario_persistence.source_export_id !== input.quantity_export.export_id) throw new Error("cost_scenario_source_export_mismatch");
  if (input.cost_scenario_output.scenario_id !== input.cost_buildout.scenario_id) throw new Error("cost_scenario_id_mismatch");
  if (input.cost_scenario_persistence.scenario_id !== input.cost_buildout.scenario_id) throw new Error("cost_scenario_id_mismatch");
  if (input.cost_scenario_persistence.scenario_output_id !== input.cost_scenario_output.scenario_output_id) throw new Error("cost_scenario_persistence_mismatch");
  if (!input.cost_scenario_persistence.storage_path.trim()) throw new Error("cost_scenario_storage_path_required");
}

function assertTraceCoverage(input: EstimatePackageInput): void {
  if (!input.cost_scenario_output.trace_refs.includes(input.quantity_export.export_id)) throw new Error("estimate_package_missing_quantity_export_trace");
  if (!input.cost_scenario_persistence.trace_refs.includes(input.quantity_export.export_id)) throw new Error("estimate_package_missing_quantity_export_trace");
  for (const sourceTakeoffItemId of input.quantity_export.source_takeoff_item_ids) {
    if (!input.cost_scenario_output.trace_refs.includes(sourceTakeoffItemId)) throw new Error("estimate_package_missing_takeoff_trace");
  }
}
