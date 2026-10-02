import type { CSSProperties, ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';
import { cn } from '../lib/cn';

/** Series name → label and colour token, as in shadcn's ChartConfig. */
export type ChartConfig = Record<string, { label: string; color: string }>;

/**
 * Sizes a recharts chart and exposes each series colour as `--color-<key>`,
 * so marks reference `var(--color-submitted)` and follow light and dark.
 */
export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: ReactNode;
}) {
  const vars = Object.fromEntries(
    Object.entries(config).map(([key, { color }]) => [`--color-${key}`, color]),
  ) as CSSProperties;
  return (
    <div
      className={cn(
        'aspect-auto w-full text-xs',
        '[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border',
        '[&_.recharts-surface]:outline-none',
        className,
      )}
      style={vars}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipPayload {
  dataKey?: string | number;
  value?: number | string;
  color?: string;
}

/** Tooltip body matching shadcn's ChartTooltipContent. */
export function ChartTooltipContent({
  active,
  payload,
  label,
  config,
  labelFormatter,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
  config: ChartConfig;
  labelFormatter?: (label: string | number) => ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-32 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md">
      {label !== undefined ? (
        <p className="mb-1 font-medium">{labelFormatter ? labelFormatter(label) : label}</p>
      ) : null}
      <ul className="flex flex-col gap-1">
        {payload.map((item) => {
          const key = String(item.dataKey);
          return (
            <li key={key} className="flex items-center gap-2">
              <span aria-hidden className="size-2.5 rounded-[2px]" style={{ background: `var(--color-${key})` }} />
              <span className="text-muted-foreground">{config[key]?.label ?? key}</span>
              <span className="ms-auto font-medium tabular-nums">{item.value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
