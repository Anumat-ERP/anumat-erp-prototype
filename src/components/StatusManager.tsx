import { Badge, Banner, Button, Checkbox, IconButton, Input, Modal, Select, Text, useToast } from '@repo/ui';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { uid, useStore } from '../data/store';
import type { StatusCategory, StatusTone, TaskStatusDef } from '../data/types';

const CATEGORIES: { value: StatusCategory; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'active', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

const TONES: { value: StatusTone; label: string }[] = [
  { value: 'neutral', label: 'Grey' },
  { value: 'info', label: 'Blue' },
  { value: 'warning', label: 'Amber' },
  { value: 'critical', label: 'Red' },
  { value: 'success', label: 'Green' },
  { value: 'primary', label: 'Blue' },
];

/** Workspace-wide task statuses: rename, recolour, reorder, add and remove. */
export function StatusManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [rows, setRows] = useState<TaskStatusDef[]>(state.taskStatuses);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      setRows(state.taskStatuses);
      setError(undefined);
    }
  }, [open, state.taskStatuses]);

  const set = (i: number, patch: Partial<TaskStatusDef>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, by: -1 | 1) => {
    const next = [...rows];
    const [r] = next.splice(i, 1);
    if (r) next.splice(i + by, 0, r);
    setRows(next);
  };
  const inUse = (id: string) => state.tasks.filter((t) => t.status === id).length;

  const save = () => {
    const names = rows.map((r) => r.name.trim().toLowerCase());
    if (names.some((n) => !n)) return setError('Every status needs a name.');
    if (new Set(names).size !== names.length) return setError('Two statuses have the same name. Give each a different one.');
    dispatch({ type: 'saveStatuses', statuses: rows.map((r) => ({ ...r, name: r.name.trim() })) });
    toast({ tone: 'success', title: 'Statuses saved', description: 'The board and lists now use them.' });
    onClose();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => (o ? undefined : onClose())}
      size="lg"
      title="Task statuses"
      description="Used by everyone in the workspace. Each status belongs to a category, which decides whether a task counts as open or done."
      primaryAction={{ content: 'Save statuses', onAction: save }}
      secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
    >
      <div className="flex flex-col gap-4">
        {error ? <Banner tone="critical">{error}</Banner> : null}
        <dl className="grid gap-x-6 gap-y-1 rounded-md bg-surface-sunken p-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-fg">Needs sign-off</dt>
            <dd className="text-fg-muted">Only whoever assigned the task, or an admin, can move tasks here. Owners ask for sign-off instead.</dd>
          </div>
          <div>
            <dt className="font-medium text-fg">Ask for a reason</dt>
            <dd className="text-fg-muted">Moving a task here asks why, for example what is blocking it.</dd>
          </div>
        </dl>
        <ol className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {rows.map((r, i) => {
            const count = inUse(r.id);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                <Badge tone={r.tone} size="sm" className="w-24 justify-center">
                  <span className="truncate">{r.name || 'Untitled'}</span>
                </Badge>
                <Input
                  aria-label={`Name of status ${i + 1}`}
                  value={r.name}
                  maxLength={24}
                  onChange={(e) => set(i, { name: e.target.value })}
                  className="min-w-32 flex-1"
                />
                <Select
                  aria-label={`Category of ${r.name || 'status'}`}
                  value={r.category}
                  disabled={r.locked}
                  onChange={(e) => set(i, { category: e.target.value as StatusCategory })}
                  options={CATEGORIES}
                  className="w-36"
                />
                <Select
                  aria-label={`Colour of ${r.name || 'status'}`}
                  value={r.tone}
                  onChange={(e) => set(i, { tone: e.target.value as StatusTone })}
                  options={TONES}
                  className="w-28"
                />
                <span className="flex">
                  <IconButton size="sm" icon={<ArrowUp />} label={`Move ${r.name} up`} disabled={i === 0} onClick={() => move(i, -1)} />
                  <IconButton size="sm" icon={<ArrowDown />} label={`Move ${r.name} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)} />
                  <IconButton
                    size="sm"
                    icon={<Trash2 />}
                    label={r.locked ? `${r.name} can’t be removed` : `Remove ${r.name}`}
                    disabled={r.locked}
                    onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  />
                </span>
                <div className="flex basis-full flex-wrap gap-x-6 gap-y-1 ps-26">
                  <Checkbox label="Needs sign-off" checked={Boolean(r.signOff)} onCheckedChange={(c) => set(i, { signOff: c === true })} />
                  <Checkbox label="Ask for a reason" checked={Boolean(r.requireNote)} onCheckedChange={(c) => set(i, { requireNote: c === true })} />
                </div>
                {count && !r.locked ? (
                  <Text variant="caption" tone="muted" className="basis-full ps-26">
                    {count} {count === 1 ? 'task uses' : 'tasks use'} this. If you remove it, they move to “{rows.find((x) => x.category === 'todo')?.name}”.
                  </Text>
                ) : null}
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            icon={<Plus />}
            onClick={() => {
              // New statuses go just before the first done-category one.
              const at = rows.findIndex((r) => r.category === 'done');
              const i = at === -1 ? rows.length : at;
              setRows([...rows.slice(0, i), { id: uid('st'), name: '', category: 'active', tone: 'neutral' }, ...rows.slice(i)]);
            }}
          >
            Add status
          </Button>
          <Text variant="bodySm" tone="muted">
            “To do” and “Done” can be renamed, not removed.
          </Text>
        </div>
      </div>
    </Modal>
  );
}
