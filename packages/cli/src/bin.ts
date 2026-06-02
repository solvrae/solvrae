import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { cancel, intro, isCancel, log, multiselect, outro } from '@clack/prompts';
import {
  type Action,
  type Diagnostic,
  type PackageManager,
  type UiFamily,
  createConsoleLogger,
  createExecutorDeps,
  createRegistryResolver,
  detectPackageManager,
  executePlan,
  findRepoRoot,
  nodeCommandRunner,
  nodeFileSystem,
  offlineResolver,
} from '@solvrae/core';
import {
  type AddTemplateOptions,
  availableTemplates,
  planAddTemplate,
  planComponentTasks,
  presentUiFamilies,
  runDoctorChecks,
} from '@solvrae/scaffold';
import { Command } from 'commander';
import pc from 'picocolors';

const PM_VALUES: PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];

function bail(message: string): never {
  cancel(message);
  process.exit(1);
}

async function getRepoRoot(): Promise<string> {
  const root = await findRepoRoot(process.cwd(), nodeFileSystem);
  if (!root) {
    bail('Not inside a Solvrae workspace (no turbo.json or pnpm-workspace.yaml found).');
  }
  return root;
}

function resolvePm(flag: string | undefined, repoRoot: string): Promise<PackageManager> {
  if (flag) {
    if (!PM_VALUES.includes(flag as PackageManager)) {
      bail(`Invalid --pm "${flag}". Use one of ${PM_VALUES.join(', ')}.`);
    }
    return Promise.resolve(flag as PackageManager);
  }
  return detectPackageManager(repoRoot);
}

interface AddTemplateFlags {
  name?: string;
  pm?: string;
  scope?: string;
  install: boolean;
  dryRun: boolean;
  offline: boolean;
}

async function runAddTemplate(templateId: string, flags: AddTemplateFlags): Promise<void> {
  intro(pc.bold(pc.cyan(' solvrae add template ')));
  const repoRoot = await getRepoRoot();
  const pm = await resolvePm(flags.pm, repoRoot);
  const logger = createConsoleLogger('info');
  const resolver = flags.offline ? offlineResolver : createRegistryResolver({ logger });

  const options: AddTemplateOptions = {
    repoRoot,
    templateId,
    packageManager: pm,
    resolver,
    install: flags.install,
  };
  if (flags.name) options.appName = flags.name;
  if (flags.scope) options.scope = flags.scope;

  let result: Awaited<ReturnType<typeof planAddTemplate>>;
  try {
    result = await planAddTemplate(options);
  } catch (err) {
    bail(err instanceof Error ? err.message : String(err));
  }

  log.step(result.plan.summary);
  if (flags.install && !flags.dryRun) log.info(`Installing dependencies with ${pm}…`);

  try {
    const res = await executePlan(result.plan, createExecutorDeps(logger), {
      cwd: repoRoot,
      dryRun: flags.dryRun,
    });
    if (flags.dryRun) {
      outro(`${pc.dim('dry-run')} — ${res.descriptions.length} actions planned, nothing written.`);
      return;
    }
  } catch (err) {
    bail(err instanceof Error ? err.message : String(err));
  }

  const ui = result.reusedUi
    ? `reused ${pc.cyan(result.uiPackage)}`
    : `created ${pc.cyan(result.uiPackage)}`;
  outro(`Added ${pc.cyan(`apps/${result.appName}`)} (${ui}).`);
}

async function runList(): Promise<void> {
  intro(pc.bold(pc.cyan(' solvrae list ')));
  const repoRoot = await getRepoRoot();
  const families = await presentUiFamilies(repoRoot);
  const apps = await readdir(join(repoRoot, 'apps'), { withFileTypes: true })
    .then((entries) => entries.filter((e) => e.isDirectory()).map((e) => e.name))
    .catch(() => [] as string[]);

  log.info(`Apps: ${apps.length ? apps.join(', ') : '(none)'}`);
  log.info(`UI families present: ${families.length ? families.join(', ') : '(none)'}`);
  log.info(`Available templates: ${availableTemplates().join(', ')}`);
  outro('Use `solvrae add template <id>` to add a framework.');
}

async function runDoctor(flags: { fix: boolean }): Promise<void> {
  intro(pc.bold(pc.cyan(' solvrae doctor ')));
  const repoRoot = await getRepoRoot();
  const report = await runDoctorChecks(repoRoot);

  log.info(`Apps: ${report.apps.length ? report.apps.join(', ') : '(none)'}`);
  log.info(`UI families: ${report.families.length ? report.families.join(', ') : '(none)'}`);

  if (report.diagnostics.length === 0) {
    log.success('No issues found.');
    outro('Doctor finished.');
    return;
  }

  for (const d of report.diagnostics) {
    if (d.level === 'error') log.error(d.message);
    else log.warn(d.message);
  }

  const fixable = report.diagnostics.filter(
    (d): d is Diagnostic & { fix: Action } => d.fix !== undefined,
  );

  if (!flags.fix) {
    log.info(
      fixable.length > 0
        ? `${fixable.length} issue(s) auto-fixable — re-run with --fix.`
        : 'No auto-fixable issues.',
    );
    outro('Doctor finished.');
    return;
  }

  if (fixable.length === 0) {
    outro('Nothing to fix automatically.');
    return;
  }

  const logger = createConsoleLogger('info');
  try {
    await executePlan(
      { summary: 'doctor --fix', actions: fixable.map((d) => d.fix) },
      createExecutorDeps(logger),
      { cwd: repoRoot, dryRun: false },
    );
  } catch (err) {
    bail(err instanceof Error ? err.message : String(err));
  }
  outro(`Fixed ${fixable.length} issue(s).`);
}

interface AddComponentFlags {
  family: string[];
  all: boolean;
  overwrite: boolean;
  pm?: string;
  yes: boolean;
  dryRun: boolean;
}

function collectFamily(value: string, previous: string[]): string[] {
  return [...previous, value];
}

async function runAddComponent(components: string[], flags: AddComponentFlags): Promise<void> {
  intro(pc.bold(pc.cyan(' solvrae add component ')));
  const repoRoot = await getRepoRoot();
  const present = await presentUiFamilies(repoRoot);
  if (present.length === 0) {
    bail('No UI packages found. Run `solvrae add template <id>` first.');
  }

  let targets: UiFamily[];
  if (flags.family.length > 0) {
    const invalid = flags.family.filter((f) => !present.includes(f as UiFamily));
    if (invalid.length > 0) {
      bail(`Family not present: ${invalid.join(', ')}. Present: ${present.join(', ')}.`);
    }
    targets = flags.family as UiFamily[];
  } else if (flags.all || flags.yes || present.length === 1) {
    targets = present;
  } else {
    const selected = await multiselect({
      message: `Add ${components.join(', ')} to which UI families?  (↑/↓ move · space toggle · enter confirm)`,
      options: present.map((f) => ({ value: f, label: `ui-${f}`, hint: f })),
      initialValues: present,
      required: true,
    });
    if (isCancel(selected)) bail('Cancelled.');
    targets = selected as UiFamily[];
  }

  const pm = await resolvePm(flags.pm, repoRoot);
  const tasks = planComponentTasks({
    repoRoot,
    components,
    families: targets,
    packageManager: pm,
    overwrite: flags.overwrite,
  });

  const succeeded: UiFamily[] = [];
  const failed: UiFamily[] = [];
  for (const task of tasks) {
    if (flags.dryRun) {
      log.info(`[dry-run] ${task.uiPackage}: ${task.command} ${task.args.join(' ')}`);
      succeeded.push(task.family);
      continue;
    }
    log.step(`${task.uiPackage} ← ${components.join(', ')}`);
    try {
      await nodeCommandRunner.run(task.command, task.args, { cwd: repoRoot });
      succeeded.push(task.family);
    } catch (err) {
      log.warn(`${task.uiPackage}: ${err instanceof Error ? err.message : String(err)}`);
      failed.push(task.family);
    }
  }

  if (flags.dryRun) {
    outro(`${pc.dim('dry-run')} — ${tasks.length} task(s) planned.`);
    return;
  }
  if (succeeded.length === 0) bail('No components were added.');
  const note = failed.length > 0 ? ` (skipped: ${failed.join(', ')})` : '';
  outro(`Added ${components.join(', ')} to ${succeeded.join(', ')}${note}.`);
}

const program = new Command();
program.name('solvrae').description('Operate on an existing Solvrae monorepo');

const add = program.command('add').description('Add things to the monorepo');
add
  .command('template <id>')
  .description('Add a framework (reuses an existing ui-<family> when the family matches)')
  .option('--name <name>', 'app directory name (defaults to the template id)')
  .option('--pm <pm>', 'package manager (pnpm|npm|yarn|bun)')
  .option('--scope <scope>', 'internal package scope (inferred when omitted)')
  .option('--no-install', 'skip dependency installation')
  .option('--dry-run', 'print the plan without writing anything', false)
  .option('--offline', 'use baseline versions instead of querying the registry', false)
  .action((id: string, flags: AddTemplateFlags) => runAddTemplate(id, flags));

add
  .command('component <names...>')
  .description('Add shadcn components to the matching UI packages (one invocation per family)')
  .option(
    '--family <family>',
    'target a UI family (repeatable: react|vue|svelte)',
    collectFamily,
    [],
  )
  .option('--all', 'add to every UI family present', false)
  .option('--overwrite', 'overwrite existing files', false)
  .option('--pm <pm>', 'package manager (pnpm|npm|yarn|bun)')
  .option('-y, --yes', 'no prompts; target all families present', false)
  .option('--dry-run', 'print the commands without running them', false)
  .action((names: string[], flags: AddComponentFlags) => runAddComponent(names, flags));

program
  .command('list')
  .description('List apps, UI families, and available templates')
  .action(() => runList());

program
  .command('doctor')
  .description('Report repo health and optionally repair wiring drift')
  .option('--fix', 'apply auto-fixes for detected issues', false)
  .action((flags: { fix: boolean }) => runDoctor(flags));

program.parseAsync().catch((err) => {
  console.error(err);
  process.exit(1);
});
