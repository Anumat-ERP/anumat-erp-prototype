import { Button, Card, CardHeader, Checkbox, EmptyState, PageHeader, Text } from '@repo/ui';
import { ChevronRight, ClipboardList } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { questionsOf } from '../lib/forms';
import { AppLink } from '../components/links';
import { AvatarGroup } from '../components/Person';
import { RequestIcon } from '../components/RequestIcon';
import { firstStatus, isDone, surveysToAnswer, useStore, waitingOnMe } from '../data/store';
import { closesLabel } from './Surveys';
import { useTaskMover } from '../components/useTaskMover';
import { daysUntil, formatMoney, formatRelative, formatTime, formatWeekday, typeLabel, typeName } from '../lib/format';
import { Time } from '../components/Time';

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
  const { state, me, person } = useStore();
  const { move, dialog } = useTaskMover();
  const navigate = useNavigate();
  const waiting = waitingOnMe(state);
  const surveys = surveysToAnswer(state);
  const inFlight = state.requests.filter((r) => r.status === 'pending').length;
  const approved30 = state.requests.filter((r) => r.status === 'approved' && daysUntil(r.updatedAt) > -30).length;
  const myTasks = state.tasks
    .filter((t) => t.ownerId === me.id && !isDone(state, t))
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);
  const overdue = state.tasks.filter((t) => !isDone(state, t) && daysUntil(t.due) < 0).length;
  const upcoming = state.meetings
    .filter((m) => new Date(m.start).getTime() > Date.now())
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 3);
  const activity = state.requests
    .flatMap((r) => r.activity.map((a) => ({ ...a, request: r })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${me.name.split(' ')[0]}`}
        subtitle={
          waiting.length
            ? `${waiting.length} ${waiting.length === 1 ? 'request is' : 'requests are'} waiting on your decision.`
            : 'Nothing is waiting on you.'
        }
        primaryAction={{ content: 'New request', onAction: () => navigate('/requests/new') }}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Waiting on you" value={waiting.length} hint="Oldest first in Approvals" to="/approvals" />
        <Stat label="In progress" value={inFlight} hint="Requests moving through approval" to="/requests?status=pending" />
        <Stat label="Approved" value={approved30} hint="In the last 30 days" to="/requests?status=approved" />
        <Stat label="Overdue tasks" value={overdue} hint="Across all teams" to="/tasks" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card flush>
            <div className="p-4 pb-2">
              <CardHeader
                title="Needs your decision"
                description="Requests where you are the current approver."
                actions={<AppLink to="/approvals">View all</AppLink>}
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
                          {typeName(r.type, state.processes)} · {r.id} · {person(r.requesterId).name} · <Time iso={r.createdAt} />
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
              <EmptyState size="card" heading="All caught up">
                Nothing is waiting on your decision right now.
              </EmptyState>
            )}
          </Card>

          {surveys.length ? (
            <Card className="flex flex-col gap-3 border-primary/40">
              <CardHeader
                title="Surveys waiting for you"
                description={`${surveys.length} ${surveys.length === 1 ? 'survey is' : 'surveys are'} waiting for your answer.`}
              />
              <ul className="flex flex-col gap-2">
                {surveys.slice(0, 3).map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/surveys/${s.id}`}
                      className="flex items-center gap-3 rounded-md p-2 -mx-2 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <ClipboardList aria-hidden className="size-5 shrink-0 text-primary" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-fg">{s.title}</span>
                        <span className="text-sm text-fg-muted">
                          {questionsOf(s.fields).length} questions · {closesLabel(s)}
                        </span>
                      </span>
                      <ChevronRight aria-hidden className="size-4 text-fg-subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          <Card>
            <CardHeader title="Recent activity" />
            <ol className="mt-3 flex flex-col gap-3">
              {activity.map((a) => (
                <li key={`${a.request.id}-${a.id}`} className="flex gap-3 text-md">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="min-w-0">
                    <span className="font-medium">{a.personId === me.id ? 'You' : person(a.personId).name}</span>{' '}
                    {a.kind === 'comment' ? 'commented on' : `${a.text} ·`}{' '}
                    <AppLink to={`/requests/${a.request.id}`}>{a.request.title}</AppLink>
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
          <Card>
            <CardHeader title="Upcoming meetings" actions={<AppLink to="/meetings">All</AppLink>} />
            <ul className="mt-3 flex flex-col gap-3">
              {upcoming.map((m) => (
                <li key={m.id}>
                  <Link
                    to={`/meetings/${m.id}`}
                    className="flex items-start gap-3 rounded-md p-2 -m-2 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <span className="flex w-12 shrink-0 flex-col items-center rounded-md border border-border bg-surface-muted py-1">
                      <Text as="span" variant="caption" tone="muted">
                        {formatWeekday(m.start).split(' ')[0]}
                      </Text>
                      <Text as="span" variant="subtitle" numeric>
                        {new Date(m.start).getDate()}
                      </Text>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <Text as="span" variant="label" truncate>
                        {m.title}
                      </Text>
                      <Text as="span" variant="bodySm" tone="muted">
                        {formatTime(m.start)} · {m.durationMin} min
                      </Text>
                      <AvatarGroup ids={m.attendeeIds} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="My tasks" actions={<AppLink to="/tasks">All</AppLink>} />
            {myTasks.length ? (
              <ul className="mt-3 flex flex-col gap-3">
                {myTasks.map((t) => {
                  const d = daysUntil(t.due);
                  return (
                    <li key={t.id}>
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => move(t, firstStatus(state, 'done'))}
                        label={t.title}
                        helpText={d < 0 ? `Overdue by ${-d} ${-d === 1 ? 'day' : 'days'}` : d === 0 ? 'Due today' : `Due in ${d} ${d === 1 ? 'day' : 'days'}`}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Text tone="muted" className="mt-3">
                No open tasks. <AppLink to="/tasks">See the team’s tasks</AppLink>
              </Text>
            )}
          </Card>

          <Card tone="muted">
            <Text variant="subtitle">Ask → Approve → Move forward</Text>
            <Text tone="muted" className="mt-1">
              Raise a request and Anumat routes it to the right people, based on your approval processes.
            </Text>
            <Button className="mt-3" onClick={() => navigate('/processes')}>
              See processes
            </Button>
          </Card>
        </div>
      </div>
      {dialog}
    </>
  );
}
