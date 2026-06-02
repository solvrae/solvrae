# 05 — Generated Output

This is what a user's repository looks like after running Solvrae. The example
below was created with `next`, then had `nuxt` added later.

```
my-app/
├─ apps/
│  ├─ web/                         # Next.js app (template: next, family: react)
│  │  ├─ app/
│  │  ├─ next.config.ts            # transpilePackages: ["@repo/ui-theme","@repo/ui-react"]
│  │  ├─ app/globals.css           # @import "@repo/ui-theme/styles.css"   ← ONE shared theme
│  │  ├─ tsconfig.json             # extends @repo/typescript-config, paths → ui-react
│  │  └─ package.json              # deps: ui-theme + ui-react (workspace:*)
│  │
│  └─ web-nuxt/                    # Nuxt app (template: nuxt, family: vue)
│     ├─ nuxt.config.ts            # build.transpile + css: ["@repo/ui-theme/styles.css"]
│     ├─ tsconfig.json
│     └─ package.json              # deps: ui-theme + ui-vue (workspace:*)
│
├─ packages/
│  ├─ ui-theme/                    # ★ SINGLE SOURCE OF TRUTH for the design system
│  │  ├─ src/styles.css            # @import "tailwindcss"; @theme tokens (OKLCH);
│  │  │                            #   dark mode; shadcn shared utilities. Default: Nova
│  │  └─ package.json              # exports "./styles.css" (+ optional tailwind preset)
│  │
│  ├─ ui-react/                    # shadcn/ui (React) — COMPONENT SOURCE ONLY (no tokens)
│  │  ├─ components.json           # registry: react; tailwind.css → @repo/ui-theme; cssVariables: true
│  │  ├─ src/
│  │  │  ├─ components/            # shadcn React components land here
│  │  │  └─ lib/utils.ts           # cn() helper
│  │  ├─ package.json              # deps: @repo/ui-theme; exports "./components/*", "./lib/*"
│  │  └─ tsconfig.json
│  │
│  ├─ ui-vue/                      # shadcn-vue — component source only (added with nuxt)
│  │  ├─ components.json           # tailwind.css → @repo/ui-theme; cssVariables: true
│  │  ├─ src/{components,lib}
│  │  └─ package.json              # deps: @repo/ui-theme
│  │
│  └─ typescript-config/           # shared tsconfig presets
│     ├─ base.json
│     ├─ nextjs.json
│     └─ package.json
│
├─ turbo.json
├─ pnpm-workspace.yaml             # (or workspaces field for npm/yarn/bun)
├─ package.json
├─ .gitignore
└─ README.md                       # generated, documents the repo + how to add components
```

## Key wiring decisions

### One shared theme (`ui-theme`) — the single source of truth

shadcn v4 is CSS-first, and **the semantic token names are identical across
React, Vue, and Svelte** (`--background`, `--primary`, `--radius`, … —
[verified](https://www.shadcn-vue.com/docs/theming)). So Solvrae factors the
design system into **one** `packages/ui-theme/styles.css`, imported by every app
and consumed by every family. Change base color / radius / fonts / preset in one
place → all families update. The default style is **Nova** (see
[12 — Design System & Configuration](12-design-system-config.md)).

```jsonc
// packages/ui-theme/package.json (excerpt)
{
  "name": "@repo/ui-theme",
  "type": "module",
  "exports": { "./styles.css": "./src/styles.css" }
}

// packages/ui-react/package.json (excerpt) — component source only
{
  "name": "@repo/ui-react",
  "type": "module",
  "dependencies": { "@repo/ui-theme": "workspace:*" },
  "exports": { "./components/*": "./src/components/*.tsx", "./lib/*": "./src/lib/*.ts" }
}
```

> **What's shared vs. per-family.** The **token layer** (colors, radius, fonts,
> dark mode) is shared in `ui-theme` because token names are universal. The
> **structural style** (e.g. Nova's square corners / serif headings / button
> sizing) lives in each family's component source and cannot be unified by CSS
> alone. Solvrae standardizes the shared file on **OKLCH / Tailwind v4** and pins
> families to the v4-era registries so the `var(--token)` convention matches; a
> per-family override file is the escape hatch if a registry ever diverges.

> The `@repo/*` scope is the conventional Turborepo internal scope. Solvrae makes
> it configurable at init (e.g. `@my-app/*`).

### App ↔ packages

| Framework | How the app consumes theme + components |
|-----------|------------------------------------------|
| **Next.js** | `transpilePackages: ["@repo/ui-theme","@repo/ui-react"]`; `@import "@repo/ui-theme/styles.css"` in `globals.css`; TS path alias to `ui-react` |
| **Nuxt** | `build.transpile` + `css: ["@repo/ui-theme/styles.css"]` in `nuxt.config.ts`; components from `ui-vue` |
| **SvelteKit** | Vite handles workspace packages; import `@repo/ui-theme/styles.css` in the root layout; components from `ui-svelte` |
| **TanStack Start** | Vite-based; alias + `@repo/ui-theme/styles.css` import, reuses `ui-react` |

### Tailwind v4 content sources

Because Tailwind v4 scans imported files, both `ui-theme` **and** each family's
components must be visible to an app's Tailwind build. Adapters add those package
paths to the relevant content/source config (or rely on v4's automatic detection
via the CSS import graph, depending on framework).

### components.json per UI package

Each `packages/ui-<family>` gets a `components.json` whose component/lib aliases
point **inside that package** while its `tailwind.css` points at the shared
`@repo/ui-theme` file (with `cssVariables: true`). So when the native shadcn CLI
(or `solvrae add component`) runs, **components** land in the family package and
any **token** additions land in the one shared theme.

## How users add components afterward

The generated `README.md` documents the supported workflow, e.g.:

```bash
# React UI package
pnpm --filter @repo/ui-react dlx shadcn@latest add button

# Vue UI package
pnpm --filter @repo/ui-vue dlx shadcn-vue@latest add button
```

A future `solvrae add component button --family react` wraps this uniformly
(see [10 — Roadmap](10-roadmap.md)).
