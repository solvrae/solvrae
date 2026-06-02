# 11 — Component Management

How users add shadcn components **after** the repo is scaffolded. This is a
distinct concern from `add template` (which adds frameworks/UI packages); here we
add *components* into existing UI packages.

## The mental model: family, not framework

shadcn ships components **per UI family**, each from its own registry:

| UI family | Registry | CLI |
|-----------|----------|-----|
| `react` | `shadcn/ui` | `shadcn` |
| `vue` | `shadcn-vue` | `shadcn-vue` |
| `svelte` | `shadcn-svelte` | `shadcn-svelte` |

A `button` exists in all three, but they are **different source files** (TSX vs
Vue SFC vs Svelte). The component code is identical across meta-frameworks within a
family — a React `button.tsx` is the same whether consumed by Next, TanStack
Start, or Vite-React. That is exactly why components live in `packages/ui-<family>`
and are shared across every app of that family.

> **Why shadcn's docs "differ per framework" — and why it doesn't break us.**
> Those differences are almost entirely **app-side setup** (Tailwind content,
> alias resolution, CSS import, `transpilePackages` / `build.transpile`, Vite
> config). That layer is owned by **adapters**, not by the component. The
> component layer is family-level and shareable. See
> [02 — Architecture](02-architecture.md) and
> [05 — Generated Output](05-generated-output.md).

## Command behavior (hybrid)

```bash
solvrae add component <name...> [--family <f>] [--all] [--overwrite]
```

The default is auto-detection with safe disambiguation:

| Repo state | Behavior |
|------------|----------|
| One UI family present | Add to that family directly — no argument required |
| Multiple families, interactive | **Multiselect** prompt, all families pre-selected |
| Multiple families, `--yes` / CI | Add to **every** family that has the component |
| `--family vue` (repeatable) | Target only the named family/families |
| `--all` | Force all families, skip the prompt |

This is the synthesis of the two candidate UXes: auto-detect as the foundation
(convenience, keeps families in sync), with an explicit `--family` escape hatch and
a prompt whenever the target is ambiguous.

### Partial availability is normal

`shadcn-vue` and `shadcn-svelte` track `shadcn/ui` but lag behind. A component may
not exist in every registry. The command treats this gracefully:

```
$ solvrae add component sidebar
✓ ui-react   sidebar  (shadcn/ui)
✓ ui-vue     sidebar  (shadcn-vue)
⚠ ui-svelte  sidebar  not found in shadcn-svelte registry — skipped
```

A missing component in one family is a **warning, not a failure**. Exit code stays
`0` unless *every* targeted family failed.

## Where files land (the three correctness rules)

1. **Per-family registry/CLI.** Each family is processed with its own registry and
   resolver. The operation runs with `cwd` (or `--cwd`) pointed at the UI package
   so files land **inside `packages/ui-<family>`**, never in an app.
2. **Tailwind v4 tokens go to the shared theme.** Components that introduce CSS
   variables write them into the single `packages/ui-theme/styles.css` (the
   `@theme` block), not an app's global stylesheet. This is automatic because each
   `components.json` `tailwind.css` points at `@repo/ui-theme` (see
   [12 — Design System & Configuration](12-design-system-config.md)).
3. **Framework-specific blocks are the exception.** A few shadcn *blocks* (not
   primitives) reference framework APIs like `next/link` or `next/image`. These are
   flagged: such blocks belong to an app, not a shared family package, and the CLI
   warns rather than placing framework-coupled code into a shared package.

## Implementation approach (and the honest trade-off)

For *scaffolding*, Solvrae's rule is "program against contracts, don't wrap the
CLI" (see [08 — Compatibility & Maintainability](08-compatibility-and-maintainability.md)).
Component adding is the **one place we relax that**, because shadcn's dependency
resolution (`registryDependencies`, npm deps, CSS tokens) is exactly what shadcn
maintains best and is costly to re-implement per family.

**Shipped today:** Solvrae delegates to each family's official CLI. For every
target family it runs one non-interactive invocation —
`<pm> dlx <cli> add <names> --cwd packages/ui-<family> --yes` — where `<cli>` is
`shadcn` / `shadcn-vue` / `shadcn-svelte`. Solvrae owns the uniform UX (family
detection, multiselect, partial-availability tolerance); the upstream CLI owns the
fetch + resolution. `--dry-run` prints the commands.

For this to work, generated UI packages carry:

- **tsconfig `baseUrl` + `paths`** (`@scope/ui-<family>/* → ./src/*`) so the CLIs
  resolve component aliases into the package;
- **component directories** (`<name>/index`) for Vue/Svelte (React uses single
  files), matching each CLI's layout so imports are uniform
  (`@scope/ui-<family>/components/<name>`);
- for **`ui-svelte`**, `svelte` + `tailwindcss` devDependencies — shadcn-svelte's
  CLI requires both to be resolvable from the package.

**Planned:** a registry-first path (fetch the registry JSON, validated with Zod,
and write files ourselves) to make `add component` offline-capable and fully
`--dry-run`-able without shelling out.

## `solvrae doctor` integration (planned)

A future check can surface component-level drift — a component present in
`ui-react` but missing from `ui-vue` when both families exist — and offer an
`add component --family vue` fix. (Today `doctor` checks repo-level wiring; see
[06 — CLI Reference](06-cli-reference.md).)
