import { describe, expect, it } from 'vitest';
import { type Plan, addDependency, mergeJson, runCommand, writeFile } from './actions';
import { ExecutionError } from './errors';
import { type ExecutorDeps, executePlan } from './executor';
import { createMemoryLogger } from './reporter';
import { createMemoryFs, createRecordingRunner } from './testing';

function deps(overrides: Partial<ExecutorDeps> = {}): ExecutorDeps {
  return {
    fs: overrides.fs ?? createMemoryFs(),
    run: overrides.run ?? createRecordingRunner(),
    logger: overrides.logger ?? createMemoryLogger(),
  };
}

const opts = { cwd: '/repo', dryRun: false };

describe('executePlan — writeFile', () => {
  it('creates a new file', async () => {
    const fs = createMemoryFs();
    const plan: Plan = { summary: 't', actions: [writeFile('/repo/a.txt', 'hi', 'error')] };
    const result = await executePlan(plan, deps({ fs }), opts);
    expect(result.applied).toBe(1);
    expect(fs.files.get('/repo/a.txt')).toBe('hi');
  });

  it('throws when file exists and ifExists is "error"', async () => {
    const fs = createMemoryFs({ '/repo/a.txt': 'old' });
    const plan: Plan = { summary: 't', actions: [writeFile('/repo/a.txt', 'new', 'error')] };
    await expect(executePlan(plan, deps({ fs }), opts)).rejects.toBeInstanceOf(ExecutionError);
    expect(fs.files.get('/repo/a.txt')).toBe('old');
  });

  it('skips when file exists and ifExists is "skip"', async () => {
    const fs = createMemoryFs({ '/repo/a.txt': 'old' });
    const plan: Plan = { summary: 't', actions: [writeFile('/repo/a.txt', 'new', 'skip')] };
    await executePlan(plan, deps({ fs }), opts);
    expect(fs.files.get('/repo/a.txt')).toBe('old');
  });
});

describe('executePlan — mergeJson & addDependency', () => {
  it('deep-merges into an existing JSON file', async () => {
    const fs = createMemoryFs({ '/repo/c.json': '{"a":1,"nested":{"x":1}}' });
    const plan: Plan = {
      summary: 't',
      actions: [mergeJson('/repo/c.json', { b: 2, nested: { y: 2 } })],
    };
    await executePlan(plan, deps({ fs }), opts);
    expect(JSON.parse(fs.files.get('/repo/c.json') as string)).toEqual({
      a: 1,
      b: 2,
      nested: { x: 1, y: 2 },
    });
  });

  it('adds dependencies to package.json', async () => {
    const fs = createMemoryFs({ '/repo/package.json': '{"name":"x"}' });
    const plan: Plan = {
      summary: 't',
      actions: [
        addDependency('/repo/package.json', [{ name: '@repo/ui', version: 'workspace:*' }]),
      ],
    };
    await executePlan(plan, deps({ fs }), opts);
    const pkg = JSON.parse(fs.files.get('/repo/package.json') as string);
    expect(pkg.dependencies).toEqual({ '@repo/ui': 'workspace:*' });
  });
});

describe('executePlan — dry-run', () => {
  it('applies nothing but describes everything', async () => {
    const fs = createMemoryFs();
    const plan: Plan = { summary: 't', actions: [writeFile('/repo/a.txt', 'hi', 'error')] };
    const result = await executePlan(plan, deps({ fs }), { cwd: '/repo', dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(result.applied).toBe(0);
    expect(result.descriptions).toHaveLength(1);
    expect(fs.files.has('/repo/a.txt')).toBe(false);
  });
});

describe('executePlan — rollback', () => {
  it('undoes applied actions when a later action fails', async () => {
    const fs = createMemoryFs();
    const run = createRecordingRunner((cmd) => cmd === 'pnpm');
    const plan: Plan = {
      summary: 't',
      actions: [
        writeFile('/repo/new.txt', 'created', 'error'),
        runCommand('pnpm', ['install'], 'install'),
      ],
    };

    let error: unknown;
    try {
      await executePlan(plan, deps({ fs, run }), opts);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ExecutionError);
    expect((error as ExecutionError).rolledBack).toBe(true);
    // The file written by the first action must be removed by rollback.
    expect(fs.files.has('/repo/new.txt')).toBe(false);
  });
});
