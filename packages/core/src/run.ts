import { spawn } from 'node:child_process';

export interface RunOptions {
  cwd: string;
}

/**
 * Runs external commands. Injectable so the executor can be tested without
 * spawning real processes.
 */
export interface CommandRunner {
  run(command: string, args: string[], options: RunOptions): Promise<void>;
}

/** Spawns commands with inherited stdio; rejects on a non-zero exit code. */
export const nodeCommandRunner: CommandRunner = {
  run(command, args, options) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd,
        stdio: 'inherit',
        shell: false,
      });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`\`${command} ${args.join(' ')}\` exited with code ${code ?? 'null'}`));
        }
      });
    });
  },
};
