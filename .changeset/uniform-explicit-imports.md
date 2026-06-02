---
"@solvrae/ui-templates": minor
"@solvrae/adapter-sveltekit": patch
---

Make UI component imports uniform across families: explicit paths everywhere
(`@scope/ui-<family>/components/<name>`), and drop the Svelte barrel re-export.

shadcn-vue and shadcn-svelte lay components out as directories (`<name>/index.ts`),
while shadcn/ui (React) uses single files. The Vue and Svelte UI packages now emit
their starter `button` as a directory too and expose components via a single
directory-aware export (`"./components/*": ".../*/index.ts"`, with the `svelte`
condition for Svelte). This means newly added components (e.g. `card`, which the
CLIs scaffold as a directory) are importable the same way as the starter — fixing
the previous gap where Svelte's `index.ts` barrel didn't include CLI-added
components, and a latent Vue issue where directory components didn't resolve.
React is unchanged (single-file `*.tsx`). Verified: a polyglot repo where every app
imports `@scope/ui-*/components/<name>` (button + card) builds across all 5 templates.
