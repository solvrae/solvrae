import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { cancel, intro, log, outro } from '@clack/prompts';
import {
  type PackageManager,
  createConsoleLogger,
  createExecutorDeps,
  createRegistryResolver,
  detectPackageManager,
  executePlan,
  findRepoRoot,
  nodeFileSystem,
  offlineResolver,
} from '@solvrae/core';
import {
  type AddTemplateOptions,
  availableTemplates,
  planAddTemplate,
  presentUiFamilies,
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

async function runDoctor(): Promise<void> {
  intro(pc.bold(pc.cyan(' solvrae doctor ')));
  const repoRoot = await getRepoRoot();
  const families = await presentUiFamilies(repoRoot);
  const hasTheme = await nodeFileSystem.exists(join(repoRoot, 'packages/ui-theme/package.json'));

  log.info(`Repo root: ${repoRoot}`);
  if (hasTheme) log.success('Shared theme (ui-theme) present.');
  else log.warn('Shared theme (ui-theme) missing — run `solvrae add template <id>`.');
  log.info(`UI families: ${families.length ? families.join(', ') : '(none)'}`);
  outro('Doctor finished.');
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

program
  .command('list')
  .description('List apps, UI families, and available templates')
  .action(() => runList());

program
  .command('doctor')
  .description('Report basic repo health')
  .action(() => runDoctor());

program.parseAsync().catch((err) => {
  console.error(err);
  process.exit(1);
});
