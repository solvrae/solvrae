import type { Action } from './actions';
import type { RunContext } from './context';
import type { UiFamily } from './types';
import type { VersionResolver } from './version';

/** A value or a promise of it — planning may need async version resolution. */
export type MaybePromise<T> = T | Promise<T>;

/** Upstream versions an adapter is verified against. */
export interface CompatibilityMatrix {
  /** Framework version range, e.g. `>=15 <17`. */
  framework: string;
  /** Tailwind version range, e.g. `^4`. */
  tailwind: string;
  /** shadcn CLI/registry version range. */
  shadcn: string;
}

export interface AppOptions {
  /** App directory name under `apps/`. */
  name: string;
  /** Internal package scope, e.g. `@repo`. */
  scope: string;
  typescript: boolean;
}

export interface WiringOptions {
  appName: string;
  scope: string;
  /** UI package the app consumes, e.g. `ui-react`. */
  uiPackage: string;
}

export interface UiPackageOptions {
  family: UiFamily;
  scope: string;
}

export type DiagnosticLevel = 'ok' | 'warn' | 'error';

export interface Diagnostic {
  level: DiagnosticLevel;
  message: string;
  /** Optional action that fixes the issue (used by `doctor --fix`). */
  fix?: Action;
}

/** Context handed to adapters: the run context, the repo root, and a version resolver. */
export interface AdapterContext {
  run: RunContext;
  repoRoot: string;
  /** Resolves dependency specs to exact versions (registry-backed or offline). */
  versions: VersionResolver;
}

/**
 * Teaches the engine how to scaffold and wire one framework. The only place
 * framework-specific knowledge lives. Planning methods are **pure**: they return
 * {@link Action}s and never touch disk.
 */
export interface FrameworkAdapter {
  /** Stable CLI id: `-t <id>`, `add template <id>`. */
  readonly id: string;
  readonly displayName: string;
  /** UI family this template consumes — drives UI-package reuse. */
  readonly family: UiFamily;
  readonly compatibility: CompatibilityMatrix;

  /** Plan the app scaffold under `apps/<name>`. May resolve versions asynchronously. */
  planApp(ctx: AdapterContext, opts: AppOptions): MaybePromise<Action[]>;

  /** Plan how the app consumes its UI package. */
  planWiring(ctx: AdapterContext, opts: WiringOptions): MaybePromise<Action[]>;

  /** Optional framework-specific tweaks to the UI package itself. */
  planUiPackageOverrides?(ctx: AdapterContext, opts: UiPackageOptions): MaybePromise<Action[]>;

  /** Optional post-install verification used by `solvrae doctor`. */
  diagnose?(ctx: AdapterContext): Promise<Diagnostic[]>;
}
