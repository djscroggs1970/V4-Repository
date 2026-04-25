import { FRAMEWORK_VERSION } from "@v4/config";
import type { QuantitySummaryLine, QuantitySummaryResult } from "./summary.js";

export interface QuantityExportInput {
  project_instance_id: string;
  source_document_id: string;
  summary: QuantitySummaryResult;
  generated_at?: string;
}

export interface QuantityExportObject {
  export_id: string;
  export_type: "quantity_only";
  project_instance_id: string;
  source_document_id: string;
  framework_version: string;
  generated_at: string;
  line_count: number;
  source_takeoff_item_ids: string[];
  lines: QuantitySummaryLine[];
}

export function buildQuantityExport(input: QuantityExportInput): QuantityExportObject {
  assertReadyForExport(input.summary);
  const generatedAt = input.generated_at ?? new Date().toISOString();
  const sourceIds = Array.from(new Set(input.summary.lines.flatMap((line) => line.source_takeoff_item_ids))).sort();

  return {
    export_id: createExportId(input.project_instance_id, generatedAt),
    export_type: "quantity_only",
    project_instance_id: input.project_instance_id,
    source_document_id: input.source_document_id,
    framework_version: FRAMEWORK_VERSION,
    generated_at: generatedAt,
    line_count: input.summary.lines.length,
    source_takeoff_item_ids: sourceIds,
    lines: input.summary.lines.map((line) => ({
      ...line,
      source_takeoff_item_ids: [...line.source_takeoff_item_ids]
    }))
  };
}

function assertReadyForExport(summary: QuantitySummaryResult): void {
  if (summary.next_required_action !== "export_quantity_summary") {
    throw new Error("quantity_summary_not_ready_for_export");
  }
  if (summary.lines.length === 0) {
    throw new Error("quantity_summary_lines_required");
  }
}

function createExportId(projectInstanceId: string, generatedAt: string): string {
  const stamp = generatedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `QTY_EXPORT_${projectInstanceId}_${stamp}`;
}
