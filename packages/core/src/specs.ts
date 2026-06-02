import type { DependencySpec } from './version';

/**
 * Shared dependency specs used across adapters — the single place to bump common
 * versions (notably for security). Each is a `{ range, baseline }`: `range` is the
 * supported semver (an upper bound keeps us off untested majors; a lower bound can
 * encode a security floor), `baseline` is the offline fallback.
 *
 * React floor is pinned to **19.2.4** to exclude versions affected by the React
 * Server Components advisories (CVE-2025-55182 "React2Shell" RCE and the follow-up
 * DoS / source-exposure issues, fixed up to 19.2.4). The online resolver still
 * picks the latest within range.
 */
export const REACT: DependencySpec = { range: '^19.2.4', baseline: '19.2.7' };
export const REACT_DOM: DependencySpec = { range: '^19.2.4', baseline: '19.2.7' };
export const TYPES_REACT: DependencySpec = { range: '^19', baseline: '19.2.0' };
export const TYPES_REACT_DOM: DependencySpec = { range: '^19', baseline: '19.2.0' };
export const TYPES_NODE: DependencySpec = { range: '^22', baseline: '22.10.0' };
export const TYPESCRIPT: DependencySpec = { range: '^5.7', baseline: '5.9.3' };
export const TAILWINDCSS: DependencySpec = { range: '^4', baseline: '4.3.0' };
export const TAILWIND_POSTCSS: DependencySpec = { range: '^4', baseline: '4.3.0' };
export const TAILWIND_VITE: DependencySpec = { range: '^4', baseline: '4.3.0' };
export const VITE: DependencySpec = { range: '^8', baseline: '8.0.16' };
export const VITE_PLUGIN_REACT: DependencySpec = { range: '^6', baseline: '6.0.2' };
