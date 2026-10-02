import { Loader2 } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface SpinnerProps
  extends Omit<ComponentPropsWithRef<'span'>, 'children' | 'color'> {
  size?: 'sm' | 'md' | 'lg';
  /** Announced text. `null` when the surrounding control already says it is busy. */
  label?: ReactNode;
  tone?: 'default' | 'inherit';
}

/** Indeterminate progress. Respects reduced motion (the motion stylesheet clamps animation). */
export function Spinner({
  size = 'md',
  label = 'Loading',
  tone = 'default',
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      role={label === null ? undefined : 'status'}
      className={cn('inline-flex items-center', className)}
      {...props}
    >
      <Loader2
        aria-hidden
        className={cn(
          'animate-spin',
          size === 'sm' ? 'size-4' : size === 'lg' ? 'size-8' : 'size-6',
          tone === 'default' && 'text-muted-foreground',
        )}
      />
      {label !== null ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
