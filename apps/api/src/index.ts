import { FRAMEWORK_VERSION, PHASE_1_WORK_TYPE } from "@v4/config";

export interface HealthResponse {
  ok: true;
  framework_version: string;
  phase_1_work_type: string;
}

export function health(): HealthResponse {
  return {
    ok: true,
    framework_version: FRAMEWORK_VERSION,
    phase_1_work_type: PHASE_1_WORK_TYPE
  };
}
