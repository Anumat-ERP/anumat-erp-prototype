import { Button, Card, CardHeader, EmptyState, PageHeader, Text } from '@app/ui';
import { ArrowUpRight, ChevronRight, Plus, UsersRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { AppLink } from '../components/links';
import { RequestIcon } from '../components/RequestIcon';
import { Time } from '../components/Time';
import { useStore, waitingOnMe } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { formatMoney, typeName } from '../lib/format';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function Home() {
  const { t: tr } = useLocale();
  const { state, me, person } = useStore();
  const navigate = useNavigate();
  const waiting = waitingOnMe(state);
  const mine = state.requests.filter((r) => r.requesterId === me.id);
  const departments = [...new Set(state.people.map((p) => p.department))];
  const activity = state.requests
    .flatMap((r) => r.activity.map((a) => ({ ...a, request: r })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5);
  const summaries = [
    { status: 'pending', label: tr("In progress") },
    { status: 'changes', label: tr("Changes requested") },
    { status: 'draft', label: tr("Drafts") },
  ];

  return (
    <>
      <PageHeader title={`${tr(greeting())}, ${me.name.split(' ')[0]}`}
        subtitle={tr("Here's what's happening in your workspace.")} />
      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex min-w-0 flex-col gap-7">
          <Card flush>
            <div className="an-panel-header">
              <CardHeader title={tr('Things to do')} actions={
                <AppLink to="/approvals" className="inline-flex items-center gap-1 text-sm">{tr('View all')}<ChevronRight aria-hidden className="size-4" /></AppLink>
              } />
            </div>
            {waiting.length ? (
              <ul className="divide-y divide-border">
                {waiting.map((r) => (
                  <li key={r.id}>
                    <Link to={`/requests/${r.id}`} className="an-task-row focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
                      <RequestIcon type={r.type} />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <Text as="span" variant="label" className="leading-relaxed">{tr(r.title)}</Text>
                        <Text as="span" variant="bodySm" tone="muted">{tr(person(r.requesterId).name)} · {tr(typeName(r.type, state.processes))}</Text>
                        <Text as="span" variant="caption" tone="subtle">{tr('Waiting on you')} · {r.id}{r.amount !== undefined ? <span className="sm:hidden"> · {formatMoney(r.amount)}</span> : null}</Text>
                      </span>
                      <span className="hidden shrink-0 flex-col items-end gap-1 text-end sm:flex">
                        {r.amount !== undefined ? <Text as="span" variant="label" numeric>{formatMoney(r.amount)}</Text> : null}
                        <Text as="span" variant="bodySm" tone="subtle"><Time iso={r.createdAt} /></Text>
                      </span>
                      <ChevronRight aria-hidden className="size-4 shrink-0 text-fg-subtle sm:hidden" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <EmptyState size="card" heading={tr('All caught up')}>{tr('Nothing is waiting on your decision right now.')}</EmptyState>}
          </Card>

          <Card flush>
            <div className="an-panel-header"><CardHeader title={tr('Your requests')} actions={
              <AppLink to="/requests?mine=1" className="inline-flex items-center gap-1 text-sm">{tr('View all')}<ChevronRight aria-hidden className="size-4" /></AppLink>
            } /></div>
            <div className="an-summary-list">
              {summaries.map(({ status, label }) => <Link key={status} to={`/requests?mine=1&status=${status}`}>
                <span className="flex items-center gap-3"><span aria-hidden className={`an-state-dot an-state-${status}`} />{tr(label)}</span>
                <span className="flex items-center gap-4 text-fg-muted"><span className="tabular-nums">{mine.filter((r) => r.status === status).length}</span><ChevronRight aria-hidden className="size-4" /></span>
              </Link>)}
            </div>
            <div className="border-t border-border px-5 py-5 sm:px-7"><Button variant="primary" icon={<Plus />} onClick={() => navigate('/requests/new')}>{tr('New request')}</Button></div>
          </Card>

          <Card flush>
            <div className="an-panel-header"><CardHeader title={tr('Recent activity')} /></div>
            {activity.length ? <ol className="divide-y divide-border">
              {activity.map((a) => <li key={`${a.request.id}-${a.id}`} className="flex items-start gap-3 px-5 py-5 sm:px-7">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 text-sm leading-relaxed">
                  <span className="font-medium">{a.personId === me.id ? tr('You') : person(a.personId).name}</span>{' '}
                  {a.kind === 'comment' ? tr('commented on') : `${tr(a.text)} ·`}{' '}<AppLink to={`/requests/${a.request.id}`}>{tr(a.request.title)}</AppLink>
                  <Text variant="caption" as="p" tone="subtle" className="mt-1"><Time iso={a.at} /></Text>
                </div>
              </li>)}
            </ol> : <p className="px-7 py-6 text-fg-muted">{tr('No recent activity.')}</p>}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-7">
          <Card flush>
            <div className="an-panel-header"><CardHeader title={tr('Your team')} actions={
              <AppLink to="/settings/people" className="inline-flex items-center gap-1 text-sm">{tr('View all')}<ChevronRight aria-hidden className="size-4" /></AppLink>
            } /></div>
            <div className="p-5 sm:p-7">
              <div className="an-team-summary">
                <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-surface"><UsersRound className="size-6" /></span>
                <div><p className="flex items-baseline gap-2 text-fg"><strong className="text-3xl font-semibold">{state.people.length}</strong><span>{tr('People')}</span></p>
                  <Text variant="bodySm" tone="muted">{tr('{count} departments', { count: departments.length })}</Text>
                </div>
              </div>
            </div>
          </Card>
          <Card flush>
            <div className="an-panel-header"><CardHeader title={tr('Team by department')} /></div>
            <ul className="an-summary-list">{departments.map((department) => <li key={department}>
              <Link to="/settings/people"><span>{tr(department)}</span><span className="tabular-nums text-fg-muted">{state.people.filter((p) => p.department === department).length}</span></Link>
            </li>)}</ul>
          </Card>
          <Link to="/processes" className="flex items-center justify-between gap-4 rounded-xl px-2 py-1 text-sm text-fg-muted hover:text-fg-link focus-visible:outline-2 focus-visible:outline-ring">
            <span>{tr('Manage approval processes')}</span><ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
