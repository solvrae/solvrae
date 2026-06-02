---
"create-solvrae": minor
"@solvrae/ui-templates": minor
"@solvrae/adapter-next": minor
---

M1 — React/Next vertical slice. Add `@solvrae/ui-templates` (the shared `ui-theme`
design-system package + a component-only `ui-react` package with `cn` and a starter
Button), `@solvrae/adapter-next` (the Next.js framework adapter), and the
`create-solvrae` bootstrapper that composes base repo → theme → ui → app → wiring →
install. `npx create-solvrae -t next` scaffolds a Turborepo whose Next app builds
end-to-end with Tailwind v4 and the shared theme.
