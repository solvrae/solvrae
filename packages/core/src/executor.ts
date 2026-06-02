import type { Action, Plan } from './actions';
import { ExecutionError } from './errors';
import { type FileSystem, type Json, deepMerge, nodeFileSystem, stringifyJson } from './fs';
import { type CommandRunner, nodeCommandRunner } from './run';
import type { Logger } from './types';

/** A function that undoes a single applied action. `null` = nothing to undo. */
type Rollback = (() => Promise<void>) | null;

/** Services the executor needs. All injectable for testing. */
export interface ExecutorDeps {
  fs: FileSystem;
  run: CommandRunner;
  logger: Logger;
}

export interface ExecuteOptions {
  /** Base directory for relative command execution. */
  cwd: string;
  /** When true, describe actions without applying them. */
  dryRun: boolean;
}

export interface ExecuteResult {
  dryRun: boolean;
  /** Number of actions applied (0 when dryRun). */
  applied: number;
  /** Human-readable description of every action, in order. */
  descriptions: string[];
}

const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/** Build default executor deps backed by the real filesystem and process spawner. */
export function createExecutorDeps(logger: Logger = noopLogger): ExecutorDeps {
  return { fs: nodeFileSystem, run: nodeCommandRunner, logger };
}

/** Render a one-line description of an action (used for dry-run and reporting). */
export function describeAction(action: Action): string {
  switch (action.kind) {
    case 'writeFile':
      return `write    ${action.path} (ifExists: ${action.ifExists})`;
    case 'mergeJson':
      return `merge    ${action.path}`;
    case 'deleteFile':
      return `delete   ${action.path}`;
    case 'addDependency':
      return `deps     ${action.dev ? 'devDependencies' : 'dependencies'} += ${action.deps
        .map((d) => d.name)
        .join(', ')} (${action.packageJsonPath})`;
    case 'runCommand':
      return `run      ${action.label}: ${action.command} ${action.args.join(' ')}`;
  }
}

function readJsonObject(text: string): Record<string, Json> {
  const parsed = JSON.parse(text) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('expected a JSON object');
  }
  return parsed as Record<string, Json>;
}

/** Apply a single action, returning a rollback for it. */
async function applyAction(action: Action, deps: ExecutorDeps, cwd: string): Promise<Rollback> {
  const { fs } = deps;
  switch (action.kind) {
    case 'writeFile': {
      const exists = await fs.exists(action.path);
      if (exists && action.ifExists === 'skip') return null;
      if (exists && action.ifExists === 'error') {
        throw new Error(`refusing to overwrite existing file: ${action.path}`);
      }
      const previous = exists ? await fs.readText(action.path) : null;
      await fs.writeText(action.path, action.contents);
      return previous === null
        ? () => fs.remove(action.path)
        : () => fs.writeText(action.path, previous);
    }

    case 'mergeJson': {
      const exists = await fs.exists(action.path);
      const previous = exists ? await fs.readText(action.path) : null;
      const base = previous === null ? {} : readJsonObject(previous);
      await fs.writeText(action.path, stringifyJson(deepMerge(base, action.merge)));
      return previous === null
        ? () => fs.remove(action.path)
        : () => fs.writeText(action.path, previous);
    }

    case 'deleteFile': {
      if (!(await fs.exists(action.path))) return null;
      let previous: string | null = null;
      try {
        previous = await fs.readText(action.path);
      } catch {
        previous = null; // directory or unreadable; cannot restore on rollback
      }
      await fs.remove(action.path);
      return previous === null ? null : () => fs.writeText(action.path, previous);
    }

    case 'addDependency': {
      if (!(await fs.exists(action.packageJsonPath))) {
        throw new Error(`package.json not found: ${action.packageJsonPath}`);
      }
      const previous = await fs.readText(action.packageJsonPath);
      const pkg = readJsonObject(previous);
      const field = action.dev ? 'devDependencies' : 'dependencies';
      const current = pkg[field];
      const deps: Record<string, Json> =
        typeof current === 'object' && current !== null && !Array.isArray(current)
          ? { ...current }
          : {};
      for (const dep of action.deps) deps[dep.name] = dep.version;
      pkg[field] = deps;
      await fs.writeText(action.packageJsonPath, stringifyJson(pkg));
      return () => fs.writeText(action.packageJsonPath, previous);
    }

    case 'runCommand': {
      await deps.run.run(action.command, action.args, { cwd: action.cwd ?? cwd });
      return null; // commands are not automatically reversible
    }
  }
}

/**
 * Execute a plan. On `dryRun`, describes actions without touching anything. On
 * failure, already-applied actions are rolled back in reverse order before an
 * {@link ExecutionError} is thrown.
 */
export async function executePlan(
  plan: Plan,
  deps: ExecutorDeps,
  options: ExecuteOptions,
): Promise<ExecuteResult> {
  const descriptions = plan.actions.map(describeAction);

  if (options.dryRun) {
    for (const description of descriptions) deps.logger.info(`[dry-run] ${description}`);
    return { dryRun: true, applied: 0, descriptions };
  }

  const rollbacks: Rollback[] = [];
  let applied = 0;

  for (const action of plan.actions) {
    try {
      const rollback = await applyAction(action, deps, options.cwd);
      rollbacks.push(rollback);
      applied += 1;
      deps.logger.debug(describeAction(action));
    } catch (cause) {
      const rolledBack = await rollback(rollbacks, deps.logger);
      const reason = cause instanceof Error ? cause.message : String(cause);
      throw new ExecutionError(
        `failed applying "${describeAction(action)}": ${reason}`,
        rolledBack,
        { cause },
      );
    }
  }

  return { dryRun: false, applied, descriptions };
}

/** Run rollbacks in reverse; returns whether every rollback succeeded. */
async function rollback(rollbacks: Rollback[], logger: Logger): Promise<boolean> {
  let allOk = true;
  for (let i = rollbacks.length - 1; i >= 0; i -= 1) {
    const undo = rollbacks[i];
    if (!undo) continue;
    try {
      await undo();
    } catch (error) {
      allOk = false;
      logger.error(
        `rollback step failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return allOk;
}
