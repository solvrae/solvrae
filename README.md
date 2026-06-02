# Solvrae

> The cross-framework scaffolding engine for shadcn/ui inside Turborepo.

Solvrae generates a fully wired Turborepo monorepo with framework-specific UI
packages (`packages/ui-react`, `packages/ui-vue`, `packages/ui-svelte`, …) that
are pre-configured for [shadcn/ui](https://ui.shadcn.com) and Tailwind CSS — and
keeps working when you add a *second* (or third) framework to the same repo
later on.

```bash
# Scaffold a new monorepo
npx create-solvrae@latest my-app -t next

# …or interactively
npx create-solvrae@latest

# Add another framework to an existing solvrae repo, any time later
npx solvrae add template nuxt
```

No more hand-wiring `components.json`, Tailwind content globs, `transpilePackages`,
workspace `tsconfig` path aliases, and per-framework shadcn registries every time
you spin up a polyglot frontend monorepo.

---

## The problem

Turborepo lets you keep apps built with **different frameworks** — Next.js, Nuxt,
SvelteKit, TanStack Start, Vite — side by side. shadcn/ui is the ideal component
layer because it is copy-paste, Tailwind-based, and has ports for React, Vue, and
Svelte. But making the two cooperate is painful:

- shadcn's own CLI [explicitly assumes a React/Next `ui` package](https://ui.shadcn.com/docs/monorepo)
  and won't configure a non-React workspace out of the box.
- The Vue and Svelte ports (`shadcn-vue`, `shadcn-svelte`) are **separate tools**
  with separate conventions — there is no single orchestrator for a polyglot repo.
- Every framework needs different glue: Tailwind content sources, build
  transpilation, CSS import order, alias resolution, package exports.
- None of the existing starters let you **add a new framework later** without
  redoing the wiring by hand.

Solvrae closes that gap with a single, programmatic, type-safe engine.

## What Solvrae does

1. **Scaffolds the base Turborepo** programmatically (root `package.json`,
   `turbo.json`, workspace manifest, shared TS config, lint config, `.gitignore`).
2. **Creates an app** in `apps/<name>` for the chosen framework.
3. **Creates a framework-family UI package** in `packages/ui-<family>`, wired for
   Tailwind v4 + the correct shadcn registry (`shadcn/ui` for React,
   `shadcn-vue` for Vue, `shadcn-svelte` for Svelte/Solid).
4. **Wires app ↔ UI package** — workspace dependency, TS path aliases, Tailwind
   content globs, framework-specific transpile/optimize settings, base CSS import.
5. **`add template`** repeats steps 2–4 for a new framework, **reusing** an
   existing UI package when the new app shares a UI family (e.g. `next` and
   `tanstack-start` both reuse `ui-react`).

Everything is **package-manager agnostic** (pnpm, npm, yarn, bun) and TypeScript
strict by default.

## Documentation

| Doc | What's inside |
|-----|---------------|
| [01 — Vision & Prior Art](docs/01-vision-and-prior-art.md) | Why this exists, what already exists, the gap we fill |
| [02 — Architecture](docs/02-architecture.md) | Engine + adapter model, design principles, data flow |
| [03 — Tech Stack](docs/03-tech-stack.md) | Every dependency and why it was chosen |
| [04 — Repository Structure](docs/04-repository-structure.md) | How the Solvrae monorepo itself is laid out |
| [05 — Generated Output](docs/05-generated-output.md) | What the user's scaffolded repo looks like |
| [06 — CLI Reference](docs/06-cli-reference.md) | Every command, flag, and prompt |
| [07 — Framework Adapters](docs/07-framework-adapters.md) | The adapter contract — how to add a framework |
| [08 — Compatibility & Maintainability](docs/08-compatibility-and-maintainability.md) | Staying compatible as shadcn & Turborepo evolve |
| [09 — Contributing](docs/09-contributing.md) | Dev setup, conventions, PR & release flow |
| [10 — Roadmap](docs/10-roadmap.md) | Milestones and supported frameworks |
| [11 — Component Management](docs/11-component-management.md) | Adding shadcn components across UI families |
| [12 — Design System & Configuration](docs/12-design-system-config.md) | Base color/radius/preset prompts — and why shadcn's native prompts don't appear |

## Status

🚧 **Pre-alpha / design phase.** This repository currently contains the design
documentation. Implementation tracks the milestones in the
[roadmap](docs/10-roadmap.md).

## License

MIT — see [LICENSE](LICENSE).
