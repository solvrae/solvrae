import { describe, expect, it } from 'vitest';
import { addCommand, detectPackageManager, dlxCommand, installCommand } from './pm';
import { createMemoryFs } from './testing';

describe('detectPackageManager', () => {
  it('prefers a lockfile', async () => {
    const fs = createMemoryFs({ '/repo/pnpm-lock.yaml': '' });
    expect(await detectPackageManager('/repo', { fs })).toBe('pnpm');
  });

  it('falls back to the packageManager field', async () => {
    const fs = createMemoryFs({ '/repo/package.json': '{"packageManager":"yarn@4.0.0"}' });
    expect(await detectPackageManager('/repo', { fs })).toBe('yarn');
  });

  it('uses the provided fallback when nothing is found', async () => {
    const fs = createMemoryFs();
    expect(await detectPackageManager('/repo', { fs, fallback: 'npm' })).toBe('npm');
  });

  it('detects bun from bun.lock', async () => {
    const fs = createMemoryFs({ '/repo/bun.lock': '' });
    expect(await detectPackageManager('/repo', { fs })).toBe('bun');
  });
});

describe('command builders', () => {
  it('builds install commands', () => {
    expect(installCommand('pnpm')).toEqual({ command: 'pnpm', args: ['install'] });
  });

  it('builds dev add commands per pm', () => {
    expect(addCommand('npm', [{ name: 'zod', version: '^3' }], true)).toEqual({
      command: 'npm',
      args: ['install', '--save-dev', 'zod@^3'],
    });
    expect(addCommand('pnpm', [{ name: 'zod', version: '^3' }], true)).toEqual({
      command: 'pnpm',
      args: ['add', '-D', 'zod@^3'],
    });
  });

  it('builds dlx commands per pm', () => {
    expect(dlxCommand('pnpm', 'shadcn', ['add', 'button'])).toEqual({
      command: 'pnpm',
      args: ['dlx', 'shadcn', 'add', 'button'],
    });
    expect(dlxCommand('bun', 'shadcn', ['add', 'button'])).toEqual({
      command: 'bunx',
      args: ['shadcn', 'add', 'button'],
    });
  });
});
