/**
 * @solvrae/core — the framework-agnostic engine.
 *
 * Public surface: shared types, errors, the package-manager helpers, the
 * filesystem utilities, the declarative Action/Plan model + executor, the run
 * context, the reporter, the adapter contract, and the Zod schemas.
 */

export * from './types';
export * from './errors';

export {
  detectPackageManager,
  installCommand,
  addCommand,
  dlxCommand,
  type PmCommand,
} from './pm';

export {
  type FileSystem,
  type Json,
  nodeFileSystem,
  deepMerge,
  stringifyJson,
} from './fs';

export { type CommandRunner, type RunOptions, nodeCommandRunner } from './run';

export * from './actions';

export {
  type ExecutorDeps,
  type ExecuteOptions,
  type ExecuteResult,
  createExecutorDeps,
  describeAction,
  executePlan,
} from './executor';

export {
  type RunContext,
  type CreateContextOptions,
  createContext,
  findRepoRoot,
} from './context';

export { createConsoleLogger, createMemoryLogger } from './reporter';

export {
  type DependencySpec,
  type VersionResolver,
  type RegistryResolverOptions,
  offlineResolver,
  createRegistryResolver,
  resolveAll,
} from './version';

export * from './adapter';

export {
  uiFamilySchema,
  packageManagerSchema,
  componentsJsonSchema,
  registryFileSchema,
  registryItemSchema,
  type ComponentsJson,
  type RegistryItem,
  parseComponentsJson,
  parseRegistryItem,
} from './schemas';
