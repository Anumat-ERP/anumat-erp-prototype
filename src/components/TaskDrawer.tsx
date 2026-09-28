import { Banner, DatePicker, Drawer, Field, Select, Text, Textarea, useToast } from '@repo/ui';
import { useEffect, useState } from 'react';
import { at } from '../data/seed';
import { canEditTask, firstStatus, isAdmin, planMove, statusDef, uid, useStore } from '../data/store';
import type { Task } from '../data/types';
import { AppLink } from './links';

const CATEGORY_LABEL = { todo: 'To do', active: 'In progress', done: 'Done' } as const;

/**
 * View and edit one task, or create a new one (`task` null, `creating` true).
 * Changes apply on Save.
 */
export function TaskDrawer({ task, creating, onClose }: { task: Task | null; creating: boolean; onClose: () => void }) {
  const { state, me, person, dispatch } = useStore();
  const { toast } = useToast();
  const open = creating || task !== null;
  const blank = (): Task => ({ id: '', title: '', ownerId: me.id, assignedById: me.id, due: at(7), status: firstStatus(state, 'todo') });

  const [draft, setDraft] = useState<Task>(task ?? blank());
  const [error, setError] = useState<string>();
  const [statusError, setStatusError] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset the form whenever a different task (or a new one) is opened.
  useEffect(() => {
    setDraft(task ?? blank());
    setError(undefined);
    setStatusError(undefined);
    setConfirmDelete(false);
  }, [task?.id, creating]);

  const editable = creating || (task !== null && canEditTask(state, task));
  const canDelete = task !== null && (task.assignedById === me.id || isAdmin(state) || (task.ownerId === me.id && task.assignedById === me.id));
  const target = statusDef(state, draft.status);
  const needsNote = !creating && task !== null && draft.status !== task.status && target.requireNote;

  const save = () => {
    if (!draft.title.trim()) {
      setError('Describe the task, starting with a verb, like “Send the updated quote”.');
      return;
    }
    const clean = { ...draft, title: draft.title.trim(), notes: draft.notes?.trim() || undefined };
    if (creating) {
      dispatch({ type: 'addTask', task: { ...clean, id: uid('t'), assignedById: me.id } });
      toast({ tone: 'success', title: 'Task added', description: `Assigned to ${clean.ownerId === me.id ? 'you' : person(clean.ownerId).name}.` });
      onClose();
      return;
    }
    if (!task) return;
    const plan = draft.status !== task.status ? planMove(state, task, draft.status) : null;
    if (plan?.kind === 'denied') {
      setStatusError(plan.reason);
      return;
    }
    if (plan?.kind === 'note' && !draft.statusNote?.trim()) {
      setStatusError(`Say why it’s ${target.name.toLowerCase()}, so the right person can help.`);
      return;
    }
    // Save the details first, then move it through the rules.
    dispatch({ type: 'updateTask', taskId: task.id, patch: { ...clean, status: task.status, statusNote: task.statusNote } });
    if (plan?.kind === 'signoff') {
      dispatch({ type: 'moveTask', taskId: task.id, status: plan.via, signOff: true });
      toast({ tone: 'success', title: `Sent to ${person(plan.assignerId).name} for sign-off` });
    } else if (plan) {
      dispatch({ type: 'moveTask', taskId: task.id, status: draft.status, note: draft.statusNote?.trim() });
      toast({ title: 'Task saved' });
    } else {
      toast({ title: 'Task saved' });
    }
    onClose();
  };

  const categories = (['todo', 'active', 'done'] as const)
    .map((c) => ({ label: CATEGORY_LABEL[c], options: state.taskStatuses.filter((s) => s.category === c).map((s) => ({ value: s.id, label: s.name })) }))
    .filter((g) => g.options.length);

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => (o ? undefined : onClose())}
      title={creating ? 'New task' : 'Task'}
      size="md"
      primaryAction={editable ? { content: creating ? 'Add task' : 'Save', onAction: save } : undefined}
      secondaryActions={[
        { content: editable ? 'Cancel' : 'Close', onAction: onClose },
        ...(!creating && task && canDelete
          ? [
              {
                content: confirmDelete ? 'Delete for good?' : 'Delete',
                destructive: true,
                onAction: () => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  dispatch({ type: 'deleteTask', taskId: task.id });
                  toast({ title: 'Task deleted' });
                  onClose();
                },
              },
            ]
          : []),
      ]}
    >
      <div className="flex flex-col gap-5">
        {!editable && task ? (
          <Banner tone="info" title="View only">
            {planMove(state, task, task.status).kind === 'denied'
              ? (planMove(state, task, task.status) as { reason: string }).reason
              : 'You can’t change this task.'}{' '}
            You can still see where it came from.
          </Banner>
        ) : null}
        {task?.signOffRequestedAt ? (
          <Banner tone="warning" title="Waiting for sign-off">
            {person(task.ownerId).name} finished this. {person(task.assignedById ?? task.ownerId).name} signs it off by moving it to Done.
          </Banner>
        ) : null}
        <Field label="Task" required error={error} disabled={!editable}>
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
          <Field label="Status" error={statusError} disabled={!editable}>
            <Select
              value={draft.status}
              onChange={(e) => {
                setDraft({ ...draft, status: e.target.value });
                setStatusError(undefined);
              }}
              options={categories}
            />
          </Field>
          <Field label="Owner" disabled={!editable}>
            <Select
              value={draft.ownerId}
              onChange={(e) => setDraft({ ...draft, ownerId: e.target.value })}
              options={state.people.map((p) => ({ value: p.id, label: p.id === me.id ? `${p.name} (you)` : p.name }))}
            />
          </Field>
        </div>
        {needsNote ? (
          <Field label={`Why is it ${target.name.toLowerCase()}?`} required>
            <Textarea rows={2} autoGrow value={draft.statusNote ?? ''} onChange={(e) => setDraft({ ...draft, statusNote: e.target.value })} />
          </Field>
        ) : task?.statusNote && task.status === draft.status ? (
          <div className="flex flex-col gap-1">
            <Text variant="caption" tone="muted">
              Why it’s {statusDef(state, task.status).name.toLowerCase()}
            </Text>
            <Text>“{task.statusNote}”</Text>
          </div>
        ) : null}
        <DatePicker
          disabled={!editable}
          label="Due"
          value={draft.due.slice(0, 10)}
          onChange={(e) => e.target.value && setDraft({ ...draft, due: new Date(`${e.target.value}T09:00`).toISOString() })}
        />
        <Field label="Notes" optional disabled={!editable}>
          <Textarea rows={3} autoGrow value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </Field>
        {task && task.assignedById && task.assignedById !== task.ownerId ? (
          <Text variant="bodySm" tone="muted">
            Assigned by {task.assignedById === me.id ? 'you' : person(task.assignedById).name}
          </Text>
        ) : null}
        {draft.source ? (
          <div className="flex flex-col gap-1">
            <Text variant="caption" tone="muted">
              Came from
            </Text>
            <AppLink to={draft.source.href}>{draft.source.label}</AppLink>
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}
