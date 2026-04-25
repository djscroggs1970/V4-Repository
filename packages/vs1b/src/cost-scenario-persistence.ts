import { FRAMEWORK_VERSION } from "@v4/config";
import type { CostScenarioOutputManifest } from "./cost-scenario-output.js";

export interface CostScenarioPersistenceInput {
  scenario_output_manifest: CostScenarioOutputManifest;
  persisted_by?: string;
  confirmed_at?: string;
}

export interface CostScenarioPersistenceRecord {
  persistence_id: string;
  scenario_output_id: string;
  scenario_id: string;
  project_instance_id: string;
  source_export_id: string;
  registry_id: string;
  registry_version: string;
  storage_root_uri: string;
  storage_path: string;
  content_type: "application/json";
  confirmed_at: string;
  persisted_by?: string;
  framework_version: string;
  total_cost: number;
  trace_refs: string[];
}

export function buildCostScenarioPersistenceRecord(input: CostScenarioPersistenceInput): CostScenarioPersistenceRecord {
  assertScenarioOutputManifest(input.scenario_output_manifest);
  const confirmedAt = input.confirmed_at ?? new Date().toISOString();

  return {
    persistence_id: createPersistenceId(input.scenario_output_manifest.scenario_output_id, confirmedAt),
    scenario_output_id: input.scenario_output_manifest.scenario_output_id,
    scenario_id: input.scenario_output_manifest.scenario_id,
    project_instance_id: input.scenario_output_manifest.project_instance_id,
    source_export_id: input.scenario_output_manifest.source_export_id,
    registry_id: input.scenario_output_manifest.registry_id,
    registry_version: input.scenario_output_manifest.registry_version,
    storage_root_uri: input.scenario_output_manifest.storage_root_uri,
    storage_path: input.scenario_output_manifest.storage_path,
    content_type: input.scenario_output_manifest.content_type,
    confirmed_at: confirmedAt,
    persisted_by: input.persisted_by,
    framework_version: FRAMEWORK_VERSION,
    total_cost: input.scenario_output_manifest.total_cost,
    trace_refs: [...input.scenario_output_manifest.trace_refs]
  };
}

function assertScenarioOutputManifest(manifest: CostScenarioOutputManifest): void {
  if (!manifest.storage_root_uri.trim()) throw new Error("storage_root_uri_required");
  if (!manifest.storage_path.trim()) throw new Error("storage_path_required");
  if (manifest.line_count <= 0) throw new Error("cost_scenario_output_lines_required");
  if (manifest.content_type !== "application/json") throw new Error("cost_scenario_output_content_type_must_be_json");
  if (!manifest.trace_refs.includes(manifest.source_export_id)) throw new Error("cost_scenario_output_missing_source_export_trace");
  if (!manifest.trace_refs.includes(manifest.registry_id)) throw new Error("cost_scenario_output_missing_registry_trace");
}

function createPersistenceId(scenarioOutputId: string, confirmedAt: string): string {
  const stamp = confirmedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `PERSIST_${scenarioOutputId}_${stamp}`;
}
