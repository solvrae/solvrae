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

describe('adapter-tanstack-start', () => {
  it('is a React-family adapter (reuses ui-react)', () => {
    expect(adapter.id).toBe('tanstack-start');
    expect(adapter.family).toBe('react');
  });

  it('plans a TanStack Start app scaffold', async () => {
    const actions = await adapter.planApp(ctx, { name: 'app', scope: '@repo', typescript: true });
    const paths = actions.flatMap((a) => (a.kind === 'writeFile' ? [a.path] : []));
    expect(paths).toContain('/repo/apps/app/vite.config.ts');
    expect(paths).toContain('/repo/apps/app/src/routes/__root.tsx');
    expect(paths).toContain('/repo/apps/app/src/routes/index.tsx');
  });

  it('wires to the shared theme and ui-react', async () => {
    const actions = await adapter.planWiring(ctx, {
      appName: 'app',
      scope: '@repo',
      uiPackage: 'ui-react',
    });
    const [dep] = actions;
    if (dep?.kind === 'addDependency') {
      expect(dep.deps.map((d) => d.name)).toEqual(['@repo/ui-theme', '@repo/ui-react']);
    }
  });
});
