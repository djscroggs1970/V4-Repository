import fs from "node:fs";
import path from "node:path";

const requiredRuleFields = [
  "rule_id",
  "rule_version",
  "work_type",
  "material_type",
  "diameter_in",
  "depth_class",
  "production_uom",
  "units_per_day",
  "validation_status"
];

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function validateRules(filePath: string): string[] {
  const data = readJson(filePath) as { rules?: Record<string, unknown>[] };
  const errors: string[] = [];
  if (!Array.isArray(data.rules)) return [`${filePath}: missing rules array`];

  data.rules.forEach((rule, index) => {
    for (const field of requiredRuleFields) {
      if (!(field in rule)) errors.push(`${filePath}: rule ${index} missing ${field}`);
    }
    if (typeof rule.units_per_day === "number" && rule.units_per_day <= 0) {
      errors.push(`${filePath}: rule ${index} units_per_day must be positive`);
    }
  });
  return errors;
}

const target = path.join(process.cwd(), "rules", "production", "pipe-installation", "pvc-gravity-sewer.json");
const errors = fs.existsSync(target) ? validateRules(target) : [`Missing ${target}`];

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("rule validation ok");
