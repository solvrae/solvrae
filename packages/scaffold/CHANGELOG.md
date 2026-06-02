# @solvrae/scaffold

## 0.1.0

### Minor Changes

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

- e8ff78a: `solvrae doctor` now runs real diagnostics and supports `--fix`. It checks the
  shared theme exists, that each `ui-<family>/components.json` points `tailwind.css`
  at the shared theme, and that every app consuming a `ui-<family>` package also
  depends on `@scope/ui-theme`. Each issue carries a fix Action; `--fix` applies them
  through the executor. Adds `collectDiagnostics` / `runDoctorChecks` to
  `@solvrae/scaffold`. Verified end-to-end: a repo with a drifted `components.json`
  css path and an app missing its theme dependency is detected and repaired.
- 6ff4d21: M2 — `solvrae add template`. Add `@solvrae/scaffold` (shared adapter registry +
  `planInit`/`planAddTemplate` orchestration, refactored out of `create-solvrae`),
  `@solvrae/adapter-vite-react` (a second React-family adapter), and the in-repo
  `solvrae` CLI with `add template <id>`, `list`, and `doctor`. `add template` is
  reuse-aware and idempotent: a template whose UI family already has a
  `packages/ui-<family>` reuses it instead of creating a duplicate — verified
  end-to-end (`init next` → `add template vite-react` reuses `ui-react`; both apps
  build).
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

- c596bf7: Add `@solvrae/adapter-tanstack-start` (TanStack Start, React family) and register
  it in the scaffold adapter registry. Completes the M2 React-family set: `next`,
  `vite-react`, and `tanstack-start` all reuse a single `ui-react` package. Verified
  end-to-end — `add template tanstack-start` reuses `ui-react`, and the generated app
  builds (client + SSR) alongside the existing Next app.
- 41b966a: Dev DX fixes for the generated repo:

  - Generated `turbo.json` now sets `"ui": "tui"`, so `pnpm dev` shows Turborepo's
    interactive two-pane terminal (workspace list + per-workspace logs) instead of
    interleaved output.
  - The Nuxt adapter sets `telemetry: false`, removing the interactive telemetry
    prompt that blocked `nuxt dev` on stdin (the dev server appeared to hang).
  - Each app's `dev` script now binds a distinct port (next 3000, nuxt 3001,
    vite-react 5173, sveltekit 5174, tanstack-start 5175) so `pnpm dev` starts every
    app without port collisions.

- Updated dependencies [c596bf7]
- Updated dependencies [9f03a9e]
- Updated dependencies [41b966a]
- Updated dependencies [e497106]
- Updated dependencies [e634280]
- Updated dependencies [6ff4d21]
- Updated dependencies [a01e2c2]
- Updated dependencies [61636f8]
- Updated dependencies [41b966a]
- Updated dependencies [3856ccd]
  - @solvrae/adapter-tanstack-start@0.1.0
  - @solvrae/ui-templates@0.1.0
  - @solvrae/adapter-nuxt@0.1.0
  - @solvrae/adapter-next@0.1.0
  - @solvrae/adapter-vite-react@0.1.0
  - @solvrae/adapter-sveltekit@0.1.0
  - @solvrae/core@0.1.0
