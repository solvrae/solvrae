# @solvrae/core

The framework-agnostic engine behind [Solvrae](../../README.md). It knows nothing
about any specific framework — adapters do. Core provides:

- **Run context** — `createContext()` resolves cwd, repo root, package manager, scope.
- **Package manager** — `detectPackageManager()` + `installCommand`/`addCommand`/`dlxCommand`.
- **Plan/Execute** — a declarative `Action[]` model and `executePlan()` with
  `--dry-run` and transactional rollback.
- **Filesystem** — injectable `FileSystem`, `deepMerge`, `stringifyJson`.
- **Adapter contract** — the `FrameworkAdapter` interface adapters implement.
- **Schemas** — Zod schemas for `components.json` and shadcn registry items.

```ts
import { createContext, executePlan, createExecutorDeps, writeFile } from '@solvrae/core';

const ctx = await createContext();
const plan = { summary: 'demo', actions: [writeFile('hello.txt', 'hi', 'overwrite')] };
await executePlan(plan, createExecutorDeps(ctx.logger), { cwd: ctx.cwd, dryRun: ctx.dryRun });
```

> Status: pre-alpha (M0). API will change before 1.0.
