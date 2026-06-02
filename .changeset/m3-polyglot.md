---
"@solvrae/ui-templates": minor
"@solvrae/adapter-nuxt": minor
"@solvrae/adapter-sveltekit": minor
"@solvrae/scaffold": minor
"@solvrae/core": patch
---

M3 — polyglot (Vue + Svelte). Add the `vue` and `svelte` UI families to
`@solvrae/ui-templates` (component-only `ui-vue` / `ui-svelte` with `cn` and a
starter Button, consuming the single shared `ui-theme`), plus `@solvrae/adapter-nuxt`
(Vue, Tailwind v4 via `@tailwindcss/vite` + `build.transpile`) and
`@solvrae/adapter-sveltekit` (Svelte 5, `@tailwindcss/vite`, adapter-node; the
`ui-svelte` package exposes a `svelte` export condition so its raw components
compile). Both are registered in the scaffold registry, and the generated repo's
Turborepo outputs now cover `.output`/`.svelte-kit`/`build`. Also bump `ui` packages
to `tailwind-merge@^3` (Tailwind v4) and add `VUE`/`SVELTE` to core `specs`.

Verified end-to-end: `init next` → `add template nuxt` → `add template sveltekit`
produces one repo where React, Vue, and Svelte apps all share a single `ui-theme`,
and all three build (Next, Nuxt SSR, SvelteKit).
