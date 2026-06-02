import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Minimal filesystem surface the executor depends on. Injectable so plans can be
 * executed against an in-memory fake in tests, or dry-run with no I/O at all.
 */
export interface FileSystem {
  exists(path: string): Promise<boolean>;
  readText(path: string): Promise<string>;
  writeText(path: string, contents: string): Promise<void>;
  remove(path: string): Promise<void>;
}

/** Real Node.js filesystem implementation. */
export const nodeFileSystem: FileSystem = {
  async exists(path) {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  },
  async readText(path) {
    return readFile(path, 'utf8');
  },
  async writeText(path, contents) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents, 'utf8');
  },
  async remove(path) {
    await rm(path, { force: true, recursive: true });
  },
};

/** A JSON-serializable value. */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function isPlainObject(value: unknown): value is Record<string, Json> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-merge `source` into `target`, returning a new object. Plain objects merge
 * key-by-key; arrays and scalars from `source` replace those in `target`.
 */
export function deepMerge<T extends Record<string, Json>>(
  target: T,
  source: Record<string, Json>,
): T {
  const out: Record<string, Json> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = out[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      out[key] = deepMerge(existing, value);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

/** Stringify JSON with 2-space indentation and a trailing newline. */
export function stringifyJson(value: Json): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
