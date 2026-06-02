import {
  type AdapterContext,
  type PackageManager,
  type Plan,
  type VersionResolver,
  createMemoryLogger,
  offlineResolver,
  runInstall,
} from '@solvrae/core';
import { planThemePackage, planUiPackage, uiPackageName } from '@solvrae/ui-templates';
import { resolveAdapter } from './adapters';
import { planBaseRepo } from './base';

/** Pinned fallbacks used only when the live pm version can't be detected. */
const FALLBACK_PM_VERSION: Record<PackageManager, string> = {
  pnpm: '9.15.0',
  npm: '10.9.0',
  yarn: '4.6.0',
  bun: '1.2.0',
};

export interface InitOptions {
  /** Absolute target directory. */
  repoRoot: string;
  projectName: string;
  appName: string;
  scope: string;
  packageManager: PackageManager;
  /** Full `name@version` spec for the root `packageManager` field. */
  packageManagerSpec?: string;
  /** Version resolver (registry-backed online; defaults to offline/baseline). */
  resolver?: VersionResolver;
  templateId: string;
  install: boolean;
}

/** Compose the full init plan: base repo → theme → ui package → app → wiring → install. */
export async function planInit(opts: InitOptions): Promise<Plan> {
  const adapter = resolveAdapter(opts.templateId);
  const { family } = adapter;
  const uiPackage = uiPackageName(family);
  const packageManagerSpec =
    opts.packageManagerSpec ?? `${opts.packageManager}@${FALLBACK_PM_VERSION[opts.packageManager]}`;

  const ctx: AdapterContext = {
    repoRoot: opts.repoRoot,
    versions: opts.resolver ?? offlineResolver,
    run: {
      cwd: opts.repoRoot,
      repoRoot: opts.repoRoot,
      packageManager: opts.packageManager,
      scope: opts.scope,
      dryRun: false,
      logger: createMemoryLogger(),
    },
  };

  const [appActions, wiringActions] = await Promise.all([
    adapter.planApp(ctx, { name: opts.appName, scope: opts.scope, typescript: true }),
    adapter.planWiring(ctx, { appName: opts.appName, scope: opts.scope, uiPackage }),
  ]);

  const actions = [
    ...planBaseRepo({
      repoRoot: opts.repoRoot,
      projectName: opts.projectName,
      scope: opts.scope,
      packageManager: opts.packageManager,
      packageManagerSpec,
    }),
    ...planThemePackage({ repoRoot: opts.repoRoot, scope: opts.scope }),
    ...planUiPackage(family, { repoRoot: opts.repoRoot, scope: opts.scope }),
    ...appActions,
    ...wiringActions,
  ];

  if (opts.install) {
    actions.push(runInstall(opts.packageManager, opts.repoRoot));
  }

  return {
    summary: `scaffold ${opts.templateId} app "${opts.appName}" in ${opts.projectName}`,
    actions,
  };
}
