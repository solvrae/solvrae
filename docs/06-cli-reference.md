# 06 — CLI Reference

Two binaries: `create-solvrae` (bootstrap a new repo) and `solvrae` (operate on an
existing solvrae repo). Both share global flags and the same engine.

## Common flags

| Flag | Description |
|------|-------------|
| `--pm <pnpm\|npm\|yarn\|bun>` | Force a package manager (otherwise auto-detected) |
| `-y`, `--yes` | Accept defaults, skip prompts (CI mode) |
| `--dry-run` | Print the plan; write nothing |
| `--no-install` | Skip dependency installation |
| `--offline` | Use pinned baseline versions instead of querying the npm registry |

> TypeScript is always the default (and currently the only) language. Planned:
> `--json` machine output and `--cwd`.

---

## `create-solvrae`

Bootstrap a brand-new Turborepo with one framework.

```bash
npm create solvrae@latest          # interactive
npx create-solvrae@latest my-app -t next
pnpm create solvrae my-app --template nuxt --pm pnpm
```

### Usage

```
create-solvrae [directory] [options]
```

| Argument / option | Description |
|-------------------|-------------|
| `[directory]` | Target directory (prompted if omitted) |
| `-t, --template <id>` | `next` \| `vite-react` \| `tanstack-start` \| `nuxt` \| `sveltekit` |
| `--scope <scope>` | Internal package scope, default `@repo` |
| `--pm <pm>` · `--no-install` · `-y` · `--dry-run` · `--offline` | see [common flags](#common-flags) |

### Interactive flow

```
◆  Project directory?  …………………  my-app
◆  Framework template?  › next / vite-react / tanstack-start / nuxt / sveltekit
◆  Package manager?  › pnpm (detected) / npm / yarn / bun
◇  Plan: scaffold next app "web" in my-app  (base · ui-theme · ui-react · app · wire · install)
●  Done. Next: cd my-app && pnpm dev
```

Internally this calls `scaffold.planInit({...})`, which composes the base repo →
shared `ui-theme` → `ui-<family>` package → app → wiring → install.

> **Planned — design-system configuration.** A unified prompt (base color, radius,
> dark mode, icon library; React-only `--base` / `--preset`) is designed in
> [12 — Design System & Configuration](12-design-system-config.md) but **not yet
> implemented** — generated repos currently ship a fixed neutral theme. shadcn's
> own prompts never appear regardless (Solvrae writes `components.json` itself).

---

## `solvrae`

Run inside a generated repo (or via `npx solvrae`).

### `solvrae add template <id>`

Add a framework to the existing monorepo. Reuses an existing
`packages/ui-<family>` when the new template shares a UI family.

```bash
npx solvrae add template nuxt
solvrae add template tanstack-start --name dashboard
```

| Option | Description |
|--------|-------------|
| `--name <name>` | App directory name (defaults to the template id) |
| `--scope <scope>` | Internal scope (inferred from the repo's `ui-theme` when omitted) |
| `--pm <pm>` · `--no-install` · `--dry-run` · `--offline` | see [common flags](#common-flags) |

Behavior:

- New family → scaffolds `apps/<name>` **and** `packages/ui-<family>`, wires both.
- Existing family → scaffolds only `apps/<name>`, wires it to the existing
  `packages/ui-<family>` (the shared `ui-theme` is reused, never duplicated).
- Idempotent: targeting an app directory that already exists is a hard error
  (`PreconditionError`) — pass a different `--name`.

### `solvrae add component <name...>`

Add one or more shadcn components to the repo's UI packages. Resolution is
**family-aware** — see [11 — Component Management](11-component-management.md) for
the full model.

```bash
solvrae add component button                 # 1 family → adds there; >1 → prompts
solvrae add component button card dialog      # multiple at once
solvrae add component button --family vue     # target one family only
solvrae add component button --all            # all families, no prompt
```

| Option | Description |
|--------|-------------|
| `--family <react\|vue\|svelte>` | Target a single UI family (repeatable). Overrides auto-detect |
| `--all` | Add to every present family, skip the prompt |
| `--overwrite` | Overwrite if the component already exists |
| `-y` · `--pm <pm>` · `--dry-run` | see [common flags](#common-flags) |

Each target family is handled by one non-interactive call to its official shadcn
CLI (`shadcn` / `shadcn-vue` / `shadcn-svelte`) pointed at `packages/ui-<family>`.

Default behavior:

| Repo state | Behavior |
|------------|----------|
| One UI family | Adds there directly — no argument needed |
| Multiple families, interactive | **Multiselect** prompt (all pre-selected) |
| Multiple families, `--yes` / CI | Adds to **every** family that has the component |

Per-family availability is reported explicitly (e.g. a component missing from the
`shadcn-vue` registry is skipped with a warning, not a hard failure).

### `solvrae list`

Print the repo's apps, the UI families present, and the available templates.

### `solvrae doctor` / `solvrae doctor --fix`

Diagnose the repo and, with `--fix`, repair it. Current checks:

- the shared `packages/ui-theme` exists;
- each `ui-<family>/components.json` points `tailwind.css` at the shared theme;
- every app consuming a `ui-<family>` package also depends on `@scope/ui-theme`.

Each issue carries a fix Action; `--fix` applies them through the executor (with
the same rollback guarantees as any plan). The safety net for hand-edited repos.

### `solvrae upgrade` — planned

Re-pin/re-wire to the current adapter/shadcn/Tailwind versions with a diff preview.
Not yet implemented.

---

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (bad usage, precondition failed, execution failed, cancelled) |

## Non-interactive / CI

With `-y`/`--yes`, prompts fall back to documented defaults; pass `--pm` and
`--offline` for fully deterministic, network-free runs:

```bash
npx create-solvrae my-app -t next --yes --pm pnpm --offline
```
