import * as semver from 'semver';
import type { Logger } from './types';

/** How a dependency's version is resolved: the supported range + a known-good fallback. */
export interface DependencySpec {
  /** semver range the adapter supports, e.g. `>=16 <17`. */
  range: string;
  /** Pinned known-good version used when the registry is unreachable. */
  baseline: string;
}

/** Resolves a dependency spec to a single exact version string. */
export interface VersionResolver {
  resolve(name: string, spec: DependencySpec): Promise<string>;
}

/**
 * Always returns the baseline. Deterministic and network-free — the default for
 * tests, CI, and `--offline`.
 */
export const offlineResolver: VersionResolver = {
  resolve(_name, spec) {
    return Promise.resolve(spec.baseline);
  },
};

export interface RegistryResolverOptions {
  /** Injectable fetch (defaults to global `fetch`) — keeps the resolver testable. */
  fetchImpl?: typeof fetch;
  /** Per-request timeout in ms (default 3000). */
  timeoutMs?: number;
  /** Registry base URL (default npm). */
  registryUrl?: string;
  logger?: Logger;
}

/**
 * Resolves the highest published version satisfying the spec's range. Falls back
 * to the baseline on any failure (offline, timeout, HTTP error, no match) so a
 * scaffold never fails because of the registry. Per-run cache + abort timeout.
 */
export function createRegistryResolver(options: RegistryResolverOptions = {}): VersionResolver {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 3000;
  const registryUrl = (options.registryUrl ?? 'https://registry.npmjs.org').replace(/\/$/, '');
  const { logger } = options;
  const cache = new Map<string, Promise<string[]>>();

  function versionsOf(name: string): Promise<string[]> {
    const cached = cache.get(name);
    if (cached) return cached;
    const pending = (async (): Promise<string[]> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetchImpl(`${registryUrl}/${encodeURIComponent(name)}`, {
          signal: controller.signal,
          headers: { accept: 'application/vnd.npm.install-v1+json' },
        });
        if (!res.ok) throw new Error(`registry responded ${res.status}`);
        const body = (await res.json()) as { versions?: Record<string, unknown> };
        return Object.keys(body.versions ?? {});
      } finally {
        clearTimeout(timer);
      }
    })();
    cache.set(name, pending);
    return pending;
  }

  return {
    async resolve(name, spec) {
      try {
        const versions = await versionsOf(name);
        const best = semver.maxSatisfying(versions, spec.range, { includePrerelease: false });
        if (best) return best;
        logger?.warn(
          `no published ${name} satisfies "${spec.range}"; using baseline ${spec.baseline}`,
        );
        return spec.baseline;
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        logger?.warn(`could not resolve ${name} (${reason}); using baseline ${spec.baseline}`);
        return spec.baseline;
      }
    },
  };
}

/** Resolve a map of specs into exact versions, in parallel, preserving key order. */
export async function resolveAll(
  resolver: VersionResolver,
  specs: Record<string, DependencySpec>,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Object.entries(specs).map(
      async ([name, spec]) => [name, await resolver.resolve(name, spec)] as const,
    ),
  );
  return Object.fromEntries(entries);
}
