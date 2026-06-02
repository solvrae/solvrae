# 03 — Tech Stack

Every dependency is chosen to be small, typed, well-maintained, and replaceable.
The guiding rule: **prefer the smallest dependency that owns a hard problem**
(package-manager detection, prompts) and hand-roll the rest against documented
schemas.

## Runtime & language

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Language | **TypeScript**, `strict: true` + `noUncheckedIndexedAccess` | Tool and generated output are both strict |
| Module system | **ESM** | Modern Node default; all deps below are ESM-friendly |
| Node target | **Node 18+** (LTS) | `fs/promises`, native `fetch`, stable enough for users |

## CLI dependencies

| Package | Role | Why this one |
|---------|------|--------------|
| [`commander`](https://github.com/tj/commander.js) | Argument & subcommand parsing | Mature, fully typed, predictable subcommand tree (`add template <x>`) |
| [`@clack/prompts`](https://github.com/bombshell-dev/clack) | Interactive prompts + spinners | Best-in-class DX, typed, cancel-aware, single dependency |
| [`picocolors`](https://github.com/alexeyraspopov/picocolors) | Terminal colors | Tiny, fast, no chalk bloat |
| [`zod`](https://zod.dev) | Runtime validation | Validate flags, `components.json`, registry responses, adapter config |
| [`package-manager-detector`](https://github.com/antfu-collective/package-manager-detector) | Detect pnpm/npm/yarn/bun | Antfu-maintained, lockfile + `packageManager` field aware |
| [`nypm`](https://github.com/unjs/nypm) | Run installs across any PM | Abstracts `install`/`add`/`remove` so we never hardcode a PM |
| [`tinyglobby`](https://github.com/SuperchupuDev/tinyglobby) | Globbing for file ops | Tiny, fast `globby` replacement |
| [`ejs`](https://ejs.co) | Template rendering | Only for template files needing interpolation; static files are copied verbatim |
| [`comment-json`](https://github.com/kaelzhang/node-comment-json) | Edit JSONC (`tsconfig`, `components.json`) | Preserves comments/formatting when merging |
| `node:fs/promises`, `node:path`, native `fetch` | FS, paths, registry HTTP | No `fs-extra`/`axios` needed on modern Node |

> AST-level edits for framework config (e.g. injecting `transpilePackages` into
> `next.config.ts`, `transpile` into `nuxt.config.ts`) use the lightest viable
> tool per file type — `comment-json` for JSON/JSONC, and a small recast/magicast
> layer only where we must edit live JS/TS config. Prefer template-owned config
> over editing generated config whenever the framework allows it.

## Build, test, quality

| Concern | Choice | Why |
|---------|--------|-----|
| Bundler | [`tsup`](https://tsup.egoist.dev) | Zero-config ESM + `.d.ts` for libraries and bins |
| Unit tests | [`vitest`](https://vitest.dev) | Fast, TS-native, great for testing pure planners |
| E2E tests | `vitest` + temp-dir scaffolding | Generate into `os.tmpdir()`, run real `install` + `build` per adapter |
| Lint + format | [`biome`](https://biomejs.dev) | Single fast tool replacing ESLint + Prettier |
| Releases | [`changesets`](https://github.com/changesets/changesets) | Independent versioning of core + adapters; changelog automation |
| Monorepo | **pnpm workspaces + Turborepo** | We dogfood the exact stack we generate |
| CI | **GitHub Actions** | Matrix over package managers × adapters |

## What we deliberately avoid

- **Shelling out to `shadcn` / `create-turbo` interactively.** Their prompt output
  is not a stable contract. We read their *schemas* and *registries* instead.
- **Heavy scaffolders** (Yeoman, Plop). Our planner/executor is purpose-built and
  serializable for `--dry-run`.
- **`fs-extra`, `chalk`, `axios`, `globby`, `inquirer`.** Each has a smaller,
  modern, ESM-native replacement above.

## Generated output stack

What the user's repo ships with (versions pinned per adapter, see
[08](08-compatibility-and-maintainability.md)):

- Turborepo + the chosen package manager's workspaces
- The chosen framework(s) at their current stable major
- **Tailwind CSS v4** (CSS-first config) — shadcn's current default
- shadcn components from the correct registry per UI family
- Shared `typescript-config` and `biome`/lint config packages
