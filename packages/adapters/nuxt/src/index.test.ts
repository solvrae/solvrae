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

describe('adapter-nuxt', () => {
  it('is a Vue-family adapter (so it uses ui-vue)', () => {
    expect(adapter.id).toBe('nuxt');
    expect(adapter.family).toBe('vue');
  });

  it('plans a Nuxt app scaffold', async () => {
    const actions = await adapter.planApp(ctx, {
      name: 'web-nuxt',
      scope: '@repo',
      typescript: true,
    });
    const paths = actions.flatMap((a) => (a.kind === 'writeFile' ? [a.path] : []));
    expect(paths).toContain('/repo/apps/web-nuxt/nuxt.config.ts');
    expect(paths).toContain('/repo/apps/web-nuxt/app/app.vue');
    expect(paths).toContain('/repo/apps/web-nuxt/app/assets/css/main.css');
  });

  it('wires to the shared theme and ui-vue', async () => {
    const actions = await adapter.planWiring(ctx, {
      appName: 'web-nuxt',
      scope: '@repo',
      uiPackage: 'ui-vue',
    });
    const [dep] = actions;
    if (dep?.kind === 'addDependency') {
      expect(dep.deps.map((d) => d.name)).toEqual(['@repo/ui-theme', '@repo/ui-vue']);
    }
  });
});
