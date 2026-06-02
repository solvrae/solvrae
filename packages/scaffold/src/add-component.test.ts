import { describe, expect, it } from 'vitest';
import { planComponentTasks } from './add-component';

describe('planComponentTasks', () => {
  it('builds one dlx shadcn add command per family, pointed at the ui package', () => {
    const tasks = planComponentTasks({
      repoRoot: '/repo',
      components: ['button', 'card'],
      families: ['react', 'vue'],
      packageManager: 'pnpm',
    });
    expect(tasks).toHaveLength(2);

    const react = tasks.find((t) => t.family === 'react');
    expect(react?.uiPackage).toBe('ui-react');
    expect(react?.command).toBe('pnpm');
    expect(react?.args.slice(0, 4)).toEqual(['dlx', 'shadcn@latest', 'add', 'button']);
    expect(react?.args).toContain('--cwd');
    expect(react?.args).toContain('/repo/packages/ui-react');
    expect(react?.args).toContain('--yes');

    const vue = tasks.find((t) => t.family === 'vue');
    expect(vue?.args).toContain('shadcn-vue@latest');
    expect(vue?.args).toContain('/repo/packages/ui-vue');
  });

  it('uses the svelte CLI and adds --overwrite when requested', () => {
    const [task] = planComponentTasks({
      repoRoot: '/r',
      components: ['dialog'],
      families: ['svelte'],
      packageManager: 'npm',
      overwrite: true,
    });
    expect(task?.command).toBe('npx');
    expect(task?.args).toContain('shadcn-svelte@latest');
    expect(task?.args).toContain('--overwrite');
  });
});
