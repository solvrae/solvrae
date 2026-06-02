# 01 — Vision & Prior Art

## Vision

A single CLI that makes a **polyglot frontend monorepo** with **shadcn/ui** feel
like a solved problem. You should be able to start a Turborepo with one framework
and grow it to many, sharing as much of the UI layer as the underlying UI library
allows — without ever hand-editing glue configuration.

Guiding principles:

- **Programmatic, not CLI-wrapping.** We do not shell out to `shadcn` or
  `create-turbo` and hope their interactive output stays stable. We generate and
  edit configuration ourselves, against documented, versioned contracts (registry
  JSON schema, `components.json` schema, `turbo.json` schema). This is the single
  most important decision for long-term maintainability — see
  [08 — Compatibility & Maintainability](08-compatibility-and-maintainability.md).
- **Framework knowledge is isolated.** All framework-specific behavior lives in
  small, independently versioned **adapters**. The core engine knows nothing about
  Next or Nuxt.
- **UI family, not meta-framework, is the unit of sharing.** shadcn ships per UI
  library (React, Vue, Svelte/Solid). Two React meta-frameworks (Next +
  TanStack Start) share one `ui-react` package.
- **Idempotent and additive.** `add template` must be safe to run against an
  existing repo, detect what's already there, and only add what's missing.
- **Package-manager agnostic.** pnpm, npm, yarn, and bun are first-class.
- **Strict TypeScript everywhere**, in both the tool and the generated output.

## Prior art (validated June 2026)

| Project | What it is | Why it doesn't solve this |
|---------|-----------|---------------------------|
| [`shadcn` CLI / monorepo docs](https://ui.shadcn.com/docs/monorepo) | Official scaffolder; `npx shadcn create` added Dec 2025 | Assumes a **React/Next** `ui` package; docs state the CLI won't configure a non-React workspace out of the box |
| [`shadcn-vue`](https://www.shadcn-vue.com/docs/cli) | Vue port with its own `create` command | **Separate** tool, separate conventions; no monorepo orchestration across frameworks |
| [`shadcn-svelte`](https://www.shadcn-svelte.com/docs/installation) | Svelte/Solid port | Same — single-framework, not an orchestrator |
| [`shadcn-web-components`](https://github.com/shcnwc/shadcn-web-components) | Framework-agnostic web components built from shadcn-svelte | Trades native components for web components; not the copy-paste shadcn model most teams want |
| [`dan5py/turborepo-shadcn-ui`](https://github.com/dan5py/turborepo-shadcn-ui) and similar starters | Static Turborepo + shadcn starters | **Static template**, Next-only, no `add template`, no cross-framework story |

### The gap

No tool today:

1. Scaffolds a Turborepo with **per-UI-family** shadcn packages, **and**
2. Lets you **add a new framework later** with full re-wiring, **and**
3. Treats React / Vue / Svelte as **first-class equals** under one orchestrator.

That intersection is Solvrae's reason to exist.

### Name availability

`solvrae` and `create-solvrae` were both unregistered on npm as of June 2026.
Reserve both: `create-solvrae` is the `npm create` entry point, `solvrae` is the
in-repo command (`add template`, `doctor`, etc.).
