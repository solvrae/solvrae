import type { Action } from '@solvrae/core';
import { type UiTemplateOptions, file, json } from './shared';

const UTILS_TS = `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

const BUTTON_TSX = `import { type VariantProps, cva } from 'class-variance-authority';
import type * as React from 'react';
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

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
`;

/**
 * Scaffold `packages/ui-react` — a component-only shadcn/ui package. Tokens come
 * from the shared `@scope/ui-theme`; this package ships the `cn` util and a
 * starter Button so the slice is demonstrable end-to-end.
 */
export function planReactUiPackage(opts: UiTemplateOptions): Action[] {
  const { repoRoot, scope } = opts;
  return [
    file(
      repoRoot,
      'packages/ui-react/package.json',
      json({
        name: `${scope}/ui-react`,
        version: '0.0.0',
        private: true,
        type: 'module',
        exports: {
          './components/*': './src/components/*.tsx',
          './lib/*': './src/lib/*.ts',
        },
        dependencies: {
          [`${scope}/ui-theme`]: 'workspace:*',
          'class-variance-authority': '^0.7.1',
          clsx: '^2.1.1',
          'lucide-react': '^0.468.0',
          'tailwind-merge': '^2.5.5',
        },
        peerDependencies: {
          react: '>=18',
          'react-dom': '>=18',
        },
        devDependencies: {
          [`${scope}/typescript-config`]: 'workspace:*',
          '@types/react': '^19.0.0',
          typescript: '^5.7.2',
        },
      }),
    ),
    file(
      repoRoot,
      'packages/ui-react/components.json',
      json({
        $schema: 'https://ui.shadcn.com/schema.json',
        style: 'new-york',
        rsc: false,
        tsx: true,
        tailwind: {
          config: '',
          css: '../ui-theme/src/styles.css',
          baseColor: 'neutral',
          cssVariables: true,
        },
        aliases: {
          components: `${scope}/ui-react/components`,
          utils: `${scope}/ui-react/lib/utils`,
          ui: `${scope}/ui-react/components`,
          lib: `${scope}/ui-react/lib`,
        },
        iconLibrary: 'lucide',
      }),
    ),
    file(repoRoot, 'packages/ui-react/src/lib/utils.ts', UTILS_TS),
    file(repoRoot, 'packages/ui-react/src/components/button.tsx', BUTTON_TSX),
    file(
      repoRoot,
      'packages/ui-react/tsconfig.json',
      json({
        extends: `${scope}/typescript-config/react-library.json`,
        include: ['src'],
        exclude: ['node_modules', 'dist'],
      }),
    ),
  ];
}
