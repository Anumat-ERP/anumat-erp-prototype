import { LinearProgress } from '@mui/material';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
export interface ProgressBarProps
  extends Omit<
    ComponentPropsWithRef<'progress'>,
    'size' | 'value' | 'color' | 'ref'
  > {
  label: ReactNode;
  labelHidden?: boolean;
  value?: number | null;
  max?: number;
  tone?: 'primary' | 'success' | 'critical' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean | string;
  wrapperClassName?: string;
}
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
        className={labelHidden ? 'sr-only' : 'mb-2 flex justify-between gap-3'}
      >
        <span id={labelId}>{label}</span>
        {showValue && percent !== undefined ? (
          <span>
            {typeof showValue === 'string'
              ? showValue
              : `${Math.round(percent)}%`}
          </span>
        ) : null}
      </div>
      <LinearProgress
        aria-labelledby={labelId}
        variant={percent === undefined ? 'indeterminate' : 'determinate'}
        value={percent}
        color={tone === 'critical' ? 'error' : tone}
        className={className}
        sx={{
          height: size === 'sm' ? 4 : size === 'lg' ? 10 : 6,
          borderRadius: 1,
        }}
        {...props}
      />
    </div>
  );
}
