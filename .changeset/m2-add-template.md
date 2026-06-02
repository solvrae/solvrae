---
"solvrae": minor
"@solvrae/scaffold": minor
"@solvrae/adapter-vite-react": minor
"create-solvrae": patch
---

M2 — `solvrae add template`. Add `@solvrae/scaffold` (shared adapter registry +
`planInit`/`planAddTemplate` orchestration, refactored out of `create-solvrae`),
`@solvrae/adapter-vite-react` (a second React-family adapter), and the in-repo
`solvrae` CLI with `add template <id>`, `list`, and `doctor`. `add template` is
reuse-aware and idempotent: a template whose UI family already has a
`packages/ui-<family>` reuses it instead of creating a duplicate — verified
end-to-end (`init next` → `add template vite-react` reuses `ui-react`; both apps
build).
