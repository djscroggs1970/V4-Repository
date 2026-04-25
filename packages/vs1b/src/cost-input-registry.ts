import { FRAMEWORK_VERSION } from "@v4/config";
import type { EquipmentRateInput, LaborRateInput, MaterialQuoteInput, ProductionRateInput } from "./index.js";

export interface CostInputRegistryInput {
  registry_id: string;
  registry_version: string;
  material_quotes: MaterialQuoteInput[];
  labor_rates: LaborRateInput[];
  equipment_rates: EquipmentRateInput[];
  production_rates: ProductionRateInput[];
  effective_at?: string;
}

export interface CostInputRegistry {
  registry_id: string;
  registry_version: string;
  framework_version: string;
  effective_at: string;
  validation_status: "validated";
  material_quotes: MaterialQuoteInput[];
  labor_rates: LaborRateInput[];
  equipment_rates: EquipmentRateInput[];
  production_rates: ProductionRateInput[];
  trace_refs: string[];
}

export function buildCostInputRegistry(input: CostInputRegistryInput): CostInputRegistry {
  assertRegistryIdentity(input);
  assertUnique(input.material_quotes.map((quote) => quote.quote_id), "duplicate_material_quote_id");
  assertUnique(input.labor_rates.map((rate) => rate.labor_rate_id), "duplicate_labor_rate_id");
  assertUnique(input.equipment_rates.map((rate) => rate.equipment_rate_id), "duplicate_equipment_rate_id");
  assertUnique(input.production_rates.map((rate) => rate.production_rate_id), "duplicate_production_rate_id");
  assertMaterialQuotes(input.material_quotes);
  assertLaborRates(input.labor_rates);
  assertEquipmentRates(input.equipment_rates);
  assertProductionRates(input.production_rates);
  assertProductionRatesReferenceKnownCostInputs(input.production_rates, input.labor_rates, input.equipment_rates);

  return {
    registry_id: input.registry_id,
    registry_version: input.registry_version,
    framework_version: FRAMEWORK_VERSION,
    effective_at: input.effective_at ?? new Date().toISOString(),
    validation_status: "validated",
    material_quotes: input.material_quotes.map((quote) => ({ ...quote })),
    labor_rates: input.labor_rates.map((rate) => ({ ...rate })),
    equipment_rates: input.equipment_rates.map((rate) => ({ ...rate })),
    production_rates: input.production_rates.map((rate) => ({ ...rate })),
    trace_refs: [
      ...input.material_quotes.map((quote) => quote.quote_id),
      ...input.labor_rates.map((rate) => rate.labor_rate_id),
      ...input.equipment_rates.map((rate) => rate.equipment_rate_id),
      ...input.production_rates.map((rate) => rate.production_rate_id)
    ].sort()
  };
}

function assertRegistryIdentity(input: CostInputRegistryInput): void {
  if (!input.registry_id) throw new Error("registry_id_required");
  if (!input.registry_version) throw new Error("registry_version_required");
}

function assertMaterialQuotes(quotes: MaterialQuoteInput[]): void {
  if (quotes.length === 0) throw new Error("material_quotes_required");
  for (const quote of quotes) {
    if (!quote.quote_id) throw new Error("material_quote_id_required");
    if (!quote.material_type) throw new Error("material_quote_material_type_required");
    if (quote.diameter_in <= 0) throw new Error("material_quote_diameter_must_be_positive");
    if (quote.unit_cost < 0) throw new Error("material_unit_cost_must_be_nonnegative");
    if (!quote.uom) throw new Error("material_quote_uom_required");
  }
}

function assertLaborRates(rates: LaborRateInput[]): void {
  if (rates.length === 0) throw new Error("labor_rates_required");
  for (const rate of rates) {
    if (!rate.labor_rate_id) throw new Error("labor_rate_id_required");
    if (!rate.crew_code) throw new Error("crew_code_required");
    if (rate.cost_per_day < 0) throw new Error("labor_cost_per_day_must_be_nonnegative");
  }
}

function assertEquipmentRates(rates: EquipmentRateInput[]): void {
  if (rates.length === 0) throw new Error("equipment_rates_required");
  for (const rate of rates) {
    if (!rate.equipment_rate_id) throw new Error("equipment_rate_id_required");
    if (!rate.equipment_code) throw new Error("equipment_code_required");
    if (rate.cost_per_day < 0) throw new Error("equipment_cost_per_day_must_be_nonnegative");
  }
}

function assertProductionRates(rates: ProductionRateInput[]): void {
  if (rates.length === 0) throw new Error("production_rates_required");
  for (const rate of rates) {
    if (!rate.production_rate_id) throw new Error("production_rate_id_required");
    if (rate.validation_status !== "validated") throw new Error("production_rate_must_be_validated");
    if (rate.units_per_day <= 0) throw new Error("production_units_per_day_must_be_positive");
    if (!rate.crew_code) throw new Error("production_rate_crew_code_required");
    if (!rate.equipment_code) throw new Error("production_rate_equipment_code_required");
  }
}

function assertProductionRatesReferenceKnownCostInputs(productionRates: ProductionRateInput[], laborRates: LaborRateInput[], equipmentRates: EquipmentRateInput[]): void {
  const crewCodes = new Set(laborRates.map((rate) => rate.crew_code));
  const equipmentCodes = new Set(equipmentRates.map((rate) => rate.equipment_code));
  for (const rate of productionRates) {
    if (!crewCodes.has(rate.crew_code)) throw new Error("production_rate_labor_rate_not_found");
    if (!equipmentCodes.has(rate.equipment_code)) throw new Error("production_rate_equipment_rate_not_found");
  }
}

function assertUnique(values: string[], errorCode: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(errorCode);
    seen.add(value);
  }
}
