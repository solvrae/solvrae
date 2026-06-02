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

/** Runtime deps, with the range we support and a known-good offline baseline. */
const RUNTIME_DEPS: Record<string, DependencySpec> = {
  next: { range: '>=16 <17', baseline: '16.2.7' },
  react: { range: '^19', baseline: '19.2.7' },
  'react-dom': { range: '^19', baseline: '19.2.7' },
};

const DEV_DEPS: Record<string, DependencySpec> = {
  '@tailwindcss/postcss': { range: '^4', baseline: '4.0.0' },
  '@types/node': { range: '^22', baseline: '22.10.0' },
  '@types/react': { range: '^19', baseline: '19.2.0' },
  '@types/react-dom': { range: '^19', baseline: '19.2.0' },
  tailwindcss: { range: '^4', baseline: '4.0.0' },
  typescript: { range: '^5.7', baseline: '5.7.2' },
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
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      typecheck: 'tsc --noEmit',
    },
    dependencies: deps,
    devDependencies: {
      [`${scope}/typescript-config`]: 'workspace:*',
      ...devDeps,
    },
  });

  const nextConfig = `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['${themePkg}', '${reactPkg}'],
};

export default nextConfig;
`;

  const postcss = `const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
`;

  const tsconfig = json({
    extends: `${scope}/typescript-config/nextjs.json`,
    compilerOptions: {
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  });

  const nextEnv = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited.
`;

  const layout = `import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Solvrae App',
  description: 'Scaffolded with Solvrae',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

  // Bare-package import of the shared theme; @source makes Tailwind v4 scan the
  // ui-react component sources so their classes are generated.
  const globals = `@import "${themePkg}/styles.css";
@source "../../../packages/ui-react/src";
`;

  const page = `import { Button } from '${reactPkg}/components/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Solvrae × Next.js</h1>
      <p className="text-muted-foreground">Shared theme + ui-react, wired by Solvrae.</p>
      <Button>Get started</Button>
    </main>
  );
}
`;

  const gitignore = `/.next/
/node_modules
*.tsbuildinfo
next-env.d.ts
`;

  return [
    file(repoRoot, `${dir}/package.json`, packageJson),
    file(repoRoot, `${dir}/next.config.ts`, nextConfig),
    file(repoRoot, `${dir}/postcss.config.mjs`, postcss),
    file(repoRoot, `${dir}/tsconfig.json`, tsconfig),
    file(repoRoot, `${dir}/next-env.d.ts`, nextEnv),
    file(repoRoot, `${dir}/.gitignore`, gitignore),
    file(repoRoot, `${dir}/app/layout.tsx`, layout),
    file(repoRoot, `${dir}/app/globals.css`, globals),
    file(repoRoot, `${dir}/app/page.tsx`, page),
  ];
}

function planWiring(ctx: AdapterContext, opts: WiringOptions): Action[] {
  const { repoRoot } = ctx;
  const pkgPath = join(repoRoot, 'apps', opts.appName, 'package.json');
  return [
    addDependency(pkgPath, [
      { name: `${opts.scope}/ui-theme`, version: 'workspace:*' },
      { name: `${opts.scope}/${opts.uiPackage}`, version: 'workspace:*' },
    ]),
  ];
}

const adapter: FrameworkAdapter = {
  id: 'next',
  displayName: 'Next.js',
  family: 'react',
  compatibility: {
    framework: '>=16 <17',
    tailwind: '^4',
    shadcn: '>=2',
  },
  planApp,
  planWiring,
};

export default adapter;
