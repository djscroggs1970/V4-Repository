import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

interface FixtureProject {
  project_instance_id: string;
  project_code: string;
  project_name: string;
  mode?: "quantity_only" | "cost_buildout";
}

interface FixtureInput {
  project: FixtureProject;
  source_document: {
    source_document_id: string;
    file_name: string;
    drive_file_id?: string;
  };
  sheets: Array<{ sheet_number: string; sheet_title?: string }>;
  runs: Array<{
    run_id: string;
    source_sheet_id: string;
    from_structure: string;
    to_structure: string;
    length_lf: number;
    diameter_in: number;
    material_type: string;
    slope_percent?: number;
    upstream_depth_ft?: number;
    downstream_depth_ft?: number;
    confidence?: number;
  }>;
  metadata?: Record<string, unknown>;
}

const builtModulePath = path.join(process.cwd(), "packages", "vs1a", "dist", "index.js");
const { buildVS1AResult } = await import(pathToFileURL(builtModulePath).href) as {
  buildVS1AResult: (input: FixtureInput) => {
    project: { project_instance_id: string };
    source_document: { source_document_id: string };
    drawing_sheets: unknown[];
    takeoff_items: Array<{ quantity: number; project_instance_id?: string }>;
  };
};

const fixturePath = path.join(process.cwd(), "tests", "fixtures", "vs1a", "promenade-runs.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as FixtureInput;
const result = buildVS1AResult(fixture);

console.log(JSON.stringify({
  project_instance_id: result.project.project_instance_id,
  source_document_id: result.source_document.source_document_id,
  drawing_sheet_count: result.drawing_sheets.length,
  takeoff_item_count: result.takeoff_items.length,
  total_lf: round2(result.takeoff_items.reduce((sum, item) => sum + item.quantity, 0)),
  data_layer_check: result.takeoff_items.every((item) => item.project_instance_id === result.project.project_instance_id)
}, null, 2));

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
