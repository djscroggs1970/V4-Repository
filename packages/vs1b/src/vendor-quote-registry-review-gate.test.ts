import { describe, expect, it } from "vitest";
import { buildVendorQuoteRegistryReviewGateResult } from "./vendor-quote-registry-review-gate.js";
import { normalizeVendorQuoteIntake } from "./vendor-quote-intake.js";

function buildNormalizedVendorQuoteIntake() {
  return normalizeVendorQuoteIntake({
    quote_batch_id: "VENDOR_BATCH_100",
    project_instance_id: "SANDBOX_PROJECT_VENDOR_100",
    source_document_id: "DOC_VENDOR_100",
    source_file_name: "vendor-batch-100.pdf",
    vendor_name: "Controlled Vendor Co",
    uploaded_at: "2026-04-27T00:00:00.000Z",
    quote_lines: [
      {
        quote_line_id: "ROW_001",
        material_type: "PVC_C900_DR18",
        diameter_in: 8,
        quoted_uom: "LF",
        quoted_unit_cost: 31.5,
        trace_refs: ["sheet:1:row:1"]
      },
      {
        quote_line_id: "ROW_002",
        material_type: "DIP_CLASS_350",
        diameter_in: 8,
        quoted_uom: "LF",
        quoted_unit_cost: 52.75,
        trace_refs: ["sheet:1:row:2"]
      },
      {
        quote_line_id: "ROW_003",
        material_type: "PVC_C900_DR18",
        diameter_in: 12,
        quoted_uom: "LF",
        quoted_unit_cost: 44,
        trace_refs: ["sheet:1:row:3"]
      },
      {
        quote_line_id: "ROW_004",
        material_type: "DIP_CLASS_350",
        diameter_in: 12,
        quoted_uom: "LF",
        quoted_unit_cost: 65,
        trace_refs: ["sheet:1:row:4"]
      }
    ]
  });
}

describe("vendor quote registry review gate", () => {
  it("promotes approved normalized quote records to eligible_for_registry_merge", () => {
    const intake = buildNormalizedVendorQuoteIntake();

    const result = buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: [
        {
          quote_id: intake.material_quotes[0]!.quote_id,
          decision: "approved",
          reviewer: "reviewer.alpha"
        }
      ]
    });

    expect(result.approved_for_registry_merge).toHaveLength(1);
    expect(result.approved_for_registry_merge[0]).toMatchObject({
      quote_id: intake.material_quotes[0]!.quote_id,
      registry_merge_status: "eligible_for_registry_merge",
      registry_merge_ready: true,
      requires_registry_review: false
    });
    expect(result.next_required_action).toBe("resolve_vendor_quote_review_flags");
    expect(result.review_status).toBe("quote_registry_review_has_open_items");
  });

  it("requires note for rejected and blocks from merge", () => {
    const intake = buildNormalizedVendorQuoteIntake();

    expect(() => buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: [
        {
          quote_id: intake.material_quotes[0]!.quote_id,
          decision: "rejected",
          reviewer: "reviewer.alpha"
        }
      ]
    })).toThrow("vendor_quote_registry_review_note_required");

    const result = buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: [
        {
          quote_id: intake.material_quotes[0]!.quote_id,
          decision: "rejected",
          reviewer: "reviewer.alpha",
          note: "unit cost formatting mismatch"
        }
      ]
    });

    expect(result.blocked_quote_records[0]).toMatchObject({
      quote_id: intake.material_quotes[0]!.quote_id,
      review_decision: "rejected",
      registry_merge_ready: false,
      review_note: "unit cost formatting mismatch"
    });
  });

  it("requires note for needs_review and keeps record open", () => {
    const intake = buildNormalizedVendorQuoteIntake();

    expect(() => buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: [
        {
          quote_id: intake.material_quotes[0]!.quote_id,
          decision: "needs_review",
          reviewer: "reviewer.alpha"
        }
      ]
    })).toThrow("vendor_quote_registry_review_note_required");

    const result = buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: [
        {
          quote_id: intake.material_quotes[0]!.quote_id,
          decision: "needs_review",
          reviewer: "reviewer.alpha",
          note: "needs source row verification"
        }
      ]
    });

    expect(result.blocked_quote_records[0]).toMatchObject({
      review_decision: "needs_review",
      registry_merge_ready: false
    });
    expect(result.review_status).toBe("quote_registry_review_has_open_items");
  });

  it("rejects missing reviewer identity", () => {
    const intake = buildNormalizedVendorQuoteIntake();

    expect(() => buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: [
        {
          quote_id: intake.material_quotes[0]!.quote_id,
          decision: "approved",
          reviewer: ""
        }
      ]
    })).toThrow("vendor_quote_registry_review_reviewer_required");
  });

  it("rejects duplicate review rows for the same quote_id", () => {
    const intake = buildNormalizedVendorQuoteIntake();

    expect(() => buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: [
        {
          quote_id: intake.material_quotes[0]!.quote_id,
          decision: "approved",
          reviewer: "reviewer.alpha"
        },
        {
          quote_id: intake.material_quotes[0]!.quote_id,
          decision: "approved",
          reviewer: "reviewer.beta"
        }
      ]
    })).toThrow("duplicate_vendor_quote_registry_review_row");
  });

  it("rejects review rows for unknown quote_id", () => {
    const intake = buildNormalizedVendorQuoteIntake();

    expect(() => buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: [
        {
          quote_id: "UNKNOWN_QUOTE_ID",
          decision: "approved",
          reviewer: "reviewer.alpha"
        }
      ]
    })).toThrow("unknown_vendor_quote_registry_review_quote_id");
  });

  it("keeps unreviewed quotes open and not merge-ready", () => {
    const intake = buildNormalizedVendorQuoteIntake();

    const result = buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: []
    });

    expect(result.review_status).toBe("quote_registry_review_has_open_items");
    expect(result.counts.unreviewed_quotes).toBe(4);
    expect(result.blocked_quote_records.every((quote) => quote.registry_merge_ready === false)).toBe(true);
    expect(result.blocked_quote_records.every((quote) => quote.review_decision === "unreviewed")).toBe(true);
  });

  it("returns completed status and merge action only when all non-approved flags are resolved", () => {
    const intake = buildNormalizedVendorQuoteIntake();

    const result = buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: [
        {
          quote_id: intake.material_quotes[0]!.quote_id,
          decision: "approved",
          reviewer: "reviewer.alpha"
        },
        {
          quote_id: intake.material_quotes[1]!.quote_id,
          decision: "rejected",
          reviewer: "reviewer.alpha",
          note: "invalid unit conversion in source"
        },
        {
          quote_id: intake.material_quotes[2]!.quote_id,
          decision: "approved",
          reviewer: "reviewer.alpha"
        },
        {
          quote_id: intake.material_quotes[3]!.quote_id,
          decision: "rejected",
          reviewer: "reviewer.alpha",
          note: "duplicate vendor line"
        }
      ]
    });

    expect(result.review_status).toBe("quote_registry_review_completed");
    expect(result.next_required_action).toBe("merge_approved_quotes_to_cost_input_registry");
  });

  it("produces correct counts for mixed approved rejected needs_review and unreviewed", () => {
    const intake = buildNormalizedVendorQuoteIntake();

    const result = buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: [
        {
          quote_id: intake.material_quotes[0]!.quote_id,
          decision: "approved",
          reviewer: "reviewer.alpha"
        },
        {
          quote_id: intake.material_quotes[1]!.quote_id,
          decision: "rejected",
          reviewer: "reviewer.alpha",
          note: "vendor line mismatch"
        },
        {
          quote_id: intake.material_quotes[2]!.quote_id,
          decision: "needs_review",
          reviewer: "reviewer.alpha",
          note: "needs normalization correction"
        }
      ]
    });

    expect(result.counts).toEqual({
      total_quotes: 4,
      reviewed_quotes: 3,
      approved_quotes: 1,
      rejected_quotes: 1,
      needs_review_quotes: 1,
      unreviewed_quotes: 1,
      blocked_quotes: 3
    });
    expect(result.next_required_action).toBe("resolve_vendor_quote_review_flags");
  });

  it("preserves approved vendor quote trace refs", () => {
    const intake = buildNormalizedVendorQuoteIntake();

    const result = buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: [
        {
          quote_id: intake.material_quotes[0]!.quote_id,
          decision: "approved",
          reviewer: "reviewer.alpha"
        }
      ]
    });

    expect(result.approved_for_registry_merge[0]!.trace_refs).toEqual(intake.material_quotes[0]!.trace_refs);
    expect(result.trace_refs).toContain("sheet:1:row:1");
  });

  it("does not create labor equipment or production rates or a validated registry", () => {
    const intake = buildNormalizedVendorQuoteIntake();

    const result = buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: intake.material_quotes.map((quote) => ({
        quote_id: quote.quote_id,
        decision: "approved" as const,
        reviewer: "reviewer.alpha"
      }))
    });

    expect(result).not.toHaveProperty("labor_rates");
    expect(result).not.toHaveProperty("equipment_rates");
    expect(result).not.toHaveProperty("production_rates");
    expect(result).not.toHaveProperty("validation_status");
    expect(result.approved_for_registry_merge.every((quote) => quote.registry_merge_status === "eligible_for_registry_merge")).toBe(true);
  });

  it("preserves project document and source identity fields in gate output and approved quotes", () => {
    const intake = buildNormalizedVendorQuoteIntake();

    const result = buildVendorQuoteRegistryReviewGateResult({
      vendor_quote_intake: intake,
      review_rows: [
        {
          quote_id: intake.material_quotes[0]!.quote_id,
          decision: "approved",
          reviewer: "reviewer.alpha"
        }
      ]
    });

    expect(result).toMatchObject({
      quote_batch_id: intake.quote_batch_id,
      project_instance_id: intake.project_instance_id,
      source_document_id: intake.source_document_id,
      source_file_name: intake.source_file_name,
      vendor_name: intake.vendor_name
    });
    expect(result.approved_for_registry_merge[0]).toMatchObject({
      quote_batch_id: intake.quote_batch_id,
      project_instance_id: intake.project_instance_id,
      source_document_id: intake.source_document_id,
      source_file_name: intake.source_file_name,
      source_quote_line_id: intake.material_quotes[0]!.source_quote_line_id,
      vendor_name: intake.vendor_name,
      quote_id: intake.material_quotes[0]!.quote_id
    });
  });
});
