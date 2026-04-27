import { FRAMEWORK_VERSION } from "@v4/config";
import type { DepthClass } from "@v4/domain";
import type { QuantityExportObject, QuantitySummaryLine } from "@v4/vs1a";
export { buildCostInputRegistry } from "./cost-input-registry.js";
export type { CostInputRegistry, CostInputRegistryInput } from "./cost-input-registry.js";
export { normalizeVendorQuoteIntake } from "./vendor-quote-intake.js";
export { buildVendorQuoteRegistryReviewGateResult } from "./vendor-quote-registry-review-gate.js";
export type {
  ApprovedVendorQuoteForRegistryMerge,
  BlockedVendorQuoteRecord,
  VendorQuoteRegistryNextAction,
  VendorQuoteRegistryReviewCounts,
  VendorQuoteRegistryReviewDecision,
  VendorQuoteRegistryReviewGateInput,
  VendorQuoteRegistryReviewGateResult,
  VendorQuoteRegistryReviewRow,
  VendorQuoteRegistryReviewStatus
} from "./vendor-quote-registry-review-gate.js";
export type {
  NormalizedVendorQuoteLine,
  VendorQuoteIntakeInput,
  VendorQuoteIntakeResult,
  VendorQuoteLineInput,
  VendorQuoteNormalizationStatus,
  VendorQuoteSourceOrigin
} from "./vendor-quote-intake.js";
export { buildCostScenarioOutputManifest } from "./cost-scenario-output.js";
export type { CostScenarioOutputInput, CostScenarioOutputManifest } from "./cost-scenario-output.js";
export { buildCostScenarioPersistenceRecord } from "./cost-scenario-persistence.js";
export type { CostScenarioPersistenceInput, CostScenarioPersistenceRecord } from "./cost-scenario-persistence.js";
export { buildEstimatePackageOutput } from "./estimate-package.js";
export type { EstimatePackageInput, EstimatePackageOutput, EstimateTraceManifest } from "./estimate-package.js";
export { buildEstimatePackagePersistenceRecord } from "./estimate-package-persistence.js";
export type { EstimatePackagePersistenceInput, EstimatePackagePersistenceRecord } from "./estimate-package-persistence.js";
export { buildEstimatePackageReviewRecord } from "./estimate-package-review.js";
export type { EstimatePackageReviewDecision, EstimatePackageReviewInput, EstimatePackageReviewRecord } from "./estimate-package-review.js";
export { buildBidGradeReleaseManifest } from "./bid-grade-release-gate.js";
export type { BidGradeReleaseGateInput, BidGradeReleaseManifest, BidGradeReleaseTraceManifest } from "./bid-grade-release-gate.js";
export { buildOutputDocumentGenerationResult } from "./output-document-generation.js";
export type {
  GeneratedOutputDocument,
  OutputDocumentGenerationInput,
  OutputDocumentGenerationResult,
  OutputDocumentSection,
  OutputDocumentType
} from "./output-document-generation.js";

export interface MaterialQuoteInput {
  quote_id: string;
  material_type: string;
  diameter_in: number;
  unit_cost: number;
  uom: string;
  source_origin?: "project_upload" | "framework_seed" | "sandbox_fixture";
}

export interface LaborRateInput {
  labor_rate_id: string;
  crew_code: string;
  cost_per_day: number;
  source_origin?: "project_upload" | "framework_seed" | "sandbox_fixture";
}

export interface EquipmentRateInput {
  equipment_rate_id: string;
  equipment_code: string;
  cost_per_day: number;
  source_origin?: "project_upload" | "framework_seed" | "sandbox_fixture";
}

export interface ProductionRateInput {
  production_rate_id: string;
  work_type: "sanitary_pipe_run";
  material_type: string;
  diameter_in: number;
  depth_class: DepthClass;
  production_uom: string;
  units_per_day: number;
  crew_code: string;
  equipment_code: string;
  validation_status: "placeholder" | "validated";
  source_origin?: "project_upload" | "framework_seed" | "sandbox_fixture";
}

export interface CostBuildoutInput {
  quantity_export: QuantityExportObject;
  material_quotes: MaterialQuoteInput[];
  labor_rates: LaborRateInput[];
  equipment_rates: EquipmentRateInput[];
  production_rates: ProductionRateInput[];
  scenario_id: string;
  generated_at?: string;
}

export interface CostBuildoutLine {
  estimate_line_id: string;
  scenario_id: string;
  project_instance_id: string;
  export_id: string;
  material_type: string;
  diameter_in: number;
  depth_class?: DepthClass;
  quantity: number;
  uom: string;
  material_cost: number;
  labor_cost: number;
  equipment_cost: number;
  total_cost: number;
  production_days: number;
  material_quote_id: string;
  production_rate_id: string;
  labor_rate_id: string;
  equipment_rate_id: string;
  source_takeoff_item_ids: string[];
  trace_refs: string[];
}

export interface CostBuildoutResult {
  scenario_id: string;
  project_instance_id: string;
  source_export_id: string;
  framework_version: string;
  generated_at: string;
  line_count: number;
  subtotal_material_cost: number;
  subtotal_labor_cost: number;
  subtotal_equipment_cost: number;
  total_cost: number;
  lines: CostBuildoutLine[];
}

export function buildCostBuildout(input: CostBuildoutInput): CostBuildoutResult {
  assertQuantityExportReady(input.quantity_export);
  assertCostInputs(input);
  const generatedAt = input.generated_at ?? new Date().toISOString();
  const lines = input.quantity_export.lines.map((line, index) => buildCostLine(input, line, index + 1));

  return {
    scenario_id: input.scenario_id,
    project_instance_id: input.quantity_export.project_instance_id,
    source_export_id: input.quantity_export.export_id,
    framework_version: FRAMEWORK_VERSION,
    generated_at: generatedAt,
    line_count: lines.length,
    subtotal_material_cost: round2(lines.reduce((sum, line) => sum + line.material_cost, 0)),
    subtotal_labor_cost: round2(lines.reduce((sum, line) => sum + line.labor_cost, 0)),
    subtotal_equipment_cost: round2(lines.reduce((sum, line) => sum + line.equipment_cost, 0)),
    total_cost: round2(lines.reduce((sum, line) => sum + line.total_cost, 0)),
    lines
  };
}

function buildCostLine(input: CostBuildoutInput, line: QuantitySummaryLine, lineNumber: number): CostBuildoutLine {
  if (!line.depth_class) throw new Error("cost_depth_class_required");
  const materialQuote = findMaterialQuote(input.material_quotes, line);
  const productionRate = findProductionRate(input.production_rates, line);
  const laborRate = findLaborRate(input.labor_rates, productionRate.crew_code);
  const equipmentRate = findEquipmentRate(input.equipment_rates, productionRate.equipment_code);
  const productionDays = round4(line.quantity / productionRate.units_per_day);
  const materialCost = round2(line.quantity * materialQuote.unit_cost);
  const laborCost = round2(productionDays * laborRate.cost_per_day);
  const equipmentCost = round2(productionDays * equipmentRate.cost_per_day);
  const totalCost = round2(materialCost + laborCost + equipmentCost);

  return {
    estimate_line_id: `${input.scenario_id}_LINE_${String(lineNumber).padStart(3, "0")}`,
    scenario_id: input.scenario_id,
    project_instance_id: input.quantity_export.project_instance_id,
    export_id: input.quantity_export.export_id,
    material_type: line.material_type,
    diameter_in: line.diameter_in,
    depth_class: line.depth_class,
    quantity: line.quantity,
    uom: line.uom,
    material_cost: materialCost,
    labor_cost: laborCost,
    equipment_cost: equipmentCost,
    total_cost: totalCost,
    production_days: productionDays,
    material_quote_id: materialQuote.quote_id,
    production_rate_id: productionRate.production_rate_id,
    labor_rate_id: laborRate.labor_rate_id,
    equipment_rate_id: equipmentRate.equipment_rate_id,
    source_takeoff_item_ids: [...line.source_takeoff_item_ids],
    trace_refs: [
      input.quantity_export.export_id,
      ...line.source_takeoff_item_ids,
      materialQuote.quote_id,
      productionRate.production_rate_id,
      laborRate.labor_rate_id,
      equipmentRate.equipment_rate_id
    ]
  };
}

function assertQuantityExportReady(quantityExport: QuantityExportObject): void {
  if (quantityExport.export_type !== "quantity_only") throw new Error("quantity_only_export_required");
  if (quantityExport.lines.length === 0) throw new Error("quantity_export_lines_required");
}

function assertCostInputs(input: CostBuildoutInput): void {
  if (!input.scenario_id) throw new Error("scenario_id_required");
  if (input.material_quotes.length === 0) throw new Error("material_quotes_required");
  if (input.labor_rates.length === 0) throw new Error("labor_rates_required");
  if (input.equipment_rates.length === 0) throw new Error("equipment_rates_required");
  if (input.production_rates.length === 0) throw new Error("production_rates_required");
  for (const quote of input.material_quotes) {
    if (quote.unit_cost < 0) throw new Error("material_unit_cost_must_be_nonnegative");
  }
  for (const rate of input.production_rates) {
    if (rate.validation_status !== "validated") throw new Error("production_rate_must_be_validated");
    if (rate.units_per_day <= 0) throw new Error("production_units_per_day_must_be_positive");
  }
}

function findMaterialQuote(quotes: MaterialQuoteInput[], line: QuantitySummaryLine): MaterialQuoteInput {
  const quote = quotes.find((candidate) => candidate.material_type === line.material_type && candidate.diameter_in === line.diameter_in && candidate.uom === line.uom);
  if (!quote) throw new Error("material_quote_not_found");
  return quote;
}

function findProductionRate(rates: ProductionRateInput[], line: QuantitySummaryLine): ProductionRateInput {
  const rate = rates.find((candidate) =>
    candidate.work_type === "sanitary_pipe_run" &&
    candidate.material_type === line.material_type &&
    candidate.diameter_in === line.diameter_in &&
    candidate.depth_class === line.depth_class &&
    candidate.production_uom === line.uom
  );
  if (!rate) throw new Error("production_rate_not_found");
  return rate;
}

function findLaborRate(rates: LaborRateInput[], crewCode: string): LaborRateInput {
  const rate = rates.find((candidate) => candidate.crew_code === crewCode);
  if (!rate) throw new Error("labor_rate_not_found");
  return rate;
}

function findEquipmentRate(rates: EquipmentRateInput[], equipmentCode: string): EquipmentRateInput {
  const rate = rates.find((candidate) => candidate.equipment_code === equipmentCode);
  if (!rate) throw new Error("equipment_rate_not_found");
  return rate;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
