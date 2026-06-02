import type { UiFamily } from '@solvrae/core';

export interface FamilyInfo {
  displayName: string;
  /** shadcn registry that serves this family. */
  registry: string;
}

/** Static metadata per UI family. */
export const FAMILIES: Record<UiFamily, FamilyInfo> = {
  react: { displayName: 'React', registry: 'shadcn/ui' },
  vue: { displayName: 'Vue', registry: 'shadcn-vue' },
  svelte: { displayName: 'Svelte', registry: 'shadcn-svelte' },
  solid: { displayName: 'Solid', registry: 'shadcn-svelte' },
};

/** The conventional package directory/name for a family's UI package. */
export function uiPackageName(family: UiFamily): string {
  return `ui-${family}`;
}
