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

const RUNTIME_DEPS: Record<string, DependencySpec> = {
  nuxt: { range: '>=4 <5', baseline: '4.4.6' },
  vue: specs.VUE,
};

const DEV_DEPS: Record<string, DependencySpec> = {
  '@tailwindcss/vite': specs.TAILWIND_VITE,
  '@types/node': specs.TYPES_NODE,
  tailwindcss: specs.TAILWINDCSS,
  typescript: specs.TYPESCRIPT,
};

async function planApp(ctx: AdapterContext, opts: AppOptions): Promise<Action[]> {
  const { repoRoot } = ctx;
  const { scope, name } = opts;
  const dir = `apps/${name}`;
  const themePkg = `${scope}/ui-theme`;
  const vuePkg = `${scope}/ui-vue`;

  const [deps, devDeps] = await Promise.all([
    resolveAll(ctx.versions, RUNTIME_DEPS),
    resolveAll(ctx.versions, DEV_DEPS),
  ]);

  const packageJson = json({
    name,
    version: '0.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'nuxt dev --port 3001',
      build: 'nuxt build',
      preview: 'nuxt preview',
    },
    dependencies: deps,
    devDependencies: {
      [`${scope}/typescript-config`]: 'workspace:*',
      ...devDeps,
    },
  });

  const nuxtConfig = `import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  // Disable the interactive telemetry prompt so \`dev\` never blocks on stdin.
  telemetry: false,
  css: ['./app/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    transpile: ['${themePkg}', '${vuePkg}'],
  },
});
`;

  const tsconfig = json({ extends: './.nuxt/tsconfig.json' });

  const mainCss = `@import "${themePkg}/styles.css";
@source "../../../../../packages/ui-vue/src";
`;

  const appVue = `<script setup lang="ts">
import Button from '${vuePkg}/components/button';
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
    <h1 class="text-2xl font-bold">Solvrae × Nuxt</h1>
    <p class="text-muted-foreground">Reusing the shared ui-vue package.</p>
    <Button>Get started</Button>
  </main>
</template>
`;

  const gitignore = `/.nuxt
/.output
/.data
/node_modules
/dist
*.tsbuildinfo
`;

  return [
    file(repoRoot, `${dir}/package.json`, packageJson),
    file(repoRoot, `${dir}/nuxt.config.ts`, nuxtConfig),
    file(repoRoot, `${dir}/tsconfig.json`, tsconfig),
    file(repoRoot, `${dir}/.gitignore`, gitignore),
    file(repoRoot, `${dir}/app/app.vue`, appVue),
    file(repoRoot, `${dir}/app/assets/css/main.css`, mainCss),
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
  id: 'nuxt',
  displayName: 'Nuxt',
  family: 'vue',
  compatibility: {
    framework: '>=4 <5',
    tailwind: '^4',
    shadcn: '>=2',
  },
  planApp,
  planWiring,
};

export default adapter;
