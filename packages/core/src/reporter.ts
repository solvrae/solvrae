import type { LogLevel, Logger } from './types';

const ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

/**
 * A console-backed {@link Logger}. Messages below `minLevel` are suppressed.
 * Pure formatting only — no colors here so it stays dependency-free; the CLI
 * layer can wrap this with `picocolors` later.
 */
export function createConsoleLogger(minLevel: LogLevel = 'info'): Logger {
  const threshold = ORDER[minLevel];
  const emit = (level: LogLevel, message: string): void => {
    if (ORDER[level] < threshold) return;
    const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
    stream.write(`${message}\n`);
  };
  return {
    debug: (m) => emit('debug', m),
    info: (m) => emit('info', m),
    warn: (m) => emit('warn', m),
    error: (m) => emit('error', m),
  };
}

/** A logger that records messages instead of printing — handy for tests. */
export function createMemoryLogger(): Logger & {
  readonly messages: ReadonlyArray<[LogLevel, string]>;
} {
  const messages: Array<[LogLevel, string]> = [];
  return {
    messages,
    debug: (m) => messages.push(['debug', m]),
    info: (m) => messages.push(['info', m]),
    warn: (m) => messages.push(['warn', m]),
    error: (m) => messages.push(['error', m]),
  };
}
