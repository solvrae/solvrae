import type { Json } from './fs';
import type { Dependency, PackageManager } from './types';

/** Policy when a `writeFile` target already exists. */
export type IfExists = 'overwrite' | 'skip' | 'error';

/** Write a file, creating parent directories. */
export interface WriteFileAction {
  kind: 'writeFile';
  path: string;
  contents: string;
  ifExists: IfExists;
}

/** Deep-merge a partial object into a JSON file (created if missing). */
export interface MergeJsonAction {
  kind: 'mergeJson';
  path: string;
  merge: Record<string, Json>;
}

/** Delete a file or directory (idempotent). */
export interface DeleteFileAction {
  kind: 'deleteFile';
  path: string;
}

/** Add dependencies to a package.json's `dependencies` or `devDependencies`. */
export interface AddDependencyAction {
  kind: 'addDependency';
  packageJsonPath: string;
  deps: Dependency[];
  dev: boolean;
}

/** Run a shell command (e.g. an install). No automatic rollback. */
export interface RunCommandAction {
  kind: 'runCommand';
  command: string;
  args: string[];
  /** Directory to run in; defaults to the execution cwd. */
  cwd?: string;
  /** Human label for reporting (e.g. "install dependencies"). */
  label: string;
}

/**
 * A declarative, serializable unit of work. Planners produce `Action[]`; the
 * executor applies them. Adding a new kind means updating this union and the
 * executor's switch — the compiler enforces exhaustiveness.
 */
export type Action =
  | WriteFileAction
  | MergeJsonAction
  | DeleteFileAction
  | AddDependencyAction
  | RunCommandAction;

/** An ordered, named list of actions — the output of a planner. */
export interface Plan {
  /** Short description of what this plan accomplishes. */
  summary: string;
  actions: Action[];
}

// ── Factory helpers (ergonomic, typed) ──────────────────────────────────────

export function writeFile(
  path: string,
  contents: string,
  ifExists: IfExists = 'error',
): WriteFileAction {
  return { kind: 'writeFile', path, contents, ifExists };
}

export function mergeJson(path: string, merge: Record<string, Json>): MergeJsonAction {
  return { kind: 'mergeJson', path, merge };
}

export function deleteFile(path: string): DeleteFileAction {
  return { kind: 'deleteFile', path };
}

export function addDependency(
  packageJsonPath: string,
  deps: Dependency[],
  dev = false,
): AddDependencyAction {
  return { kind: 'addDependency', packageJsonPath, deps, dev };
}

export function runCommand(
  command: string,
  args: string[],
  label: string,
  cwd?: string,
): RunCommandAction {
  return cwd === undefined
    ? { kind: 'runCommand', command, args, label }
    : { kind: 'runCommand', command, args, label, cwd };
}

/** Build a `runInstall`-style action for the given package manager. */
export function runInstall(pm: PackageManager, cwd?: string): RunCommandAction {
  return runCommand(pm, ['install'], `install dependencies (${pm})`, cwd);
}
