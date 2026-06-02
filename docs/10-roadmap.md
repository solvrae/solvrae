# 10 — Roadmap

Milestones are intentionally vertical: each ships something a user can run
end-to-end, with the e2e build matrix green.

## M0 — Foundations

- [ ] Create the **`solvrae` GitHub organization** + matching **`solvrae` npm org** (scope `@solvrae/*`)
- [ ] Monorepo bootstrap (pnpm + Turborepo, Biome, tsup, Vitest, Changesets, CI)
- [ ] `@solvrae/core`: context, `pm`, `fs`, plan/executor, reporter, adapter contract
- [ ] Action types + pure planner/executor with rollback + `--dry-run`
- [ ] Zod schemas for `components.json`, registry, adapter metadata

## M1 — First vertical slice (React/Next)

- [ ] `@solvrae/ui-templates` → `react` (Tailwind v4 + shadcn/ui)
- [ ] `@solvrae/adapter-next`
- [ ] `create-solvrae` bootstrapper → `init` flow end-to-end
- [ ] E2E: `{pnpm,npm,yarn,bun} × next` scaffolds, installs, builds
- [ ] `solvrae list` + `solvrae doctor`

## M2 — `add template` + UI-family reuse

- [ ] `solvrae add template <id>` with idempotent, additive planning
- [ ] `@solvrae/adapter-tanstack-start` (proves React-family **reuse** of `ui-react`)
- [ ] E2E: `init next` → `add tanstack-start` reuses `ui-react`

## M3 — Cross-framework (Vue + Svelte)

- [ ] `ui-templates/vue` + `@solvrae/adapter-nuxt` (registry: `shadcn-vue`)
- [ ] `ui-templates/svelte` + `@solvrae/adapter-sveltekit` (registry: `shadcn-svelte`)
- [ ] E2E: polyglot repo (`next` + `nuxt` + `sveltekit`) builds

## M4 — Robustness & DX

- [ ] `solvrae doctor --fix` for drifted wiring
- [ ] `solvrae upgrade` with diff preview + migrations
- [ ] `solvrae add component <name...>` — hybrid family resolution (auto-detect + multiselect + `--family`/`--all`); see [11 — Component Management](11-component-management.md)
- [ ] Third-party adapter discovery (`solvrae-adapter-*` convention)
- [ ] Docs site (Astro Starlight) under `apps/docs`

## M5 — Ecosystem

- [ ] More adapters: `react-router`, `vite-vue`, `vite-svelte`, `solid-start`, `astro`
- [ ] Nightly CI against upstream `latest` (early-warning for shadcn/Tailwind/frameworks)
- [ ] Adapter generator (`gen:adapter`) + adapter authoring guide
- [ ] Telemetry (opt-in) to learn which templates matter most

## Supported templates (target)

| Template | UI family | shadcn registry | Status |
|----------|-----------|-----------------|--------|
| `next` | react | `shadcn/ui` | planned (M1) |
| `tanstack-start` | react | `shadcn/ui` | planned (M2) |
| `nuxt` | vue | `shadcn-vue` | planned (M3) |
| `sveltekit` | svelte | `shadcn-svelte` | planned (M3) |
| `react-router` | react | `shadcn/ui` | M5 |
| `vite-vue` | vue | `shadcn-vue` | M5 |
| `vite-svelte` | svelte | `shadcn-svelte` | M5 |
| `solid-start` | solid | `shadcn-svelte` | M5 |
| `astro` | react/vue/svelte | varies | exploratory |

## Explicitly out of scope (for now)

- Shipping our own component library (we wire shadcn, not replace it)
- Forking shadcn or Turborepo
- Non-Tailwind styling engines (shadcn is Tailwind-based by definition)
