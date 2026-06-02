# Contributing to Solvrae

Thanks for considering a contribution! Solvrae is built to be extended — most
contributions are **new framework adapters** or fixes to existing ones, and the
architecture is designed so you rarely need to touch the core.

For the *why* behind the design, read [`docs/`](docs/) (start with
[02 — Architecture](docs/02-architecture.md) and
[07 — Framework Adapters](docs/07-framework-adapters.md)). This file is the
practical how-to.

## Prerequisites

- **Node.js 18+** (LTS recommended; developed on Node 24)
- **pnpm** — `corepack enable` to get the pinned version
- git

## Setup

```bash
git clone https://github.com/solvrae/solvrae.git
cd solvrae
corepack enable
pnpm install
pnpm build      # build every package via Turborepo
```

## Everyday commands

| Command | What it does |
|---------|--------------|
| `pnpm build` | Build all packages (tsup) |
| `pnpm dev` | Watch-build core + adapters |
| `pnpm typecheck` | `tsc --noEmit` across packages (strict) |
| `pnpm test` | Unit tests (Vitest) — pure planners, fast |
| `pnpm lint` | Biome check (lint + format) |
| `pnpm lint:fix` | Apply Biome fixes |
| `pnpm changeset` | Record a changeset for your change |

CI runs lint → typecheck → build → test; keep all four green.

## Running the CLI locally (not yet published)

Build, then link the bins globally:

```bash
pnpm build
pnpm --filter solvrae link --global
pnpm --filter create-solvrae link --global
# (one-time: `pnpm setup` if pnpm's global bin dir isn't on PATH yet)

create-solvrae /tmp/demo -t next --pm pnpm
cd /tmp/demo && solvrae add template nuxt
```

Because the link points at your build output, `pnpm build` instantly updates the
global `solvrae` / `create-solvrae`. Or skip linking and run the bins directly:
`node packages/cli/dist/bin.js <args>`.

## Repository layout

```
packages/
  core/          @solvrae/core        — framework-agnostic engine (types, pm, fs,
                                         Action/Plan + executor, version resolver,
                                         specs, Zod schemas, adapter contract)
  scaffold/      @solvrae/scaffold     — adapter registry + planInit / planAddTemplate
                                         / planComponentTasks / doctor
  ui-templates/  @solvrae/ui-templates — shared ui-theme + per-family UI packages
  adapters/*     @solvrae/adapter-<id> — next, vite-react, tanstack-start, nuxt, sveltekit
  cli/           solvrae              — in-repo CLI (add template/component, list, doctor)
  create-solvrae create-solvrae       — bootstrapper
  config/        @solvrae/config      — shared tsconfig presets
```

`core` has **zero** framework imports — framework specifics live only in adapters.

## Adding a framework adapter (the common contribution)

1. Copy an existing adapter, e.g. `packages/adapters/vite-react`.
2. Set `id`, `displayName`, `family` (`react` | `vue` | `svelte`), and the
   `compatibility` block.
3. Implement `planApp` / `planWiring` — **return `Action[]`, never write to disk**.
   Resolve dependency versions with `resolveAll(ctx.versions, …)`, reusing
   `specs.*` for shared deps (react, tailwind, vite, typescript).
4. Register the adapter in `@solvrae/scaffold`'s `ADAPTERS` map (and add it as a
   dependency of `@solvrae/scaffold`).
5. Add `src/index.test.ts` asserting the produced plan.
6. Verify a generated app **builds**: scaffold into a temp dir, install, build.
7. `pnpm changeset` and open a PR.

See [07 — Framework Adapters](docs/07-framework-adapters.md) for the full contract.

## Conventions

- **TypeScript strict** (`strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`). No `any` without justification; validate external
  data (config, registry) with Zod.
- **Planners stay pure.** Decision logic returns `Action[]`; side effects live only
  in the executor. This is what makes `--dry-run` and rollback work everywhere.
- **No cross-adapter imports.** Shared logic goes to `core`, `scaffold`, or
  `ui-templates`.
- **Conventional Commits** (`feat:`, `fix:`, `docs:`, scoped where useful, e.g.
  `feat(adapter-nuxt): …`).
- **Every user-facing change ships a changeset** (`pnpm changeset`). Versioning and
  changelogs are automated; packages version independently.
- **Biome** formats and lints in one pass — run `pnpm lint:fix` before pushing.

## Pull requests

1. Branch off `main`.
2. Make the change + tests + a changeset.
3. Ensure `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass.
4. For adapter changes, confirm a generated app builds.
5. Open the PR; a maintainer reviews. On merge, Changesets opens/updates the
   release PR.

## Reporting issues

Include: the command run, package manager + version, Node version, the template(s)
involved, and `solvrae doctor` output for an existing repo. A minimal reproduction
(or the generated repo) helps enormously.

## Code of Conduct

This project follows the
[Contributor Covenant](https://www.contributor-covenant.org/). Be respectful and
constructive.
