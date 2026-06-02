import { dirname, join } from 'node:path';
import { type FileSystem, nodeFileSystem } from './fs';
import { detectPackageManager } from './pm';
import { createConsoleLogger } from './reporter';
import type { Logger, PackageManager } from './types';

/** Files that mark the root of a Turborepo / Solvrae workspace. */
const REPO_MARKERS = ['pnpm-workspace.yaml', 'turbo.json'] as const;

/** Resolved environment for a single command invocation. */
export interface RunContext {
  /** Directory the command was invoked from. */
  cwd: string;
  /** Monorepo root, or `null` when not inside one. */
  repoRoot: string | null;
  packageManager: PackageManager;
  /** Internal package scope, e.g. `@repo`. */
  scope: string;
  dryRun: boolean;
  logger: Logger;
}

export interface CreateContextOptions {
  cwd?: string;
  packageManager?: PackageManager;
  scope?: string;
  dryRun?: boolean;
  logger?: Logger;
  fs?: FileSystem;
}

/** Walk up from `start` looking for a repo marker; return the root or `null`. */
export async function findRepoRoot(start: string, fs: FileSystem): Promise<string | null> {
  let dir = start;
  // Stop when `dirname` no longer changes (filesystem root reached).
  for (;;) {
    for (const marker of REPO_MARKERS) {
      if (await fs.exists(join(dir, marker))) return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Resolve a {@link RunContext}, detecting the repo root and package manager. */
export async function createContext(options: CreateContextOptions = {}): Promise<RunContext> {
  const fs = options.fs ?? nodeFileSystem;
  const cwd = options.cwd ?? process.cwd();
  const repoRoot = await findRepoRoot(cwd, fs);
  const packageManager =
    options.packageManager ?? (await detectPackageManager(repoRoot ?? cwd, { fs }));

  return {
    cwd,
    repoRoot,
    packageManager,
    scope: options.scope ?? '@repo',
    dryRun: options.dryRun ?? false,
    logger: options.logger ?? createConsoleLogger(),
  };
}
