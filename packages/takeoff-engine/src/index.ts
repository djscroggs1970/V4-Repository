import type { DepthClass } from "@v4/domain";

export interface DepthBucketAllocation {
  depth_class: DepthClass;
  length_lf: number;
}

export function allocateRunToDepthBuckets(input: {
  length_lf: number;
  start_depth_ft: number;
  end_depth_ft: number;
}): DepthBucketAllocation[] {
  const buckets: Record<DepthClass, number> = {
    A_0_5: 0,
    B_5_8: 0,
    C_8_10: 0,
    D_10_12: 0,
    E_OVER_12: 0
  };

  const steps = Math.max(1, Math.ceil(input.length_lf));
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps;
    const depth = input.start_depth_ft + (input.end_depth_ft - input.start_depth_ft) * t;
    const cls = depthClass(depth);
    buckets[cls] += input.length_lf / steps;
  }

  return Object.entries(buckets)
    .filter(([, length]) => length > 0)
    .map(([depth_class, length_lf]) => ({ depth_class: depth_class as DepthClass, length_lf: round2(length_lf) }));
}

function depthClass(depthFt: number): DepthClass {
  if (depthFt <= 5) return "A_0_5";
  if (depthFt <= 8) return "B_5_8";
  if (depthFt <= 10) return "C_8_10";
  if (depthFt <= 12) return "D_10_12";
  return "E_OVER_12";
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
