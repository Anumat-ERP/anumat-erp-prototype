import { Field, Modal, Textarea, useToast } from '@app/ui';
import { useState } from 'react';
import { planMove, statusDef, useStore } from '../data/store';
import type { Task, TaskStatus } from '../data/types';

/**
 * Moves tasks between statuses while applying the workspace rules: who may
 * edit, statuses that need the assigner's sign-off, and statuses that ask for
 * a reason. Render `dialog` once wherever the hook is used.
 */
export function useTaskMover() {
  const { state, person, dispatch } = useStore();
  const { toast } = useToast();
  const [pending, setPending] = useState<{ task: Task; status: TaskStatus } | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();

  const move = (task: Task, status: TaskStatus) => {
    if (status === task.status && !task.signOffRequestedAt) return;
    const plan = planMove(state, task, status);
    const target = statusDef(state, status);
    switch (plan.kind) {
      case 'denied':
        toast({ tone: 'critical', title: 'You can’t move this task', description: plan.reason });
        return;
      case 'note':
        setNote('');
        setError(undefined);
        setPending({ task, status });
        return;
      case 'signoff':
        dispatch({ type: 'moveTask', taskId: task.id, status: plan.via, signOff: true });
        toast({
          tone: 'success',
          title: `Sent to ${person(plan.assignerId).name} for sign-off`,
          description: `It moves to ${target.name} once they sign it off.`,
        });
        return;
      case 'move':
        dispatch({ type: 'moveTask', taskId: task.id, status });
        if (task.signOffRequestedAt && target.category === 'done') {
          toast({ tone: 'success', title: 'Signed off', description: `${person(task.ownerId).name} will see it as done.` });
        }
    }
  };

  const target = pending ? statusDef(state, pending.status) : null;
  const close = () => setPending(null);
  const confirm = () => {
    if (!pending) return;
    if (!note.trim()) {
      setError('Say what’s in the way, so the right person can help.');
      return;
    }
    dispatch({ type: 'moveTask', taskId: pending.task.id, status: pending.status, note: note.trim() });
    toast({ title: `Moved to ${target?.name}` });
    close();
  };

  const dialog = (
    <Modal
      open={pending !== null}
      onOpenChange={(o) => (o ? undefined : close())}
      size="sm"
      title={`Move to ${target?.name ?? ''}`}
      description={pending?.task.title}
      primaryAction={{ content: `Move to ${target?.name ?? ''}`, onAction: confirm }}
      secondaryActions={[{ content: 'Cancel', onAction: close }]}
    >
      <Field label="Reason" required helpText="Shown on the task, so the team knows what’s needed." error={error}>
        <Textarea
          rows={3}
          autoGrow
          value={note}
          placeholder="Waiting on the supplier’s quote"
          onChange={(e) => {
            setNote(e.target.value);
            if (error) setError(undefined);
          }}
        />
      </Field>
    </Modal>
  );

  return { move, dialog };
}
