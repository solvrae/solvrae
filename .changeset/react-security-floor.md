---
"@solvrae/core": minor
"@solvrae/adapter-next": patch
"@solvrae/adapter-vite-react": patch
"@solvrae/adapter-tanstack-start": patch
"@solvrae/ui-templates": patch
---

Centralize shared dependency specs in `@solvrae/core` (`specs`) and pin a React
security floor. React/react-dom ranges are now `^19.2.4` to exclude the React
Server Components advisories (CVE-2025-55182 "React2Shell" RCE and the follow-up
DoS / source-exposure issues, fixed up to 19.2.4); baselines track the latest
patched release. The three React adapters now source react/tailwind/vite/typescript
specs from one place, so future security bumps happen in a single file. `ui-react`'s
peer range tightened to `^19.2.4` (drops React 18). Ranges stay within the current
major to avoid breaking changes; the online resolver still selects the latest
patched version within range.
