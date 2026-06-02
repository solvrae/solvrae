import { SolvraeError } from '@solvrae/core';
import { describe, expect, it } from 'vitest';
import { uiPackageName } from './families';
import { planUiPackage } from './index';
import { planThemePackage } from './theme';

function writePaths(actions: ReturnType<typeof planThemePackage>): string[] {
  return actions.flatMap((a) => (a.kind === 'writeFile' ? [a.path] : []));
}

describe('uiPackageName', () => {
  it('keys by family', () => {
    expect(uiPackageName('react')).toBe('ui-react');
    expect(uiPackageName('vue')).toBe('ui-vue');
  });
});

describe('planThemePackage', () => {
  it('scaffolds the shared theme package', () => {
    const paths = writePaths(planThemePackage({ repoRoot: '/repo', scope: '@repo' }));
    expect(paths).toContain('/repo/packages/ui-theme/package.json');
    expect(paths).toContain('/repo/packages/ui-theme/src/styles.css');
  });
});

describe('planUiPackage', () => {
  it('scaffolds a component-only react package', () => {
    const actions = planUiPackage('react', { repoRoot: '/repo', scope: '@repo' });
    const paths = writePaths(actions);
    expect(paths).toContain('/repo/packages/ui-react/components.json');
    expect(paths).toContain('/repo/packages/ui-react/src/lib/utils.ts');
    expect(paths).toContain('/repo/packages/ui-react/src/components/button.tsx');
    // theme is separate — the ui package must not own styles.css
    expect(paths.some((p) => p.endsWith('styles.css'))).toBe(false);
  });

  it('throws for families not yet implemented', () => {
    expect(() => planUiPackage('vue', { repoRoot: '/repo', scope: '@repo' })).toThrow(SolvraeError);
  });
});
