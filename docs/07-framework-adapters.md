# 07 — Framework Adapters

An **adapter** teaches Solvrae how to scaffold and wire one framework. Adapters are
the only place framework-specific knowledge lives. Adding support for a new
framework = writing one adapter package; the core never changes.

## The contract

```ts
import type {
  AdapterContext,   // services + resolved run context from core
  Action,           // declarative plan actions
  UiFamily,         // 'react' | 'vue' | 'svelte' | 'solid'
} from '@solvrae/core';

export interface FrameworkAdapter {
  /** Stable id used on the CLI: `-t <id>`, `add template <id>`. */
  readonly id: string;                 // 'next'
  readonly displayName: string;        // 'Next.js'

  /** Which shadcn UI family this template consumes — drives package reuse. */
  readonly family: UiFamily;           // 'react'

  /** Versions this adapter is verified against (compatibility matrix). */
  readonly compatibility: {
    framework: string;                 // semver range, e.g. '>=15 <17'
    tailwind: string;                  // '^4'
    shadcn: string;                    // registry/CLI version range
  };

  /** Plan the app scaffold in apps/<name>. Pure: returns Actions, no I/O. */
  planApp(ctx: AdapterContext, opts: AppOptions): Action[];

  /**
   * Plan how the app consumes packages/ui-<family>.
   * Runs whether the UI package is new or reused.
   */
  planWiring(ctx: AdapterContext, opts: WiringOptions): Action[];

  /** Optional: framework-specific tweaks to the UI package itself. */
  planUiPackageOverrides?(ctx: AdapterContext, opts: UiPackageOptions): Action[];

  /** Optional: post-install verification used by `solvrae doctor`. */
  diagnose?(ctx: AdapterContext): Promise<Diagnostic[]>;
}
```

The UI package scaffold itself is **not** the adapter's job — it comes from
`@solvrae/ui-templates` keyed by `family`, so every React adapter produces an
identical `ui-react`. The adapter only contributes the *app* and the *wiring*.

## Anatomy of an adapter package

```
adapters/next/
├─ src/index.ts          # export default adapter: FrameworkAdapter
├─ templates/
│  ├─ app/               # rendered into apps/<name> (ejs for interpolated files)
│  └─ wiring/            # patches/snippets for next.config, globals.css, tsconfig
├─ test/
│  └─ plan.test.ts       # assert the Action[] for given inputs (pure, fast)
└─ package.json          # depends on @solvrae/core (peer) + @solvrae/ui-templates
```

## Example: what the Next adapter does

- **`planApp`** — render the Next app template into `apps/<name>` (App Router,
  TS, `app/globals.css`).
- **`planWiring`** — emit:
  - `addDependency` `@repo/ui-react: workspace:*`
  - `editFile next.config.ts` → ensure `transpilePackages` includes the UI pkg
  - `editFile app/globals.css` → prepend `@import "@repo/ui-react/styles.css"`
  - `mergeJson tsconfig.json` → path alias `@repo/ui-react/*`
- **`diagnose`** — check those four are present; report fixes for `doctor`.

The Nuxt adapter is structurally identical but targets `nuxt.config.ts`
(`build.transpile`, `css`) and `family: 'vue'`, so it reuses/creates `ui-vue`.

## Adapter resolution & loading

- Adapters are resolved by id at runtime; core never statically imports them.
- Built-in adapters ship as dependencies of the `solvrae` CLI; resolution can also
  discover **third-party adapters** by naming convention
  (`@scope/solvrae-adapter-<id>` / `solvrae-adapter-<id>`), enabling a community
  plugin ecosystem without touching core.
- Each adapter declares its `compatibility` block so `solvrae doctor` / `upgrade`
  can warn when a framework version drifts outside the verified range.

## Authoring a new adapter (checklist)

1. `pnpm --filter @solvrae/cli gen:adapter <id>` scaffolds the package (planned dev
   tooling) — or copy `adapters/next` as a starting point.
2. Set `id`, `displayName`, `family`, `compatibility`.
3. Put the app scaffold in `templates/app/`.
4. Implement `planApp` and `planWiring` returning only Actions (no direct I/O).
5. Add `templates/wiring/` snippets/patches.
6. Implement `diagnose` for `doctor` coverage.
7. Add a unit test asserting the Plan and an entry to the e2e matrix
   (scaffold → install → build in a temp dir).
8. Add a changeset.

## Design rules for adapters

- **Return Actions, never touch disk.** Keeps adapters pure and testable and lets
  `--dry-run` work everywhere.
- **Prefer template-owned config over editing generated config.** Edit live config
  files only when the framework forces generated config (e.g. `next.config.ts`).
- **No cross-adapter imports.** Shared logic belongs in `@solvrae/core` or
  `@solvrae/ui-templates`.
- **Pin and declare versions.** Compatibility metadata is mandatory.
