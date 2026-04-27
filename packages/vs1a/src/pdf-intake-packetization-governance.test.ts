import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
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

const schemaPath = resolve(process.cwd(), "../../schemas/skills/pdf-intake-packetization.output.schema.json");
const fixturesDir = resolve(process.cwd(), "../../tests/fixtures/pdf-intake-packetization");

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
    const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.provisional_status.const).toBe("provisional_pending_manual_review");
    expect(schema.properties.review_gated.const).toBe(true);
    expect(schema.properties.hard_guardrail_confirmation.properties.quantities_extracted.const).toBe(false);
    expect(schema.properties.hard_guardrail_confirmation.properties.takeoff_items_created.const).toBe(false);
    expect(schema.properties.hard_guardrail_confirmation.properties.cost_outputs_created.const).toBe(false);
    expect(schema.properties.hard_guardrail_confirmation.properties.pricing_records_created.const).toBe(false);
    expect(schema.properties.hard_guardrail_confirmation.properties.production_rate_records_created.const).toBe(false);
    expect(schema.properties.hard_guardrail_confirmation.properties.review_gated.const).toBe(true);

    expect(schema.properties.sheet_classifications.items.type).toBe("object");
    expect(schema.properties.possible_relationships.items.type).toBe("object");
    expect(schema.properties.source_artifact_register.items.type).toBe("object");
    expect(schema.properties.manual_confirmation_flags.items.type).toBe("object");
  });

  it("fixtures stay provisional, review-gated, and preserve placeholder-safe identity fields", () => {
    for (const fixtureName of readdirSync(fixturesDir).filter((file) => file.endsWith(".json"))) {
      const output = loadFixture(fixtureName);

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
    for (const fixtureName of readdirSync(fixturesDir).filter((file) => file.endsWith(".json"))) {
      const output = loadFixture(fixtureName);
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
      const output = loadFixture(fixtureName);
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
    for (const fixtureName of readdirSync(fixturesDir).filter((file) => file.endsWith(".json"))) {
      const output = loadFixture(fixtureName) as Record<string, unknown>;
      for (const forbidden of forbiddenStructures) {
        expect(Object.hasOwn(output, forbidden)).toBe(false);
      }
    }
  });
});

function loadFixture(fileName: string): PacketizationOutput {
  return JSON.parse(readFileSync(resolve(fixturesDir, fileName), "utf8")) as PacketizationOutput;
}

function isPreservedOrPlaceholder(value: string): boolean {
  return /^((PRJ|DOC)_[A-Z0-9_]+|PLACEHOLDER_[A-Z0-9_]+)$/.test(value);
}
