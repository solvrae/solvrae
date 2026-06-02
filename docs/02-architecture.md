# 02 — Architecture

Solvrae is built as a small **framework-agnostic core** orchestrating a set of
**framework adapters**, with two thin **entry points** (the `create-solvrae`
bootstrapper and the in-repo `solvrae` command).

```
┌──────────────────────────────────────────────────────────────────┐
│  Entry points                                                      │
│  ┌────────────────────┐        ┌────────────────────────────────┐ │
│  │ create-solvrae      │        │ solvrae  (in-repo binary)      │ │
│  │ (npm create / npx)  │        │ add | doctor | list | upgrade  │ │
│  └─────────┬───────────┘        └───────────────┬────────────────┘ │
└────────────┼────────────────────────────────────┼─────────────────┘
             │                                     │
             ▼                                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  @solvrae/core  — framework-agnostic engine                        │
│                                                                    │
│   prompts ── plan (Action[]) ── executor ── reporter               │
│      │            ▲                  │                             │
│      │            │                  ▼                             │
│   context     adapter API        fs / pm / templating / registry  │
└────────────────────┬───────────────────────────────────────────────┘
                     │  resolves & invokes
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  Adapters (one package each, lazily loaded)                        │
│  adapter-next  adapter-nuxt  adapter-sveltekit  adapter-tanstack…  │
│        │             │              │                              │
│        └─────────────┴──────────────┴──► declare which UI family   │
│                                          (react / vue / svelte)    │
└──────────────────────────────────────────────────────────────────┘
```

## Layers

### 1. Entry points

- **`create-solvrae`** — the `npm create solvrae` / `npx create-solvrae` binary.
  Its only job: collect bootstrap input (target dir, template, package manager),
  create the directory, then hand off to `@solvrae/core` to run the `init` flow.
- **`solvrae`** — the binary installed *into* a generated repo (and runnable via
  `npx solvrae`). Hosts post-init commands: `add template`, `list`, `doctor`,
  `upgrade`. Both binaries are thin; all logic lives in core.

### 2. `@solvrae/core` — the engine

The core never imports a framework adapter statically. It exposes services and an
adapter contract, then **resolves adapters at runtime** by id. Core
responsibilities:

| Service | Responsibility |
|---------|----------------|
| `context` | Resolved run context: cwd, repo root, package manager, monorepo manifest, existing apps/packages, dry-run flag, logger |
| `prompts` | Interactive Q&A (`@clack/prompts`), with non-interactive fallbacks from flags |
| `planner` | Turns intent + adapter output into an ordered list of **Actions** (pure data) before touching disk |
| `executor` | Applies Actions transactionally (with rollback on failure) |
| `fs` | Safe filesystem ops: write/merge JSON, copy+render templates, edit existing files via AST/structured edits |
| `pm` | Package-manager detection & command building (install, add, run) |
| `registry` | Clients for shadcn registries per UI family; resolves component/style metadata from versioned JSON |
| `reporter` | Human-readable + `--json` machine output |

### 3. Adapters

One package per framework (`@solvrae/adapter-next`, …). An adapter is a pure
description plus a few async hooks; it owns its templates and its glue logic. See
[07 — Framework Adapters](07-framework-adapters.md) for the full contract.

## The Plan → Execute model (why it matters)

Solvrae never edits files ad-hoc in the middle of prompting. Every command runs in
three phases:

1. **Resolve context** — read the repo, detect package manager, load relevant
   adapters, validate preconditions.
2. **Build a Plan** — a flat, serializable `Action[]`. Actions are declarative:
   `WriteFile`, `MergeJson`, `EditFile`, `AddDependency`, `RunInstall`,
   `RunRegistryFetch`, etc. Nothing has touched disk yet.
3. **Execute the Plan** — apply actions in order, tracking what was written so a
   failure can roll back; emit a report.

Benefits:

- **`--dry-run`** is free: print the Plan, execute nothing.
- **Idempotency**: the planner diffs intent against current repo state, so
  `add template next` a second time is a no-op (or only fills gaps).
- **Testability**: planners are pure functions — assert on the Plan without I/O.
- **Transactional safety**: partial failures roll back instead of leaving a
  half-wired repo.

```ts
// Shape of an Action (illustrative)
type Action =
  | { kind: 'writeFile'; path: string; contents: string; ifExists: 'skip' | 'overwrite' | 'error' }
  | { kind: 'mergeJson'; path: string; merge: Record<string, unknown>; strategy: MergeStrategy }
  | { kind: 'editFile'; path: string; edit: StructuredEdit }   // e.g. add a Tailwind content glob
  | { kind: 'addDependency'; workspace: string; deps: Dep[]; dev?: boolean }
  | { kind: 'runInstall'; pm: PackageManager }
  | { kind: 'fetchRegistry'; family: UiFamily; items: string[]; dest: string };
```

## UI family resolution

The mapping from **template** (what the user picks) to **UI family** (what the
shadcn package is) is owned by adapters and central to sharing:

| Template | UI family | shadcn registry |
|----------|-----------|-----------------|
| `next`, `tanstack-start`, `react-router`, `vite-react` | `react` | `shadcn/ui` |
| `nuxt`, `vite-vue` | `vue` | `shadcn-vue` |
| `sveltekit`, `vite-svelte` | `svelte` | `shadcn-svelte` |
| `solid-start` | `solid` | `shadcn-svelte` (Solid output) |

When `add template` is asked for a template whose family already has a
`packages/ui-<family>`, the planner **reuses** it and only scaffolds + wires the
new app. This is why the package is `ui-react`, not `ui-next`.

## Data flow for `add template nuxt`

```
solvrae add template nuxt
  └─ context: detect pnpm, read pnpm-workspace.yaml, find existing apps/ & packages/
  └─ resolve adapter "nuxt"  →  family = "vue"
  └─ planner:
       • apps/<name>?         → scaffold Nuxt app                (WriteFile×N)
       • packages/ui-vue?     → exists? reuse : scaffold          (WriteFile×N + fetchRegistry)
       • wire app → ui-vue    → MergeJson(package.json deps),
                                EditFile(nuxt.config: transpile, css),
                                EditFile(tailwind content / css import)
       • install              → RunInstall(pnpm)
  └─ executor: apply, rollback on error
  └─ reporter: "Added apps/web-nuxt + reused packages/ui-vue"
```

## Non-goals

- Solvrae is **not** a component library. It wires up *shadcn's* components; it
  ships none of its own.
- Solvrae does **not** fork shadcn or Turborepo. It composes them and stays
  compatible by tracking their public contracts.
