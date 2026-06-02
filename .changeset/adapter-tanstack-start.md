---
"@solvrae/adapter-tanstack-start": minor
"@solvrae/scaffold": patch
---

Add `@solvrae/adapter-tanstack-start` (TanStack Start, React family) and register
it in the scaffold adapter registry. Completes the M2 React-family set: `next`,
`vite-react`, and `tanstack-start` all reuse a single `ui-react` package. Verified
end-to-end — `add template tanstack-start` reuses `ui-react`, and the generated app
builds (client + SSR) alongside the existing Next app.
