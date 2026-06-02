# 04 — Repository Structure (Solvrae itself)

Solvrae is a pnpm + Turborepo monorepo — we dogfood the stack we generate. Core,
adapters, and entry points are independent packages so adapters can be versioned
and released on their own cadence.

File contents are **generated programmatically** (template strings → `Action[]`),
not copied from raw `templates/` directories — so every package is plain, bundled,
type-checked TypeScript.

```
solvrae/
├─ packages/
│  ├─ core/                        # @solvrae/core — the engine (no framework code)
│  │  └─ src/                      # flat modules, not folders:
│  │     ├─ types.ts errors.ts     #   shared types, error hierarchy
│  │     ├─ pm.ts fs.ts run.ts     #   pm detection, fs + deepMerge, command runner
│  │     ├─ actions.ts executor.ts #   Action union, Plan, executor (dry-run + rollback)
│  │     ├─ context.ts reporter.ts #   run context, console/memory logger
│  │     ├─ adapter.ts             #   FrameworkAdapter contract + AdapterContext
│  │     ├─ version.ts specs.ts    #   registry version resolver + shared dependency specs
│  │     ├─ schemas.ts             #   Zod: components.json + registry item
│  │     └─ testing.ts             #   in-memory fs / recording runner (test helpers)
│  │
│  ├─ scaffold/                    # @solvrae/scaffold — orchestration shared by both CLIs
│  │  └─ src/                      #   adapters registry, planBaseRepo, planInit,
│  │                               #   planAddTemplate, planComponentTasks, doctor, repo
│  │
│  ├─ cli/                         # solvrae — in-repo binary (add template/component, list, doctor)
│  │  └─ src/bin.ts                #   commander + @clack/prompts → @solvrae/scaffold
│  │
│  ├─ create-solvrae/              # create-solvrae — npm create entry
│  │  └─ src/bin.ts                #   bootstrap prompts → scaffold.planInit
│  │
│  ├─ adapters/
│  │  ├─ next/                     # @solvrae/adapter-next            (family: react)
│  │  ├─ vite-react/               # @solvrae/adapter-vite-react      (family: react)
│  │  ├─ tanstack-start/           # @solvrae/adapter-tanstack-start  (family: react)
│  │  ├─ nuxt/                     # @solvrae/adapter-nuxt            (family: vue)
│  │  └─ sveltekit/                # @solvrae/adapter-sveltekit       (family: svelte)
│  │     └─ src/index.ts           #   each: default export implementing FrameworkAdapter
│  │
│  ├─ ui-templates/                # @solvrae/ui-templates — UI package generators
│  │  └─ src/                      #   theme.ts (shared ui-theme), react.ts / vue.ts /
│  │                               #   svelte.ts (component-only packages), families.ts
│  │
│  └─ config/                      # @solvrae/config — shared tsconfig presets
│
├─ .changeset/                     # changesets release flow
├─ .github/workflows/ci.yml        # CI: lint · typecheck · build · test
├─ turbo.json  pnpm-workspace.yaml  biome.json  tsconfig.base.json  package.json
```

> Planned, not yet present: `apps/docs` (docs site) and an `e2e/` package (the
> build matrix is currently verified by scaffolding into a temp dir manually; see
> the roadmap).

## Why this split

- **`core` has zero framework imports.** It depends only on the adapter
  *contract*. This is what keeps framework churn (a Next 16 change, a Nuxt 4
  change) contained to one adapter package.
- **Adapters own their generation logic.** Each adapter is one package whose
  `planApp` / `planWiring` emit `Action[]`; a framework maintainer touches exactly
  one package.
- **UI-package generators are separate from adapters** because they are keyed by
  **UI family**, not framework — `ui-templates`' `react` generator is shared by
  `adapter-next`, `adapter-vite-react`, and `adapter-tanstack-start`.
- **`scaffold` is the orchestrator.** It holds the adapter registry and the
  `init` / `add-template` / `add-component` / `doctor` planners, so both bins stay
  thin and never duplicate that logic.
- **Two thin bins** (`cli`, `create-solvrae`) call into `scaffold`/`core`.

## Package naming & publishing

| Package | npm name | Public? |
|---------|----------|---------|
| Bootstrapper | `create-solvrae` | ✅ (`npm create solvrae`) |
| In-repo CLI | `solvrae` | ✅ |
| Engine | `@solvrae/core` | ✅ (adapter authors depend on it) |
| Orchestration | `@solvrae/scaffold` | ✅ |
| Adapters | `@solvrae/adapter-<id>` | ✅ |
| UI templates | `@solvrae/ui-templates` | ✅ |
| Shared config | `@solvrae/config` | internal |

Independent versioning via Changesets: a fix to `adapter-nuxt` ships without
bumping `core` or other adapters.
