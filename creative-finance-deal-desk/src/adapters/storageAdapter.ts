import * as fs from "fs";
import * as path from "path";
import { config } from "../config";
import { logger } from "../lib/logger";

/**
 * Simple filesystem storage adapter. Used to save closer packets and JSON
 * archives. In production, swap for S3 / GCS / Azure blob by replacing the
 * implementation via `setStorageBackend(...)`.
 */

export interface StorageBackend {
  save(filename: string, content: string): Promise<string>;
}

class FileSystemBackend implements StorageBackend {
  async save(filename: string, content: string): Promise<string> {
    const root = path.resolve(config.storage.path);
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
    const full = path.join(root, filename);
    fs.writeFileSync(full, content, "utf-8");
    return full;
  }
}

let backend: StorageBackend = new FileSystemBackend();

export function setStorageBackend(impl: StorageBackend): void {
  backend = impl;
}

export async function saveCloserPacket(
  filename: string,
  content: string
): Promise<string> {
  const safeName = filename.endsWith(".md") ? filename : `${filename}.md`;
  const full = await backend.save(safeName, content);
  logger.info("storage.saveCloserPacket", { path: full });
  return full;
}

export async function saveJsonArchive(
  filename: string,
  content: unknown
): Promise<string> {
  const safeName = filename.endsWith(".json") ? filename : `${filename}.json`;
  const full = await backend.save(safeName, JSON.stringify(content, null, 2));
  logger.info("storage.saveJsonArchive", { path: full });
  return full;
}
