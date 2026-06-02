# 04 — Repository Structure (Solvrae itself)

Solvrae is a pnpm + Turborepo monorepo — we dogfood the stack we generate. Core,
adapters, and entry points are independent packages so adapters can be versioned
and released on their own cadence.

```
solvrae/
├─ apps/
│  └─ docs/                        # Documentation site (Astro Starlight) — optional
│
├─ packages/
│  ├─ core/                        # @solvrae/core — the engine (no framework code)
│  │  ├─ src/
│  │  │  ├─ context/               # run context: cwd, repo, pm, manifest
│  │  │  ├─ prompts/               # @clack wrappers + non-interactive fallbacks
│  │  │  ├─ plan/                  # Action types + planner + executor + rollback
│  │  │  ├─ fs/                    # writeJson, mergeJson, renderTemplate, editFile
│  │  │  ├─ pm/                    # package-manager-detector + nypm wrappers
│  │  │  ├─ registry/              # shadcn registry clients (react/vue/svelte)
│  │  │  ├─ adapter/               # the FrameworkAdapter contract + resolver
│  │  │  └─ reporter/              # human + --json output
│  │  └─ package.json
│  │
│  ├─ cli/                         # solvrae — in-repo binary (add/list/doctor/upgrade)
│  │  ├─ src/
│  │  │  ├─ bin.ts                 # #!/usr/bin/env node entry
│  │  │  └─ commands/              # one file per subcommand, all delegate to core
│  │  └─ package.json              # "bin": { "solvrae": "./dist/bin.js" }
│  │
│  ├─ create-solvrae/              # create-solvrae — npm create entry
│  │  ├─ src/bin.ts                # collects bootstrap input → core.init()
│  │  └─ package.json              # "bin": { "create-solvrae": "./dist/bin.js" }
│  │
│  ├─ adapters/
│  │  ├─ next/                     # @solvrae/adapter-next
│  │  │  ├─ src/index.ts           # implements FrameworkAdapter
│  │  │  └─ templates/             # raw template files (co-located, adapter owns them)
│  │  │     ├─ app/                # apps/<name> scaffold
│  │  │     └─ wiring/             # snippets/patches for app ↔ ui-react
│  │  ├─ nuxt/                     # @solvrae/adapter-nuxt          (family: vue)
│  │  ├─ sveltekit/                # @solvrae/adapter-sveltekit     (family: svelte)
│  │  └─ tanstack-start/           # @solvrae/adapter-tanstack-start (family: react)
│  │
│  ├─ ui-templates/                # @solvrae/ui-templates — ui package templates
│  │  └─ templates/
│  │     ├─ theme/                  # packages/ui-theme scaffold (shared styles.css, default Nova)
│  │     ├─ react/                 # packages/ui-react scaffold (components.json, cn) — component-only
│  │     ├─ vue/                   # packages/ui-vue   — component-only
│  │     └─ svelte/                # packages/ui-svelte — component-only
│  │
│  └─ config/                      # @solvrae/config — shared tsconfig + biome presets
│
├─ e2e/                            # end-to-end: scaffold into tmp, install, build, assert
│  ├─ next.e2e.ts
│  ├─ nuxt.e2e.ts
│  └─ add-template.e2e.ts
│
├─ .changeset/                     # changesets release flow
├─ .github/workflows/              # CI: lint, unit, e2e matrix (pm × adapter)
├─ turbo.json
├─ pnpm-workspace.yaml
├─ biome.json
├─ tsconfig.base.json
└─ package.json
```

## Why this split

- **`core` has zero framework imports.** It depends only on the adapter
  *contract*. This is what keeps framework churn (a Next 16 change, a Nuxt 4
  change) contained to one adapter package.
- **Adapters own their templates.** Co-locating `templates/` inside each adapter
  means a framework maintainer touches exactly one package. No central template
  dir that everyone fights over.
- **UI-package templates are separate from adapters** because they are keyed by
  **UI family**, not framework — `ui-templates/react` is shared by `adapter-next`
  and `adapter-tanstack-start`.
- **Two thin bins** (`cli`, `create-solvrae`) keep the published entry points
  minimal; both call into `core`.

## Package naming & publishing

| Package | npm name | Public? |
|---------|----------|---------|
| Bootstrapper | `create-solvrae` | ✅ (`npm create solvrae`) |
| In-repo CLI | `solvrae` | ✅ |
| Engine | `@solvrae/core` | ✅ (adapter authors depend on it) |
| Adapters | `@solvrae/adapter-<id>` | ✅ |
| UI templates | `@solvrae/ui-templates` | ✅ |
| Shared config | `@solvrae/config` | internal (or published) |

Independent versioning via Changesets: a fix to `adapter-nuxt` ships without
bumping `core` or other adapters.
