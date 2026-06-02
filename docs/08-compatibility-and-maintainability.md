# 08 — Compatibility & Maintainability

Solvrae runs **on top of** shadcn and Turborepo, both of which move fast. This
document is the strategy for staying compatible with minimal ongoing effort —
it's the reason the architecture looks the way it does.

## Threat model: what breaks a scaffolder

| Source of churn | Example | Our containment |
|-----------------|---------|-----------------|
| shadcn registry/`components.json` schema change | new field, new style system | Validate against versioned **Zod schemas**; read registry JSON, never scrape CLI output |
| shadcn CLI prompt/flag change | `add` flags renamed | We don't drive the CLI interactively; we either fetch the registry directly or call it non-interactively with pinned, documented flags |
| Tailwind major (v4 → v5) | config model changes | Tailwind strategy is per-family in `@solvrae/ui-templates`; one update point |
| Framework major (Next 15→16, Nuxt 3→4) | config file / API changes | Contained to **one adapter**; `compatibility` block flags drift |
| Turborepo schema change | `turbo.json` `pipeline`→`tasks` | Base scaffold templates + a single `turbo.json` writer |
| Package-manager differences | workspaces field vs `pnpm-workspace.yaml`, `workspace:*` support | Abstracted behind `@solvrae/core/pm` (`nypm` + detector) |

## The core defenses

### 1. Program against contracts, not behavior

We never parse another tool's human output. Instead we depend on its **stable,
versioned data contracts**:

- shadcn **registry JSON** and **`components.json` schema** (validated with Zod).
- **`turbo.json`** and framework config schemas.

If a contract changes, a schema validation fails loudly in CI against the real
upstream — a clear, localized signal, not a mysterious runtime breakage for users.

> **Current target: shadcn CLI v4 (March 2026).** v4 replaced the `default`/`new-york`
> style enum with **named design-system styles** (Nova, Vega, Sera, …) delivered as
> **presets** (`--preset <code>`) + a **base primitive** choice (`--base radix|base`),
> and added `--monorepo`, `--dry-run`, `--diff`, and `--view`. Because styles are
> encoded in presets, Solvrae exposes `--preset` pass-through rather than hardcoding
> a style list — new styles need no Solvrae change. We track these (see
> [12 — Design System & Configuration](12-design-system-config.md)) and treat
> preset/base as React-family-only, since `shadcn-vue`/`shadcn-svelte` don't expose
> identical mechanisms.

### 2. Per-adapter compatibility matrix

Every adapter declares the versions it's verified against:

```ts
compatibility: { framework: '>=15 <17', tailwind: '^4', shadcn: '>=2 <4' }
```

`solvrae doctor` / `upgrade` compares these against what's installed and warns on
drift. A maintenance dashboard (CI job) tracks, per adapter, the latest upstream
version vs the verified range, so it's obvious what needs attention.

### 3. Pin what we generate

Generated repos get **pinned, known-good** dependency versions resolved at
scaffold time (queried from the npm registry, bounded by the adapter's
compatibility range) — not floating `latest`. Users get a repo that builds today;
upgrades are an explicit, reviewed step.

### 4. E2E "does it actually build" matrix

The strongest guarantee. CI scaffolds each template into a temp dir, installs with
**each package manager**, and runs the framework's `build`. Matrix:

```
{ pnpm, npm, yarn, bun } × { next, nuxt, sveltekit, tanstack-start } × { init, add-template }
```

If shadcn or a framework ships a breaking change, a real build fails in CI before
users ever hit it. A scheduled (nightly) run against upstream `latest` gives early
warning ahead of pinning.

### 5. Idempotent, diff-based wiring + `doctor`

Because wiring is expressed as Actions diffed against current repo state, re-runs
are safe and `solvrae doctor --fix` can repair drift introduced by hand-edits or
framework upgrades. Users aren't locked into never touching their config.

## Code quality standards

- **TypeScript strict** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- **Pure planners** — all decision logic returns `Action[]` and is unit-tested
  without I/O. Side effects live only in the executor.
- **Zod at every boundary** — flags, config files, registry responses, adapter
  metadata.
- **Biome** for one-pass lint+format; enforced in CI.
- **Conventional commits + Changesets** — every user-facing change ships a
  changeset; changelogs and versioning are automated.
- **Small, replaceable dependencies** (see [03](03-tech-stack.md)).

## Upgrade playbook (for maintainers)

When upstream ships a major:

1. Update the affected adapter's templates/wiring and `compatibility` range.
2. Run the e2e matrix for that adapter.
3. If conventions changed for existing users, add an `solvrae upgrade` migration
   and document it.
4. Changeset → release just that adapter.

Core and unaffected adapters don't move — that's the payoff of the split.
