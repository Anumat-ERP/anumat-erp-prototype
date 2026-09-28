import { Badge, Button, Card, CardHeader, Checkbox, EmptyState, Field, Input, List, PageHeader, Select, Text, useToast } from '@repo/ui';
import { Gavel } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AppLink, headerLink } from '../components/links';
import { Person } from '../components/Person';
import { StatusBadge } from '../components/StatusBadge';
import { at } from '../data/seed';
import { firstStatus, isDone, uid, useStore } from '../data/store';
import { daysUntil, formatShortDate, formatTime, formatWeekday } from '../lib/format';

export function MeetingDetail() {
  const { id } = useParams();
  const { state, person, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [decision, setDecision] = useState('');
  const [task, setTask] = useState('');
  const [owner, setOwner] = useState('');
  const [taskError, setTaskError] = useState<string>();

  const m = state.meetings.find((x) => x.id === id);
  if (!m) {
    return (
      <EmptyState heading="This meeting doesn’t exist" action={<Button onClick={() => navigate('/meetings')}>Back to meetings</Button>}>
        It may have been cancelled, or the link is wrong.
      </EmptyState>
    );
  }
  const href = `/meetings/${m.id}`;
  const actionItems = state.tasks.filter((t) => t.source?.href === href);
  const requests = state.requests.filter((r) => m.requestIds.includes(r.id));
  const ownerId = owner || m.organizerId;

  return (
    <>
      <PageHeader
        title={m.title}
        subtitle={`${formatWeekday(m.start)}, ${formatTime(m.start)} · ${m.durationMin} min · ${m.location}`}
        backAction={{ content: 'Meetings', href: '/meetings' }}
        renderLink={headerLink}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Agenda" />
            <List type="number" className="mt-3">
              {m.agenda.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </List>
          </Card>

          <Card>
            <CardHeader title="Decisions" description="What was agreed. Everyone in the meeting can see these." />
            {m.decisions.length ? (
              <ul className="mt-4 flex flex-col gap-3">
                {m.decisions.map((d) => (
                  <li key={d.id} className="flex gap-3 rounded-md border border-success-border bg-success-subtle px-3 py-2">
                    <Gavel aria-hidden className="mt-0.5 size-4 shrink-0 text-success-subtle-fg" />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="text-fg">{d.text}</span>
                      {d.requestId ? (
                        <span className="text-sm">
                          <AppLink to={`/requests/${d.requestId}`}>{d.requestId}</AppLink>
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Text tone="muted" className="mt-3">
                No decisions recorded yet.
              </Text>
            )}
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                if (!decision.trim()) return;
                dispatch({ type: 'addDecision', meetingId: m.id, text: decision.trim() });
                setDecision('');
                toast({ tone: 'success', title: 'Decision recorded' });
              }}
            >
              <Field label="Record a decision" className="flex-1">
                <Input value={decision} onChange={(e) => setDecision(e.target.value)} placeholder="We agreed to…" />
              </Field>
              <Button type="submit" disabled={!decision.trim()}>
                Record
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader title="Action items" description="Each one becomes a task with an owner and a due date." />
            {actionItems.length ? (
              <ul className="mt-4 flex flex-col gap-3">
                {actionItems.map((t) => {
                  const d = daysUntil(t.due);
                  return (
                    <li key={t.id} className="flex flex-wrap items-start justify-between gap-2">
                      <Checkbox
                        checked={isDone(state, t)}
                        onCheckedChange={(c) =>
                          dispatch({ type: 'taskStatus', taskId: t.id, status: firstStatus(state, c === true ? 'done' : 'todo') })
                        }
                        label={t.title}
                        helpText={`${person(t.ownerId).name} · due ${formatShortDate(t.due)}`}
                      />
                      {!isDone(state, t) && d < 0 ? (
                        <Badge tone="critical" size="sm">
                          Overdue
                        </Badge>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Text tone="muted" className="mt-3">
                No action items yet.
              </Text>
            )}
            <form
              className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                if (!task.trim()) {
                  setTaskError('Describe the action, starting with a verb.');
                  return;
                }
                dispatch({
                  type: 'addTask',
                  task: { id: uid('t'), title: task.trim(), ownerId, due: at(7), status: firstStatus(state, 'todo'), source: { label: m.title, href } },
                });
                setTask('');
                setTaskError(undefined);
                toast({ tone: 'success', title: `Task assigned to ${person(ownerId).name}`, description: 'Due in 7 days.' });
              }}
            >
              <Field label="New action item" error={taskError}>
                <Input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Send the updated quote" />
              </Field>
              <Field label="Owner">
                <Select value={ownerId} onChange={(e) => setOwner(e.target.value)} options={m.attendeeIds.map((pid) => ({ value: pid, label: person(pid).name }))} />
              </Field>
              <Button type="submit">Add</Button>
            </form>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="People" />
            <ul className="mt-3 flex flex-col gap-3">
              {m.attendeeIds.map((pid) => (
                <li key={pid} className="flex items-center justify-between gap-2">
                  <Person id={pid} showRole />
                  {pid === m.organizerId ? (
                    <Badge size="sm" tone="primary">
                      Organiser
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
          {requests.length ? (
            <Card>
              <CardHeader title="Requests discussed" />
              <ul className="mt-3 flex flex-col gap-3">
                {requests.map((r) => (
                  <li key={r.id} className="flex flex-col items-start gap-1">
                    <AppLink to={`/requests/${r.id}`}>{r.title}</AppLink>
                    <StatusBadge status={r.status} size="sm" />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
