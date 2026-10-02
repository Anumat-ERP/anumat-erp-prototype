import { Card, ChartContainer, ChartTooltipContent, Tabs, TabsList, TabsTrigger, type ChartConfig } from '@app/ui';
import { useId, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../../data/store';
import { useLocale } from '../../i18n/LocaleProvider';
import { formatShortDate } from '../../lib/format';
import { requestsByDay } from './counts';

const RANGES = [7, 30, 90] as const;

/**
 * Submitted vs approved requests per day. The chart is a picture; the same
 * numbers are in a visually hidden table for screen readers.
 */
export function RequestsChart() {
  const { t: tr, locale } = useLocale();
  const { state } = useStore();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const data = useMemo(() => requestsByDay(state, days), [state, days]);
  const id = useId();
  const config = {
    submitted: { label: tr('Submitted'), color: 'var(--chart-1)' },
    approved: { label: tr('Approved'), color: 'var(--chart-2)' },
  } satisfies ChartConfig;
  const totals = data.reduce((t, d) => ({ submitted: t.submitted + d.submitted, approved: t.approved + d.approved }), { submitted: 0, approved: 0 });
  const title = tr('Requests over time');
  const period = tr('last {count} days', { count: days });
  return (
    <Card flush>
      <figure aria-labelledby={`${id}-caption`} className="m-0 flex flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <figcaption id={`${id}-caption`} className="flex flex-col gap-0.5">
            <span className="text-md font-semibold">{title}<span className="sr-only">, {period}</span></span>
            <span className="text-sm text-muted-foreground">
              {tr('{submitted} submitted, {approved} approved', totals)}
            </span>
          </figcaption>
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v) as (typeof RANGES)[number])}>
            <TabsList aria-label={tr('Period')}>
              {RANGES.map((r) => (
                <TabsTrigger key={r} value={String(r)}>{tr('{count} days', { count: r })}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="px-2 pt-4 pb-2 sm:px-4" aria-hidden>
          <ChartContainer config={config} className="h-56">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }} barGap={2} accessibilityLayer={false}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={(d: string) => formatShortDate(d, locale)}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <Tooltip
                cursor={{ fill: 'var(--muted)' }}
                content={(props) => (
                  <ChartTooltipContent
                    {...(props as object)}
                    config={config}
                    labelFormatter={(d) => formatShortDate(String(d), locale)}
                  />
                )}
              />
              <Bar dataKey="submitted" fill="var(--color-submitted)" radius={[3, 3, 0, 0]} maxBarSize={14} isAnimationActive={false} />
              <Bar dataKey="approved" fill="var(--color-approved)" radius={[3, 3, 0, 0]} maxBarSize={14} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        </div>
        <ul className="flex gap-4 px-5 pb-4 text-xs text-muted-foreground sm:px-6" aria-hidden>
          <li className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-[2px] bg-chart-1" />{config.submitted.label}</li>
          <li className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-[2px] bg-chart-2" />{config.approved.label}</li>
        </ul>
        <table className="sr-only">
          <caption>{title}, {period}</caption>
          <thead>
            <tr><th scope="col">{tr('Date')}</th><th scope="col">{config.submitted.label}</th><th scope="col">{config.approved.label}</th></tr>
          </thead>
          <tbody>
            {data.filter((d) => d.submitted || d.approved).map((d) => (
              <tr key={d.date}><th scope="row">{formatShortDate(d.date, locale)}</th><td>{d.submitted}</td><td>{d.approved}</td></tr>
            ))}
          </tbody>
        </table>
      </figure>
    </Card>
  );
}
