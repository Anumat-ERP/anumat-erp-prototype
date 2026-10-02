import { Separator } from 'radix-ui';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface DividerProps extends ComponentPropsWithRef<'div'> {
  orientation?: 'horizontal' | 'vertical';
  /** Text set between two rules ("or"). */
  label?: ReactNode;
  tone?: 'default' | 'strong';
  /** Purely visual (default). Set false when the rule separates content semantically. */
  decorative?: boolean;
}

export function Divider({
  label,
  tone = 'default',
  decorative = true,
  orientation = 'horizontal',
  className,
  ...props
}: DividerProps) {
  const line = tone === 'strong' ? 'bg-input' : 'bg-border';
  if (label) {
    return (
      <div
        role={decorative ? 'none' : 'separator'}
        className={cn('flex items-center gap-3 text-sm text-muted-foreground', className)}
        {...props}
      >
        <span aria-hidden className={cn('h-px flex-1', line)} />
        {label}
        <span aria-hidden className={cn('h-px flex-1', line)} />
      </div>
    );
  }
  return (
    <Separator.Root
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0',
        line,
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px self-stretch',
        className,
      )}
      {...props}
    />
  );
}
