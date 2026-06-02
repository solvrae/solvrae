/**
 * Core shared types for Solvrae. Framework-agnostic — no adapter imports here.
 */

/** UI library family a shadcn registry targets. The unit of UI-package sharing. */
export type UiFamily = 'react' | 'vue' | 'svelte' | 'solid';

/** Supported package managers. */
export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

/** Severity for log/report messages. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Minimal logger surface the engine depends on. */
export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/** A dependency to add to a workspace's package.json. */
export interface Dependency {
  name: string;
  /** Version range or specifier (e.g. `^1.2.3`, `workspace:*`). */
  version: string;
}
