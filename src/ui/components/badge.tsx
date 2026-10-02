import { Chip } from '@mui/material';
import type { ComponentPropsWithRef } from 'react';
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
  progressLabel?: string;
}
export function Badge({
  tone = 'default',
  size = 'md',
  dot,
  progress,
  progressLabel,
  children,
  ...props
}: BadgeProps) {
  const color =
    tone === 'critical'
      ? 'error'
      : tone === 'attention'
      ? 'warning'
      : tone === 'neutral' || tone === 'default'
      ? 'default'
      : tone;
  return (
    <Chip
      component="span"
      size="small"
      color={color}
      variant="outlined"
      label={
        <span className="inline-flex items-center gap-1.5">
          {dot || progress ? (
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
          ) : null}
          {children}
          {progressLabel ? (
            <span className="sr-only">{progressLabel}</span>
          ) : null}
        </span>
      }
      sx={{
        height: size === 'sm' ? 22 : 26,
        fontSize: '0.75rem',
        borderRadius: 1.5,
      }}
      {...props}
    />
  );
}
