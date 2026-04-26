import { describe, expect, it } from "vitest";
import { normalizeVendorQuoteIntake } from "./vendor-quote-intake.js";

const BASE_INPUT = {
  quote_batch_id: "VENDOR_QUOTE_BATCH_001",
  project_instance_id: "SANDBOX_VENDOR_QUOTE_001",
  source_document_id: "DOC_VENDOR_QUOTE_001",
  source_file_name: "vendor-quote-001.pdf",
  vendor_name: "Controlled Pipe Supply",
  uploaded_at: "2026-04-26T22:15:00.000Z",
  received_at: "2026-04-26T20:00:00.000Z",
  quote_lines: [
    {
      quote_line_id: "QUOTE_ROW_001",
      material_type: "PVC_C900_DR18",
      diameter_in: 8,
      quoted_uom: "lf",
      quoted_unit_cost: 32.12567,
      currency: "USD",
      manufacturer: "Controlled Manufacturer",
      quoted_description: "8 inch PVC C900 DR18 pipe",
      source_page_ref: "page:1",
      source_row_ref: "row:4",
      trace_refs: ["cell:A4", "cell:D4"]
    },
    {
      quote_line_id: "QUOTE_ROW_002",
      material_type: "DIP_CLASS_350",
      diameter_in: 8,
      quoted_uom: "LF",
      quoted_unit_cost: 58,
      currency: "USD",
      source_page_ref: "page:1",
      source_row_ref: "row:5"
    }
  ]
};

describe("vendor quote intake normalization", () => {
  it("normalizes uploaded vendor quote lines into traceable material quote records", () => {
    const result = normalizeVendorQuoteIntake(BASE_INPUT);

    expect(result.quote_batch_id).toBe("VENDOR_QUOTE_BATCH_001");
    expect(result.project_instance_id).toBe("SANDBOX_VENDOR_QUOTE_001");
    expect(result.source_document_id).toBe("DOC_VENDOR_QUOTE_001");
    expect(result.vendor_name).toBe("Controlled Pipe Supply");
    expect(result.source_origin).toBe("project_upload");
    expect(result.normalization_status).toBe("normalized_pending_registry_merge");
    expect(result.registry_merge_ready).toBe(false);
    expect(result.requires_registry_review).toBe(true);
    expect(result.line_count).toBe(2);
    expect(result.material_quotes[0]).toMatchObject({
      quote_id: "VENDOR_QUOTE_BATCH_001_MAT_001",
      source_quote_line_id: "QUOTE_ROW_001",
      material_type: "PVC_C900_DR18",
      diameter_in: 8,
      unit_cost: 32.1257,
      uom: "LF",
      currency: "USD",
      source_origin: "project_upload"
    });
    expect(result.material_quotes[0]!.trace_refs).toEqual([
      "DOC_VENDOR_QUOTE_001",
      "QUOTE_ROW_001",
      "SANDBOX_VENDOR_QUOTE_001",
      "VENDOR_QUOTE_BATCH_001",
      "VENDOR_QUOTE_BATCH_001_MAT_001",
      "cell:A4",
      "cell:D4"
    ]);
    expect(result.trace_refs).toContain("VENDOR_QUOTE_BATCH_001_MAT_001");
    expect(result.trace_refs).toContain("VENDOR_QUOTE_BATCH_001_MAT_002");
  });

  it("does not make normalized vendor quote records registry merge ready without review", () => {
    const result = normalizeVendorQuoteIntake(BASE_INPUT);

    expect(result.registry_merge_ready).toBe(false);
    expect(result.requires_registry_review).toBe(true);
    expect(result.material_quotes.every((quote) => quote.source_origin === "project_upload")).toBe(true);
  });

  it("rejects missing batch identity fields", () => {
    expect(() => normalizeVendorQuoteIntake({
      ...BASE_INPUT,
      quote_batch_id: ""
    })).toThrow("quote_batch_id_required");

    expect(() => normalizeVendorQuoteIntake({
      ...BASE_INPUT,
      project_instance_id: ""
    })).toThrow("project_instance_id_required");

    expect(() => normalizeVendorQuoteIntake({
      ...BASE_INPUT,
      source_document_id: ""
    })).toThrow("source_document_id_required");

    expect(() => normalizeVendorQuoteIntake({
      ...BASE_INPUT,
      vendor_name: ""
    })).toThrow("vendor_name_required");
  });

  it("rejects duplicate vendor quote line IDs", () => {
    expect(() => normalizeVendorQuoteIntake({
      ...BASE_INPUT,
      quote_lines: [BASE_INPUT.quote_lines[0]!, BASE_INPUT.quote_lines[0]!]
    })).toThrow("duplicate_vendor_quote_line_id");
  });

  it("rejects quote lines with missing or invalid pricing fields", () => {
    expect(() => normalizeVendorQuoteIntake({
      ...BASE_INPUT,
      quote_lines: [{ ...BASE_INPUT.quote_lines[0]!, material_type: "" }]
    })).toThrow("vendor_quote_material_type_required");

    expect(() => normalizeVendorQuoteIntake({
      ...BASE_INPUT,
      quote_lines: [{ ...BASE_INPUT.quote_lines[0]!, diameter_in: 0 }]
    })).toThrow("vendor_quote_diameter_must_be_positive");

    expect(() => normalizeVendorQuoteIntake({
      ...BASE_INPUT,
      quote_lines: [{ ...BASE_INPUT.quote_lines[0]!, quoted_uom: "" }]
    })).toThrow("vendor_quote_uom_required");

    expect(() => normalizeVendorQuoteIntake({
      ...BASE_INPUT,
      quote_lines: [{ ...BASE_INPUT.quote_lines[0]!, quoted_unit_cost: -1 }]
    })).toThrow("vendor_quote_unit_cost_must_be_nonnegative");
  });

  it("rejects unsupported currency and non-upload source origins", () => {
    expect(() => normalizeVendorQuoteIntake({
      ...BASE_INPUT,
      quote_lines: [{ ...BASE_INPUT.quote_lines[0]!, currency: "CAD" }]
    })).toThrow("vendor_quote_currency_must_be_usd");

    expect(() => normalizeVendorQuoteIntake({
      ...BASE_INPUT,
      source_origin: "framework_seed" as "project_upload"
    })).toThrow("vendor_quote_source_origin_must_be_project_upload");
  });
});
