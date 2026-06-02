import { type Action, SolvraeError, type UiFamily } from '@solvrae/core';
import { planReactUiPackage } from './react';
import type { UiTemplateOptions } from './shared';
import { planSvelteUiPackage } from './svelte';
import { planVueUiPackage } from './vue';

export { planThemePackage } from './theme';
export { FAMILIES, uiPackageName, type FamilyInfo } from './families';
export type { UiTemplateOptions } from './shared';

/** Scaffold the component-only UI package for a family (theme is separate). */
export function planUiPackage(family: UiFamily, opts: UiTemplateOptions): Action[] {
  switch (family) {
    case 'react':
      return planReactUiPackage(opts);
    case 'vue':
      return planVueUiPackage(opts);
    case 'svelte':
      return planSvelteUiPackage(opts);
    case 'solid':
      throw new SolvraeError(
        'NOT_IMPLEMENTED',
        `UI family "${family}" is not supported yet (Solid is planned for a later release).`,
      );
  }
}
