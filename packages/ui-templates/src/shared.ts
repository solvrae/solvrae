import { join } from 'node:path';
import { type Action, writeFile } from '@solvrae/core';

/** Options shared by every UI-package template generator. */
export interface UiTemplateOptions {
  /** Absolute monorepo root. */
  repoRoot: string;
  /** Internal package scope, e.g. `@repo`. */
  scope: string;
}

/** Build a `writeFile` action for a path relative to the repo root. */
export function file(repoRoot: string, relativePath: string, contents: string): Action {
  return writeFile(join(repoRoot, relativePath), contents, 'overwrite');
}

/** Pretty-print a value as JSON with a trailing newline. */
export function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
