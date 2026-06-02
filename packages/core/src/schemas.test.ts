import { describe, expect, it } from 'vitest';
import { ValidationError } from './errors';
import { parseComponentsJson, parseRegistryItem } from './schemas';

describe('parseComponentsJson', () => {
  it('parses a valid components.json and keeps unknown fields', () => {
    const parsed = parseComponentsJson({
      $schema: 'https://ui.shadcn.com/schema.json',
      tailwind: { css: 'src/styles.css', baseColor: 'neutral' },
      aliases: { components: '@/components', utils: '@/lib/utils' },
      futureField: 'kept',
    });
    expect(parsed.tailwind.baseColor).toBe('neutral');
    expect(parsed.tailwind.cssVariables).toBe(true); // default applied
    expect((parsed as Record<string, unknown>).futureField).toBe('kept');
  });

  it('throws ValidationError on missing required fields', () => {
    expect(() => parseComponentsJson({ tailwind: {} })).toThrow(ValidationError);
  });
});

describe('parseRegistryItem', () => {
  it('parses an item and defaults files to an empty array', () => {
    const item = parseRegistryItem({ name: 'button', registryDependencies: ['utils'] });
    expect(item.name).toBe('button');
    expect(item.files).toEqual([]);
    expect(item.registryDependencies).toEqual(['utils']);
  });

  it('throws when name is absent', () => {
    expect(() => parseRegistryItem({ type: 'registry:ui' })).toThrow(ValidationError);
  });
});
