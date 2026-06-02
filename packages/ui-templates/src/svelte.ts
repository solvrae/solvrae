import type { Action } from '@solvrae/core';
import { type UiTemplateOptions, file, json } from './shared';

const UTILS_TS = `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

const INDEX_TS = `export { default as Button } from './components/button';
export { cn } from './lib/utils';
`;

const BUTTON_INDEX = `export { default } from './button.svelte';\n`;

const BUTTON_SVELTE = `<script lang="ts">
import { type VariantProps, cva } from 'class-variance-authority';
import type { HTMLButtonAttributes } from 'svelte/elements';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3',
        lg: 'h-10 px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

type Props = HTMLButtonAttributes & {
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: VariantProps<typeof buttonVariants>['size'];
};

let {
  variant = 'default',
  size = 'default',
  class: className,
  children,
  ...restProps
}: Props = $props();
</script>

<button class={cn(buttonVariants({ variant, size }), className)} {...restProps}>
  {@render children?.()}
</button>
`;

/** Scaffold \`packages/ui-svelte\` — a component-only shadcn-svelte package (shared theme). */
export function planSvelteUiPackage(opts: UiTemplateOptions): Action[] {
  const { repoRoot, scope } = opts;
  return [
    file(
      repoRoot,
      'packages/ui-svelte/package.json',
      json({
        name: `${scope}/ui-svelte`,
        version: '0.0.0',
        private: true,
        type: 'module',
        // The `svelte` export condition tells vite-plugin-svelte to compile this
        // package's raw .svelte sources instead of externalizing them.
        svelte: './src/index.ts',
        exports: {
          '.': { svelte: './src/index.ts', types: './src/index.ts' },
          './components/*': { svelte: './src/components/*/index.ts' },
          './lib/*': './src/lib/*.ts',
        },
        dependencies: {
          [`${scope}/ui-theme`]: 'workspace:*',
          'class-variance-authority': '^0.7.1',
          clsx: '^2.1.1',
          'tailwind-merge': '^3.6.0',
        },
        peerDependencies: {
          svelte: '^5',
        },
        devDependencies: {
          [`${scope}/typescript-config`]: 'workspace:*',
          // shadcn-svelte's CLI requires svelte + tailwindcss to be resolvable
          // from this package when adding components.
          svelte: '^5',
          tailwindcss: '^4',
          typescript: '^5.7.2',
        },
      }),
    ),
    file(
      repoRoot,
      'packages/ui-svelte/components.json',
      json({
        $schema: 'https://shadcn-svelte.com/schema.json',
        tailwind: {
          css: '../ui-theme/src/styles.css',
          baseColor: 'neutral',
        },
        aliases: {
          components: `${scope}/ui-svelte/components`,
          utils: `${scope}/ui-svelte/lib/utils`,
          ui: `${scope}/ui-svelte/components`,
          lib: `${scope}/ui-svelte/lib`,
        },
        typescript: true,
        registry: 'https://shadcn-svelte.com/registry',
      }),
    ),
    file(repoRoot, 'packages/ui-svelte/src/index.ts', INDEX_TS),
    file(repoRoot, 'packages/ui-svelte/src/lib/utils.ts', UTILS_TS),
    file(repoRoot, 'packages/ui-svelte/src/components/button/button.svelte', BUTTON_SVELTE),
    file(repoRoot, 'packages/ui-svelte/src/components/button/index.ts', BUTTON_INDEX),
    file(
      repoRoot,
      'packages/ui-svelte/tsconfig.json',
      json({
        extends: `${scope}/typescript-config/base.json`,
        compilerOptions: {
          baseUrl: '.',
          paths: { [`${scope}/ui-svelte/*`]: ['./src/*'] },
        },
        include: ['src'],
        exclude: ['node_modules'],
      }),
    ),
  ];
}
