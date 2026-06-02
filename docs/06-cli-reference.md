# 06 — CLI Reference

Two binaries: `create-solvrae` (bootstrap a new repo) and `solvrae` (operate on an
existing solvrae repo). Both share global flags and the same engine.

## Global flags

| Flag | Description |
|------|-------------|
| `--pm <pnpm\|npm\|yarn\|bun>` | Force a package manager (otherwise auto-detected) |
| `--ts` / `--js` | Language; **TypeScript is the default** |
| `--yes`, `-y` | Accept all defaults, skip prompts (CI mode) |
| `--dry-run` | Print the Plan; write nothing |
| `--json` | Machine-readable output |
| `--no-install` | Skip dependency installation |
| `--cwd <path>` | Run as if in `<path>` |
| `--verbose` | Debug logging |

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
| `-t, --template <id>` | `next` \| `nuxt` \| `sveltekit` \| `tanstack-start` \| … |
| `--scope <scope>` | Internal package scope, default `@repo` |
| `--base-color <c>` | `neutral` (default) \| `zinc` \| `stone` \| `slate` \| `gray` |
| `--radius <r>` | Border radius token, default `0.5rem` |
| `--dark` / `--no-dark` | Dark mode (default: on) |
| `--icon <lib>` | Icon library, default `lucide` |
| `--base <radix\|base>` | React-only: shadcn base primitive (Radix or Base UI) |
| `--preset <code>` | React-only: shadcn design-system preset code |
| `--git` / `--no-git` | Initialize a git repo (default: yes) |

### Interactive flow

```
◆  Project name?  ……………………  my-app
◆  Which framework template?
   › Next.js   (React)
     Nuxt      (Vue)
     SvelteKit (Svelte)
     TanStack Start (React)
◆  Language?  › TypeScript (recommended) / JavaScript
◆  Package manager?  › pnpm (detected) / npm / yarn / bun
◆  Internal package scope?  ……  @repo
─ Design system (asked once, written to every UI package) ──
◆  Base color?       › Neutral (default) / Zinc / Stone / Slate / Gray
◆  Border radius?    › 0.5rem (default) / …
◆  Dark mode?        › Yes / No
◆  Icon library?     › Lucide (default) / Radix Icons
◇  Plan: create base repo · apps/web (next) · packages/ui-react · wire · install
●  Done. Next: cd my-app && pnpm dev
```

> shadcn's **own** interactive prompts do **not** appear — Solvrae asks a unified,
> family-neutral set once and writes them into each `components.json`. See
> [12 — Design System & Configuration](12-design-system-config.md). React-only
> options (`--base`, `--preset`) apply to the React family only.

This maps internally to `core.init({...})`, which runs the base scaffold + a
single `add template` for the chosen framework.

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
| `--name <name>` | App directory name (default derived from template, deduped) |
| `--reuse-ui` / `--fresh-ui` | Force reuse / force a new UI package for the family |

Behavior:

- New family → scaffolds `apps/<name>` **and** `packages/ui-<family>`, wires both.
- Existing family → scaffolds only `apps/<name>`, wires it to the existing
  `packages/ui-<family>`.
- Idempotent: re-running with an existing app name is a no-op (or `--force`).

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
| `--all` | Add to every family that has the component, skip the prompt |
| `--overwrite` | Overwrite if the component already exists |

Default behavior:

| Repo state | Behavior |
|------------|----------|
| One UI family | Adds there directly — no argument needed |
| Multiple families, interactive | **Multiselect** prompt (all pre-selected) |
| Multiple families, `--yes` / CI | Adds to **every** family that has the component |

Per-family availability is reported explicitly (e.g. a component missing from the
`shadcn-vue` registry is skipped with a warning, not a hard failure).

### `solvrae list`

Show templates installed in this repo and which UI family each maps to, plus
available templates not yet added.

### `solvrae doctor`

Diagnose a repo: detect missing wiring (e.g. a UI package not in an app's Tailwind
sources, a missing `transpilePackages` entry, drifted `components.json`) and
optionally `--fix` them. This is the safety net for repos edited by hand or
upgraded.

### `solvrae upgrade`

Re-run the wiring for the current adapter/shadcn/Tailwind versions — used when a
new adapter release adjusts conventions (e.g. Tailwind v4 → v5). Shows a diff and
asks before applying.

---

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Generic error |
| `2` | Invalid usage / bad flags |
| `3` | Precondition failed (e.g. `add` outside a solvrae repo) |
| `130` | Cancelled by user (Ctrl-C) |

## Non-interactive / CI

All prompts have flag equivalents. With `--yes`, missing values fall back to
documented defaults. `--json` emits the Plan and result for scripting:

```bash
npx create-solvrae my-app -t next --yes --pm pnpm --json
```
