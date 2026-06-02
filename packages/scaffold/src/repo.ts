import { join } from 'node:path';
import { type FileSystem, type UiFamily, nodeFileSystem } from '@solvrae/core';

const FAMILIES: UiFamily[] = ['react', 'vue', 'svelte', 'solid'];

/** Infer the internal package scope from the existing shared theme package. */
export async function inferScope(
  repoRoot: string,
  fs: FileSystem = nodeFileSystem,
): Promise<string> {
  try {
    const raw = await fs.readText(join(repoRoot, 'packages/ui-theme/package.json'));
    const name = (JSON.parse(raw) as { name?: string }).name;
    if (name?.startsWith('@')) {
      const scope = name.split('/')[0];
      if (scope) return scope;
    }
  } catch {
    // no theme yet, or unreadable — fall through
  }
  return '@repo';
}

export function hasUiPackage(
  repoRoot: string,
  uiPackage: string,
  fs: FileSystem = nodeFileSystem,
): Promise<boolean> {
  return fs.exists(join(repoRoot, 'packages', uiPackage, 'package.json'));
}

export function hasThemePackage(
  repoRoot: string,
  fs: FileSystem = nodeFileSystem,
): Promise<boolean> {
  return fs.exists(join(repoRoot, 'packages/ui-theme/package.json'));
}

export function appExists(
  repoRoot: string,
  appName: string,
  fs: FileSystem = nodeFileSystem,
): Promise<boolean> {
  return fs.exists(join(repoRoot, 'apps', appName));
}

/** UI families present in the repo (one `packages/ui-<family>` each). */
export async function presentUiFamilies(
  repoRoot: string,
  fs: FileSystem = nodeFileSystem,
): Promise<UiFamily[]> {
  const present: UiFamily[] = [];
  for (const family of FAMILIES) {
    if (await hasUiPackage(repoRoot, `ui-${family}`, fs)) present.push(family);
  }
  return present;
}
