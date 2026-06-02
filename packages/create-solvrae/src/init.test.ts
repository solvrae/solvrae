import { SolvraeError } from '@solvrae/core';
import { describe, expect, it } from 'vitest';
import { availableTemplates, planInit, resolveAdapter } from './init';

const base = {
  repoRoot: '/repo',
  projectName: 'demo',
  appName: 'web',
  scope: '@repo',
  packageManager: 'pnpm' as const,
  templateId: 'next',
};

describe('resolveAdapter', () => {
  it('resolves the next adapter', () => {
    expect(resolveAdapter('next').id).toBe('next');
  });

  it('throws on unknown template', () => {
    expect(() => resolveAdapter('angular')).toThrow(SolvraeError);
  });

  it('lists available templates', () => {
    expect(availableTemplates()).toContain('next');
  });
});

describe('planInit', () => {
  it('composes base + theme + ui + app + wiring, ending with install', () => {
    const plan = planInit({ ...base, install: true });
    const paths = plan.actions.flatMap((a) => (a.kind === 'writeFile' ? [a.path] : []));

    expect(paths).toContain('/repo/package.json'); // base repo
    expect(paths).toContain('/repo/pnpm-workspace.yaml'); // pnpm workspace
    expect(paths).toContain('/repo/packages/ui-theme/src/styles.css'); // theme
    expect(paths).toContain('/repo/packages/ui-react/src/components/button.tsx'); // ui
    expect(paths).toContain('/repo/apps/web/app/page.tsx'); // app

    const last = plan.actions.at(-1);
    expect(last?.kind).toBe('runCommand');
  });

  it('uses the workspaces field for non-pnpm managers', () => {
    const plan = planInit({ ...base, packageManager: 'npm', install: false });
    const paths = plan.actions.flatMap((a) => (a.kind === 'writeFile' ? [a.path] : []));
    expect(paths).not.toContain('/repo/pnpm-workspace.yaml');
    expect(plan.actions.some((a) => a.kind === 'runCommand')).toBe(false);
  });
});
