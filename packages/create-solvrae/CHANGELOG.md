# create-solvrae

## 0.1.0

### Minor Changes

- e634280: M1 — React/Next vertical slice. Add `@solvrae/ui-templates` (the shared `ui-theme`
  design-system package + a component-only `ui-react` package with `cn` and a starter
  Button), `@solvrae/adapter-next` (the Next.js framework adapter), and the
  `create-solvrae` bootstrapper that composes base repo → theme → ui → app → wiring →
  install. `npx create-solvrae -t next` scaffolds a Turborepo whose Next app builds
  end-to-end with Tailwind v4 and the shared theme.
- 3856ccd: Add registry-backed version resolution. Adapters now declare dependencies as
  `{ range, baseline }`; at scaffold time the engine queries the npm registry for the
  highest version satisfying the range and writes it as an **exact pin**, falling back
  to the baseline when the registry is unreachable. Adds `VersionResolver`,
  `createRegistryResolver`, `offlineResolver`, and `resolveAll` to `@solvrae/core`
  (depends on `semver`); adapter planning methods may now be async; `create-solvrae`
  gains `--offline`. Generated repos get the latest known-good versions, reproducibly.

### Patch Changes

- 6ff4d21: M2 — `solvrae add template`. Add `@solvrae/scaffold` (shared adapter registry +
  `planInit`/`planAddTemplate` orchestration, refactored out of `create-solvrae`),
  `@solvrae/adapter-vite-react` (a second React-family adapter), and the in-repo
  `solvrae` CLI with `add template <id>`, `list`, and `doctor`. `add template` is
  reuse-aware and idempotent: a template whose UI family already has a
  `packages/ui-<family>` reuses it instead of creating a duplicate — verified
  end-to-end (`init next` → `add template vite-react` reuses `ui-react`; both apps
  build).
- Updated dependencies [c596bf7]
- Updated dependencies [9f03a9e]
- Updated dependencies [41b966a]
- Updated dependencies [e8ff78a]
- Updated dependencies [e497106]
- Updated dependencies [6ff4d21]
- Updated dependencies [a01e2c2]
- Updated dependencies [61636f8]
- Updated dependencies [3856ccd]
  - @solvrae/scaffold@0.1.0
  - @solvrae/core@0.1.0
