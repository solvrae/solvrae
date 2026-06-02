import { type FileSystem, PreconditionError } from '@solvrae/core';
import { describe, expect, it } from 'vitest';
import { planAddTemplate } from './add-template';

function memFs(files: Record<string, string>, dirs: string[] = []): FileSystem {
  return {
    exists: (p) => Promise.resolve(p in files || dirs.includes(p)),
    readText: (p) =>
      p in files ? Promise.resolve(files[p] as string) : Promise.reject(new Error('ENOENT')),
    writeText: () => Promise.resolve(),
    remove: () => Promise.resolve(),
  };
}

const repoRoot = '/repo';
const THEME = '/repo/packages/ui-theme/package.json';
const UI_REACT = '/repo/packages/ui-react/package.json';

function writePaths(result: { plan: { actions: { kind: string; path?: string }[] } }): string[] {
  return result.plan.actions.flatMap((a) => (a.kind === 'writeFile' && a.path ? [a.path] : []));
}

describe('planAddTemplate', () => {
  it('reuses an existing ui-react package (no re-scaffold)', async () => {
    const fs = memFs({ [THEME]: '{"name":"@repo/ui-theme"}', [UI_REACT]: '{}' });
    const result = await planAddTemplate({
      repoRoot,
      templateId: 'vite-react',
      packageManager: 'pnpm',
      install: false,
      fs,
    });
    expect(result.reusedUi).toBe(true);
    const paths = writePaths(result);
    expect(paths.some((p) => p.startsWith('/repo/packages/ui-react/'))).toBe(false);
    expect(paths).toContain('/repo/apps/vite-react/vite.config.ts');
  });

  it('creates the ui package when the family is absent', async () => {
    const fs = memFs({ [THEME]: '{"name":"@repo/ui-theme"}' });
    const result = await planAddTemplate({
      repoRoot,
      templateId: 'vite-react',
      packageManager: 'pnpm',
      install: false,
      fs,
    });
    expect(result.reusedUi).toBe(false);
    expect(writePaths(result)).toContain('/repo/packages/ui-react/src/components/button.tsx');
  });

  it('infers the scope from the existing theme', async () => {
    const fs = memFs({ [THEME]: '{"name":"@acme/ui-theme"}', [UI_REACT]: '{}' });
    const result = await planAddTemplate({
      repoRoot,
      templateId: 'vite-react',
      packageManager: 'pnpm',
      install: false,
      fs,
    });
    const dep = result.plan.actions.find((a) => a.kind === 'addDependency');
    if (dep?.kind === 'addDependency') {
      expect(dep.deps[0]?.name).toBe('@acme/ui-theme');
    }
  });

  it('refuses when the target app already exists', async () => {
    const fs = memFs({ [THEME]: '{"name":"@repo/ui-theme"}' }, ['/repo/apps/vite-react']);
    await expect(
      planAddTemplate({
        repoRoot,
        templateId: 'vite-react',
        packageManager: 'pnpm',
        install: false,
        fs,
      }),
    ).rejects.toBeInstanceOf(PreconditionError);
  });
});
