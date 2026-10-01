import { Button, Card, CardHeader, EmptyState, PageHeader, Text } from '@repo/ui';
import { ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { AppLink } from '../components/links';
import { RequestIcon } from '../components/RequestIcon';
import { Time } from '../components/Time';
import { useStore, waitingOnMe } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { daysUntil, formatMoney, typeName } from '../lib/format';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function Stat({ label, value, hint, to }: { label: string; value: number; hint: string; to: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 shadow-xs transition-colors duration-(--a-duration-fast) hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Text as="span" variant="bodySm" tone="muted">
        {label}
      </Text>
      <Text as="span" variant="display" numeric>
        {value}
      </Text>
      <Text as="span" variant="caption" tone="subtle">
        {hint}
      </Text>
    </Link>
  );
}

export function Home() {
  const { t: tr } = useLocale();
  const { state, me, person } = useStore();
  const navigate = useNavigate();
  const waiting = waitingOnMe(state);
  const inFlight = state.requests.filter((r) => r.status === 'pending').length;
  const approved30 = state.requests.filter((r) => r.status === 'approved' && daysUntil(r.updatedAt) > -30).length;
  const activity = state.requests
    .flatMap((r) => r.activity.map((a) => ({ ...a, request: r })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  return (
    <>
      <PageHeader
        title={`${tr(greeting())}, ${me.name.split(' ')[0]}`}
        subtitle={
          waiting.length
            ? tr('{count} requests waiting on your decision', {
                count: waiting.length,
              })
            : tr('Nothing is waiting on you.')
        }
        primaryAction={{
          content: tr('New request'),
          onAction: () => navigate('/requests/new'),
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label={tr('Waiting on you')} value={waiting.length} hint={tr('Oldest first in Approvals')} to="/approvals" />
        <Stat label={tr('In progress')} value={inFlight} hint={tr('Requests moving through approval')} to="/requests?status=pending" />
        <Stat label={tr('Approved')} value={approved30} hint={tr('In the last 30 days')} to="/requests?status=approved" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card flush>
            <div className="p-4 pb-2">
              <CardHeader
                title={tr('Needs your decision')}
                description={tr('Requests where you are the current approver.')}
                actions={<AppLink to="/approvals">{tr('View all')}</AppLink>}
              />
            </div>
            {waiting.length ? (
              <ul className="divide-y divide-border">
                {waiting.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/requests/${r.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    >
                      <RequestIcon type={r.type} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <Text as="span" variant="label" truncate>
                          {r.title}
                        </Text>
                        <Text as="span" variant="bodySm" tone="muted" truncate>
                          {tr(typeName(r.type, state.processes))} · {r.id} · {person(r.requesterId).name} · <Time iso={r.createdAt} />
                        </Text>
                      </span>
                      {r.amount !== undefined ? (
                        <Text as="span" variant="label" numeric className="hidden sm:block">
                          {formatMoney(r.amount)}
                        </Text>
                      ) : null}
                      <ChevronRight aria-hidden className="size-4 shrink-0 text-fg-subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState size="card" heading={tr('All caught up')}>
                {' '}
                {tr('Nothing is waiting on your decision right now.')}{' '}
              </EmptyState>
            )}
          </Card>

          <Card>
            <CardHeader title={tr('Recent activity')} />
            <ol className="mt-3 flex flex-col gap-3">
              {activity.map((a) => (
                <li key={`${a.request.id}-${a.id}`} className="flex gap-3 text-md">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="min-w-0">
                    <span className="font-medium">{a.personId === me.id ? tr('You') : person(a.personId).name}</span>{' '}
                    {a.kind === 'comment' ? tr('commented on') : `${tr(a.text)} ·`} <AppLink to={`/requests/${a.request.id}`}>{a.request.title}</AppLink>
                    <Text as="span" variant="bodySm" tone="subtle">
                      {' '}
                      · <Time iso={a.at} />
                    </Text>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card tone="muted">
            <Text variant="subtitle">{tr('Ask → Approve → Move forward')}</Text>
            <Text tone="muted" className="mt-1">
              {' '}
              {tr('Raise a request and Anumat routes it to the right people, based on your approval processes.')}{' '}
            </Text>
            <Button className="mt-3" onClick={() => navigate('/processes')}>
              {' '}
              {tr('See processes')}{' '}
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
