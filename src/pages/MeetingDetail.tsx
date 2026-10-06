import {decisionProblem,visibleDecision} from '../lib/workflowCompletion';
import {PeoplePicker} from '../components/PeoplePicker';
import { MeetingActions } from '../components/MeetingActions';
import { appRole, canContributeToApp } from '../lib/appAccess';
import { Badge, Banner, Button, Card, CardHeader, Checkbox, EmptyState, Field, Input, List, PageHeader, Select, Text, cn, useToast } from '@app/ui';
import { Gavel } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AppLink, headerLink } from '../components/links';
import { Person } from '../components/Person';
import { StatusBadge } from '../components/StatusBadge';
import { at } from '../data/seed';
import { canEditTask, firstStatus, isDone, uid, useStore } from '../data/store';
import { useTaskMover } from '../components/useTaskMover';
import { downloadIcs, googleCalendarUrl } from '../lib/calendar';
import { CalendarPlus, Download } from 'lucide-react';
import { daysUntil, formatShortDate, formatTime, formatWeekday } from '../lib/format';
import { useFresh } from '../lib/motion';
import { useLocale } from '../i18n/LocaleProvider';

export function MeetingDetail() {
  const { t: tr } = useLocale();
  const { id } = useParams();
  const { state, person, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { move, dialog } = useTaskMover();
  const [decision, setDecision] = useState('');
  const [privateNote,setPrivateNote]=useState(false);
  const [noteKind,setNoteKind]=useState<'decision'|'minutes'>('decision');
  const [noteReaders,setNoteReaders]=useState<string[]>([]);
  const [noteError,setNoteError]=useState<string>();
  const [task, setTask] = useState('');
  const [owner, setOwner] = useState('');
  const [taskError, setTaskError] = useState<string>();

  const m = state.meetings.find((x) => x.id === id);
  const freshDecision = useFresh(m?.decisions.map((d) => d.id) ?? []);
  const freshItem = useFresh(state.tasks.filter((t) => m && t.source?.href === `/meetings/${m.id}`).map((t) => t.id));
  if (!m) {
    return (
      <EmptyState heading={tr("This meeting doesn’t exist")} action={<Button onClick={() => navigate('/meetings')}>{tr("Back to meetings")}</Button>}>
        {tr("It may have been cancelled, or the link is wrong.")}</EmptyState>
    );
  }
  const decisions=m.decisions.filter(d=>visibleDecision(state,d));
  const href = `/meetings/${m.id}`;
  const actionItems = (appRole(state, 'tasks') ? state.tasks : []).filter((t) => t.source?.href === href);
  const requests = (appRole(state, 'approvals') ? state.requests : []).filter((r) => m.requestIds.includes(r.id));
  const taskPeople = m.attendeeIds.filter((id) => canContributeToApp(state, 'tasks', id));
  const ownerId = owner || (taskPeople.includes(m.organizerId) ? m.organizerId : taskPeople[0] ?? state.meId);

  return (
    <>
      <PageHeader
        title={tr(m.title)}
        subtitle={tr("{value0}, {value1} · {value2} min · {value3}", { value0: formatWeekday(m.start), value1: formatTime(m.start), value2: m.durationMin, value3: m.location })}
        backAction={{ content: tr("Meetings"), href: '/meetings' }}
        renderLink={headerLink}
      />
      <MeetingActions meeting={m} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title={tr("Agenda")} />
            <List type="number" className="mt-3">
              {m.agenda.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </List>
          </Card>

          <Card>
            <CardHeader title={tr("Decisions")} description={tr("Decisions and minutes show only to their permitted readers.")} />
            {decisions.length ? (
              <ul className="mt-4 flex flex-col gap-3">
                {decisions.map((d) => (
                  <li key={d.id} className={cn('flex gap-3 rounded-md border border-success-border bg-success-subtle px-3 py-2', freshDecision(d.id))}>
                    <Gavel aria-hidden className="mt-0.5 size-4 shrink-0 text-success-subtle-fg" />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="text-fg">{d.text}</span>
                      <span className="text-sm text-muted-foreground">{tr(d.kind==='minutes'?'Meeting minutes':'Decision')}{d.audienceIds?.length?` · ${tr('Restricted note')}`:''}</span>
                      {d.requestId && appRole(state,'approvals') ? (
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
                {tr("No decisions recorded yet.")}</Text>
            )}
            <form
              className="mt-4 flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!decision.trim() || (!canContributeToApp(state, 'meetings') || m.status === 'cancelled')) return;
                const readers=privateNote?[...new Set([state.meId,...noteReaders])]:undefined;
                const problem=decisionProblem(state,m.id,decision,readers);if(problem){setNoteError(problem);return;}
                dispatch({ type: 'addDecision', meetingId: m.id, text: decision.trim(),audienceIds:readers,kind:noteKind });
                setNoteError(undefined);
                setDecision('');
                toast({ tone: 'success', title: tr(noteKind === 'minutes' ? 'Minutes recorded' : 'Decision recorded') });
              }}
            >
              {noteError&&<Banner tone="critical">{tr(noteError)}</Banner>}
              <div className="grid gap-4 sm:grid-cols-2"><Field label={tr('Note type')}><Select value={noteKind} onChange={e=>setNoteKind(e.target.value as typeof noteKind)} options={[{value:'decision',label:tr('Decision')},{value:'minutes',label:tr('Meeting minutes')}]}/></Field><Field label={tr('Note visibility')}><Select value={privateNote?'selected':'all'} onChange={e=>setPrivateNote(e.target.value==='selected')} options={[{value:'all',label:tr('Everyone with Meetings access')},{value:'selected',label:tr('Selected meeting participants')}]}/></Field></div>
              {privateNote&&<Field label={tr('Additional readers')} helpText={tr('You are included automatically.')}><PeoplePicker app="meetings" label={tr('Additional readers')} emptyText={tr('No additional readers')} value={noteReaders} onChange={setNoteReaders} exclude={state.people.filter(p=>p.id===state.meId||![m.organizerId,...m.attendeeIds].includes(p.id)).map(p=>p.id)}/></Field>}
              <Field label={tr(noteKind === 'minutes' ? 'Record meeting minutes' : 'Record a decision')} className="flex-1">
                <Input value={decision} onChange={(e) => setDecision(e.target.value)} maxLength={4000} placeholder={tr(noteKind === 'minutes' ? 'Summarize the discussion and next steps…' : 'We agreed to…')} />
              </Field>
              <Button type="submit" disabled={!decision.trim() || (!canContributeToApp(state, 'meetings') || m.status === 'cancelled')}>
                {tr("Record")}</Button>
            </form>
          </Card>

          <Card>
            <CardHeader title={tr("Action items")} description={tr("Each one becomes a task with an owner and a due date.")} />
            {actionItems.length ? (
              <ul className="mt-4 flex flex-col gap-3">
                {actionItems.map((t) => {
                  const d = daysUntil(t.due);
                  return (
                    <li key={t.id} className={cn('flex flex-wrap items-start justify-between gap-2 rounded-md', freshItem(t.id))}>
                      <Checkbox
                        checked={isDone(state, t)}
                        disabled={!canEditTask(state, t)}
                        onCheckedChange={(c) => move(t, firstStatus(state, c === true ? 'done' : 'todo'))}
                        label={tr(t.title)}
                        helpText={`${person(t.ownerId).name} · due ${formatShortDate(t.due)}`}
                      />
                      {!isDone(state, t) && d < 0 ? (
                        <Badge tone="critical" size="sm">
                          {tr("Overdue")}</Badge>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Text tone="muted" className="mt-3">
                {tr("No action items yet.")}</Text>
            )}
            <form
              className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                if ((!canContributeToApp(state, 'tasks') || m.status === 'cancelled')) return;
                if (!task.trim()) {
                  setTaskError('Describe the action, starting with a verb.');
                  return;
                }
                dispatch({
                  type: 'addTask',
                  task: { id: uid('t'), title: task.trim(), ownerId, due: at(7), status: firstStatus(state, 'todo'), assignedById: state.meId, informedIds: m.attendeeIds.filter((a) => a !== ownerId && a !== state.meId && appRole(state, 'tasks', a)), consultedIds: [], source: { label: m.title, href } },
                });
                setTask('');
                setTaskError(undefined);
                toast({ tone: 'success', title: `Task assigned to ${person(ownerId).name}`, description: tr("Due in 7 days.") });
              }}
            >
              <Field label={tr("New action item")} error={taskError}>
                <Input value={task} onChange={(e) => setTask(e.target.value)} placeholder={tr("Send the updated quote")} />
              </Field>
              <Field label={tr("Owner")}>
                <Select value={ownerId} onChange={(e) => setOwner(e.target.value)} options={taskPeople.map((pid) => ({ value: pid, label: person(pid).name }))} />
              </Field>
              <Button type="submit" disabled={(!canContributeToApp(state, 'tasks') || m.status === 'cancelled')}>{tr("Add")}</Button>
            </form>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <CardHeader title={tr("Add to your calendar")} description={tr("Anumat keeps the agenda and decisions; your calendar keeps the time.")} />
            <div className="flex flex-wrap gap-2">
              <Button icon={<CalendarPlus />} asChild>
                <a href={googleCalendarUrl(m)} target="_blank" rel="noopener noreferrer">
                  {tr("Google Calendar")}</a>
              </Button>
              <Button icon={<Download />} onClick={() => downloadIcs(m)}>
                {tr("Outlook or Apple (.ics)")}</Button>
            </div>
          </Card>
          <Card>
            <CardHeader title={tr("People")} />
            <ul className="mt-3 flex flex-col gap-3">
              {m.attendeeIds.map((pid) => (
                <li key={pid} className="flex items-center justify-between gap-2">
                  <Person id={pid} showRole />
                  {pid === m.organizerId ? (
                    <Badge size="sm" tone="primary">
                      {tr("Organiser")}</Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
          {requests.length ? (
            <Card>
              <CardHeader title={tr("Requests discussed")} />
              <ul className="mt-3 flex flex-col gap-3">
                {requests.map((r) => (
                  <li key={r.id} className="flex flex-col items-start gap-1">
                    <AppLink to={`/requests/${r.id}`}>{tr(r.title)}</AppLink>
                    <StatusBadge status={r.status} size="sm" />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
      {dialog}
    </>
  );
}
