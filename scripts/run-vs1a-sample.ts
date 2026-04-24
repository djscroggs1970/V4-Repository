import fs from "node:fs";
import path from "node:path";
import { buildVS1AResult } from "@v4/vs1a";

type Fixture = Parameters<typeof buildVS1AResult>[0];

const fixturePath = path.join(process.cwd(), "tests", "fixtures", "vs1a", "promenade-runs.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Fixture & { metadata?: Record<string, unknown> };
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
