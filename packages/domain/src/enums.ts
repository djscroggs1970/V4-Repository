export const DATA_LAYERS = ["framework", "project", "sandbox"] as const;
export type DataLayer = (typeof DATA_LAYERS)[number];

export const SOURCE_ORIGINS = ["framework_seed", "project_upload", "sandbox_fixture", "promoted_change"] as const;
export type SourceOrigin = (typeof SOURCE_ORIGINS)[number];

export const REVIEW_STATUSES = ["pending", "approved", "rejected", "needs_review"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const TAKEOFF_MODES = ["quantity_only", "cost_buildout"] as const;
export type TakeoffMode = (typeof TAKEOFF_MODES)[number];

export const DEPTH_CLASSES = ["A_0_5", "B_5_8", "C_8_10", "D_10_12", "E_OVER_12"] as const;
export type DepthClass = (typeof DEPTH_CLASSES)[number];
