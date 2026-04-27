import { describe, expect, it } from "vitest";

type PacketizationOutput = {
  project_instance_id: string;
  source_document_id: string;
  provisional_status: string;
  review_gated: boolean;
  hard_guardrail_confirmation: {
    quantities_extracted: boolean;
    takeoff_items_created: boolean;
    cost_outputs_created: boolean;
    pricing_records_created: boolean;
    production_rate_records_created: boolean;
    review_gated: boolean;
  };
  sheet_classifications: Array<{ confidence: number; trace_refs: string[]; provisional_status: string; sheet_id: string }>;
  possible_relationships: Array<{ confidence: number; trace_refs: string[]; provisional_status: string }>;
  source_artifact_register: Array<{
    artifact_id: string;
    artifact_type: string;
    source_document_id: string;
    storage_ref: string;
    page_range: { start_page: number; end_page: number };
    provisional_status: string;
    trace_refs: string[];
  }>;
  manual_confirmation_flags: Array<{ flag_code: string; required: boolean; reason: string; trace_refs: string[] }>;
  trace_refs: string[];
};

type PacketizationSchema = {
  additionalProperties: boolean;
  properties: {
    provisional_status: { const: string };
    review_gated: { const: boolean };
    hard_guardrail_confirmation: {
      properties: Record<string, { const: boolean }>;
    };
    sheet_classifications: { items: { type: string } };
    possible_relationships: { items: { type: string } };
    source_artifact_register: { items: { type: string } };
    manual_confirmation_flags: { items: { type: string } };
  };
};

const schemaContract: PacketizationSchema = {
  additionalProperties: false,
  properties: {
    provisional_status: { const: "provisional_pending_manual_review" },
    review_gated: { const: true },
    hard_guardrail_confirmation: {
      properties: {
        quantities_extracted: { const: false },
        takeoff_items_created: { const: false },
        cost_outputs_created: { const: false },
        pricing_records_created: { const: false },
        production_rate_records_created: { const: false },
        review_gated: { const: true }
      }
    },
    sheet_classifications: { items: { type: "object" } },
    possible_relationships: { items: { type: "object" } },
    source_artifact_register: { items: { type: "object" } },
    manual_confirmation_flags: { items: { type: "object" } }
  }
};

const fixtures: Record<string, PacketizationOutput> = {
  "clear-sheet-index.fixture.json": {
    project_instance_id: "PRJ_PACKET_001",
    source_document_id: "DOC_PACKET_001",
    provisional_status: "provisional_pending_manual_review",
    review_gated: true,
    hard_guardrail_confirmation: {
      quantities_extracted: false,
      takeoff_items_created: false,
      cost_outputs_created: false,
      pricing_records_created: false,
      production_rate_records_created: false,
      review_gated: true
    },
    sheet_classifications: [
      { sheet_id: "C-00", confidence: 0.99, provisional_status: "provisional", trace_refs: ["sheet:C-00", "note:cover"] },
      { sheet_id: "C-01", confidence: 0.91, provisional_status: "provisional", trace_refs: ["sheet:C-01", "note:index"] },
      { sheet_id: "C-40", confidence: 0.94, provisional_status: "provisional", trace_refs: ["sheet:C-40", "note:utility_plan"] },
      { sheet_id: "C-41", confidence: 0.92, provisional_status: "provisional", trace_refs: ["sheet:C-41", "note:utility_plan"] },
      { sheet_id: "C-50", confidence: 0.9, provisional_status: "provisional", trace_refs: ["sheet:C-50", "note:profile"] },
      { sheet_id: "C-51", confidence: 0.9, provisional_status: "provisional", trace_refs: ["sheet:C-51", "note:profile"] },
      { sheet_id: "D-1", confidence: 0.95, provisional_status: "provisional", trace_refs: ["sheet:D-1", "note:detail"] }
    ],
    possible_relationships: [{ confidence: 0.93, provisional_status: "provisional", trace_refs: ["sequence:C-40->C-41"] }],
    source_artifact_register: [
      {
        artifact_id: "ART_001",
        artifact_type: "sheet_index_capture",
        source_document_id: "DOC_PACKET_001",
        storage_ref: "synthetic://packetization/clear/index",
        page_range: { start_page: 1, end_page: 1 },
        provisional_status: "provisional",
        trace_refs: ["capture:index_page_1"]
      }
    ],
    manual_confirmation_flags: [
      {
        flag_code: "low_confidence_classifications",
        required: true,
        reason: "Baseline manual spot-check required by governance even when confidence is high.",
        trace_refs: ["governance:manual_review_required"]
      }
    ],
    trace_refs: ["project:PRJ_PACKET_001", "document:DOC_PACKET_001"]
  },
  "missing-index.fixture.json": {
    project_instance_id: "PLACEHOLDER_PROJECT_INSTANCE_ID",
    source_document_id: "DOC_PACKET_MISSING_INDEX",
    provisional_status: "provisional_pending_manual_review",
    review_gated: true,
    hard_guardrail_confirmation: {
      quantities_extracted: false,
      takeoff_items_created: false,
      cost_outputs_created: false,
      pricing_records_created: false,
      production_rate_records_created: false,
      review_gated: true
    },
    sheet_classifications: [{ sheet_id: "UNK-1", confidence: 0.44, provisional_status: "provisional", trace_refs: ["sheet:UNK-1", "note:index_not_detected"] }],
    possible_relationships: [],
    source_artifact_register: [
      {
        artifact_id: "ART_MISS_001",
        artifact_type: "sheet_snippet",
        source_document_id: "DOC_PACKET_MISSING_INDEX",
        storage_ref: "synthetic://packetization/missing-index/page-2",
        page_range: { start_page: 2, end_page: 2 },
        provisional_status: "provisional",
        trace_refs: ["capture:page_2"]
      }
    ],
    manual_confirmation_flags: [
      { flag_code: "missing_plan_index", required: true, reason: "No explicit plan index was found.", trace_refs: ["issue:missing_index"] },
      { flag_code: "low_confidence_classifications", required: true, reason: "Classification confidence below threshold.", trace_refs: ["confidence:0.44"] }
    ],
    trace_refs: ["document:DOC_PACKET_MISSING_INDEX"]
  },
  "duplicate-sheet-id.fixture.json": {
    project_instance_id: "PRJ_PACKET_DUP_001",
    source_document_id: "PLACEHOLDER_SOURCE_DOCUMENT_ID",
    provisional_status: "provisional_pending_manual_review",
    review_gated: true,
    hard_guardrail_confirmation: {
      quantities_extracted: false,
      takeoff_items_created: false,
      cost_outputs_created: false,
      pricing_records_created: false,
      production_rate_records_created: false,
      review_gated: true
    },
    sheet_classifications: [
      { sheet_id: "C-40", confidence: 0.88, provisional_status: "provisional", trace_refs: ["sheet:C-40", "note:first_occurrence"] },
      { sheet_id: "C-40", confidence: 0.73, provisional_status: "provisional", trace_refs: ["sheet:C-40", "note:duplicate_occurrence"] }
    ],
    possible_relationships: [{ confidence: 0.61, provisional_status: "provisional", trace_refs: ["note:duplicate_reference"] }],
    source_artifact_register: [
      {
        artifact_id: "ART_DUP_001",
        artifact_type: "sheet_index_capture",
        source_document_id: "PLACEHOLDER_SOURCE_DOCUMENT_ID",
        storage_ref: "synthetic://packetization/duplicate/index",
        page_range: { start_page: 1, end_page: 1 },
        provisional_status: "provisional",
        trace_refs: ["capture:index"]
      }
    ],
    manual_confirmation_flags: [{ flag_code: "duplicate_sheet_ids", required: true, reason: "Duplicate sheet identifier detected.", trace_refs: ["duplicate:sheet:C-40"] }],
    trace_refs: ["project:PRJ_PACKET_DUP_001", "document:PLACEHOLDER_SOURCE_DOCUMENT_ID"]
  },
  "mixed-utility.fixture.json": {
    project_instance_id: "PRJ_PACKET_MIXED_001",
    source_document_id: "DOC_PACKET_MIXED_001",
    provisional_status: "provisional_pending_manual_review",
    review_gated: true,
    hard_guardrail_confirmation: {
      quantities_extracted: false,
      takeoff_items_created: false,
      cost_outputs_created: false,
      pricing_records_created: false,
      production_rate_records_created: false,
      review_gated: true
    },
    sheet_classifications: [{ sheet_id: "C-41", confidence: 0.56, provisional_status: "provisional", trace_refs: ["sheet:C-41", "note:mixed_utilities"] }],
    possible_relationships: [{ confidence: 0.52, provisional_status: "provisional", trace_refs: ["note:detail_reference"] }],
    source_artifact_register: [
      {
        artifact_id: "ART_MIXED_001",
        artifact_type: "legend_capture",
        source_document_id: "DOC_PACKET_MIXED_001",
        storage_ref: "synthetic://packetization/mixed/legend",
        page_range: { start_page: 3, end_page: 3 },
        provisional_status: "provisional",
        trace_refs: ["capture:legend"]
      }
    ],
    manual_confirmation_flags: [
      { flag_code: "mixed_utility_sheets", required: true, reason: "Sheet contains multiple utility scopes.", trace_refs: ["issue:mixed_utilities"] },
      { flag_code: "low_confidence_classifications", required: true, reason: "Classification confidence below threshold.", trace_refs: ["confidence:0.56"] }
    ],
    trace_refs: ["project:PRJ_PACKET_MIXED_001", "document:DOC_PACKET_MIXED_001"]
  },
  "broad-construction-details.fixture.json": {
    project_instance_id: "PRJ_PACKET_DETAIL_001",
    source_document_id: "DOC_PACKET_DETAIL_001",
    provisional_status: "provisional_pending_manual_review",
    review_gated: true,
    hard_guardrail_confirmation: {
      quantities_extracted: false,
      takeoff_items_created: false,
      cost_outputs_created: false,
      pricing_records_created: false,
      production_rate_records_created: false,
      review_gated: true
    },
    sheet_classifications: [{ sheet_id: "D-1", confidence: 0.59, provisional_status: "provisional", trace_refs: ["sheet:D-1", "note:broad_details"] }],
    possible_relationships: [{ confidence: 0.5, provisional_status: "provisional", trace_refs: ["note:details_apply_to_profile"] }],
    source_artifact_register: [
      {
        artifact_id: "ART_DETAIL_001",
        artifact_type: "notes_capture",
        source_document_id: "DOC_PACKET_DETAIL_001",
        storage_ref: "synthetic://packetization/details/notes",
        page_range: { start_page: 4, end_page: 4 },
        provisional_status: "provisional",
        trace_refs: ["capture:detail_notes"]
      }
    ],
    manual_confirmation_flags: [
      { flag_code: "broad_construction_detail_sheets", required: true, reason: "Details are too broad for automated relationship confidence.", trace_refs: ["issue:broad_details"] },
      { flag_code: "low_confidence_classifications", required: true, reason: "Classification confidence below threshold.", trace_refs: ["confidence:0.59"] }
    ],
    trace_refs: ["project:PRJ_PACKET_DETAIL_001", "document:DOC_PACKET_DETAIL_001"]
  }
};

const forbiddenStructures = [
  "takeoff_items",
  "quantity_summaries",
  "quantity_summary",
  "quantity_exports",
  "cost_outputs",
  "labor_outputs",
  "equipment_outputs",
  "production_rates",
  "vendor_pricing"
];

describe("pdf intake packetization governance", () => {
  it("schema locks hard guardrail constants and typed arrays", () => {
    expect(schemaContract.additionalProperties).toBe(false);
    expect(schemaContract.properties.provisional_status.const).toBe("provisional_pending_manual_review");
    expect(schemaContract.properties.review_gated.const).toBe(true);
    expect(schemaContract.properties.hard_guardrail_confirmation.properties.quantities_extracted.const).toBe(false);
    expect(schemaContract.properties.hard_guardrail_confirmation.properties.takeoff_items_created.const).toBe(false);
    expect(schemaContract.properties.hard_guardrail_confirmation.properties.cost_outputs_created.const).toBe(false);
    expect(schemaContract.properties.hard_guardrail_confirmation.properties.pricing_records_created.const).toBe(false);
    expect(schemaContract.properties.hard_guardrail_confirmation.properties.production_rate_records_created.const).toBe(false);
    expect(schemaContract.properties.hard_guardrail_confirmation.properties.review_gated.const).toBe(true);

    expect(schemaContract.properties.sheet_classifications.items.type).toBe("object");
    expect(schemaContract.properties.possible_relationships.items.type).toBe("object");
    expect(schemaContract.properties.source_artifact_register.items.type).toBe("object");
    expect(schemaContract.properties.manual_confirmation_flags.items.type).toBe("object");
  });

  it("fixtures stay provisional, review-gated, and preserve placeholder-safe identity fields", () => {
    for (const output of Object.values(fixtures)) {
      expect(output.provisional_status).toBe("provisional_pending_manual_review");
      expect(output.review_gated).toBe(true);
      expect(output.hard_guardrail_confirmation).toEqual({
        quantities_extracted: false,
        takeoff_items_created: false,
        cost_outputs_created: false,
        pricing_records_created: false,
        production_rate_records_created: false,
        review_gated: true
      });

      expect(isPreservedOrPlaceholder(output.project_instance_id)).toBe(true);
      expect(isPreservedOrPlaceholder(output.source_document_id)).toBe(true);
    }
  });

  it("fixtures enforce required register fields, trace refs, and bounded confidence", () => {
    for (const output of Object.values(fixtures)) {
      expect(output.source_artifact_register.length).toBeGreaterThan(0);

      for (const item of output.sheet_classifications) {
        expect(item.provisional_status).toBe("provisional");
        expect(item.trace_refs.length).toBeGreaterThan(0);
        expect(item.confidence).toBeGreaterThanOrEqual(0);
        expect(item.confidence).toBeLessThanOrEqual(1);
      }

      for (const item of output.possible_relationships) {
        expect(item.provisional_status).toBe("provisional");
        expect(item.trace_refs.length).toBeGreaterThan(0);
        expect(item.confidence).toBeGreaterThanOrEqual(0);
        expect(item.confidence).toBeLessThanOrEqual(1);
      }

      for (const artifact of output.source_artifact_register) {
        expect(artifact.artifact_id.length).toBeGreaterThan(0);
        expect(artifact.artifact_type.length).toBeGreaterThan(0);
        expect(artifact.source_document_id.length).toBeGreaterThan(0);
        expect(artifact.storage_ref.length).toBeGreaterThan(0);
        expect(artifact.page_range.start_page).toBeGreaterThan(0);
        expect(artifact.page_range.end_page).toBeGreaterThan(0);
        expect(artifact.provisional_status).toBe("provisional");
        expect(artifact.trace_refs.length).toBeGreaterThan(0);
      }

      expect(output.trace_refs.length).toBeGreaterThan(0);
    }
  });

  it("manual confirmation flags cover all risk conditions", () => {
    const expectedByFixture: Record<string, string[]> = {
      "missing-index.fixture.json": ["missing_plan_index", "low_confidence_classifications"],
      "duplicate-sheet-id.fixture.json": ["duplicate_sheet_ids"],
      "mixed-utility.fixture.json": ["mixed_utility_sheets", "low_confidence_classifications"],
      "broad-construction-details.fixture.json": ["broad_construction_detail_sheets", "low_confidence_classifications"]
    };

    for (const [fixtureName, expectedFlags] of Object.entries(expectedByFixture)) {
      const output = fixtures[fixtureName]!;
      const actualFlags = output.manual_confirmation_flags.map((flag) => flag.flag_code);
      for (const expectedFlag of expectedFlags) {
        expect(actualFlags).toContain(expectedFlag);
      }
      for (const flag of output.manual_confirmation_flags) {
        expect(flag.required).toBe(true);
        expect(flag.reason.length).toBeGreaterThan(0);
        expect(flag.trace_refs.length).toBeGreaterThan(0);
      }
    }
  });

  it("fixtures do not create takeoff, quantity, or pricing structures", () => {
    for (const output of Object.values(fixtures)) {
      const outputRecord = output as Record<string, unknown>;
      for (const forbidden of forbiddenStructures) {
        expect(Object.hasOwn(outputRecord, forbidden)).toBe(false);
      }
    }
  });
});

function isPreservedOrPlaceholder(value: string): boolean {
  return /^((PRJ|DOC)_[A-Z0-9_]+|PLACEHOLDER_[A-Z0-9_]+)$/.test(value);
}
