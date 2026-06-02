import { describe, expect, it } from 'vitest';
import { createMemoryLogger } from './reporter';
import { createRegistryResolver, offlineResolver, resolveAll } from './version';

function fakeFetch(versions: string[]): typeof fetch {
  return (async () => ({
    ok: true,
    status: 200,
    json: async () => ({ versions: Object.fromEntries(versions.map((v) => [v, {}])) }),
  })) as unknown as typeof fetch;
}

describe('offlineResolver', () => {
  it('returns the baseline', async () => {
    expect(await offlineResolver.resolve('next', { range: '>=16 <17', baseline: '16.2.7' })).toBe(
      '16.2.7',
    );
  });
});

describe('createRegistryResolver', () => {
  it('picks the highest version satisfying the range', async () => {
    const resolver = createRegistryResolver({
      fetchImpl: fakeFetch(['15.5.0', '16.0.0', '16.2.7', '17.0.0']),
    });
    expect(await resolver.resolve('next', { range: '>=16 <17', baseline: '16.0.0' })).toBe(
      '16.2.7',
    );
  });

  it('falls back to the baseline when nothing satisfies', async () => {
    const resolver = createRegistryResolver({ fetchImpl: fakeFetch(['14.0.0']) });
    expect(await resolver.resolve('next', { range: '>=16 <17', baseline: '16.2.7' })).toBe(
      '16.2.7',
    );
  });

  it('falls back to the baseline on a fetch error', async () => {
    const failing = (() => Promise.reject(new Error('offline'))) as unknown as typeof fetch;
    const resolver = createRegistryResolver({ fetchImpl: failing, logger: createMemoryLogger() });
    expect(await resolver.resolve('react', { range: '^19', baseline: '19.2.7' })).toBe('19.2.7');
  });
});

describe('resolveAll', () => {
  it('resolves a map of specs in parallel', async () => {
    const result = await resolveAll(offlineResolver, {
      next: { range: '>=16 <17', baseline: '16.2.7' },
      react: { range: '^19', baseline: '19.2.7' },
    });
    expect(result).toEqual({ next: '16.2.7', react: '19.2.7' });
  });
});
