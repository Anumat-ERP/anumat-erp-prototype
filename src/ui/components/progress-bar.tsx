import { Progress } from 'radix-ui';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface ProgressBarProps
  extends Omit<
    ComponentPropsWithRef<'div'>,
    'size' | 'value' | 'color' | 'ref' | 'children'
  > {
  label: ReactNode;
  labelHidden?: boolean;
  /** `null`/`undefined` shows an indeterminate bar. */
  value?: number | null;
  max?: number;
  tone?: 'primary' | 'success' | 'critical' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  /** `true` shows the percentage; a string replaces it. */
  showValue?: boolean | string;
  wrapperClassName?: string;
}

const FILL = {
  primary: 'bg-primary',
  info: 'bg-primary',
  success: 'bg-mint',
  critical: 'bg-destructive',
  warning: 'bg-chart-5',
} as const;

export function ProgressBar({
  label,
  labelHidden,
  value,
  max = 100,
  tone = 'primary',
  size = 'md',
  showValue,
  wrapperClassName,
  className,
  id,
  ...props
}: ProgressBarProps) {
  const generated = useId();
  const labelId = `${id ?? generated}-label`;
  const percent =
    value == null
      ? undefined
      : Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));
  return (
    <div className={wrapperClassName}>
      <div
        className={
          labelHidden
            ? 'sr-only'
            : 'mb-2 flex justify-between gap-3 text-sm text-foreground'
        }
      >
        <span id={labelId}>{label}</span>
        {showValue && percent !== undefined ? (
          <span className="text-muted-foreground tabular-nums">
            {typeof showValue === 'string' ? showValue : `${Math.round(percent)}%`}
          </span>
        ) : null}
      </div>
      <Progress.Root
        id={id}
        aria-labelledby={labelId}
        value={percent ?? null}
        max={100}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-muted',
          size === 'sm' ? 'h-1' : size === 'lg' ? 'h-2.5' : 'h-1.5',
          className,
        )}
        {...props}
      >
        <Progress.Indicator
          className={cn(
            'h-full rounded-full transition-[width] duration-(--a-duration-slow) ease-standard',
            FILL[tone],
            percent === undefined && 'w-1/3 animate-pulse',
          )}
          style={percent === undefined ? undefined : { width: `${percent}%` }}
        />
      </Progress.Root>
    </div>
  );
}
