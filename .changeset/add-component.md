---
"solvrae": minor
"@solvrae/scaffold": minor
"@solvrae/ui-templates": patch
---

Add `solvrae add component <names...>` (docs/11). Resolution is family-aware and
hybrid: one UI family present → adds there directly; multiple → an interactive
multiselect (all pre-selected), or `--all` / `-y` for every family, or `--family`
to target specific ones. Each target family is handled by one non-interactive
invocation of its official shadcn CLI (`shadcn` / `shadcn-vue` / `shadcn-svelte`)
pointed at the matching `packages/ui-<family>` via `--cwd` — Solvrae owns the
uniform UX and per-family availability tolerance (a family that fails is a warning,
not a hard failure; exit is non-zero only if every target failed). Supports
`--overwrite` and `--dry-run`.

To make the CLIs resolve component aliases into the package, generated UI packages
now carry `baseUrl` + `paths` in their tsconfig, and `ui-svelte` declares `svelte`
and `tailwindcss` as devDependencies (shadcn-svelte requires both to be resolvable).
Verified end-to-end: `add component card` lands files in `ui-react`, `ui-vue`, and
`ui-svelte`.
