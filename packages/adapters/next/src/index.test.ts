import { type AdapterContext, createMemoryLogger } from '@solvrae/core';
import { describe, expect, it } from 'vitest';
import adapter from './index';

const ctx: AdapterContext = {
  repoRoot: '/repo',
  run: {
    cwd: '/repo',
    repoRoot: '/repo',
    packageManager: 'pnpm',
    scope: '@repo',
    dryRun: false,
    logger: createMemoryLogger(),
  },
};

describe('adapter-next', () => {
  it('declares the react family', () => {
    expect(adapter.id).toBe('next');
    expect(adapter.family).toBe('react');
  });

  it('plans an app scaffold with the key files', () => {
    const actions = adapter.planApp(ctx, { name: 'web', scope: '@repo', typescript: true });
    const paths = actions.flatMap((a) => (a.kind === 'writeFile' ? [a.path] : []));
    expect(paths).toContain('/repo/apps/web/package.json');
    expect(paths).toContain('/repo/apps/web/next.config.ts');
    expect(paths).toContain('/repo/apps/web/app/page.tsx');
    expect(paths).toContain('/repo/apps/web/app/globals.css');
  });

  it('wires the app to ui-theme and the ui package', () => {
    const actions = adapter.planWiring(ctx, {
      appName: 'web',
      scope: '@repo',
      uiPackage: 'ui-react',
    });
    expect(actions).toHaveLength(1);
    const [dep] = actions;
    expect(dep?.kind).toBe('addDependency');
    if (dep?.kind === 'addDependency') {
      expect(dep.deps.map((d) => d.name)).toEqual(['@repo/ui-theme', '@repo/ui-react']);
      expect(dep.packageJsonPath).toBe('/repo/apps/web/package.json');
    }
  });
});
