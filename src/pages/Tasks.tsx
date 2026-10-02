import { ButtonBase } from '@mui/material';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  PageHeader,
  SearchField,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  cn,
} from '@app/ui';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { StatusManager } from '../components/StatusManager';
import { TaskDrawer } from '../components/TaskDrawer';
import { useTaskMover } from '../components/useTaskMover';
import { canEditTask, firstStatus, isAdmin, isDone, statusDef, useStore } from '../data/store';
import type { DataState, Task } from '../data/types';
import { daysUntil, formatShortDate } from '../lib/format';
import { useLocale } from '../i18n/LocaleProvider';
import type { createTranslator } from '../i18n/locale';

type View = 'list' | 'board';
type Source = 'any' | 'meeting' | 'request' | 'none';

const RECENT_DONE_DAYS = 7;

function dueLabel(task: Task, done: boolean, tr: ReturnType<typeof createTranslator>) {
  if (done) return task.doneAt ? tr('Done {date}', { date: formatShortDate(task.doneAt) }) : tr('Done');
  const d = daysUntil(task.due);
  if (d < 0) return tr(d === -1 ? '{count} day overdue' : '{count} days overdue', { count: -d });
  if (d === 0) return tr('Due today');
  if (d === 1) return tr('Due tomorrow');
  return tr('Due {date}', { date: formatShortDate(task.due) });
}

function recentlyDone(t: Task) {
  return !t.doneAt || daysUntil(t.doneAt) >= -RECENT_DONE_DAYS;
}

/** One line per task: checkbox, title, then status, due and source in a quiet meta line. */
type Mover = ReturnType<typeof useTaskMover>['move'];

function TaskRow({ task, state, onOpen, move }: { task: Task; state: DataState; onOpen: () => void; move: Mover }) {
  const { t: tr } = useLocale();
  const { person } = useStore();
  const done = isDone(state, task);
  const editable = canEditTask(state, task);
  const assigner = person(task.assignedById ?? task.ownerId);
  const canSignOff = Boolean(task.signOffRequestedAt) && (task.assignedById === state.meId || isAdmin(state));
  const status = statusDef(state, task.status);
  const overdue = !done && daysUntil(task.due) < 0;
  const owner = person(task.ownerId);
  return (
    <li className="flex items-start gap-3 px-4 py-2.5 hover:bg-surface-hover">
      <Checkbox
        className="mt-0.5"
        labelHidden
        label={editable ? (done ? tr('Mark “{title}” not done', { title: task.title }) : tr('Mark “{title}” done', { title: task.title })) : tr('“{title}” (view only)', { title: task.title })}
        checked={done}
        disabled={!editable}
        onCheckedChange={(c) => move(task, firstStatus(state, c === true ? 'done' : 'todo'))}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <ButtonBase
          type="button"
          onClick={onOpen}
          className={cn(
            'truncate rounded-sm text-start text-md font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            done ? 'text-fg-muted line-through' : 'text-fg',
          )}
          title={tr(task.title)}
        >
          {tr(task.title)}
        </ButtonBase>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted">
          {status.category === 'active' ? (
            <Badge size="sm" tone={status.tone}>
              {tr(status.name)}
            </Badge>
          ) : null}
          {task.statusNote ? <span className="text-fg">“{task.statusNote}”</span> : null}
          {task.signOffRequestedAt ? (
            <Badge size="sm" tone="warning">
              {task.assignedById === state.meId ? tr('Needs your sign-off') : tr('Waiting for sign-off from {name}', { name: assigner.name })}
            </Badge>
          ) : null}
          <span className={overdue ? 'font-medium text-critical-subtle-fg' : undefined}>{dueLabel(task, done, tr)}</span>
          {task.source ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{tr(task.source.label)}</span>
            </>
          ) : null}
          {task.notes ? (
            <>
              <span aria-hidden>·</span>
              <span>{tr("Has notes")}</span>
            </>
          ) : null}
          {task.comments?.length ? (
            <>
              <span aria-hidden>·</span>
              <span>
                {tr(task.comments.length === 1 ? '{count} comment' : '{count} comments', { count: task.comments.length })}
              </span>
            </>
          ) : null}
          {task.consultedIds?.includes(state.meId) ? (
            <Badge size="sm" tone="info">
              {tr("You’re consulted")}</Badge>
          ) : task.informedIds?.includes(state.meId) ? (
            <Badge size="sm">{tr("You’re informed")}</Badge>
          ) : null}
          {!editable ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Lock aria-hidden className="size-3" />
                {tr("View only")}</span>
            </>
          ) : null}
        </span>
      </div>
      {canSignOff ? (
        <Button size="sm" variant="primary" onClick={() => move(task, firstStatus(state, 'done'))}>
          {tr("Sign off")}</Button>
      ) : null}
      <span className="flex shrink-0 items-center gap-2">
        <Avatar name={owner.name} size="xs" decorative />
        <span className="hidden w-24 truncate text-sm text-fg-muted md:inline">{tr(owner.name)}</span>
        <span className="sr-only md:hidden">{tr(owner.name)}</span>
      </span>
    </li>
  );
}

function Group({
  title,
  tone,
  tasks,
  state,
  onOpen,
  move,
  collapsible,
  children,
}: {
  title: string;
  tone?: 'critical';
  tasks: Task[];
  state: DataState;
  onOpen: (t: Task) => void;
  move: Mover;
  collapsible?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(!collapsible);
  if (!tasks.length && !children) return null;
  const id = `group-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const heading = (
    <span className="flex items-center gap-2">
      <span className={cn('text-md font-semibold', tone === 'critical' ? 'text-critical-subtle-fg' : 'text-fg')}>{title}</span>
      <Badge size="sm" tone={tone ?? 'neutral'}>
        {tasks.length}
      </Badge>
    </span>
  );
  return (
    <section aria-labelledby={id} className="flex flex-col">
      <h2 id={id} className="px-4 pt-4 pb-2">
        {collapsible ? (
          <ButtonBase
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="-ms-1 flex items-center gap-1 rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
          >
            {open ? <ChevronDown aria-hidden className="size-4" /> : <ChevronRight aria-hidden className="size-4" />}
            {heading}
          </ButtonBase>
        ) : (
          heading
        )}
      </h2>
      {open ? (
        <>
          <ul className="divide-y divide-border-subtle">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} state={state} onOpen={() => onOpen(t)} move={move} />
            ))}
          </ul>
          {children}
        </>
      ) : null}
    </section>
  );
}

export function Tasks() {
  const { t: tr } = useLocale();
  const { state, me, person } = useStore();
  const { move, dialog } = useTaskMover();
  const admin = isAdmin(state);
  const [view, setView] = useState<View>('list');
  const [owner, setOwner] = useState('me');
  const [source, setSource] = useState<Source>('any');
  const [query, setQuery] = useState('');
  const [showAllDone, setShowAllDone] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState(false);

  const openTask = state.tasks.find((t) => t.id === openId) ?? null;
  const ownerId = owner === 'me' ? me.id : owner;

  const tasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.tasks
      .filter((t) => {
        if (owner === 'all') return true;
        if (owner === 'consulted') return t.consultedIds?.includes(me.id);
        if (owner === 'informed') return t.informedIds?.includes(me.id);
        return t.ownerId === ownerId;
      })
      .filter((t) => {
        if (source === 'any') return true;
        if (source === 'none') return !t.source;
        return t.source?.href.startsWith(source === 'meeting' ? '/meetings/' : '/requests/');
      })
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q) || t.source?.label.toLowerCase().includes(q))
      .sort((a, b) => a.due.localeCompare(b.due));
  }, [state.tasks, owner, ownerId, source, query, me.id]);

  const open = tasks.filter((t) => !isDone(state, t));
  const done = tasks.filter((t) => isDone(state, t)).sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''));
  const shownDone = showAllDone ? done : done.filter(recentlyDone);
  const hiddenDone = done.length - shownDone.length;
  const groups = {
    overdue: open.filter((t) => daysUntil(t.due) < 0),
    today: open.filter((t) => daysUntil(t.due) === 0),
    week: open.filter((t) => daysUntil(t.due) > 0 && daysUntil(t.due) <= 7),
    later: open.filter((t) => daysUntil(t.due) > 7),
  };
  const filtered = Boolean(query || source !== 'any');
  const clear = () => {
    setQuery('');
    setSource('any');
    setOwner('all');
  };
  const openDrawer = (t: Task) => setOpenId(t.id);

  return (
    <>
      <PageHeader
        title={tr("Tasks")}
        subtitle={tr("Decisions turned into work, with an owner and a deadline.")}
        primaryAction={{ content: tr("New task"), onAction: () => setCreating(true) }}
        secondaryActions={admin ? [{ content: tr("Manage statuses"), onAction: () => setManaging(true) }] : undefined}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList aria-label={tr("Task view")}>
            <TabsTrigger value="list">{tr("List")}</TabsTrigger>
            <TabsTrigger value="board">{tr("Board")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            size="sm"
            aria-label={tr("Whose tasks")}
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            options={[
              { value: 'me', label: tr("My tasks") },
              { value: 'consulted', label: tr("Where I’m consulted") },
              { value: 'informed', label: tr("Where I’m informed") },
              { value: 'all', label: tr("Everyone") },
              { label: tr("People"), options: state.people.filter((p) => p.id !== me.id).map((p) => ({ value: p.id, label: p.name })) },
            ]}
            className="w-48"
          />
          <Select
            size="sm"
            aria-label={tr("Where tasks came from")}
            value={source}
            onChange={(e) => setSource(e.target.value as Source)}
            options={[
              { value: 'any', label: tr("From anywhere") },
              { value: 'meeting', label: tr("From meetings") },
              { value: 'request', label: tr("From requests") },
              { value: 'none', label: tr("Added directly") },
            ]}
            className="w-40"
          />
          <SearchField label={tr("Search tasks")} labelHidden size="sm" placeholder={tr("Search tasks")} value={query} onChange={setQuery} className="w-full sm:w-56" />
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card>
          {filtered ? (
            <EmptyState size="card" heading={tr("No tasks match")} action={<Button onClick={clear}>{tr("Clear filters")}</Button>}>
              {tr("Try another search, or show everyone’s tasks.")}</EmptyState>
          ) : (
            <EmptyState
              size="card"
              heading={
                owner === 'consulted' ? tr('Nobody needs your input') : owner === 'informed' ? tr('Nothing to follow') : owner === 'me' ? tr('Nothing on your plate') : tr('No tasks yet')
              }
              action={<Button onClick={() => setCreating(true)}>{tr("New task")}</Button>}
            >
              {tr("Action items from meetings and requests show up here.")}</EmptyState>
          )}
        </Card>
      ) : view === 'list' ? (
        <Card flush>
          {open.length === 0 ? (
            <Text tone="muted" className="px-4 pt-4">
              {owner === 'me' || owner === 'consulted' || owner === 'informed'
                ? tr('All caught up. Nothing open.')
                : tr('All caught up. Nothing open for {name}.', { name: owner === 'all' ? tr('anyone') : person(owner).name })}
            </Text>
          ) : null}
          <Group title={tr("Overdue")} tone="critical" tasks={groups.overdue} state={state} onOpen={openDrawer} move={move} />
          <Group title={tr("Today")} tasks={groups.today} state={state} onOpen={openDrawer} move={move} />
          <Group title={tr("This week")} tasks={groups.week} state={state} onOpen={openDrawer} move={move} />
          <Group title={tr("Later")} tasks={groups.later} state={state} onOpen={openDrawer} move={move} />
          {done.length ? (
            <Group title={showAllDone ? tr('Done') : tr('Done in the last 7 days')} tasks={shownDone} state={state} onOpen={openDrawer} move={move} collapsible>
              {hiddenDone ? (
                <div className="px-4 py-2">
                  <Button size="sm" variant="plain" onClick={() => setShowAllDone(true)}>
                    {tr(hiddenDone === 1 ? 'Show {count} older done task' : 'Show {count} older done tasks', { count: hiddenDone })}
                  </Button>
                </div>
              ) : null}
            </Group>
          ) : null}
          <div className="h-2" />
        </Card>
      ) : (
        <div className="overflow-x-auto pb-2" role="region" aria-label={tr("Task board")} tabIndex={0}>
          <div className="flex w-max gap-4">
            {state.taskStatuses.map((s) => {
              const all = tasks.filter((t) => t.status === s.id);
              const column = s.category === 'done' && !showAllDone ? all.filter(recentlyDone) : all;
              return (
                <section key={s.id} aria-labelledby={`col-${s.id}`} className="flex w-72 shrink-0 flex-col gap-2 rounded-lg bg-surface-sunken p-3">
                  <h2 className="flex items-center justify-between px-1">
                    <Badge id={`col-${s.id}`} tone={s.tone} size="sm">
                      {tr(s.name)}
                    </Badge>
                    <Text as="span" variant="caption" tone="muted" numeric>
                      {column.length}
                      <span className="sr-only"> {tr("tasks")}</span>
                    </Text>
                  </h2>
                  {column.length ? (
                    <ul className="flex flex-col gap-2">
                      {column.map((t) => {
                        const overdue = s.category !== 'done' && daysUntil(t.due) < 0;
                        return (
                          <li key={t.id}>
                            <Card className="flex flex-col gap-2 p-3">
                              <ButtonBase
                                type="button"
                                onClick={() => setOpenId(t.id)}
                                className="line-clamp-2 rounded-sm text-start text-md font-medium text-fg hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                                title={tr(t.title)}
                              >
                                {tr(t.title)}
                              </ButtonBase>
                              <div className="flex items-center justify-between gap-2 text-sm">
                                <span className="flex min-w-0 items-center gap-1.5 text-fg-muted">
                                  <Avatar name={person(t.ownerId).name} size="xs" decorative />
                                  <span className="truncate">{person(t.ownerId).name.split(' ')[0]}</span>
                                </span>
                                <span className={overdue ? 'shrink-0 font-medium text-critical-subtle-fg' : 'shrink-0 text-fg-muted'}>
                                  {dueLabel(t, s.category === 'done', tr)}
                                </span>
                              </div>
                              {t.statusNote || t.signOffRequestedAt ? (
                                <Text variant="caption" tone="muted" className="line-clamp-2">
                                  {t.signOffRequestedAt ? tr('Waiting for sign-off from {name}', { name: person(t.assignedById ?? t.ownerId).name }) : `“${t.statusNote}”`}
                                </Text>
                              ) : null}
                              {canEditTask(state, t) ? (
                                <Select
                                  size="sm"
                                  aria-label={tr('Move “{title}” to', { title: t.title })}
                                  value={t.status}
                                  onChange={(e) => move(t, e.target.value)}
                                  options={state.taskStatuses.map((x) => ({ value: x.id, label: tr(x.name) }))}
                                />
                              ) : (
                                <Text variant="caption" tone="muted" className="inline-flex items-center gap-1">
                                  <Lock aria-hidden className="size-3" /> {tr("View only")}</Text>
                              )}
                            </Card>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <Text variant="bodySm" tone="muted" className="px-1 pb-1">
                      {tr("Nothing here.")}</Text>
                  )}
                  {s.category === 'done' && all.length > column.length ? (
                    <Button size="sm" variant="plain" className="self-start px-1" onClick={() => setShowAllDone(true)}>
                      {tr("Show")}{' '}{all.length - column.length} {tr("older")}</Button>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      )}

      <TaskDrawer
        task={openTask}
        creating={creating}
        onClose={() => {
          setOpenId(null);
          setCreating(false);
        }}
      />
      <StatusManager open={managing} onClose={() => setManaging(false)} />
      {dialog}
    </>
  );
}
