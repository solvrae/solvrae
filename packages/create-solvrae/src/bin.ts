import { execFile } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { promisify } from 'node:util';
import { cancel, intro, isCancel, log, outro, select, text } from '@clack/prompts';
import {
  type PackageManager,
  createConsoleLogger,
  createExecutorDeps,
  createRegistryResolver,
  detectPackageManager,
  executePlan,
  offlineResolver,
} from '@solvrae/core';
import { Command } from 'commander';
import pc from 'picocolors';
import { type InitOptions, availableTemplates, planInit } from './init';

const execFileAsync = promisify(execFile);

interface CliFlags {
  template?: string;
  pm?: string;
  scope: string;
  install: boolean;
  yes: boolean;
  dryRun: boolean;
  offline: boolean;
}

const PM_VALUES: PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];

function bail(message: string): never {
  cancel(message);
  process.exit(1);
}

function devCommand(pm: PackageManager): string {
  return pm === 'npm' ? 'npm run dev' : `${pm} dev`;
}

/** Read the installed package manager's version (for the root `packageManager` field). */
async function detectPmVersion(pm: PackageManager): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync(pm, ['--version']);
    const version = stdout.trim().split('\n')[0];
    return version && /^\d/.test(version) ? version : undefined;
  } catch {
    return undefined;
  }
}

async function run(): Promise<void> {
  const program = new Command();
  program
    .name('create-solvrae')
    .description('Scaffold a cross-framework Turborepo with shadcn/ui')
    .argument('[directory]', 'target directory')
    .option('-t, --template <id>', 'framework template')
    .option('--pm <pm>', 'package manager (pnpm|npm|yarn|bun)')
    .option('--scope <scope>', 'internal package scope', '@repo')
    .option('--no-install', 'skip dependency installation')
    .option('-y, --yes', 'accept defaults, skip prompts', false)
    .option('--dry-run', 'print the plan without writing anything', false)
    .option('--offline', 'use baseline versions instead of querying the registry', false)
    .parse();

  const flags = program.opts<CliFlags>();
  const dirArg = program.args[0];

  intro(pc.bold(pc.cyan(' create-solvrae ')));

  // 1. Target directory
  let directory = dirArg;
  if (!directory) {
    if (flags.yes) {
      directory = 'my-solvrae-app';
    } else {
      const res = await text({ message: 'Project directory?', placeholder: 'my-app' });
      if (isCancel(res)) bail('Cancelled.');
      directory = res.trim() || 'my-app';
    }
  }
  const repoRoot = resolve(process.cwd(), directory);
  const projectName = basename(repoRoot);

  if (!flags.dryRun && existsSync(repoRoot) && readdirSync(repoRoot).length > 0) {
    bail(`Directory ${pc.cyan(directory)} exists and is not empty.`);
  }

  // 2. Template
  const templates = availableTemplates();
  let templateId = flags.template;
  if (!templateId) {
    if (flags.yes) {
      templateId = 'next';
    } else {
      const res = await select({
        message: 'Framework template?',
        options: templates.map((t) => ({ value: t, label: t })),
      });
      if (isCancel(res)) bail('Cancelled.');
      templateId = res;
    }
  }
  if (!templates.includes(templateId)) {
    bail(`Unknown template "${templateId}". Available: ${templates.join(', ')}.`);
  }

  // 3. Package manager
  let pm = flags.pm as PackageManager | undefined;
  if (pm && !PM_VALUES.includes(pm))
    bail(`Invalid --pm "${pm}". Use one of ${PM_VALUES.join(', ')}.`);
  if (!pm) pm = await detectPackageManager(process.cwd());
  const pmVersion = await detectPmVersion(pm);
  const logger = createConsoleLogger('info');
  const resolver = flags.offline ? offlineResolver : createRegistryResolver({ logger });

  const options: InitOptions = {
    repoRoot,
    projectName,
    appName: 'web',
    scope: flags.scope,
    packageManager: pm,
    resolver,
    templateId,
    install: flags.install,
  };
  if (pmVersion) options.packageManagerSpec = `${pm}@${pmVersion}`;

  const plan = await planInit(options);

  log.step(`Plan: ${plan.summary}`);
  if (flags.install && !flags.dryRun) log.info(`Installing dependencies with ${pm}…`);

  try {
    const result = await executePlan(plan, createExecutorDeps(logger), {
      cwd: repoRoot,
      dryRun: flags.dryRun,
    });
    if (flags.dryRun) {
      outro(
        `${pc.dim('dry-run')} — ${result.descriptions.length} actions planned, nothing written.`,
      );
      return;
    }
    log.success(`Wrote ${result.applied} actions.`);
  } catch (err) {
    bail(err instanceof Error ? err.message : String(err));
  }

  const steps = [`cd ${directory}`];
  if (!flags.install) steps.push(`${pm} install`);
  steps.push(devCommand(pm));
  outro(`Done! Next:\n${steps.map((s) => pc.cyan(`  ${s}`)).join('\n')}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
