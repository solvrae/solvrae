# @solvrae/ui-templates

## 0.1.0

### Minor Changes

- e634280: M1 — React/Next vertical slice. Add `@solvrae/ui-templates` (the shared `ui-theme`
  design-system package + a component-only `ui-react` package with `cn` and a starter
  Button), `@solvrae/adapter-next` (the Next.js framework adapter), and the
  `create-solvrae` bootstrapper that composes base repo → theme → ui → app → wiring →
  install. `npx create-solvrae -t next` scaffolds a Turborepo whose Next app builds
  end-to-end with Tailwind v4 and the shared theme.
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

- 41b966a: Make UI component imports uniform across families: explicit paths everywhere
  (`@scope/ui-<family>/components/<name>`), and drop the Svelte barrel re-export.

  shadcn-vue and shadcn-svelte lay components out as directories (`<name>/index.ts`),
  while shadcn/ui (React) uses single files. The Vue and Svelte UI packages now emit
  their starter `button` as a directory too and expose components via a single
  directory-aware export (`"./components/*": ".../*/index.ts"`, with the `svelte`
  condition for Svelte). This means newly added components (e.g. `card`, which the
  CLIs scaffold as a directory) are importable the same way as the starter — fixing
  the previous gap where Svelte's `index.ts` barrel didn't include CLI-added
  components, and a latent Vue issue where directory components didn't resolve.
  React is unchanged (single-file `*.tsx`). Verified: a polyglot repo where every app
  imports `@scope/ui-*/components/<name>` (button + card) builds across all 5 templates.

### Patch Changes

- 9f03a9e: Add `solvrae add component <names...>` (docs/11). Resolution is family-aware and
  hybrid: one UI family present → adds there directly; multiple → an interactive
  multiselect (all pre-selected), or `--all` / `-y` for every family, or `--family`
  to target specific ones. Each target family is handled by one non-interactive
  invocation of its official shadcn CLI (`shadcn` / `shadcn-vue` / `shadcn-svelte`)
  pointed at the matching `packages/ui-<family>` via `--cwd` — Solvrae owns the
  uniform UX and per-family availability tolerance (a family that fails is a warning,
  not a hard failure; exit is non-zero only if every target failed). Supports
  `--overwrite` and `--dry-run`.

  To make the CLIs resolve component aliases into the package, generated UI packages
  now carry `baseUrl` + `paths` in their tsconfig, and `ui-svelte` declares `svelte`
  and `tailwindcss` as devDependencies (shadcn-svelte requires both to be resolvable).
  Verified end-to-end: `add component card` lands files in `ui-react`, `ui-vue`, and
  `ui-svelte`.

- 61636f8: Centralize shared dependency specs in `@solvrae/core` (`specs`) and pin a React
  security floor. React/react-dom ranges are now `^19.2.4` to exclude the React
  Server Components advisories (CVE-2025-55182 "React2Shell" RCE and the follow-up
  DoS / source-exposure issues, fixed up to 19.2.4); baselines track the latest
  patched release. The three React adapters now source react/tailwind/vite/typescript
  specs from one place, so future security bumps happen in a single file. `ui-react`'s
  peer range tightened to `^19.2.4` (drops React 18). Ranges stay within the current
  major to avoid breaking changes; the online resolver still selects the latest
  patched version within range.
- Updated dependencies [e497106]
- Updated dependencies [a01e2c2]
- Updated dependencies [61636f8]
- Updated dependencies [3856ccd]
  - @solvrae/core@0.1.0
