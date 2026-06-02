# @solvrae/core

## 0.1.0

### Minor Changes

- e497106: Initial `@solvrae/core` engine (M0): shared types, error hierarchy,
  package-manager detection + command builders, filesystem helpers with deep-merge,
  the declarative Action/Plan model, a transactional executor with `--dry-run` and
  rollback, run context resolution, a console/memory reporter, the `FrameworkAdapter`
  contract, and Zod schemas for `components.json` and registry items.
- 61636f8: Centralize shared dependency specs in `@solvrae/core` (`specs`) and pin a React
  security floor. React/react-dom ranges are now `^19.2.4` to exclude the React
  Server Components advisories (CVE-2025-55182 "React2Shell" RCE and the follow-up
  DoS / source-exposure issues, fixed up to 19.2.4); baselines track the latest
  patched release. The three React adapters now source react/tailwind/vite/typescript
  specs from one place, so future security bumps happen in a single file. `ui-react`'s
  peer range tightened to `^19.2.4` (drops React 18). Ranges stay within the current
  major to avoid breaking changes; the online resolver still selects the latest
  patched version within range.
- 3856ccd: Add registry-backed version resolution. Adapters now declare dependencies as
  `{ range, baseline }`; at scaffold time the engine queries the npm registry for the
  highest version satisfying the range and writes it as an **exact pin**, falling back
  to the baseline when the registry is unreachable. Adds `VersionResolver`,
  `createRegistryResolver`, `offlineResolver`, and `resolveAll` to `@solvrae/core`
  (depends on `semver`); adapter planning methods may now be async; `create-solvrae`
  gains `--offline`. Generated repos get the latest known-good versions, reproducibly.

### Patch Changes

- a01e2c2: M3 — polyglot (Vue + Svelte). Add the `vue` and `svelte` UI families to
  `@solvrae/ui-templates` (component-only `ui-vue` / `ui-svelte` with `cn` and a
  starter Button, consuming the single shared `ui-theme`), plus `@solvrae/adapter-nuxt`
  (Vue, Tailwind v4 via `@tailwindcss/vite` + `build.transpile`) and
  `@solvrae/adapter-sveltekit` (Svelte 5, `@tailwindcss/vite`, adapter-node; the
  `ui-svelte` package exposes a `svelte` export condition so its raw components
  compile). Both are registered in the scaffold registry, and the generated repo's
  Turborepo outputs now cover `.output`/`.svelte-kit`/`build`. Also bump `ui` packages
  to `tailwind-merge@^3` (Tailwind v4) and add `VUE`/`SVELTE` to core `specs`.

  Verified end-to-end: `init next` → `add template nuxt` → `add template sveltekit`
  produces one repo where React, Vue, and Svelte apps all share a single `ui-theme`,
  and all three build (Next, Nuxt SSR, SvelteKit).
