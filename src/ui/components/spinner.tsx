import { CircularProgress } from '@mui/material';
import type { ComponentPropsWithRef, ReactNode } from 'react';
export interface SpinnerProps
  extends Omit<ComponentPropsWithRef<'span'>, 'children' | 'color'> {
  size?: 'sm' | 'md' | 'lg';
  label?: ReactNode;
  tone?: 'default' | 'inherit';
}
export function Spinner({
  size = 'md',
  label = 'Loading',
  tone: _tone,
  ...props
}: SpinnerProps) {
  return (
    <span {...props}>
      <CircularProgress
        size={size === 'sm' ? 16 : size === 'lg' ? 32 : 24}
        aria-label={typeof label === 'string' ? label : undefined}
        aria-hidden={label === null || undefined}
      />
      {typeof label !== 'string' && label !== null ? (
        <span className="sr-only">{label}</span>
      ) : null}
    </span>
  );
}
