import { FRAMEWORK_VERSION } from "@v4/config";

export interface WorkerJobResult {
  ok: boolean;
  framework_version: string;
  job_type: string;
}

export function runPlaceholderJob(job_type: string): WorkerJobResult {
  return { ok: true, framework_version: FRAMEWORK_VERSION, job_type };
}
