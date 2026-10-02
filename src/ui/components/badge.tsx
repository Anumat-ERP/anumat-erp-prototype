import { cva } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/cn';

export type BadgeTone =
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'critical'
  | 'attention'
  | 'neutral'
  | 'primary';
export type BadgeProgress = 'incomplete' | 'partial' | 'complete';

export interface BadgeProps
  extends Omit<ComponentPropsWithRef<'span'>, 'color'> {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  dot?: boolean;
  progress?: BadgeProgress;
  /** Spoken meaning of the dot or progress mark. */
  progressLabel?: string;
}

const badge = cva(
  'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        default: 'border-border bg-muted text-foreground',
        neutral: 'border-border bg-muted text-foreground',
        info: 'border-transparent bg-accent text-accent-foreground',
        primary: 'border-transparent bg-accent text-accent-foreground',
        success: 'border-transparent bg-mint-subtle text-mint-subtle-foreground',
        warning: 'border-transparent bg-warning-subtle text-warning-subtle-fg',
        attention: 'border-transparent bg-warning-subtle text-warning-subtle-fg',
        critical: 'border-transparent bg-critical-subtle text-critical-subtle-fg',
      },
      size: { sm: 'min-h-5', md: 'min-h-6' },
    },
    defaultVariants: { tone: 'default', size: 'md' },
  },
);

/** A short status or count. Its text carries the meaning; the dot only echoes it. */
export function Badge({
  tone = 'default',
  size = 'md',
  dot,
  progress,
  progressLabel,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badge({ tone, size }), className)} {...props}>
      {dot || progress ? (
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
      ) : null}
      {children}
      {progressLabel ? <span className="sr-only">{progressLabel}</span> : null}
    </span>
  );
}
