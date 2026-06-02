import { join } from 'node:path';
import { type FileSystem, nodeFileSystem } from './fs';
import type { Dependency, PackageManager } from './types';

const LOCKFILES: ReadonlyArray<readonly [file: string, pm: PackageManager]> = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['bun.lockb', 'bun'],
  ['bun.lock', 'bun'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
  ['npm-shrinkwrap.json', 'npm'],
];

const PM_NAMES: ReadonlyArray<PackageManager> = ['pnpm', 'npm', 'yarn', 'bun'];

function parsePackageManagerField(value: unknown): PackageManager | undefined {
  if (typeof value !== 'string') return undefined;
  const name = value.split('@', 1)[0];
  return PM_NAMES.find((pm) => pm === name);
}

/**
 * Detect the package manager for `cwd`: a lockfile wins, then the
 * `packageManager` field of package.json, otherwise the `fallback` (default
 * `pnpm`). Filesystem is injectable for testing.
 */
export async function detectPackageManager(
  cwd: string,
  options: { fs?: FileSystem; fallback?: PackageManager } = {},
): Promise<PackageManager> {
  const fs = options.fs ?? nodeFileSystem;

  for (const [file, pm] of LOCKFILES) {
    if (await fs.exists(join(cwd, file))) return pm;
  }

  const pkgPath = join(cwd, 'package.json');
  if (await fs.exists(pkgPath)) {
    try {
      const pkg = JSON.parse(await fs.readText(pkgPath)) as { packageManager?: unknown };
      const fromField = parsePackageManagerField(pkg.packageManager);
      if (fromField) return fromField;
    } catch {
      // ignore malformed package.json; fall through to fallback
    }
  }

  return options.fallback ?? 'pnpm';
}

/** A resolved command: a binary name and its arguments. */
export interface PmCommand {
  command: string;
  args: string[];
}

/** Build the command that installs all dependencies. */
export function installCommand(pm: PackageManager): PmCommand {
  return { command: pm, args: ['install'] };
}

/** Build the command that adds the given dependencies to the current package. */
export function addCommand(pm: PackageManager, deps: Dependency[], dev = false): PmCommand {
  const specs = deps.map((d) => (d.version ? `${d.name}@${d.version}` : d.name));
  switch (pm) {
    case 'pnpm':
      return { command: 'pnpm', args: ['add', ...(dev ? ['-D'] : []), ...specs] };
    case 'yarn':
      return { command: 'yarn', args: ['add', ...(dev ? ['-D'] : []), ...specs] };
    case 'bun':
      return { command: 'bun', args: ['add', ...(dev ? ['-d'] : []), ...specs] };
    case 'npm':
      return { command: 'npm', args: ['install', ...(dev ? ['--save-dev'] : []), ...specs] };
  }
}

/** Build the command that runs a package binary without installing it (dlx/npx). */
export function dlxCommand(pm: PackageManager, pkg: string, args: string[] = []): PmCommand {
  switch (pm) {
    case 'pnpm':
      return { command: 'pnpm', args: ['dlx', pkg, ...args] };
    case 'yarn':
      return { command: 'yarn', args: ['dlx', pkg, ...args] };
    case 'bun':
      return { command: 'bunx', args: [pkg, ...args] };
    case 'npm':
      return { command: 'npx', args: ['--yes', pkg, ...args] };
  }
}
