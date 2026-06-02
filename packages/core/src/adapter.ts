import type { Action } from './actions';
import type { RunContext } from './context';
import type { UiFamily } from './types';

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

/** Context handed to adapters: the run context plus the resolved repo root. */
export interface AdapterContext {
  run: RunContext;
  repoRoot: string;
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

  /** Plan the app scaffold under `apps/<name>`. */
  planApp(ctx: AdapterContext, opts: AppOptions): Action[];

  /** Plan how the app consumes its UI package. */
  planWiring(ctx: AdapterContext, opts: WiringOptions): Action[];

  /** Optional framework-specific tweaks to the UI package itself. */
  planUiPackageOverrides?(ctx: AdapterContext, opts: UiPackageOptions): Action[];

  /** Optional post-install verification used by `solvrae doctor`. */
  diagnose?(ctx: AdapterContext): Promise<Diagnostic[]>;
}
