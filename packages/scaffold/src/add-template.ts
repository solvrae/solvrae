import {
  type Action,
  type AdapterContext,
  type FileSystem,
  type PackageManager,
  type Plan,
  PreconditionError,
  type UiFamily,
  type VersionResolver,
  createMemoryLogger,
  nodeFileSystem,
  offlineResolver,
  runInstall,
} from '@solvrae/core';
import { planThemePackage, planUiPackage, uiPackageName } from '@solvrae/ui-templates';
import { resolveAdapter } from './adapters';
import { appExists, hasThemePackage, hasUiPackage, inferScope } from './repo';

export interface AddTemplateOptions {
  /** Absolute monorepo root. */
  repoRoot: string;
  templateId: string;
  /** App directory name; defaults to the template id. */
  appName?: string;
  /** Internal scope; inferred from the repo's ui-theme when omitted. */
  scope?: string;
  packageManager: PackageManager;
  resolver?: VersionResolver;
  install: boolean;
  /** Injectable filesystem for repo inspection (defaults to Node). */
  fs?: FileSystem;
}

export interface AddTemplateResult {
  plan: Plan;
  appName: string;
  family: UiFamily;
  uiPackage: string;
  /** True when an existing `packages/ui-<family>` was reused rather than created. */
  reusedUi: boolean;
}

/**
 * Plan adding a framework to an existing Solvrae repo. Additive and reuse-aware:
 * an existing UI package for the template's family is reused; the shared theme is
 * only created if missing; an existing app directory is a hard error (idempotent).
 */
export async function planAddTemplate(opts: AddTemplateOptions): Promise<AddTemplateResult> {
  const fs = opts.fs ?? nodeFileSystem;
  const adapter = resolveAdapter(opts.templateId);
  const { family } = adapter;
  const uiPackage = uiPackageName(family);
  const scope = opts.scope ?? (await inferScope(opts.repoRoot, fs));
  const appName = opts.appName ?? opts.templateId;

  if (await appExists(opts.repoRoot, appName, fs)) {
    throw new PreconditionError(
      `apps/${appName} already exists — choose a different name with --name.`,
    );
  }

  const [reusedUi, themeExists] = await Promise.all([
    hasUiPackage(opts.repoRoot, uiPackage, fs),
    hasThemePackage(opts.repoRoot, fs),
  ]);

  const ctx: AdapterContext = {
    repoRoot: opts.repoRoot,
    versions: opts.resolver ?? offlineResolver,
    run: {
      cwd: opts.repoRoot,
      repoRoot: opts.repoRoot,
      packageManager: opts.packageManager,
      scope,
      dryRun: false,
      logger: createMemoryLogger(),
    },
  };

  const [appActions, wiringActions] = await Promise.all([
    adapter.planApp(ctx, { name: appName, scope, typescript: true }),
    adapter.planWiring(ctx, { appName, scope, uiPackage }),
  ]);

  const actions: Action[] = [];
  if (!themeExists) actions.push(...planThemePackage({ repoRoot: opts.repoRoot, scope }));
  if (!reusedUi) actions.push(...planUiPackage(family, { repoRoot: opts.repoRoot, scope }));
  actions.push(...appActions, ...wiringActions);
  if (opts.install) actions.push(runInstall(opts.packageManager, opts.repoRoot));

  const reuseNote = reusedUi
    ? ` (reusing ${scope}/${uiPackage})`
    : ` (+ new ${scope}/${uiPackage})`;
  return {
    plan: { summary: `add ${opts.templateId} app "${appName}"${reuseNote}`, actions },
    appName,
    family,
    uiPackage,
    reusedUi,
  };
}
