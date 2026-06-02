import type { Action } from '@solvrae/core';
import { type UiTemplateOptions, file, json } from './shared';

const UTILS_TS = `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

const BUTTON_VUE = `<script setup lang="ts">
import { type VariantProps, cva } from 'class-variance-authority';
import { computed } from 'vue';
import { cn } from '../lib/utils';

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

type ButtonVariants = VariantProps<typeof buttonVariants>;

const props = defineProps<{
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  class?: string;
}>();

const classes = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: props.size }), props.class),
);
</script>

<template>
  <button :class="classes">
    <slot />
  </button>
</template>
`;

/** Scaffold \`packages/ui-vue\` — a component-only shadcn-vue package (shared theme). */
export function planVueUiPackage(opts: UiTemplateOptions): Action[] {
  const { repoRoot, scope } = opts;
  return [
    file(
      repoRoot,
      'packages/ui-vue/package.json',
      json({
        name: `${scope}/ui-vue`,
        version: '0.0.0',
        private: true,
        type: 'module',
        exports: {
          './components/*': './src/components/*.vue',
          './lib/*': './src/lib/*.ts',
        },
        dependencies: {
          [`${scope}/ui-theme`]: 'workspace:*',
          'class-variance-authority': '^0.7.1',
          clsx: '^2.1.1',
          'tailwind-merge': '^3.6.0',
        },
        peerDependencies: {
          vue: '^3.5',
        },
        devDependencies: {
          [`${scope}/typescript-config`]: 'workspace:*',
          typescript: '^5.7.2',
        },
      }),
    ),
    file(
      repoRoot,
      'packages/ui-vue/components.json',
      json({
        $schema: 'https://shadcn-vue.com/schema.json',
        style: 'new-york',
        typescript: true,
        tailwind: {
          config: '',
          css: '../ui-theme/src/styles.css',
          baseColor: 'neutral',
          cssVariables: true,
        },
        aliases: {
          components: `${scope}/ui-vue/components`,
          utils: `${scope}/ui-vue/lib/utils`,
          ui: `${scope}/ui-vue/components`,
          lib: `${scope}/ui-vue/lib`,
        },
        iconLibrary: 'lucide',
      }),
    ),
    file(repoRoot, 'packages/ui-vue/src/lib/utils.ts', UTILS_TS),
    file(repoRoot, 'packages/ui-vue/src/components/button.vue', BUTTON_VUE),
    file(
      repoRoot,
      'packages/ui-vue/tsconfig.json',
      json({
        extends: `${scope}/typescript-config/base.json`,
        include: ['src'],
        exclude: ['node_modules'],
      }),
    ),
  ];
}
