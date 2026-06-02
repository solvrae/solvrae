import type { FileSystem } from './fs';
import type { CommandRunner, RunOptions } from './run';

/** An in-memory {@link FileSystem} for tests. Directories are implicit. */
export interface MemoryFs extends FileSystem {
  readonly files: Map<string, string>;
}

export function createMemoryFs(initial: Record<string, string> = {}): MemoryFs {
  const files = new Map<string, string>(Object.entries(initial));
  return {
    files,
    async exists(path) {
      return files.has(path);
    },
    async readText(path) {
      const value = files.get(path);
      if (value === undefined) throw new Error(`ENOENT: ${path}`);
      return value;
    },
    async writeText(path, contents) {
      files.set(path, contents);
    },
    async remove(path) {
      files.delete(path);
      for (const key of [...files.keys()]) {
        if (key.startsWith(`${path}/`)) files.delete(key);
      }
    },
  };
}

export interface RecordingRunner extends CommandRunner {
  readonly calls: Array<{ command: string; args: string[]; options: RunOptions }>;
}

/** A {@link CommandRunner} that records calls and optionally throws. */
export function createRecordingRunner(
  failOn?: (command: string, args: string[]) => boolean,
): RecordingRunner {
  const calls: RecordingRunner['calls'] = [];
  return {
    calls,
    async run(command, args, options) {
      calls.push({ command, args, options });
      if (failOn?.(command, args)) {
        throw new Error(`forced failure: ${command} ${args.join(' ')}`);
      }
    },
  };
}
