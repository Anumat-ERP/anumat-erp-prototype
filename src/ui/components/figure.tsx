import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface FigureValueProps extends ComponentPropsWithoutRef<'span'> {
  /** The number as people should read it: "4", "1.1", "$4,650", "73%". */
  value: ReactNode;
  /** A short unit after it, set small: "days", "h", "/mo". */
  unit?: ReactNode;
  size?: 'md' | 'lg';
}

/**
 * A headline value: a large serif figure with a small unit beside it, sharing
 * one baseline. Use for the few numbers a page is about, not for table cells.
 */
export function FigureValue({ value, unit, size = 'lg', className, ...props }: FigureValueProps) {
  return (
    <span className={cn('inline-flex items-baseline gap-1', className)} {...props}>
      <span className={cn('an-figure text-foreground', size === 'lg' ? 'text-[2.25rem]' : 'text-[1.75rem]')}>{value}</span>
      {unit ? <span className="an-figure-unit">{unit}</span> : null}
    </span>
  );
}
