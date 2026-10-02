import { Card, CardHeader, FigureValue, PageHeader, Text } from '@app/ui';
import { BarTable, ColumnChart, Legend } from '../components/charts';
import { AppLink } from '../components/links';
import { useStore } from '../data/store';
import type { DataState } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import { daysUntil, formatMoney, formatShortDate, typeLabel } from '../lib/format';
import type { Translate } from '../i18n/locale';

const HOUR = 3_600_000;
const dollars = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
// Submissions in the seven weeks before the demo data starts (illustrative history).
const HISTORY = [9, 12, 8, 14, 11, 15, 13];

/** Each decided step with how long it took and whether it beat its SLA. */
function decidedSteps(state: DataState) {
  return state.requests.flatMap((r) => {
    const process = state.processes.find((p) => p.requestType === r.type);
    let from = new Date(r.createdAt).getTime();
    return r.steps.flatMap((s) => {
      if (!s.at || s.status === 'current' || s.status === 'waiting') return [];
      const took = Math.max(0, new Date(s.at).getTime() - from) / HOUR;
      from = new Date(s.at).getTime();
      const sla = process?.steps.find((p) => p.name === s.name)?.slaHours ?? 48;
      return [{ took, onTime: took <= sla }];
    });
  });
}

function formatHours(h: number, tr: Translate) {
  return h < 24 ? tr('{n} h', { n: Math.round(h) }) : tr('{n} days', { n: (h / 24).toFixed(1) });
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  // "21 h" becomes a big 21 and a small h; "$4,650" and "73%" stay whole.
  const [, figure = value, unit] = /^(\S+)\s+(.+)$/.exec(value) ?? [];
  return (
    <Card className="flex flex-col gap-1">
      <Text as="span" variant="bodySm" tone="muted">
        {label}
      </Text>
      <FigureValue value={figure} unit={unit} className="mt-1" />
      <Text as="span" variant="caption" tone="subtle">
        {hint}
      </Text>
    </Card>
  );
}

export function Insights() {
  const { t: tr } = useLocale();
  const { state, person } = useStore();

  const waiting = state.requests.filter((r) => r.status === 'pending');
  const steps = decidedSteps(state);
  const onTime = steps.length ? Math.round((steps.filter((s) => s.onTime).length / steps.length) * 100) : 100;
  const recentApproved = state.requests.filter((r) => r.status === 'approved' && daysUntil(r.updatedAt) >= -30);
  const approvedSpend = recentApproved.reduce((a, r) => a + (r.amount ?? 0), 0);
  const totalRuns = state.processes.reduce((a, p) => a + p.runs30d, 0);
  const avgHours = state.processes.reduce((a, p) => a + p.avgHours * p.runs30d, 0) / Math.max(1, totalRuns);

  // Time to decision by process vs the sum of its step SLAs.
  const processRows = state.processes.map((p) => ({
    id: p.id,
    label: tr(p.name),
    segments: [{ value: p.avgHours, color: 'var(--an-chart-1)', label: tr('Average') }],
    target: p.steps.reduce((a, s) => a + s.slaHours, 0),
    display: formatHours(p.avgHours, tr),
    detail: tr('{process}: {time} on average over {count} requests. Target {target}.', { process: tr(p.name), time: formatHours(p.avgHours, tr), count: p.runs30d, target: formatHours(p.steps.reduce((a, s) => a + s.slaHours, 0), tr) }),
  }));

  // Where pending requests are waiting right now.
  const byApprover = new Map<string, { count: number; oldest: string }>();
  for (const r of waiting) {
    const step = r.steps.find((s) => s.status === 'current');
    if (!step) continue;
    const entry = byApprover.get(step.approverId);
    byApprover.set(step.approverId, {
      count: (entry?.count ?? 0) + 1,
      oldest: entry && entry.oldest < r.updatedAt ? entry.oldest : r.updatedAt,
    });
  }
  const bottleneckRows = [...byApprover.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([id, v]) => {
      const days = -daysUntil(v.oldest);
      return {
        id,
        label: person(id).name,
        segments: [{ value: v.count, color: 'var(--an-chart-1)', label: tr('Waiting') }],
        display: String(v.count),
        detail: tr(days === 1 ? '{name} has {count} waiting; the oldest for {days} day.' : '{name} has {count} waiting; the oldest for {days} days.', { name: person(id).name, count: v.count, days }),
      };
    });

  // Spend by department: approved vs still in approval.
  const departments = [...new Set(state.requests.filter((r) => r.amount).map((r) => r.department))];
  const spendRows = departments
    .map((d) => {
      const approved = state.requests.filter((r) => r.department === d && r.status === 'approved').reduce((a, r) => a + (r.amount ?? 0), 0);
      const pending = state.requests
        .filter((r) => r.department === d && (r.status === 'pending' || r.status === 'changes'))
        .reduce((a, r) => a + (r.amount ?? 0), 0);
      return {
        id: d,
        label: tr(d),
        segments: [
          {
            value: approved,
            color: 'var(--an-chart-1)',
            label: tr('Approved'),
          },
          {
            value: pending,
            color: 'var(--an-chart-2)',
            label: tr('In approval'),
          },
        ],
        display: dollars.format(approved + pending),
        detail: tr('{department}: {approved} approved, {pending} in approval.', { department: tr(d), approved: formatMoney(approved), pending: formatMoney(pending) }),
        total: approved + pending,
      };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  // Requests submitted per week.
  const thisWeek = state.requests.filter((r) => r.status !== 'draft' && daysUntil(r.createdAt) > -7).length;
  const weeks = [...HISTORY, thisWeek].map((value, i, all) => {
    const start = new Date();
    start.setDate(start.getDate() - 7 * (all.length - 1 - i));
    const current = i === all.length - 1;
    const label = current ? tr('Now') : formatShortDate(start.toISOString());
    return {
      label,
      value,
      detail: tr('{week}: {count} requests submitted', { week: current ? tr('This week') : tr('Week of {date}', { date: label }), count: value }),
    };
  });

  return (
    <>
      <PageHeader title={tr('Insights')} subtitle={tr('How fast decisions happen, and where they get stuck. Updates as you use the prototype.')} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={tr('Waiting for a decision')} value={String(waiting.length)} hint={tr('Requests in approval now')} />
        <Stat label={tr('Average time to decision')} value={formatHours(avgHours, tr)} hint={tr('Across {count} requests, last 30 days', { count: totalRuns })} />
        <Stat label={tr('Decided on time')} value={`${onTime}%`} hint={tr('Steps finished within their target')} />
        <Stat label={tr('Approved spend')} value={dollars.format(approvedSpend)} hint={tr('Last 30 days')} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <CardHeader title={tr('Time to decision by process')} description={tr("Average over the last 30 days, against the target set in Approval processes.")} />
          <Legend
            items={[
              { label: tr('Average time'), color: 'var(--an-chart-1)' },
              { label: tr('Target'), marker: 'target' },
            ]}
          />
          <BarTable caption={tr("Average time to decision by process")} valueHeader={tr('Average time')} rows={processRows} targetLabel={tr('Target')} />
          <Text variant="bodySm" tone="muted">
            {tr("Contract review runs longest: legal review alone has a 3-day target.")}{' '}<AppLink to="/processes/proc-contract">{tr('Edit the process')}</AppLink>
          </Text>
        </Card>

        <Card className="flex flex-col gap-4">
          <CardHeader title={tr('Where requests are waiting')} description={tr("Pending requests by the person whose decision they need.")} />
          {bottleneckRows.length ? (
            <BarTable caption={tr("Pending requests by current approver")} valueHeader={tr('Waiting')} rows={bottleneckRows} />
          ) : (
            <Text tone="muted">{tr('Nothing is waiting on anyone.')}</Text>
          )}
          <Text variant="bodySm" tone="muted">
            {tr("Hover a bar to see how long the oldest one has waited.")}</Text>
        </Card>

        <Card className="flex flex-col gap-4">
          <CardHeader title={tr('Spend by department')} description={tr("Purchases, expenses and contracts with an amount.")} />
          <Legend
            items={[
              { label: tr('Approved'), color: 'var(--an-chart-1)' },
              { label: tr('In approval'), color: 'var(--an-chart-2)' },
            ]}
          />
          <BarTable caption={tr("Approved and in-approval spend by department")} valueHeader={tr('Total')} rows={spendRows} />
        </Card>

        <Card className="flex flex-col gap-4">
          <CardHeader title={tr('Requests submitted per week')} description={tr("All types: {value0}.", { value0: Object.values(typeLabel).map((t) => tr(t).toLowerCase()).join(', ') })} />
          <ColumnChart caption={tr("Requests submitted per week, last 8 weeks")} points={weeks} />
        </Card>
      </div>
    </>
  );
}
