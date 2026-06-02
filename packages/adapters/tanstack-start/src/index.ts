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
  '@tanstack/react-router': { range: '^1', baseline: '1.170.10' },
  '@tanstack/react-start': { range: '^1', baseline: '1.168.18' },
  react: { range: '^19', baseline: '19.2.7' },
  'react-dom': { range: '^19', baseline: '19.2.7' },
};

const DEV_DEPS: Record<string, DependencySpec> = {
  '@tailwindcss/vite': { range: '^4', baseline: '4.0.0' },
  '@types/node': { range: '^22', baseline: '22.10.0' },
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
      dev: 'vite dev',
      build: 'vite build',
      start: 'node .output/server/index.mjs',
    },
    dependencies: deps,
    devDependencies: {
      [`${scope}/typescript-config`]: 'workspace:*',
      ...devDeps,
    },
  });

  const viteConfig = `import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tanstackStart(), viteReact(), tailwindcss()],
});
`;

  const tsconfig = json({
    extends: `${scope}/typescript-config/react-library.json`,
    include: ['src'],
    exclude: ['node_modules', 'dist'],
  });

  const router = `import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
  });
}
`;

  const rootRoute = `import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import appCss from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Solvrae × TanStack Start' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
`;

  const indexRoute = `import { createFileRoute } from '@tanstack/react-router';
import { Button } from '${reactPkg}/components/button';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Solvrae × TanStack Start</h1>
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
/.output
/.tanstack
/node_modules
src/routeTree.gen.ts
*.tsbuildinfo
`;

  return [
    file(repoRoot, `${dir}/package.json`, packageJson),
    file(repoRoot, `${dir}/vite.config.ts`, viteConfig),
    file(repoRoot, `${dir}/tsconfig.json`, tsconfig),
    file(repoRoot, `${dir}/.gitignore`, gitignore),
    file(repoRoot, `${dir}/src/router.tsx`, router),
    file(repoRoot, `${dir}/src/styles.css`, indexCss),
    file(repoRoot, `${dir}/src/routes/__root.tsx`, rootRoute),
    file(repoRoot, `${dir}/src/routes/index.tsx`, indexRoute),
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
  id: 'tanstack-start',
  displayName: 'TanStack Start',
  family: 'react',
  compatibility: {
    framework: '^1',
    tailwind: '^4',
    shadcn: '>=2',
  },
  planApp,
  planWiring,
};

export default adapter;
