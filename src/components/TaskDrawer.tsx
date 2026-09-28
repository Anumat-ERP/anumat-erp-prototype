import { DatePicker, Drawer, Field, Input, Select, Text, Textarea, useToast } from '@repo/ui';
import { useEffect, useState } from 'react';
import { at } from '../data/seed';
import { firstStatus, uid, useStore } from '../data/store';
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
  const blank = (): Task => ({ id: '', title: '', ownerId: me.id, due: at(7), status: firstStatus(state, 'todo') });

  const [draft, setDraft] = useState<Task>(task ?? blank());
  const [error, setError] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset the form whenever a different task (or a new one) is opened.
  useEffect(() => {
    setDraft(task ?? blank());
    setError(undefined);
    setConfirmDelete(false);
  }, [task?.id, creating]);

  const save = () => {
    if (!draft.title.trim()) {
      setError('Describe the task, starting with a verb, like “Send the updated quote”.');
      return;
    }
    const clean = { ...draft, title: draft.title.trim(), notes: draft.notes?.trim() || undefined };
    if (creating) {
      dispatch({ type: 'addTask', task: { ...clean, id: uid('t') } });
      toast({ tone: 'success', title: 'Task added', description: `Assigned to ${clean.ownerId === me.id ? 'you' : person(clean.ownerId).name}.` });
    } else {
      dispatch({ type: 'updateTask', taskId: clean.id, patch: clean });
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
      primaryAction={{ content: creating ? 'Add task' : 'Save', onAction: save }}
      secondaryActions={[
        { content: 'Cancel', onAction: onClose },
        ...(!creating && task
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
        <Field label="Task" required error={error}>
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
          <Field label="Status">
            <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} options={categories} />
          </Field>
          <Field label="Owner">
            <Select
              value={draft.ownerId}
              onChange={(e) => setDraft({ ...draft, ownerId: e.target.value })}
              options={state.people.map((p) => ({ value: p.id, label: p.id === me.id ? `${p.name} (you)` : p.name }))}
            />
          </Field>
        </div>
        <DatePicker
          label="Due"
          value={draft.due.slice(0, 10)}
          onChange={(e) => e.target.value && setDraft({ ...draft, due: new Date(`${e.target.value}T09:00`).toISOString() })}
        />
        <Field label="Notes" optional>
          <Textarea rows={3} autoGrow value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </Field>
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
