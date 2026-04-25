import { FRAMEWORK_VERSION } from "@v4/config";
import type { CostBuildoutResult } from "./index.js";
import type { CostInputRegistry } from "./cost-input-registry.js";

export interface CostScenarioOutputInput {
  cost_buildout: CostBuildoutResult;
  cost_input_registry: CostInputRegistry;
  storage_root_uri: string;
  persisted_at?: string;
}

export interface CostScenarioOutputManifest {
  scenario_output_id: string;
  scenario_id: string;
  project_instance_id: string;
  source_export_id: string;
  registry_id: string;
  registry_version: string;
  framework_version: string;
  generated_at: string;
  persisted_at: string;
  storage_root_uri: string;
  storage_path: string;
  content_type: "application/json";
  line_count: number;
  subtotal_material_cost: number;
  subtotal_labor_cost: number;
  subtotal_equipment_cost: number;
  total_cost: number;
  trace_refs: string[];
}

export function buildCostScenarioOutputManifest(input: CostScenarioOutputInput): CostScenarioOutputManifest {
  assertCostScenarioOutputInput(input);
  const persistedAt = input.persisted_at ?? new Date().toISOString();
  const traceRefs = Array.from(new Set([
    input.cost_buildout.source_export_id,
    input.cost_input_registry.registry_id,
    input.cost_input_registry.registry_version,
    ...input.cost_buildout.lines.flatMap((line) => line.trace_refs),
    ...input.cost_input_registry.trace_refs
  ])).sort();

  return {
    scenario_output_id: createScenarioOutputId(input.cost_buildout.scenario_id, persistedAt),
    scenario_id: input.cost_buildout.scenario_id,
    project_instance_id: input.cost_buildout.project_instance_id,
    source_export_id: input.cost_buildout.source_export_id,
    registry_id: input.cost_input_registry.registry_id,
    registry_version: input.cost_input_registry.registry_version,
    framework_version: FRAMEWORK_VERSION,
    generated_at: input.cost_buildout.generated_at,
    persisted_at: persistedAt,
    storage_root_uri: input.storage_root_uri,
    storage_path: createStoragePath(input.cost_buildout),
    content_type: "application/json",
    line_count: input.cost_buildout.line_count,
    subtotal_material_cost: input.cost_buildout.subtotal_material_cost,
    subtotal_labor_cost: input.cost_buildout.subtotal_labor_cost,
    subtotal_equipment_cost: input.cost_buildout.subtotal_equipment_cost,
    total_cost: input.cost_buildout.total_cost,
    trace_refs: traceRefs
  };
}

function assertCostScenarioOutputInput(input: CostScenarioOutputInput): void {
  if (!input.storage_root_uri.trim()) throw new Error("storage_root_uri_required");
  if (input.cost_buildout.line_count === 0) throw new Error("cost_buildout_lines_required");
  if (input.cost_input_registry.validation_status !== "validated") throw new Error("cost_input_registry_must_be_validated");
  assertScenarioUsesRegistryInputs(input.cost_buildout, input.cost_input_registry);
}

function assertScenarioUsesRegistryInputs(costBuildout: CostBuildoutResult, registry: CostInputRegistry): void {
  const registryRefs = new Set(registry.trace_refs);
  for (const line of costBuildout.lines) {
    for (const requiredRef of [line.material_quote_id, line.production_rate_id, line.labor_rate_id, line.equipment_rate_id]) {
      if (!registryRefs.has(requiredRef)) {
        throw new Error("cost_line_input_not_found_in_registry");
      }
    }
  }
}

function createStoragePath(costBuildout: CostBuildoutResult): string {
  return [
    "project-instances",
    costBuildout.project_instance_id,
    "cost-scenarios",
    costBuildout.scenario_id,
    `${costBuildout.scenario_id}.json`
  ].join("/");
}

function createScenarioOutputId(scenarioId: string, persistedAt: string): string {
  const stamp = persistedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `COST_OUTPUT_${scenarioId}_${stamp}`;
}
