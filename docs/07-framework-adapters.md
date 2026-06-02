# 07 — Framework Adapters

An **adapter** teaches Solvrae how to scaffold and wire one framework. Adapters are
the only place framework-specific knowledge lives. Adding support for a new
framework = writing one adapter package; the core never changes.

## The contract

```ts
import {
  type Action,           // declarative plan action
  type AdapterContext,   // run context + repoRoot + version resolver
  type AppOptions,
  type DependencySpec,   // { range, baseline }
  type FrameworkAdapter,
  type MaybePromise,     // T | Promise<T>
  type UiFamily,         // 'react' | 'vue' | 'svelte' | 'solid'
  type WiringOptions,
  resolveAll,            // resolve { name: spec } → { name: exactVersion }
  specs,                 // shared specs: specs.REACT, specs.TAILWINDCSS, …
} from '@solvrae/core';

export interface FrameworkAdapter {
  /** Stable id used on the CLI: `-t <id>`, `add template <id>`. */
  readonly id: string;                 // 'next'
  readonly displayName: string;        // 'Next.js'

  /** UI family this template consumes — drives ui-<family> reuse. */
  readonly family: UiFamily;           // 'react'

  /** Versions this adapter is verified against. */
  readonly compatibility: {
    framework: string;                 // semver range, e.g. '>=16 <17'
    tailwind: string;                  // '^4'
    shadcn: string;                    // registry/CLI version range
  };

  /**
   * Plan the app scaffold in apps/<name>. Returns Actions (no disk writes); may be
   * async because it resolves dependency versions via `ctx.versions`.
   */
  planApp(ctx: AdapterContext, opts: AppOptions): MaybePromise<Action[]>;

  /** Plan how the app consumes ui-theme + ui-<family>. */
  planWiring(ctx: AdapterContext, opts: WiringOptions): MaybePromise<Action[]>;

  /** Optional framework-specific tweaks to the UI package. */
  planUiPackageOverrides?(ctx: AdapterContext, opts: UiPackageOptions): MaybePromise<Action[]>;

  /** Optional diagnostics (reserved for `doctor`; not yet wired). */
  diagnose?(ctx: AdapterContext): Promise<Diagnostic[]>;
}
```

`AdapterContext` carries `{ run, repoRoot, versions }` — `versions` is a
`VersionResolver` (registry-backed online, baseline offline). The UI package itself
is **not** the adapter's job — it comes from `@solvrae/ui-templates` keyed by
`family`, so every React adapter shares an identical `ui-react`. The adapter only
contributes the *app* and the *wiring*.

## Anatomy of an adapter package

File contents are generated programmatically (template strings → Actions), not
copied from a `templates/` directory:

```
adapters/next/
├─ src/index.ts          # default export implementing FrameworkAdapter
├─ src/index.test.ts     # assert the Action[] for given inputs (pure, fast)
├─ tsconfig.json  tsup.config.ts
└─ package.json          # depends on @solvrae/core
```

## Example: what the Next adapter does

```ts
const RUNTIME_DEPS: Record<string, DependencySpec> = {
  next: { range: '>=16 <17', baseline: '16.2.7' },
  react: specs.REACT,            // shared, security-floored spec
  'react-dom': specs.REACT_DOM,
};

async function planApp(ctx, opts) {
  const deps = await resolveAll(ctx.versions, RUNTIME_DEPS);  // → exact versions
  // emit writeFile actions: package.json (deps), next.config.ts (transpilePackages
  // for @scope/ui-theme + @scope/ui-react), app/globals.css (@import the theme +
  // @source the ui-react sources), app/page.tsx (imports @scope/ui-react/components/button)
  return actions;
}

function planWiring(ctx, opts) {
  // addDependency on apps/<name>/package.json: @scope/ui-theme + @scope/<uiPackage>
  return [addDependency(/* … */)];
}
```

The Nuxt adapter is structurally identical but targets `nuxt.config.ts`
(`build.transpile`, `css`) with `family: 'vue'` → reuses/creates `ui-vue`; the
SvelteKit adapter targets `vite.config.ts` + `svelte.config.js` with
`family: 'svelte'`.

## Adapter resolution & loading

- Adapters are registered by id in `@solvrae/scaffold`'s `ADAPTERS` map; the engine
  (`@solvrae/core`) never imports an adapter.
- Each adapter declares a `compatibility` block so future `doctor` / `upgrade` can
  warn when a framework version drifts outside the verified range.
- **Planned:** discover **third-party adapters** by naming convention
  (`@scope/solvrae-adapter-<id>` / `solvrae-adapter-<id>`) for a plugin ecosystem
  without touching the registry.

## Authoring a new adapter (checklist)

1. Copy an existing adapter (e.g. `adapters/vite-react`) as a starting point.
2. Set `id`, `displayName`, `family`, and `compatibility`.
3. Implement `planApp` / `planWiring` — return Actions only; resolve versions with
   `resolveAll(ctx.versions, …)` reusing `specs.*` for shared deps.
4. Register it in `@solvrae/scaffold`'s `ADAPTERS` map (+ add as a dependency).
5. Add a `src/index.test.ts` asserting the produced `Action[]`.
6. Verify a generated app builds (scaffold into a temp dir, install, build).
7. Add a changeset.

> A `gen:adapter` generator is planned dev tooling.

## Design rules for adapters

- **Return Actions, never touch disk.** Keeps adapters pure and testable and lets
  `--dry-run` work everywhere.
- **Reuse `specs.*` for shared deps** (react, tailwind, vite, typescript) so a
  security/version bump happens in one place (`@solvrae/core/specs`).
- **No cross-adapter imports.** Shared logic belongs in `@solvrae/core`,
  `@solvrae/scaffold`, or `@solvrae/ui-templates`.
- **Pin and declare versions.** The `compatibility` block is mandatory.
