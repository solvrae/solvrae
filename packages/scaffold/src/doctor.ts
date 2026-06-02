import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  type Diagnostic,
  type FileSystem,
  type UiFamily,
  addDependency,
  mergeJson,
  nodeFileSystem,
} from '@solvrae/core';
import { uiPackageName } from '@solvrae/ui-templates';
import { inferScope, presentUiFamilies } from './repo';

/** Where a UI package's components.json must point its `tailwind.css`. */
const THEME_CSS = '../ui-theme/src/styles.css';

const UI_DEP_RE = /\/ui-(react|vue|svelte|solid)$/;

export interface DoctorReport {
  repoRoot: string;
  scope: string;
  apps: string[];
  families: UiFamily[];
  diagnostics: Diagnostic[];
}

interface PackageJson {
  dependencies?: Record<string, string>;
  tailwind?: { css?: string };
}

async function readJson(fs: FileSystem, path: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await fs.readText(path)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export interface DiagnoseInput {
  repoRoot: string;
  scope: string;
  families: UiFamily[];
  apps: string[];
  fs: FileSystem;
}

/**
 * Pure-ish check pass: inspects known invariants and returns one {@link Diagnostic}
 * per problem (each carrying an optional `fix` Action). Reads via the injected
 * filesystem so it's unit-testable.
 */
export async function collectDiagnostics(input: DiagnoseInput): Promise<Diagnostic[]> {
  const { repoRoot, scope, families, apps, fs } = input;
  const diagnostics: Diagnostic[] = [];

  // 1. Shared theme must exist.
  if (!(await fs.exists(join(repoRoot, 'packages/ui-theme/package.json')))) {
    diagnostics.push({
      level: 'error',
      message: 'Shared theme packages/ui-theme is missing — add a template to create it.',
    });
  }

  // 2. Each UI package's components.json must point tailwind.css at the shared theme.
  for (const family of families) {
    const cjPath = join(repoRoot, 'packages', uiPackageName(family), 'components.json');
    const cj = (await readJson(fs, cjPath)) as PackageJson | null;
    if (!cj) continue;
    const css = cj.tailwind?.css;
    if (css !== THEME_CSS) {
      diagnostics.push({
        level: 'warn',
        message: `ui-${family}/components.json tailwind.css is "${css ?? 'unset'}" (expected "${THEME_CSS}").`,
        fix: mergeJson(cjPath, { tailwind: { css: THEME_CSS } }),
      });
    }
  }

  // 3. An app that consumes a ui-<family> package must also depend on the shared theme.
  for (const app of apps) {
    const pkgPath = join(repoRoot, 'apps', app, 'package.json');
    const pkg = (await readJson(fs, pkgPath)) as PackageJson | null;
    if (!pkg) continue;
    const deps = Object.keys(pkg.dependencies ?? {});
    const usesUi = deps.some((d) => UI_DEP_RE.test(d));
    const hasTheme = deps.some((d) => d.endsWith('/ui-theme'));
    if (usesUi && !hasTheme) {
      diagnostics.push({
        level: 'warn',
        message: `apps/${app} consumes a ui package but is missing ${scope}/ui-theme.`,
        fix: addDependency(pkgPath, [{ name: `${scope}/ui-theme`, version: 'workspace:*' }]),
      });
    }
  }

  return diagnostics;
}

async function listApps(repoRoot: string): Promise<string[]> {
  try {
    const entries = await readdir(join(repoRoot, 'apps'), { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

/** Gather repo facts and run the diagnostic checks. */
export async function runDoctorChecks(
  repoRoot: string,
  fs: FileSystem = nodeFileSystem,
): Promise<DoctorReport> {
  const [scope, families, apps] = await Promise.all([
    inferScope(repoRoot, fs),
    presentUiFamilies(repoRoot, fs),
    listApps(repoRoot),
  ]);
  const diagnostics = await collectDiagnostics({ repoRoot, scope, families, apps, fs });
  return { repoRoot, scope, apps, families, diagnostics };
}
