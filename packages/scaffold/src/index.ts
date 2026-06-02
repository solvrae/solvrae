/**
 * @solvrae/scaffold — orchestration shared by the `create-solvrae` and `solvrae`
 * CLIs: the adapter registry, base-repo scaffolding, and the `init` /
 * `add-template` planners.
 */

export { ADAPTERS, availableTemplates, resolveAdapter } from './adapters';
export { type BaseRepoOptions, planBaseRepo } from './base';
export { type InitOptions, planInit } from './init';
export { type AddTemplateOptions, type AddTemplateResult, planAddTemplate } from './add-template';
export {
  type AddComponentOptions,
  type ComponentTask,
  REGISTRY_CLI,
  planComponentTasks,
} from './add-component';
export {
  type DoctorReport,
  type DiagnoseInput,
  collectDiagnostics,
  runDoctorChecks,
} from './doctor';
export {
  inferScope,
  hasUiPackage,
  hasThemePackage,
  appExists,
  presentUiFamilies,
} from './repo';
