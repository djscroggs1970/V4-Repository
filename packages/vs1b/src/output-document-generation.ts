import { FRAMEWORK_VERSION } from "@v4/config";
import type { BidGradeReleaseManifest } from "./bid-grade-release-gate.js";

export type OutputDocumentType =
  | "estimate_summary"
  | "cost_breakdown"
  | "quantity_cost_trace_exhibit"
  | "client_facing_export_manifest";

export interface OutputDocumentGenerationInput {
  release_manifest: BidGradeReleaseManifest;
  generated_by: string;
  generated_at?: string;
  document_set_id?: string;
  requested_document_types?: OutputDocumentType[];
}

export interface OutputDocumentSection {
  section_id: string;
  title: string;
  content: string;
  trace_refs: string[];
}

export interface GeneratedOutputDocument {
  document_id: string;
  document_type: OutputDocumentType;
  document_status: "generated_pending_persistence_review";
  project_instance_id: string;
  release_id: string;
  package_id: string;
  title: string;
  content_type: "text/markdown" | "application/json";
  generated_at: string;
  generated_by: string;
  sections: OutputDocumentSection[];
  trace_refs: string[];
}

export interface OutputDocumentGenerationResult {
  document_set_id: string;
  output_type: "bid_grade_output_document_set";
  document_status: "generated_pending_persistence_review";
  project_instance_id: string;
  framework_version: string;
  release_id: string;
  package_id: string;
  package_persistence_id: string;
  review_id: string;
  quantity_export_id: string;
  cost_scenario_id: string;
  total_cost: number;
  generated_at: string;
  generated_by: string;
  document_count: number;
  documents: GeneratedOutputDocument[];
  trace_refs: string[];
  next_required_action: "persist_output_documents";
}

const DEFAULT_DOCUMENT_TYPES: OutputDocumentType[] = [
  "estimate_summary",
  "cost_breakdown",
  "quantity_cost_trace_exhibit",
  "client_facing_export_manifest"
];

export function buildOutputDocumentGenerationResult(input: OutputDocumentGenerationInput): OutputDocumentGenerationResult {
  assertOutputDocumentGenerationInput(input);
  const generatedAt = input.generated_at ?? new Date().toISOString();
  const documentSetId = input.document_set_id ?? createDocumentSetId(input.release_manifest.release_id, generatedAt);
  const documentTypes = input.requested_document_types ?? DEFAULT_DOCUMENT_TYPES;
  const documents = documentTypes.map((documentType) => buildDocument(documentSetId, documentType, input.release_manifest, input.generated_by, generatedAt));
  const traceRefs = Array.from(new Set([
    input.release_manifest.release_id,
    input.release_manifest.package_id,
    input.release_manifest.package_persistence_id,
    input.release_manifest.review_id,
    input.release_manifest.quantity_export_id,
    input.release_manifest.cost_scenario_id,
    ...input.release_manifest.trace_manifest.release_trace_refs,
    ...documents.flatMap((document) => document.trace_refs)
  ])).sort();

  return {
    document_set_id: documentSetId,
    output_type: "bid_grade_output_document_set",
    document_status: "generated_pending_persistence_review",
    project_instance_id: input.release_manifest.project_instance_id,
    framework_version: FRAMEWORK_VERSION,
    release_id: input.release_manifest.release_id,
    package_id: input.release_manifest.package_id,
    package_persistence_id: input.release_manifest.package_persistence_id,
    review_id: input.release_manifest.review_id,
    quantity_export_id: input.release_manifest.quantity_export_id,
    cost_scenario_id: input.release_manifest.cost_scenario_id,
    total_cost: input.release_manifest.total_cost,
    generated_at: generatedAt,
    generated_by: input.generated_by,
    document_count: documents.length,
    documents,
    trace_refs: traceRefs,
    next_required_action: "persist_output_documents"
  };
}

function assertOutputDocumentGenerationInput(input: OutputDocumentGenerationInput): void {
  if (!input.generated_by.trim()) throw new Error("output_document_generated_by_required");
  if (input.release_manifest.release_type !== "bid_grade_release_manifest") throw new Error("output_document_release_manifest_required");
  if (input.release_manifest.release_status !== "ready_for_output_document_generation") throw new Error("output_document_release_not_ready");
  if (input.release_manifest.next_required_action !== "generate_output_documents") throw new Error("output_document_generation_action_required");
  if (input.release_manifest.total_cost < 0) throw new Error("output_document_total_cost_must_be_nonnegative");
  assertReleaseTrace(input.release_manifest);
  assertRequestedDocumentTypes(input.requested_document_types);
}

function assertReleaseTrace(releaseManifest: BidGradeReleaseManifest): void {
  const requiredRefs = [
    releaseManifest.release_id,
    releaseManifest.package_id,
    releaseManifest.package_persistence_id,
    releaseManifest.review_id,
    releaseManifest.quantity_export_id,
    releaseManifest.cost_scenario_id,
    releaseManifest.trace_manifest.source_document_id,
    releaseManifest.trace_manifest.registry_id,
    releaseManifest.trace_manifest.registry_version
  ];

  for (const ref of requiredRefs) {
    if (!releaseManifest.trace_manifest.release_trace_refs.includes(ref)) throw new Error("output_document_missing_release_trace");
  }

  for (const sourceTakeoffItemId of releaseManifest.trace_manifest.source_takeoff_item_ids) {
    if (!releaseManifest.trace_manifest.release_trace_refs.includes(sourceTakeoffItemId)) throw new Error("output_document_missing_takeoff_trace");
  }
}

function assertRequestedDocumentTypes(documentTypes?: OutputDocumentType[]): void {
  if (!documentTypes) return;
  if (documentTypes.length === 0) throw new Error("output_document_types_required");
  if (new Set(documentTypes).size !== documentTypes.length) throw new Error("duplicate_output_document_type");
}

function buildDocument(
  documentSetId: string,
  documentType: OutputDocumentType,
  releaseManifest: BidGradeReleaseManifest,
  generatedBy: string,
  generatedAt: string
): GeneratedOutputDocument {
  const documentId = `${documentSetId}_${documentType.toUpperCase()}`;
  const baseTraceRefs = Array.from(new Set([
    releaseManifest.release_id,
    releaseManifest.package_id,
    releaseManifest.package_persistence_id,
    releaseManifest.review_id,
    releaseManifest.quantity_export_id,
    releaseManifest.cost_scenario_id,
    ...releaseManifest.trace_manifest.release_trace_refs
  ])).sort();

  return {
    document_id: documentId,
    document_type: documentType,
    document_status: "generated_pending_persistence_review",
    project_instance_id: releaseManifest.project_instance_id,
    release_id: releaseManifest.release_id,
    package_id: releaseManifest.package_id,
    title: createDocumentTitle(documentType),
    content_type: documentType === "client_facing_export_manifest" ? "application/json" : "text/markdown",
    generated_at: generatedAt,
    generated_by: generatedBy,
    sections: buildSections(documentType, releaseManifest),
    trace_refs: baseTraceRefs
  };
}

function buildSections(documentType: OutputDocumentType, releaseManifest: BidGradeReleaseManifest): OutputDocumentSection[] {
  switch (documentType) {
    case "estimate_summary":
      return [
        buildSection("summary", "Estimate Summary", `Approved bid-grade release ${releaseManifest.release_id} for project instance ${releaseManifest.project_instance_id}. Total cost: ${formatCurrency(releaseManifest.total_cost)}.`, releaseManifest),
        buildSection("source_control", "Source Control", `Generated from package ${releaseManifest.package_id}, review ${releaseManifest.review_id}, quantity export ${releaseManifest.quantity_export_id}, and cost scenario ${releaseManifest.cost_scenario_id}.`, releaseManifest)
      ];
    case "cost_breakdown":
      return [
        buildSection("cost_total", "Cost Total", `Total approved cost carried by the release manifest: ${formatCurrency(releaseManifest.total_cost)}.`, releaseManifest),
        buildSection("cost_detail_boundary", "Cost Detail Boundary", `Detailed line-item costs are controlled by source cost scenario ${releaseManifest.cost_scenario_id}. This document does not infer or recreate cost lines that are not present in the approved release manifest.`, releaseManifest)
      ];
    case "quantity_cost_trace_exhibit":
      return [
        buildSection("trace_summary", "Quantity and Cost Trace", `Quantity export ${releaseManifest.quantity_export_id} and cost scenario ${releaseManifest.cost_scenario_id} are tied to ${releaseManifest.trace_manifest.source_takeoff_item_ids.length} source takeoff item(s).`, releaseManifest),
        buildSection("source_takeoff_items", "Source Takeoff Items", releaseManifest.trace_manifest.source_takeoff_item_ids.join(", "), releaseManifest)
      ];
    case "client_facing_export_manifest":
      return [
        buildSection("export_manifest", "Client-Facing Export Manifest", JSON.stringify({
          release_id: releaseManifest.release_id,
          project_instance_id: releaseManifest.project_instance_id,
          package_id: releaseManifest.package_id,
          quantity_export_id: releaseManifest.quantity_export_id,
          cost_scenario_id: releaseManifest.cost_scenario_id,
          total_cost: releaseManifest.total_cost,
          trace_ref_count: releaseManifest.trace_manifest.release_trace_refs.length
        }, null, 2), releaseManifest)
      ];
  }
}

function buildSection(sectionId: string, title: string, content: string, releaseManifest: BidGradeReleaseManifest): OutputDocumentSection {
  return {
    section_id: sectionId,
    title,
    content,
    trace_refs: [
      releaseManifest.release_id,
      releaseManifest.package_id,
      releaseManifest.quantity_export_id,
      releaseManifest.cost_scenario_id
    ]
  };
}

function createDocumentTitle(documentType: OutputDocumentType): string {
  switch (documentType) {
    case "estimate_summary":
      return "Estimate Summary";
    case "cost_breakdown":
      return "Cost Breakdown";
    case "quantity_cost_trace_exhibit":
      return "Quantity and Cost Trace Exhibit";
    case "client_facing_export_manifest":
      return "Client-Facing Export Manifest";
  }
}

function createDocumentSetId(releaseId: string, generatedAt: string): string {
  const stamp = generatedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `DOCSET_${releaseId}_${stamp}`;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}
