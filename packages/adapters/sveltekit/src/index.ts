import { join } from 'node:path';
import {
  type Action,
  type AdapterContext,
  type AppOptions,
  type DependencySpec,
  type FrameworkAdapter,
  type WiringOptions,
  addDependency,
  resolveAll,
  specs,
  writeFile,
} from '@solvrae/core';

function file(repoRoot: string, relativePath: string, contents: string): Action {
  return writeFile(join(repoRoot, relativePath), contents, 'overwrite');
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

// SvelteKit keeps the framework toolchain in devDependencies.
const DEV_DEPS: Record<string, DependencySpec> = {
  '@sveltejs/adapter-node': { range: '>=5 <6', baseline: '5.5.4' },
  '@sveltejs/kit': { range: '>=2 <3', baseline: '2.61.1' },
  '@sveltejs/vite-plugin-svelte': { range: '>=7 <8', baseline: '7.1.2' },
  '@tailwindcss/vite': specs.TAILWIND_VITE,
  '@types/node': specs.TYPES_NODE,
  svelte: specs.SVELTE,
  tailwindcss: specs.TAILWINDCSS,
  typescript: specs.TYPESCRIPT,
  vite: specs.VITE,
};

async function planApp(ctx: AdapterContext, opts: AppOptions): Promise<Action[]> {
  const { repoRoot } = ctx;
  const { scope, name } = opts;
  const dir = `apps/${name}`;
  const themePkg = `${scope}/ui-theme`;
  const sveltePkg = `${scope}/ui-svelte`;

  const devDeps = await resolveAll(ctx.versions, DEV_DEPS);

  const packageJson = json({
    name,
    version: '0.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite dev --port 5174',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: {},
    devDependencies: {
      [`${scope}/typescript-config`]: 'workspace:*',
      ...devDeps,
    },
  });

  const svelteConfig = `import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
  },
};

export default config;
`;

  const viteConfig = `import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
});
`;

  const tsconfig = json({ extends: './.svelte-kit/tsconfig.json' });

  const appHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
`;

  const appCss = `@import "${themePkg}/styles.css";
@source "../../../packages/ui-svelte/src";
`;

  const layout = `<script lang="ts">
import '../app.css';

let { children } = $props();
</script>

{@render children()}
`;

  const page = `<script lang="ts">
import Button from '${sveltePkg}/components/button';
</script>

<main class="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
  <h1 class="text-2xl font-bold">Solvrae × SvelteKit</h1>
  <p class="text-muted-foreground">Reusing the shared ui-svelte package.</p>
  <Button>Get started</Button>
</main>
`;

  const gitignore = `/.svelte-kit
/build
/node_modules
*.tsbuildinfo
`;

  return [
    file(repoRoot, `${dir}/package.json`, packageJson),
    file(repoRoot, `${dir}/svelte.config.js`, svelteConfig),
    file(repoRoot, `${dir}/vite.config.ts`, viteConfig),
    file(repoRoot, `${dir}/tsconfig.json`, tsconfig),
    file(repoRoot, `${dir}/.gitignore`, gitignore),
    file(repoRoot, `${dir}/src/app.html`, appHtml),
    file(repoRoot, `${dir}/src/app.css`, appCss),
    file(repoRoot, `${dir}/src/routes/+layout.svelte`, layout),
    file(repoRoot, `${dir}/src/routes/+page.svelte`, page),
  ];
}

function planWiring(ctx: AdapterContext, opts: WiringOptions): Action[] {
  const pkgPath = join(ctx.repoRoot, 'apps', opts.appName, 'package.json');
  return [
    addDependency(pkgPath, [
      { name: `${opts.scope}/ui-theme`, version: 'workspace:*' },
      { name: `${opts.scope}/${opts.uiPackage}`, version: 'workspace:*' },
    ]),
  ];
}

const adapter: FrameworkAdapter = {
  id: 'sveltekit',
  displayName: 'SvelteKit',
  family: 'svelte',
  compatibility: {
    framework: '>=2 <3',
    tailwind: '^4',
    shadcn: '>=2',
  },
  planApp,
  planWiring,
};

export default adapter;
