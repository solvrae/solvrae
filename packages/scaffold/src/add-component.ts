import { join } from 'node:path';
import { type PackageManager, type UiFamily, dlxCommand } from '@solvrae/core';
import { uiPackageName } from '@solvrae/ui-templates';

/**
 * Per-family official shadcn CLI. Component installation is the one place Solvrae
 * delegates to the upstream CLI (see docs/11): re-implementing each registry's
 * dependency resolver would be the brittle path. Solvrae owns the uniform UX
 * (family detection, multiselect, partial-availability tolerance); the CLI owns
 * the registry fetch + resolution.
 */
export const REGISTRY_CLI: Record<UiFamily, string> = {
  react: 'shadcn',
  vue: 'shadcn-vue',
  svelte: 'shadcn-svelte',
  solid: 'shadcn-svelte',
};

export interface ComponentTask {
  family: UiFamily;
  /** UI package the components land in, e.g. `ui-react`. */
  uiPackage: string;
  /** Resolved command + args (a `<pm> dlx <cli> add …`). */
  command: string;
  args: string[];
}

export interface AddComponentOptions {
  repoRoot: string;
  components: string[];
  /** Families to target (already resolved by the CLI layer). */
  families: UiFamily[];
  packageManager: PackageManager;
  overwrite?: boolean;
}

/**
 * Build one task per target family: a non-interactive invocation of that family's
 * shadcn CLI, pointed (`--cwd`) at its UI package so components land inside it and
 * any token additions go to the shared theme referenced by its components.json.
 */
export function planComponentTasks(opts: AddComponentOptions): ComponentTask[] {
  const { repoRoot, components, families, packageManager, overwrite } = opts;
  return families.map((family) => {
    const uiPackage = uiPackageName(family);
    const dir = join(repoRoot, 'packages', uiPackage);
    const addArgs = [
      'add',
      ...components,
      '--cwd',
      dir,
      '--yes',
      ...(overwrite ? ['--overwrite'] : []),
    ];
    const { command, args } = dlxCommand(packageManager, `${REGISTRY_CLI[family]}@latest`, addArgs);
    return { family, uiPackage, command, args };
  });
}
