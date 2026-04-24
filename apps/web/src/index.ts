import { FRAMEWORK_VERSION, PHASE_1_WORK_TYPE } from "@v4/config";

export function renderShell(): string {
  return `V4 ${FRAMEWORK_VERSION} ${PHASE_1_WORK_TYPE}`;
}
