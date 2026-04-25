import { FRAMEWORK_VERSION } from "@v4/config";
import type { EstimatePackageOutput } from "./estimate-package.js";

export interface EstimatePackagePersistenceInput {
  estimate_package: EstimatePackageOutput;
  storage_root_uri: string;
  persisted_by?: string;
  persisted_at?: string;
}

export interface EstimatePackagePersistenceRecord {
  persistence_id: string;
  package_id: string;
  package_type: "human_review_estimate_package";
  review_status: "ready_for_human_review";
  project_instance_id: string;
  storage_root_uri: string;
  storage_path: string;
  content_type: "application/json";
  persisted_at: string;
  persisted_by?: string;
  framework_version: string;
  quantity_export_id: string;
  cost_scenario_id: string;
  total_cost: number;
  trace_refs: string[];
}

export function buildEstimatePackagePersistenceRecord(input: EstimatePackagePersistenceInput): EstimatePackagePersistenceRecord {
  assertEstimatePackagePersistenceInput(input);
  const persistedAt = input.persisted_at ?? new Date().toISOString();

  return {
    persistence_id: createPersistenceId(input.estimate_package.package_id, persistedAt),
    package_id: input.estimate_package.package_id,
    package_type: input.estimate_package.package_type,
    review_status: input.estimate_package.review_status,
    project_instance_id: input.estimate_package.project_instance_id,
    storage_root_uri: input.storage_root_uri,
    storage_path: createStoragePath(input.estimate_package),
    content_type: "application/json",
    persisted_at: persistedAt,
    persisted_by: input.persisted_by,
    framework_version: FRAMEWORK_VERSION,
    quantity_export_id: input.estimate_package.quantity_export_id,
    cost_scenario_id: input.estimate_package.cost_scenario_id,
    total_cost: input.estimate_package.total_cost,
    trace_refs: [...input.estimate_package.trace_manifest.trace_refs]
  };
}

function assertEstimatePackagePersistenceInput(input: EstimatePackagePersistenceInput): void {
  if (!input.storage_root_uri.trim()) throw new Error("storage_root_uri_required");
  if (input.estimate_package.package_type !== "human_review_estimate_package") throw new Error("estimate_package_type_required");
  if (input.estimate_package.review_status !== "ready_for_human_review") throw new Error("estimate_package_must_be_ready_for_human_review");
  if (input.estimate_package.total_cost_lines <= 0) throw new Error("estimate_package_cost_lines_required");
  if (input.estimate_package.total_quantity_lines <= 0) throw new Error("estimate_package_quantity_lines_required");
  if (!input.estimate_package.trace_manifest.trace_refs.includes(input.estimate_package.quantity_export_id)) throw new Error("estimate_package_missing_quantity_export_trace");
  if (!input.estimate_package.trace_manifest.trace_refs.includes(input.estimate_package.trace_manifest.registry_id)) throw new Error("estimate_package_missing_registry_trace");
}

function createStoragePath(estimatePackage: EstimatePackageOutput): string {
  return [
    "project-instances",
    estimatePackage.project_instance_id,
    "estimate-packages",
    estimatePackage.package_id,
    `${estimatePackage.package_id}.json`
  ].join("/");
}

function createPersistenceId(packageId: string, persistedAt: string): string {
  const stamp = persistedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `PERSIST_${packageId}_${stamp}`;
}
