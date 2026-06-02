# 10 — Roadmap

Milestones are intentionally vertical: each ships something a user can run
end-to-end, with the e2e build matrix green.

Legend: ✅ done · 🚧 in progress · ⬜ planned.

## M0 — Foundations ✅

- [x] Monorepo bootstrap (pnpm + Turborepo, Biome, tsup, Vitest, Changesets, CI)
- [x] `@solvrae/core`: types, errors, `pm`, `fs`, plan/executor, reporter, adapter contract
- [x] Action types + pure planner/executor with rollback + `--dry-run`
- [x] Zod schemas for `components.json` and registry items
- [ ] Create the **`solvrae` GitHub org** + **`solvrae` npm org** (publish prerequisite)

## M1 — First vertical slice (React/Next) ✅

- [x] `@solvrae/ui-templates` → `react` (Tailwind v4 + shadcn/ui) + shared `ui-theme`
- [x] `@solvrae/adapter-next`
- [x] `create-solvrae` bootstrapper → `init` flow end-to-end (Next app builds)
- [x] Registry-backed version resolution + React security floor (`@solvrae/core/specs`)
- [ ] E2E in CI across all four package managers (verified manually with pnpm so far)

## M2 — `add template` + UI-family reuse ✅

- [x] `@solvrae/scaffold` — shared adapter registry + `planInit` / `planAddTemplate`
- [x] `solvrae add template <id>` — idempotent, additive, reuse-aware
- [x] `@solvrae/adapter-vite-react` + `@solvrae/adapter-tanstack-start` (React reuse of `ui-react`)
- [x] `solvrae list` + `solvrae doctor`
- [x] E2E: `init next` → `add template tanstack-start` reuses `ui-react`; both build

## M3 — Cross-framework (Vue + Svelte) ✅

- [x] `ui-templates` vue + svelte families; `@solvrae/adapter-nuxt` + `@solvrae/adapter-sveltekit`
- [x] E2E: polyglot repo (`next` + `nuxt` + `sveltekit`) builds with one shared `ui-theme`

## M4 — Robustness & DX 🚧

- [x] `solvrae add component <name...>` — hybrid family resolution (auto-detect / multiselect / `--family` / `--all`); see [11 — Component Management](11-component-management.md)
- [x] `solvrae doctor --fix` for drifted wiring
- [x] Dev DX: Turborepo TUI, fixed dev ports, Nuxt telemetry off, uniform explicit-path component imports
- [ ] `solvrae upgrade` with diff preview + migrations
- [ ] Third-party adapter discovery (`solvrae-adapter-*` convention)
- [ ] Docs site (Astro Starlight) under `apps/docs`

## M5 — Ecosystem ⬜

- [ ] More adapters: `react-router`, `vite-vue`, `vite-svelte`, `solid-start`, `astro`
- [ ] Registry-first `add component` (offline-capable, replacing CLI delegation)
- [ ] Nightly CI against upstream `latest` (early-warning for shadcn/Tailwind/frameworks)
- [ ] Adapter generator (`gen:adapter`) + adapter authoring guide
- [ ] Publish to npm

## Supported templates

| Template | UI family | shadcn registry | Status |
|----------|-----------|-----------------|--------|
| `next` | react | `shadcn/ui` | ✅ available |
| `vite-react` | react | `shadcn/ui` | ✅ available |
| `tanstack-start` | react | `shadcn/ui` | ✅ available |
| `nuxt` | vue | `shadcn-vue` | ✅ available |
| `sveltekit` | svelte | `shadcn-svelte` | ✅ available |
| `react-router` | react | `shadcn/ui` | ⬜ M5 |
| `vite-vue` | vue | `shadcn-vue` | ⬜ M5 |
| `vite-svelte` | svelte | `shadcn-svelte` | ⬜ M5 |
| `solid-start` | solid | `shadcn-svelte` | ⬜ M5 |
| `astro` | react/vue/svelte | varies | exploratory |

## Explicitly out of scope (for now)

- Shipping our own component library (we wire shadcn, not replace it)
- Forking shadcn or Turborepo
- Non-Tailwind styling engines (shadcn is Tailwind-based by definition)
