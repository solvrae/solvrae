# @solvrae/adapter-sveltekit

## 0.1.0

### Minor Changes

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

### Patch Changes

- 41b966a: Dev DX fixes for the generated repo:

  - Generated `turbo.json` now sets `"ui": "tui"`, so `pnpm dev` shows Turborepo's
    interactive two-pane terminal (workspace list + per-workspace logs) instead of
    interleaved output.
  - The Nuxt adapter sets `telemetry: false`, removing the interactive telemetry
    prompt that blocked `nuxt dev` on stdin (the dev server appeared to hang).
  - Each app's `dev` script now binds a distinct port (next 3000, nuxt 3001,
    vite-react 5173, sveltekit 5174, tanstack-start 5175) so `pnpm dev` starts every
    app without port collisions.

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

- Updated dependencies [e497106]
- Updated dependencies [a01e2c2]
- Updated dependencies [61636f8]
- Updated dependencies [3856ccd]
  - @solvrae/core@0.1.0
