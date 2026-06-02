import type { Action, PackageManager } from '@solvrae/core';
import { file, json } from './util';

export interface BaseRepoOptions {
  repoRoot: string;
  projectName: string;
  scope: string;
  packageManager: PackageManager;
  /** Full `name@version` spec for the root `packageManager` field (Turbo needs it). */
  packageManagerSpec: string;
}

const GITIGNORE = `node_modules
dist
.next
.turbo
*.log
.DS_Store
*.tsbuildinfo
`;

const BASE_TSCONFIG = {
  $schema: 'https://json.schemastore.org/tsconfig',
  display: 'Base',
  compilerOptions: {
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    isolatedModules: true,
    moduleDetection: 'force',
    declaration: false,
  },
};

const NEXTJS_TSCONFIG = {
  $schema: 'https://json.schemastore.org/tsconfig',
  display: 'Next.js',
  extends: './base.json',
  compilerOptions: {
    lib: ['dom', 'dom.iterable', 'esnext'],
    target: 'ES2022',
    module: 'esnext',
    moduleResolution: 'bundler',
    jsx: 'preserve',
    allowJs: true,
    incremental: true,
    noEmit: true,
  },
};

const REACT_LIBRARY_TSCONFIG = {
  $schema: 'https://json.schemastore.org/tsconfig',
  display: 'React Library',
  extends: './base.json',
  compilerOptions: {
    lib: ['es2022', 'dom', 'dom.iterable'],
    target: 'ES2022',
    module: 'esnext',
    moduleResolution: 'bundler',
    jsx: 'react-jsx',
    noEmit: true,
  },
};

function readme(projectName: string, pm: PackageManager): string {
  return `# ${projectName}

Scaffolded with [Solvrae](https://github.com/solvrae/solvrae) — a cross-framework
Turborepo with shadcn/ui, wired and ready.

## Layout

- \`apps/*\` — your applications
- \`packages/ui-theme\` — the single shared design system (\`styles.css\`)
- \`packages/ui-react\` — shadcn/ui components (React family)
- \`packages/typescript-config\` — shared tsconfig presets

## Develop

\`\`\`bash
${pm} install
${pm} run dev
\`\`\`

## Add another framework

\`\`\`bash
${pm} dlx solvrae add template vite-react
\`\`\`
`;
}

/** Scaffold the base Turborepo (root manifest, turbo.json, workspace, tsconfig presets). */
export function planBaseRepo(opts: BaseRepoOptions): Action[] {
  const { repoRoot, projectName, scope, packageManager, packageManagerSpec } = opts;
  const isPnpm = packageManager === 'pnpm';

  const rootPkg: Record<string, unknown> = {
    name: projectName,
    version: '0.0.0',
    private: true,
    packageManager: packageManagerSpec,
    scripts: {
      dev: 'turbo run dev',
      build: 'turbo run build',
      typecheck: 'turbo run typecheck',
    },
    devDependencies: { turbo: '^2.3.3' },
  };
  if (!isPnpm) rootPkg.workspaces = ['apps/*', 'packages/*'];

  const turboJson = {
    $schema: 'https://turbo.build/schema.json',
    tasks: {
      build: {
        dependsOn: ['^build'],
        outputs: [
          '.next/**',
          '!.next/cache/**',
          '.output/**',
          '.svelte-kit/**',
          'build/**',
          'dist/**',
        ],
      },
      dev: { cache: false, persistent: true },
      typecheck: { dependsOn: ['^build'] },
    },
  };

  const tsConfigPkg = {
    name: `${scope}/typescript-config`,
    version: '0.0.0',
    private: true,
    files: ['base.json', 'nextjs.json', 'react-library.json'],
    exports: {
      './base.json': './base.json',
      './nextjs.json': './nextjs.json',
      './react-library.json': './react-library.json',
    },
  };

  const actions: Action[] = [
    file(repoRoot, 'package.json', json(rootPkg)),
    file(repoRoot, 'turbo.json', json(turboJson)),
    file(repoRoot, '.gitignore', GITIGNORE),
    file(repoRoot, 'README.md', readme(projectName, packageManager)),
    file(repoRoot, 'packages/typescript-config/package.json', json(tsConfigPkg)),
    file(repoRoot, 'packages/typescript-config/base.json', json(BASE_TSCONFIG)),
    file(repoRoot, 'packages/typescript-config/nextjs.json', json(NEXTJS_TSCONFIG)),
    file(repoRoot, 'packages/typescript-config/react-library.json', json(REACT_LIBRARY_TSCONFIG)),
  ];

  if (isPnpm) {
    actions.push(
      file(repoRoot, 'pnpm-workspace.yaml', 'packages:\n  - "apps/*"\n  - "packages/*"\n'),
    );
  }

  return actions;
}
