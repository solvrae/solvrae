import nextAdapter from '@solvrae/adapter-next';
import viteReactAdapter from '@solvrae/adapter-vite-react';
import { type FrameworkAdapter, SolvraeError } from '@solvrae/core';

/** Built-in adapters, keyed by template id. Third-party resolution comes later. */
export const ADAPTERS: Record<string, FrameworkAdapter> = {
  next: nextAdapter,
  'vite-react': viteReactAdapter,
};

export function availableTemplates(): string[] {
  return Object.keys(ADAPTERS);
}

export function resolveAdapter(templateId: string): FrameworkAdapter {
  const adapter = ADAPTERS[templateId];
  if (!adapter) {
    throw new SolvraeError(
      'UNKNOWN_TEMPLATE',
      `Unknown template "${templateId}". Available: ${availableTemplates().join(', ')}.`,
    );
  }
  return adapter;
}
