import type { QuantityExportObject } from "./quantity-export.js";

export interface QuantityExportPersistenceInput {
  export_object: QuantityExportObject;
  storage_root_uri: string;
  persisted_at?: string;
}

export interface QuantityExportPersistenceRecord {
  persistence_id: string;
  project_instance_id: string;
  export_id: string;
  export_type: "quantity_only";
  storage_root_uri: string;
  storage_path: string;
  content_type: "application/json";
  persisted_at: string;
  framework_version: string;
  source_document_id: string;
  source_takeoff_item_ids: string[];
}

export function buildQuantityExportPersistenceRecord(input: QuantityExportPersistenceInput): QuantityExportPersistenceRecord {
  assertStorageRoot(input.storage_root_uri);
  const persistedAt = input.persisted_at ?? new Date().toISOString();
  const storagePath = createStoragePath(input.export_object);

  return {
    persistence_id: createPersistenceId(input.export_object.export_id, persistedAt),
    project_instance_id: input.export_object.project_instance_id,
    export_id: input.export_object.export_id,
    export_type: input.export_object.export_type,
    storage_root_uri: input.storage_root_uri,
    storage_path: storagePath,
    content_type: "application/json",
    persisted_at: persistedAt,
    framework_version: input.export_object.framework_version,
    source_document_id: input.export_object.source_document_id,
    source_takeoff_item_ids: [...input.export_object.source_takeoff_item_ids]
  };
}

function createStoragePath(exportObject: QuantityExportObject): string {
  return [
    "project-instances",
    exportObject.project_instance_id,
    "exports",
    "quantity-only",
    `${exportObject.export_id}.json`
  ].join("/");
}

function createPersistenceId(exportId: string, persistedAt: string): string {
  const stamp = persistedAt.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  return `PERSIST_${exportId}_${stamp}`;
}

function assertStorageRoot(storageRootUri: string): void {
  if (!storageRootUri.trim()) {
    throw new Error("storage_root_uri_required");
  }
}
