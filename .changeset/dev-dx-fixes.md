---
"@solvrae/scaffold": patch
"@solvrae/adapter-nuxt": patch
"@solvrae/adapter-next": patch
"@solvrae/adapter-vite-react": patch
"@solvrae/adapter-sveltekit": patch
"@solvrae/adapter-tanstack-start": patch
---

Dev DX fixes for the generated repo:

- Generated `turbo.json` now sets `"ui": "tui"`, so `pnpm dev` shows Turborepo's
  interactive two-pane terminal (workspace list + per-workspace logs) instead of
  interleaved output.
- The Nuxt adapter sets `telemetry: false`, removing the interactive telemetry
  prompt that blocked `nuxt dev` on stdin (the dev server appeared to hang).
- Each app's `dev` script now binds a distinct port (next 3000, nuxt 3001,
  vite-react 5173, sveltekit 5174, tanstack-start 5175) so `pnpm dev` starts every
  app without port collisions.
