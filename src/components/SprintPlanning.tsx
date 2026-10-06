import { isAppAdmin } from '../lib/appAccess';
import { Badge, Banner, Button, Card, DatePicker, EmptyState, Field, Input, Modal, ProgressBar, Select, Textarea } from '@app/ui';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { isDone, uid, useStore } from '../data/store';
import type { Sprint } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import { formatDate } from '../lib/format';
import { nextSprintName, sprintDays, sprintEnd, sprintProblem, todayDate } from '../lib/sprints';
import '../styles/sprints.css';

const STATUS_LABEL = { planned: 'Planned', active: 'Active', completed: 'Completed' } as const;

function SprintEditor({ sprint, onClose, onSaved }: { sprint: Sprint | null; onClose: () => void; onSaved: (id: string) => void }) {
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const [draft, setDraft] = useState<Sprint>(() => sprint ?? { id: uid('sprint'), name: nextSprintName(state.sprints), startDate: todayDate(), endDate: sprintEnd(todayDate(), 14), status: 'planned', createdAt: new Date().toISOString() });
  const initialDays = sprintDays(draft.startDate, draft.endDate);
  const [duration, setDuration] = useState([7, 14, 21, 28].includes(initialDays) ? String(initialDays) : 'custom');
  const [error, setError] = useState<string | null>(null);
  const setDates = (startDate: string, choice = duration) => { setError(null); setDraft({ ...draft, startDate, endDate: choice === 'custom' ? draft.endDate : sprintEnd(startDate, Number(choice)) }); };
  return <Modal open title={tr(sprint ? 'Edit sprint' : 'Create sprint')} description={tr('Choose the goal and time period. Task due dates stay independent of sprint dates.')} onOpenChange={(open) => !open && onClose()} primaryAction={{ content: tr('Save sprint'), onAction: () => {
    const problem = sprintProblem(draft, state.sprints);
    if (problem) { setError(problem); return; }
    dispatch({ type: 'saveSprint', sprint: draft });
    onSaved(draft.id);
  } }} secondaryActions={[{ content: tr('Cancel'), onAction: onClose }]}>
    <div className="flex flex-col gap-4">
      {error && <Banner tone="critical">{tr(error)}</Banner>}
      <Field label={tr('Sprint name')} required><Input value={draft.name} maxLength={80} onChange={(event) => { setError(null); setDraft({ ...draft, name: event.target.value }); }} /></Field>
      <Field label={tr('Sprint goal')} optional><Textarea rows={2} value={draft.goal ?? ''} onChange={(event) => { setError(null); setDraft({ ...draft, goal: event.target.value }); }} /></Field>
      <Field label={tr('Duration')}><Select value={duration} onChange={(event) => { setDuration(event.target.value); setDates(draft.startDate, event.target.value); }} options={[{ value: '7', label: tr('1 week') }, { value: '14', label: tr('2 weeks') }, { value: '21', label: tr('3 weeks') }, { value: '28', label: tr('4 weeks') }, { value: 'custom', label: tr('Custom dates') }]} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker required label={tr('Start date')} value={draft.startDate} onChange={(event) => setDates(event.target.value)} />
        <DatePicker required label={tr('End date')} value={draft.endDate} min={draft.startDate} onChange={(event) => { setError(null); setDuration('custom'); setDraft({ ...draft, endDate: event.target.value }); }} />
      </div>
      <p className="text-sm text-muted-foreground">{tr('The start and end dates are both included. One week is 7 calendar days.')}</p>
    </div>
  </Modal>;
}

export function SprintPlanning({ overview, scope, onSelect, creating, onCreateClose, onCreate }: { overview: boolean; scope: string; onSelect: (id: string) => void; creating: boolean; onCreateClose: () => void; onCreate: () => void }) {
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const admin = isAppAdmin(state, 'tasks');
  const [editing, setEditing] = useState<Sprint | null>(null);
  const [closing, setClosing] = useState<Sprint | null>(null);
  const [moveTo, setMoveTo] = useState('backlog');
  const selected = state.sprints.find((sprint) => sprint.id === scope);
  const active = state.sprints.find((sprint) => sprint.status === 'active');
  const unfinished = closing ? state.tasks.filter((task) => task.sprintId === closing.id && !isDone(state, task)) : [];
  const closeEditor = () => { setEditing(null); onCreateClose(); };
  const ordered = [...state.sprints].sort((a, b) => ({ active: 0, planned: 1, completed: 2 }[a.status] - { active: 0, planned: 1, completed: 2 }[b.status]) || a.startDate.localeCompare(b.startDate));
  const summary = (sprint: Sprint) => {
    const tasks = state.tasks.filter((task) => task.sprintId === sprint.id);
    const completed = tasks.filter((task) => isDone(state, task)).length;
    return <div className="an-sprint-summary" key={sprint.id}>
      <div className="an-sprint-description">
        <div className="an-sprint-heading"><h2>{sprint.name}</h2><Badge size="sm" tone={sprint.status === 'active' ? 'info' : sprint.status === 'completed' ? 'success' : 'neutral'}>{tr(STATUS_LABEL[sprint.status])}</Badge></div>
        <p className="an-sprint-dates"><CalendarDays size={16} aria-hidden />{formatDate(`${sprint.startDate}T12:00`)} – {formatDate(`${sprint.endDate}T12:00`)}<span>· {tr('{count} days', { count: sprintDays(sprint.startDate, sprint.endDate) })}</span></p>
        {sprint.goal && <p className="an-sprint-goal">{sprint.goal}</p>}
        <ProgressBar label={tr('{done} of {total} tasks completed', { done: completed, total: tasks.length })} value={completed} max={Math.max(1, tasks.length)} size="sm" />
        {sprint.status === 'completed' && sprint.carriedTasks !== undefined && <p className="an-sprint-goal">{tr('{count} unfinished tasks moved when this sprint closed.', { count: sprint.carriedTasks })}</p>}
      </div>
      <div className="an-sprint-actions">
        {overview && <Button size="sm" onClick={() => onSelect(sprint.id)}>{tr('Open {name}', { name: sprint.name })}</Button>}
        {admin && sprint.status !== 'completed' && <Button size="sm" onClick={() => setEditing(sprint)}>{tr('Edit sprint')}</Button>}
        {admin && sprint.status === 'planned' && <Button variant="primary" size="sm" disabled={Boolean(active)} onClick={() => dispatch({ type: 'startSprint', sprintId: sprint.id })}>{tr('Start sprint')}</Button>}
        {admin && sprint.status === 'active' && <Button variant="primary" size="sm" onClick={() => { setClosing(sprint); setMoveTo('backlog'); }}>{tr('Complete sprint')}</Button>}
      </div>
    </div>;
  };
  return <>
    {overview ? <>
      <div className="an-sprint-overview-intro"><div><h2>{tr('Sprint planning')}</h2><p>{tr('Plan a fixed period of work. Keep unplanned tasks in the backlog.')}</p></div><Button onClick={() => onSelect('backlog')}>{tr('Open backlog')}</Button></div>
      {active && <p className="text-sm text-muted-foreground">{tr('Complete the active sprint before starting another.')}</p>}
      {ordered.length ? <Card flush>{ordered.map(summary)}</Card> : <Card><EmptyState size="card" heading={tr('No sprints yet')} action={admin ? <Button onClick={onCreate}>{tr('Create sprint')}</Button> : undefined}>{tr('Create Sprint 1 with a one-week, two-week or custom time period. Tasks can stay in the backlog until you plan them.')}</EmptyState></Card>}
    </> : selected ? <Card flush>{summary(selected)}</Card> : scope === 'backlog' ? <p className="text-sm text-muted-foreground">{tr('Backlog: tasks that have not been assigned to a sprint.')}</p> : null}
    {admin && (editing || creating) && <SprintEditor key={editing?.id ?? 'new'} sprint={editing} onClose={closeEditor} onSaved={(id) => { closeEditor(); onSelect(id); }} />}
    {admin && closing && <Modal open title={tr('Complete {name}?', { name: closing.name })} description={tr('Completed tasks stay in this sprint. Choose where unfinished work goes.')} onOpenChange={(open) => !open && setClosing(null)} primaryAction={{ content: tr('Complete sprint'), onAction: () => { dispatch({ type: 'completeSprint', sprintId: closing.id, moveTo: moveTo === 'backlog' ? undefined : moveTo }); setClosing(null); } }} secondaryActions={[{ content: tr('Cancel'), onAction: () => setClosing(null) }]}>
      <p className="mb-4 text-sm">{tr('{count} unfinished tasks will move.', { count: unfinished.length })}</p>
      <Field label={tr('Move unfinished tasks to')}><Select value={moveTo} onChange={(event) => setMoveTo(event.target.value)} options={[{ value: 'backlog', label: tr('Backlog') }, ...state.sprints.filter((sprint) => sprint.id !== closing.id && sprint.status !== 'completed').map((sprint) => ({ value: sprint.id, label: sprint.name }))]} /></Field>
    </Modal>}
  </>;
}
