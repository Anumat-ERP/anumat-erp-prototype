import { Avatar, Banner, Button, DatePicker, Drawer, Field, Select, Text, Textarea, cn, useToast } from '@app/ui';
import { useEffect, useState } from 'react';
import { at } from '../data/seed';
import { canCommentOnTask, canEditTask, firstStatus, isAdmin, planMove, statusDef, uid, useStore } from '../data/store';
import { formatRelative } from '../lib/format';
import { PeoplePicker } from './PeoplePicker';
import type { Task } from '../data/types';
import { AppLink } from './links';
import { Time } from './Time';
import { useFresh } from '../lib/motion';
import { useLocale } from '../i18n/LocaleProvider';

const CATEGORY_LABEL = { todo: 'To do', active: 'In progress', done: 'Done' } as const;

/**
 * View and edit one task, or create a new one (`task` null, `creating` true).
 * Changes apply on Save.
 */
export function TaskDrawer({ task, creating, onClose }: { task: Task | null; creating: boolean; onClose: () => void }) {
  const { t: tr } = useLocale();
  const { state, me, person, dispatch } = useStore();
  const { toast } = useToast();
  const open = creating || task !== null;
  const freshComment = useFresh(task?.comments?.map((c) => c.id) ?? [], task?.id);
  const blank = (): Task => ({ id: '', title: '', ownerId: me.id, assignedById: me.id, due: at(7), status: firstStatus(state, 'todo') });

  const [draft, setDraft] = useState<Task>(task ?? blank());
  const [error, setError] = useState<string>();
  const [statusError, setStatusError] = useState<string>();
  const [comment, setComment] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset the form whenever a different task (or a new one) is opened.
  useEffect(() => {
    setDraft(task ?? blank());
    setError(undefined);
    setStatusError(undefined);
    setComment('');
    setConfirmDelete(false);
  }, [task?.id, creating]);

  const editable = creating || (task !== null && canEditTask(state, task));
  const canDelete = task !== null && (task.assignedById === me.id || isAdmin(state) || (task.ownerId === me.id && task.assignedById === me.id));
  const target = statusDef(state, draft.status);
  const needsNote = !creating && task !== null && draft.status !== task.status && target.requireNote;

  const save = () => {
    if (!draft.title.trim()) {
      setError(tr('Describe the task, starting with a verb, like “Send the updated quote”.'));
      return;
    }
    const clean = { ...draft, title: draft.title.trim(), notes: draft.notes?.trim() || undefined };
    if (creating) {
      dispatch({ type: 'addTask', task: { ...clean, id: uid('t'), assignedById: me.id } });
      toast({ tone: 'success', title: tr('Task added'), description: tr('Assigned to {name}.', { name: clean.ownerId === me.id ? tr('you') : person(clean.ownerId).name }) });
      onClose();
      return;
    }
    if (!task) return;
    const plan = draft.status !== task.status ? planMove(state, task, draft.status) : null;
    if (plan?.kind === 'denied') {
      setStatusError(tr(plan.reason));
      return;
    }
    if (plan?.kind === 'note' && !draft.statusNote?.trim()) {
      setStatusError(tr('Say why it’s {status}, so the right person can help.', { status: tr(target.name).toLowerCase() }));
      return;
    }
    // Save the details first, then move it through the rules.
    dispatch({ type: 'updateTask', taskId: task.id, patch: { ...clean, status: task.status, statusNote: task.statusNote } });
    if (plan?.kind === 'signoff') {
      dispatch({ type: 'moveTask', taskId: task.id, status: plan.via, signOff: true });
      toast({ tone: 'success', title: tr('Sent to {name} for sign-off', { name: person(plan.assignerId).name }) });
    } else if (plan) {
      dispatch({ type: 'moveTask', taskId: task.id, status: draft.status, note: draft.statusNote?.trim() });
      toast({ title: tr("Task saved") });
    } else {
      toast({ title: tr("Task saved") });
    }
    onClose();
  };

  const categories = (['todo', 'active', 'done'] as const)
    .map((c) => ({ label: tr(CATEGORY_LABEL[c]), options: state.taskStatuses.filter((s) => s.category === c).map((s) => ({ value: s.id, label: tr(s.name) })) }))
    .filter((g) => g.options.length);

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => (o ? undefined : onClose())}
      title={creating ? tr('New task') : tr('Task')}
      size="md"
      primaryAction={editable ? { content: creating ? tr('Add task') : tr('Save'), onAction: save } : undefined}
      secondaryActions={[
        { content: editable ? tr('Cancel') : tr('Close'), onAction: onClose },
        ...(!creating && task && canDelete
          ? [
              {
                content: confirmDelete ? tr('Delete for good?') : tr('Delete'),
                destructive: true,
                onAction: () => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  dispatch({ type: 'deleteTask', taskId: task.id });
                  toast({ title: tr("Task deleted") });
                  onClose();
                },
              },
            ]
          : []),
      ]}
    >
      <div className="flex flex-col gap-5">
        {!editable && task ? (
          <Banner tone="info" title={tr("View only")}>
            {planMove(state, task, task.status).kind === 'denied'
              ? tr((planMove(state, task, task.status) as { reason: string }).reason)
              : tr('You can’t change this task.')}{' '}
            {task.consultedIds?.includes(me.id) ? tr('You’re consulted, so you can comment.') : tr('You can still see where it came from.')}
          </Banner>
        ) : null}
        {task?.signOffRequestedAt ? (
          <Banner tone="warning" title={tr("Waiting for sign-off")}>
            {tr(person(task.ownerId).name)} {tr("finished this.")}{' '}{tr(person(task.assignedById ?? task.ownerId).name)} {tr("signs it off by moving it to Done.")}</Banner>
        ) : null}
        <Field label={tr("Task")} required error={error} disabled={!editable}>
          <Textarea
            rows={2}
            autoGrow
            value={draft.title}
            onChange={(e) => {
              setDraft({ ...draft, title: e.target.value });
              if (error) setError(undefined);
            }}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tr("Status")} error={statusError} disabled={!editable}>
            <Select
              value={draft.status}
              onChange={(e) => {
                setDraft({ ...draft, status: e.target.value });
                setStatusError(undefined);
              }}
              options={categories}
            />
          </Field>
          <Field label={tr("Owner")} disabled={!editable}>
            <Select
              value={draft.ownerId}
              onChange={(e) => setDraft({ ...draft, ownerId: e.target.value })}
              options={state.people.map((p) => ({ value: p.id, label: p.id === me.id ? tr('{name} (you)', { name: p.name }) : p.name }))}
            />
          </Field>
        </div>
        {needsNote ? (
          <Field label={tr('Why is it {status}?', { status: tr(target.name).toLowerCase() })} required>
            <Textarea rows={2} autoGrow value={draft.statusNote ?? ''} onChange={(e) => setDraft({ ...draft, statusNote: e.target.value })} />
          </Field>
        ) : task?.statusNote && task.status === draft.status ? (
          <div className="flex flex-col gap-1">
            <Text variant="caption" tone="muted">
              {tr('Why it’s {status}', { status: tr(statusDef(state, task.status).name).toLowerCase() })}
            </Text>
            <Text>“{task.statusNote}”</Text>
          </div>
        ) : null}
        <section aria-labelledby="raci-title" className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <div className="flex items-baseline justify-between gap-2">
            <Text as="h3" id="raci-title" variant="label">
              {tr("RACI")}</Text>
            <Text as="span" variant="caption" tone="muted">
              {tr("Who does it, who answers for it, who to ask, who to tell")}</Text>
          </div>
          <dl className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3 gap-y-3 text-md">
            <dt className="pt-0.5 font-mono text-sm font-semibold text-fg-muted" title={tr("Responsible")}>
              <span aria-hidden="true">R</span><span className="sr-only">{tr('Responsible')}</span>
            </dt>
            <dd className="flex items-center gap-2">
              <Avatar name={person(draft.ownerId).name} size="xs" decorative />
              {tr(person(draft.ownerId).name)}
              <Text as="span" variant="caption" tone="muted">
                {tr("does the work (owner)")}</Text>
            </dd>
            <dt className="pt-0.5 font-mono text-sm font-semibold text-fg-muted" title={tr("Accountable")}>
              <span aria-hidden="true">A</span><span className="sr-only">{tr('Accountable')}</span>
            </dt>
            <dd className="flex items-center gap-2">
              <Avatar name={person(draft.assignedById ?? draft.ownerId).name} size="xs" decorative />
              {tr(person(draft.assignedById ?? draft.ownerId).name)}
              <Text as="span" variant="caption" tone="muted">
                {tr("assigned it, signs it off")}</Text>
            </dd>
            <dt className="pt-1.5 font-mono text-sm font-semibold text-fg-muted" title={tr("Consulted")}>
              <span aria-hidden="true">C</span><span className="sr-only">{tr('Consulted')}</span>
            </dt>
            <dd>
              <PeoplePicker
                label={tr("Consulted")}
                value={draft.consultedIds ?? []}
                onChange={(ids) => setDraft({ ...draft, consultedIds: ids, informedIds: (draft.informedIds ?? []).filter((i) => !ids.includes(i)) })}
                exclude={[draft.ownerId, draft.assignedById ?? draft.ownerId]}
                disabled={!editable}
                emptyText={tr('Nobody to consult')}
              />
            </dd>
            <dt className="pt-1.5 font-mono text-sm font-semibold text-fg-muted" title={tr("Informed")}>
              <span aria-hidden="true">I</span><span className="sr-only">{tr('Informed')}</span>
            </dt>
            <dd>
              <PeoplePicker
                label={tr("Informed")}
                value={draft.informedIds ?? []}
                onChange={(ids) => setDraft({ ...draft, informedIds: ids })}
                exclude={[draft.ownerId, draft.assignedById ?? draft.ownerId, ...(draft.consultedIds ?? [])]}
                disabled={!editable}
                emptyText={tr('Nobody to inform')}
              />
            </dd>
          </dl>
          <Text variant="caption" tone="muted">
            {tr("Consulted people can comment and are asked for input before sign-off. Informed people hear when it’s done or blocked.")}</Text>
        </section>
        <DatePicker
          disabled={!editable}
          label={tr("Due")}
          value={draft.due.slice(0, 10)}
          onChange={(e) => e.target.value && setDraft({ ...draft, due: new Date(`${e.target.value}T09:00`).toISOString() })}
        />
        <Field label={tr("Notes")} optional disabled={!editable}>
          <Textarea rows={3} autoGrow value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </Field>
        {task && task.assignedById && task.assignedById !== task.ownerId ? (
          <Text variant="bodySm" tone="muted">
            {tr('Assigned by {name}', { name: task.assignedById === me.id ? tr('you') : person(task.assignedById).name })}
          </Text>
        ) : null}
        {task && !creating ? (
          <section aria-labelledby="comments-title" className="flex flex-col gap-3">
            <Text as="h3" id="comments-title" variant="label">
              {tr("Comments")}{task.comments?.length ? ` (${task.comments.length})` : ''}
            </Text>
            {task.comments?.length ? (
              <ol className="flex flex-col gap-3">
                {task.comments.map((c) => (
                  <li key={c.id} className={cn('flex gap-2 rounded-md', freshComment(c.id))}>
                    <Avatar name={person(c.personId).name} size="xs" decorative />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <Text as="span" variant="bodySm">
                        <span className="font-medium">{c.personId === me.id ? tr('You') : person(c.personId).name}</span>
                        <span className="text-fg-subtle"> · <Time iso={c.at} /></span>
                      </Text>
                      <p className="rounded-md bg-surface-sunken px-3 py-2 text-md">{c.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
            {canCommentOnTask(state, task) ? (
              <div className="flex flex-col gap-2">
                <Field label={tr("Add a comment")} labelHidden>
                  <Textarea rows={2} autoGrow placeholder={tr("Add a comment…")} value={comment} onChange={(e) => setComment(e.target.value)} />
                </Field>
                <Button
                  size="sm"
                  className="self-start"
                  disabled={!comment.trim()}
                  onClick={() => {
                    dispatch({ type: 'commentTask', taskId: task.id, text: comment.trim() });
                    setComment('');
                  }}
                >
                  {tr("Comment")}</Button>
              </div>
            ) : (
              <Text variant="bodySm" tone="muted">
                {tr("Only people working on it or consulted can comment.")}</Text>
            )}
          </section>
        ) : null}
        {draft.source ? (
          <div className="flex flex-col gap-1">
            <Text variant="caption" tone="muted">
              {tr("Came from")}</Text>
            <AppLink to={draft.source.href}>{tr(draft.source.label)}</AppLink>
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}
