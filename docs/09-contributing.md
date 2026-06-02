# 09 — Contributing

Thanks for considering a contribution! Solvrae is built to be extended — most
contributions are **new adapters** or fixes to existing ones, and the architecture
is designed so you rarely need to touch the core.

## Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm (the repo's package manager — `corepack enable` to get the pinned version)
- git

## Setup

```bash
git clone https://github.com/<org>/solvrae.git
cd solvrae
corepack enable
pnpm install
pnpm build      # turbo build across packages
pnpm test       # unit tests (vitest)
```

## Common tasks

| Command | What it does |
|---------|--------------|
| `pnpm build` | Build all packages via Turborepo |
| `pnpm dev` | Watch-build core + adapters |
| `pnpm test` | Unit tests (pure planners — fast) |
| `pnpm test:e2e` | Scaffold into temp dirs, install, build (slow) |
| `pnpm lint` | Biome lint + format check |
| `pnpm lint:fix` | Apply Biome fixes |
| `pnpm changeset` | Record a changeset for your change |

## Running the CLI locally

```bash
# Link the local build and try create-solvrae against a scratch dir
pnpm --filter create-solvrae build
node packages/create-solvrae/dist/bin.js /tmp/scratch-app -t next --pm pnpm

# Or test add-template against a generated repo
cd /tmp/scratch-app
node /path/to/solvrae/packages/cli/dist/bin.js add template nuxt
```

## Adding a framework adapter

This is the most valuable contribution. Follow the checklist in
[07 — Framework Adapters](07-framework-adapters.md):

1. Copy `packages/adapters/next` as a starting point.
2. Set `id`, `displayName`, `family`, and the `compatibility` block.
3. Put the app scaffold under `templates/app/`, wiring under `templates/wiring/`.
4. Implement `planApp` / `planWiring` (and `diagnose`) — **return Actions, never
   write to disk directly**.
5. Add a `plan.test.ts` asserting the produced `Action[]`.
6. Register the adapter in the e2e matrix.
7. `pnpm changeset` and open a PR.

## Conventions

- **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`, scoped where
  useful: `feat(adapter-nuxt): …`).
- **TypeScript strict**; no `any` without justification; validate external data
  with Zod.
- **Planners stay pure.** If you find yourself doing I/O in a planner, move it to
  an Action + the executor.
- **No cross-adapter imports.** Shared logic goes to `@solvrae/core` or
  `@solvrae/ui-templates`.
- Every user-facing change includes a **changeset** and, where relevant, docs.

## Pull request flow

1. Branch off `main`.
2. Make the change + tests + changeset.
3. Ensure `pnpm lint && pnpm test` pass; run `pnpm test:e2e` for adapter changes.
4. Open a PR; CI runs the lint/unit/e2e matrix.
5. A maintainer reviews; on merge, Changesets opens/updates the release PR.

## Reporting issues

Include: command run, package manager + version, Node version, the template(s)
involved, and the output of `solvrae doctor` if it's an existing repo. A minimal
reproduction (or the generated repo) speeds things up enormously.

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/).
Be respectful and constructive.
