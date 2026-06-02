import { z } from 'zod';
import { ValidationError } from './errors';

export const uiFamilySchema = z.enum(['react', 'vue', 'svelte', 'solid']);

export const packageManagerSchema = z.enum(['pnpm', 'npm', 'yarn', 'bun']);

/**
 * A pragmatic subset of shadcn's `components.json`. `.passthrough()` keeps
 * unknown fields so upstream additions don't break parsing — we validate the
 * shape we rely on, not the whole file.
 */
export const componentsJsonSchema = z
  .object({
    $schema: z.string().optional(),
    style: z.string().optional(),
    rsc: z.boolean().optional(),
    tsx: z.boolean().optional(),
    tailwind: z
      .object({
        config: z.string().optional(),
        css: z.string(),
        baseColor: z.string(),
        cssVariables: z.boolean().default(true),
        prefix: z.string().optional(),
      })
      .passthrough(),
    aliases: z
      .object({
        components: z.string(),
        utils: z.string(),
        ui: z.string().optional(),
        lib: z.string().optional(),
        hooks: z.string().optional(),
      })
      .passthrough(),
    iconLibrary: z.string().optional(),
  })
  .passthrough();

export type ComponentsJson = z.infer<typeof componentsJsonSchema>;

/** A single file entry within a shadcn registry item. */
export const registryFileSchema = z
  .object({
    path: z.string(),
    content: z.string().optional(),
    type: z.string().optional(),
    target: z.string().optional(),
  })
  .passthrough();

/**
 * A shadcn registry item (the JSON returned for a component). Permissive on
 * purpose — we read `name`, `dependencies`, `registryDependencies`, and `files`.
 */
export const registryItemSchema = z
  .object({
    name: z.string(),
    type: z.string().optional(),
    dependencies: z.array(z.string()).optional(),
    devDependencies: z.array(z.string()).optional(),
    registryDependencies: z.array(z.string()).optional(),
    files: z.array(registryFileSchema).default([]),
  })
  .passthrough();

export type RegistryItem = z.infer<typeof registryItemSchema>;

function parseOrThrow<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  input: unknown,
  what: string,
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(
      `invalid ${what}: ${result.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`,
    );
  }
  return result.data;
}

export function parseComponentsJson(input: unknown): ComponentsJson {
  return parseOrThrow(componentsJsonSchema, input, 'components.json');
}

export function parseRegistryItem(input: unknown): RegistryItem {
  return parseOrThrow(registryItemSchema, input, 'registry item');
}
