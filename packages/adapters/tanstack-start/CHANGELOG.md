# @solvrae/adapter-tanstack-start

## 0.1.0

### Minor Changes

- c596bf7: Add `@solvrae/adapter-tanstack-start` (TanStack Start, React family) and register
  it in the scaffold adapter registry. Completes the M2 React-family set: `next`,
  `vite-react`, and `tanstack-start` all reuse a single `ui-react` package. Verified
  end-to-end — `add template tanstack-start` reuses `ui-react`, and the generated app
  builds (client + SSR) alongside the existing Next app.

### Patch Changes

- 41b966a: Dev DX fixes for the generated repo:

  - Generated `turbo.json` now sets `"ui": "tui"`, so `pnpm dev` shows Turborepo's
    interactive two-pane terminal (workspace list + per-workspace logs) instead of
    interleaved output.
  - The Nuxt adapter sets `telemetry: false`, removing the interactive telemetry
    prompt that blocked `nuxt dev` on stdin (the dev server appeared to hang).
  - Each app's `dev` script now binds a distinct port (next 3000, nuxt 3001,
    vite-react 5173, sveltekit 5174, tanstack-start 5175) so `pnpm dev` starts every
    app without port collisions.

- 61636f8: Centralize shared dependency specs in `@solvrae/core` (`specs`) and pin a React
  security floor. React/react-dom ranges are now `^19.2.4` to exclude the React
  Server Components advisories (CVE-2025-55182 "React2Shell" RCE and the follow-up
  DoS / source-exposure issues, fixed up to 19.2.4); baselines track the latest
  patched release. The three React adapters now source react/tailwind/vite/typescript
  specs from one place, so future security bumps happen in a single file. `ui-react`'s
  peer range tightened to `^19.2.4` (drops React 18). Ranges stay within the current
  major to avoid breaking changes; the online resolver still selects the latest
  patched version within range.
- Updated dependencies [e497106]
- Updated dependencies [a01e2c2]
- Updated dependencies [61636f8]
- Updated dependencies [3856ccd]
  - @solvrae/core@0.1.0
