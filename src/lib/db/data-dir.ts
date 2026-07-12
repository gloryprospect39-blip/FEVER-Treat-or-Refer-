import "server-only";

import fs from "fs";
import os from "os";
import path from "path";

let cached: string | null = null;

/**
 * Resolves a writable directory for local data files.
 *
 * Prefers `./data` (persists on hosts with a real disk, e.g. Render/Railway or
 * a local machine). Falls back to the OS temp dir on read-only serverless
 * filesystems (e.g. Vercel) so writes never crash the app — data there is
 * ephemeral. Override with the FEVERGATE_DATA_DIR env var.
 */
export function dataDir(): string {
  if (cached) return cached;

  const candidates = [
    process.env.FEVERGATE_DATA_DIR,
    path.join(process.cwd(), "data"),
    path.join(os.tmpdir(), "fevergate"),
  ].filter((c): c is string => Boolean(c));

  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      cached = dir;
      return dir;
    } catch {
      // Directory not writable — try the next candidate.
    }
  }

  cached = path.join(os.tmpdir(), "fevergate");
  return cached;
}
