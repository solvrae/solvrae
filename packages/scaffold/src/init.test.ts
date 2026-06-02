import { SolvraeError } from '@solvrae/core';
import { describe, expect, it } from 'vitest';
import { availableTemplates, resolveAdapter } from './adapters';
import { planInit } from './init';

const base = {
  repoRoot: '/repo',
  projectName: 'demo',
  appName: 'web',
  scope: '@repo',
  packageManager: 'pnpm' as const,
  templateId: 'next',
};

describe('adapters', () => {
  it('resolves built-in templates', () => {
    expect(resolveAdapter('next').id).toBe('next');
    expect(resolveAdapter('vite-react').family).toBe('react');
  });

  it('lists available templates', () => {
    expect(availableTemplates()).toEqual(expect.arrayContaining(['next', 'vite-react']));
  });

  it('throws on unknown template', () => {
    expect(() => resolveAdapter('angular')).toThrow(SolvraeError);
  });
});

describe('planInit', () => {
  it('composes base + theme + ui + app + wiring, ending with install', async () => {
    const plan = await planInit({ ...base, install: true });
    const paths = plan.actions.flatMap((a) => (a.kind === 'writeFile' ? [a.path] : []));
    expect(paths).toContain('/repo/package.json');
    expect(paths).toContain('/repo/pnpm-workspace.yaml');
    expect(paths).toContain('/repo/packages/ui-theme/src/styles.css');
    expect(paths).toContain('/repo/packages/ui-react/src/components/button.tsx');
    expect(paths).toContain('/repo/apps/web/app/page.tsx');
    expect(plan.actions.at(-1)?.kind).toBe('runCommand');
  });

  it('uses the workspaces field for non-pnpm managers', async () => {
    const plan = await planInit({ ...base, packageManager: 'npm', install: false });
    const paths = plan.actions.flatMap((a) => (a.kind === 'writeFile' ? [a.path] : []));
    expect(paths).not.toContain('/repo/pnpm-workspace.yaml');
    expect(plan.actions.some((a) => a.kind === 'runCommand')).toBe(false);
  });
});
