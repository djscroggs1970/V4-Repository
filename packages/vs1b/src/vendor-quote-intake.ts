import { FRAMEWORK_VERSION } from "@v4/config";
import type { MaterialQuoteInput } from "./index.js";

export type VendorQuoteSourceOrigin = "project_upload";
export type VendorQuoteNormalizationStatus = "normalized_pending_registry_merge";

export interface VendorQuoteLineInput {
  quote_line_id: string;
  material_type: string;
  diameter_in: number;
  quoted_uom: string;
  quoted_unit_cost: number;
  currency?: string;
  manufacturer?: string;
  quoted_description?: string;
  source_page_ref?: string;
  source_row_ref?: string;
  trace_refs?: string[];
}

export interface VendorQuoteIntakeInput {
  quote_batch_id: string;
  project_instance_id: string;
  source_document_id: string;
  source_file_name: string;
  vendor_name: string;
  uploaded_at?: string;
  received_at?: string;
  source_origin?: VendorQuoteSourceOrigin;
  quote_lines: VendorQuoteLineInput[];
}

export interface NormalizedVendorQuoteLine extends MaterialQuoteInput {
  quote_id: string;
  quote_batch_id: string;
  project_instance_id: string;
  source_document_id: string;
  source_file_name: string;
  source_quote_line_id: string;
  vendor_name: string;
  currency: string;
  manufacturer?: string;
  quoted_description?: string;
  source_page_ref?: string;
  source_row_ref?: string;
  source_origin: VendorQuoteSourceOrigin;
  trace_refs: string[];
}

export interface VendorQuoteIntakeResult {
  quote_batch_id: string;
  project_instance_id: string;
  source_document_id: string;
  source_file_name: string;
  vendor_name: string;
  framework_version: string;
  source_origin: VendorQuoteSourceOrigin;
  uploaded_at: string;
  received_at?: string;
  normalization_status: VendorQuoteNormalizationStatus;
  registry_merge_ready: false;
  requires_registry_review: true;
  line_count: number;
  material_quotes: NormalizedVendorQuoteLine[];
  trace_refs: string[];
}

export function normalizeVendorQuoteIntake(input: VendorQuoteIntakeInput): VendorQuoteIntakeResult {
  assertQuoteBatchIdentity(input);
  assertUnique(input.quote_lines.map((line) => line.quote_line_id), "duplicate_vendor_quote_line_id");

  const sourceOrigin = input.source_origin ?? "project_upload";
  if (sourceOrigin !== "project_upload") throw new Error("vendor_quote_source_origin_must_be_project_upload");

  const materialQuotes = input.quote_lines.map((line, index) => normalizeQuoteLine(input, line, index + 1));
  const traceRefs = dedupeSort([
    input.quote_batch_id,
    input.project_instance_id,
    input.source_document_id,
    ...materialQuotes.flatMap((quote) => quote.trace_refs)
  ]);

  return {
    quote_batch_id: input.quote_batch_id,
    project_instance_id: input.project_instance_id,
    source_document_id: input.source_document_id,
    source_file_name: input.source_file_name,
    vendor_name: input.vendor_name,
    framework_version: FRAMEWORK_VERSION,
    source_origin: sourceOrigin,
    uploaded_at: input.uploaded_at ?? new Date().toISOString(),
    received_at: input.received_at,
    normalization_status: "normalized_pending_registry_merge",
    registry_merge_ready: false,
    requires_registry_review: true,
    line_count: materialQuotes.length,
    material_quotes: materialQuotes,
    trace_refs: traceRefs
  };
}

function normalizeQuoteLine(input: VendorQuoteIntakeInput, line: VendorQuoteLineInput, lineNumber: number): NormalizedVendorQuoteLine {
  assertQuoteLine(line);
  const quoteId = `${input.quote_batch_id}_MAT_${String(lineNumber).padStart(3, "0")}`;
  return {
    quote_id: quoteId,
    quote_batch_id: input.quote_batch_id,
    project_instance_id: input.project_instance_id,
    source_document_id: input.source_document_id,
    source_file_name: input.source_file_name,
    source_quote_line_id: line.quote_line_id,
    vendor_name: input.vendor_name,
    material_type: line.material_type,
    diameter_in: line.diameter_in,
    unit_cost: round4(line.quoted_unit_cost),
    uom: normalizeUom(line.quoted_uom),
    currency: line.currency ?? "USD",
    manufacturer: line.manufacturer,
    quoted_description: line.quoted_description,
    source_page_ref: line.source_page_ref,
    source_row_ref: line.source_row_ref,
    source_origin: "project_upload",
    trace_refs: dedupeSort([
      input.quote_batch_id,
      input.project_instance_id,
      input.source_document_id,
      line.quote_line_id,
      quoteId,
      ...(line.trace_refs ?? [])
    ])
  };
}

function assertQuoteBatchIdentity(input: VendorQuoteIntakeInput): void {
  if (!input.quote_batch_id) throw new Error("quote_batch_id_required");
  if (!input.project_instance_id) throw new Error("project_instance_id_required");
  if (!input.source_document_id) throw new Error("source_document_id_required");
  if (!input.source_file_name) throw new Error("source_file_name_required");
  if (!input.vendor_name) throw new Error("vendor_name_required");
  if (input.quote_lines.length === 0) throw new Error("vendor_quote_lines_required");
}

function assertQuoteLine(line: VendorQuoteLineInput): void {
  if (!line.quote_line_id) throw new Error("vendor_quote_line_id_required");
  if (!line.material_type) throw new Error("vendor_quote_material_type_required");
  if (line.diameter_in <= 0) throw new Error("vendor_quote_diameter_must_be_positive");
  if (!line.quoted_uom) throw new Error("vendor_quote_uom_required");
  if (line.quoted_unit_cost < 0) throw new Error("vendor_quote_unit_cost_must_be_nonnegative");
  if (line.currency !== undefined && line.currency !== "USD") throw new Error("vendor_quote_currency_must_be_usd");
}

function normalizeUom(uom: string): string {
  const normalized = uom.trim().toUpperCase();
  if (!normalized) throw new Error("vendor_quote_uom_required");
  return normalized;
}

function assertUnique(values: string[], errorCode: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) throw new Error(errorCode);
    seen.add(value);
  }
}

function dedupeSort(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
