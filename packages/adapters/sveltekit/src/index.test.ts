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

describe('adapter-sveltekit', () => {
  it('is a Svelte-family adapter (so it uses ui-svelte)', () => {
    expect(adapter.id).toBe('sveltekit');
    expect(adapter.family).toBe('svelte');
  });

  it('plans a SvelteKit app scaffold', async () => {
    const actions = await adapter.planApp(ctx, {
      name: 'web-svelte',
      scope: '@repo',
      typescript: true,
    });
    const paths = actions.flatMap((a) => (a.kind === 'writeFile' ? [a.path] : []));
    expect(paths).toContain('/repo/apps/web-svelte/svelte.config.js');
    expect(paths).toContain('/repo/apps/web-svelte/src/routes/+page.svelte');
    expect(paths).toContain('/repo/apps/web-svelte/src/app.css');
  });

  it('wires to the shared theme and ui-svelte', async () => {
    const actions = await adapter.planWiring(ctx, {
      appName: 'web-svelte',
      scope: '@repo',
      uiPackage: 'ui-svelte',
    });
    const [dep] = actions;
    if (dep?.kind === 'addDependency') {
      expect(dep.deps.map((d) => d.name)).toEqual(['@repo/ui-theme', '@repo/ui-svelte']);
    }
  });
});
