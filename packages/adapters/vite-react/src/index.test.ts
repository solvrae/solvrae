import { type AdapterContext, createMemoryLogger, offlineResolver } from '@solvrae/core';
import { describe, expect, it } from 'vitest';
import adapter from './index';

const ctx: AdapterContext = {
  repoRoot: '/repo',
  versions: offlineResolver,
  run: {
    cwd: '/repo',
    repoRoot: '/repo',
    packageManager: 'pnpm',
    scope: '@repo',
    dryRun: false,
    logger: createMemoryLogger(),
  },
};

describe('adapter-vite-react', () => {
  it('is a React-family adapter (so it reuses ui-react)', () => {
    expect(adapter.id).toBe('vite-react');
    expect(adapter.family).toBe('react');
  });

  it('plans a Vite app scaffold', async () => {
    const actions = await adapter.planApp(ctx, {
      name: 'dashboard',
      scope: '@repo',
      typescript: true,
    });
    const paths = actions.flatMap((a) => (a.kind === 'writeFile' ? [a.path] : []));
    expect(paths).toContain('/repo/apps/dashboard/vite.config.ts');
    expect(paths).toContain('/repo/apps/dashboard/index.html');
    expect(paths).toContain('/repo/apps/dashboard/src/App.tsx');
  });

  it('wires to the shared theme and ui-react', async () => {
    const actions = await adapter.planWiring(ctx, {
      appName: 'dashboard',
      scope: '@repo',
      uiPackage: 'ui-react',
    });
    const [dep] = actions;
    if (dep?.kind === 'addDependency') {
      expect(dep.deps.map((d) => d.name)).toEqual(['@repo/ui-theme', '@repo/ui-react']);
    }
  });
});
