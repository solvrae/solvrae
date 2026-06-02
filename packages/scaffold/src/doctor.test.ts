import type { FileSystem } from '@solvrae/core';
import { describe, expect, it } from 'vitest';
import { collectDiagnostics } from './doctor';

function memFs(files: Record<string, string>): FileSystem {
  return {
    exists: (p) => Promise.resolve(p in files),
    readText: (p) =>
      p in files ? Promise.resolve(files[p] as string) : Promise.reject(new Error('ENOENT')),
    writeText: () => Promise.resolve(),
    remove: () => Promise.resolve(),
  };
}

const THEME = '/repo/packages/ui-theme/package.json';

describe('collectDiagnostics', () => {
  it('is clean for a correctly wired repo', async () => {
    const fs = memFs({
      [THEME]: '{"name":"@repo/ui-theme"}',
      '/repo/packages/ui-react/components.json': JSON.stringify({
        tailwind: { css: '../ui-theme/src/styles.css' },
      }),
      '/repo/apps/web/package.json': JSON.stringify({
        dependencies: { '@repo/ui-react': 'workspace:*', '@repo/ui-theme': 'workspace:*' },
      }),
    });
    const diags = await collectDiagnostics({
      repoRoot: '/repo',
      scope: '@repo',
      families: ['react'],
      apps: ['web'],
      fs,
    });
    expect(diags).toHaveLength(0);
  });

  it('flags a missing shared theme', async () => {
    const diags = await collectDiagnostics({
      repoRoot: '/repo',
      scope: '@repo',
      families: [],
      apps: [],
      fs: memFs({}),
    });
    expect(diags.some((d) => d.level === 'error')).toBe(true);
  });

  it('flags + offers a fix for components.json css drift', async () => {
    const fs = memFs({
      [THEME]: '{}',
      '/repo/packages/ui-vue/components.json': JSON.stringify({
        tailwind: { css: 'wrong.css', baseColor: 'neutral' },
      }),
    });
    const diags = await collectDiagnostics({
      repoRoot: '/repo',
      scope: '@repo',
      families: ['vue'],
      apps: [],
      fs,
    });
    const drift = diags.find((d) => d.message.includes('components.json'));
    expect(drift?.fix?.kind).toBe('mergeJson');
  });

  it('flags + offers a fix for an app missing ui-theme', async () => {
    const fs = memFs({
      [THEME]: '{}',
      '/repo/apps/web/package.json': JSON.stringify({
        dependencies: { '@repo/ui-react': 'workspace:*' },
      }),
    });
    const diags = await collectDiagnostics({
      repoRoot: '/repo',
      scope: '@repo',
      families: ['react'],
      apps: ['web'],
      fs,
    });
    const missing = diags.find((d) => d.message.includes('missing'));
    expect(missing?.fix?.kind).toBe('addDependency');
  });
});
