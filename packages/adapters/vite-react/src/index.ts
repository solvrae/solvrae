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
  writeFile,
} from '@solvrae/core';

function file(repoRoot: string, relativePath: string, contents: string): Action {
  return writeFile(join(repoRoot, relativePath), contents, 'overwrite');
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const RUNTIME_DEPS: Record<string, DependencySpec> = {
  react: { range: '^19', baseline: '19.2.7' },
  'react-dom': { range: '^19', baseline: '19.2.7' },
};

const DEV_DEPS: Record<string, DependencySpec> = {
  '@tailwindcss/vite': { range: '^4', baseline: '4.0.0' },
  '@types/react': { range: '^19', baseline: '19.2.0' },
  '@types/react-dom': { range: '^19', baseline: '19.2.0' },
  '@vitejs/plugin-react': { range: '^6', baseline: '6.0.2' },
  tailwindcss: { range: '^4', baseline: '4.0.0' },
  typescript: { range: '^5.7', baseline: '5.7.2' },
  vite: { range: '^8', baseline: '8.0.16' },
};

async function planApp(ctx: AdapterContext, opts: AppOptions): Promise<Action[]> {
  const { repoRoot } = ctx;
  const { scope, name } = opts;
  const dir = `apps/${name}`;
  const themePkg = `${scope}/ui-theme`;
  const reactPkg = `${scope}/ui-react`;

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
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      typecheck: 'tsc --noEmit',
    },
    dependencies: deps,
    devDependencies: {
      [`${scope}/typescript-config`]: 'workspace:*',
      ...devDeps,
    },
  });

  const viteConfig = `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`;

  const tsconfig = json({
    extends: `${scope}/typescript-config/react-library.json`,
    compilerOptions: { types: ['vite/client'] },
    include: ['src'],
    exclude: ['node_modules', 'dist'],
  });

  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Solvrae App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

  const viteEnv = '/// <reference types="vite/client" />\n';

  const mainTsx = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
`;

  const appTsx = `import { Button } from '${reactPkg}/components/button';

export function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Solvrae × Vite + React</h1>
      <p className="text-muted-foreground">Reusing the shared ui-react package.</p>
      <Button>Get started</Button>
    </main>
  );
}
`;

  const indexCss = `@import "${themePkg}/styles.css";
@source "../../../packages/ui-react/src";
`;

  const gitignore = `/dist
/node_modules
*.tsbuildinfo
`;

  return [
    file(repoRoot, `${dir}/package.json`, packageJson),
    file(repoRoot, `${dir}/vite.config.ts`, viteConfig),
    file(repoRoot, `${dir}/tsconfig.json`, tsconfig),
    file(repoRoot, `${dir}/index.html`, indexHtml),
    file(repoRoot, `${dir}/.gitignore`, gitignore),
    file(repoRoot, `${dir}/src/vite-env.d.ts`, viteEnv),
    file(repoRoot, `${dir}/src/main.tsx`, mainTsx),
    file(repoRoot, `${dir}/src/App.tsx`, appTsx),
    file(repoRoot, `${dir}/src/index.css`, indexCss),
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
  id: 'vite-react',
  displayName: 'Vite + React',
  family: 'react',
  compatibility: {
    framework: '>=8 <9',
    tailwind: '^4',
    shadcn: '>=2',
  },
  planApp,
  planWiring,
};

export default adapter;
