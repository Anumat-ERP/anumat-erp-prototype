import { Badge, Banner, Button, Checkbox, IconButton, Input, Modal, Select, Text, Textarea, Field, useToast } from '@app/ui';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { uid, useStore } from '../data/store';
import type { StatusCategory, StatusTone, TaskStatusDef } from '../data/types';
import { TASK_DEFAULTS } from '../lib/taskRequirements';
import { useLocale } from '../i18n/LocaleProvider';


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
  const { t: tr } = useLocale();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [rows, setRows] = useState<TaskStatusDef[]>(state.taskStatuses);
  const [defaults, setDefaults] = useState(state.taskDefaults ?? TASK_DEFAULTS);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      setRows(state.taskStatuses);
      setDefaults(state.taskDefaults ?? TASK_DEFAULTS);
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
    if (!rows.some((row) => row.category === 'todo' && !row.requireReady && !row.requireDone && !row.signOff)) return setError(tr('Keep one backlog status without readiness, completion, or sign-off gates.'));
    if (rows.some((row) => row.moveRoles?.length === 0)) return setError(tr('Choose at least one responsibility for every status.'));
    dispatch({ type: 'saveTaskDefaults', defaults: { readiness: defaults.readiness.map((text) => text.trim()).filter(Boolean), completion: defaults.completion.map((text) => text.trim()).filter(Boolean) } });
    dispatch({ type: 'saveStatuses', statuses: rows.map((r) => ({ ...r, name: r.name.trim() })) });
    toast({ tone: 'success', title: tr("Statuses saved"), description: tr("The board and lists now use them.") });
    onClose();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => (o ? undefined : onClose())}
      size="lg"
      title={tr("Task statuses")}
      description={tr("Used by everyone in the workspace. Each status belongs to a category, which decides whether a task counts as open or done.")}
      primaryAction={{ content: tr("Save statuses"), onAction: save }}
      secondaryActions={[{ content: tr("Cancel"), onAction: onClose }]}
    >
      <div className="flex flex-col gap-4">
        {error ? <Banner tone="critical">{error}</Banner> : null}
        <dl className="grid gap-x-6 gap-y-1 rounded-md bg-surface-sunken p-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-fg">{tr("Needs sign-off")}</dt>
            <dd className="text-fg-muted">{tr("Only whoever assigned the task, or an admin, can move tasks here. Owners ask for sign-off instead.")}</dd>
          </div>
          <div>
            <dt className="font-medium text-fg">{tr("Ask for a reason")}</dt>
            <dd className="text-fg-muted">{tr("Moving a task here asks why, for example what is blocking it.")}</dd>
          </div>
        </dl>
        <section className="flex flex-col gap-3 border-b border-border pb-4" aria-label={tr('Workspace task defaults')}>
          <Text as="h3" variant="label">{tr('Workspace task defaults')}</Text>
          <Text variant="caption" tone="muted">{tr('One requirement per line. Applied to new tasks; existing task checklists stay unchanged.')}</Text>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr('Default readiness requirements')}><Textarea rows={4} value={defaults.readiness.join('\n')} onChange={(event) => setDefaults({ ...defaults, readiness: event.target.value.split('\n') })} /></Field>
            <Field label={tr('Default completion requirements')}><Textarea rows={4} value={defaults.completion.join('\n')} onChange={(event) => setDefaults({ ...defaults, completion: event.target.value.split('\n') })} /></Field>
          </div>
          <Button className="self-start" onClick={() => {
            const backlog = rows.find((row) => row.category === 'todo' && row.locked) ?? rows.find((row) => row.category === 'todo')!;
            const done = rows.find((row) => row.category === 'done')!;
            setRows([
              { ...backlog, name: 'Backlog' },
              { id: 'ready', name: 'Ready', category: 'todo', tone: 'info', requireReady: true },
              { id: 'doing', name: 'In progress', category: 'active', tone: 'info', requireReady: true },
              { id: 'review', name: 'Review', category: 'active', tone: 'warning', requireDone: true },
              { ...done, name: 'Done', requireDone: true, signOff: true },
              ...rows.filter((row) => ![backlog.id, done.id, 'ready', 'doing', 'review'].includes(row.id)),
            ]);
          }}>{tr('Use recommended workflow')}</Button>
          <Text variant="caption" tone="muted">{tr('Backlog → Ready → In progress → Review → Done. Readiness and completion checks apply when enabled below.')}</Text>
        </section>
        <ol className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {rows.map((r, i) => {
            const count = inUse(r.id);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                <Badge tone={r.tone} size="sm" className="w-24 justify-center">
                  <span className="truncate">{r.name || 'Untitled'}</span>
                </Badge>
                <Input
                  aria-label={tr("Name of status {value0}", { value0: i + 1 })}
                  value={r.name}
                  maxLength={24}
                  onChange={(e) => set(i, { name: e.target.value })}
                  className="min-w-32 flex-1"
                />
                <Select
                  aria-label={tr("Category of {value0}", { value0: r.name || 'status' })}
                  value={r.category}
                  disabled={r.locked}
                  onChange={(e) => set(i, { category: e.target.value as StatusCategory })}
                  options={CATEGORIES}
                  className="w-36"
                />
                <Select
                  aria-label={tr("Colour of {value0}", { value0: r.name || 'status' })}
                  value={r.tone}
                  onChange={(e) => set(i, { tone: e.target.value as StatusTone })}
                  options={TONES}
                  className="w-28"
                />
                <span className="flex">
                  <IconButton size="sm" icon={<ArrowUp />} label={tr("Move {value0} up", { value0: r.name })} disabled={i === 0} onClick={() => move(i, -1)} />
                  <IconButton size="sm" icon={<ArrowDown />} label={tr("Move {value0} down", { value0: r.name })} disabled={i === rows.length - 1} onClick={() => move(i, 1)} />
                  <IconButton
                    size="sm"
                    icon={<Trash2 />}
                    label={r.locked ? tr("{value0} can’t be removed", { value0: r.name }) : tr("Remove {value0}", { value0: r.name })}
                    disabled={r.locked}
                    onClick={() => setRows(rows.filter((_, j) => j !== i).map((row) => ({ ...row, allowedFrom: row.allowedFrom?.filter((id) => id !== r.id) })))}
                  />
                </span>
                <div className="flex basis-full flex-wrap gap-x-6 gap-y-1 ps-26">
                  <Checkbox label={tr("Needs sign-off")} checked={Boolean(r.signOff)} onCheckedChange={(c) => set(i, { signOff: c === true })} />
                  <Checkbox label={tr("Ask for a reason")} checked={Boolean(r.requireNote)} onCheckedChange={(c) => set(i, { requireNote: c === true })} />
                </div>
                <div className="flex basis-full flex-col gap-2 border-t border-border pt-2">
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <Checkbox label={tr('Require readiness checks')} checked={Boolean(r.requireReady)} onCheckedChange={(value) => set(i, { requireReady: value === true })} />
                    <Checkbox label={tr('Require completion checks and evidence')} checked={Boolean(r.requireDone)} onCheckedChange={(value) => set(i, { requireDone: value === true })} />
                  </div>
                  <Text variant="caption" tone="muted">{tr('Who can move here')}</Text>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">{(['responsible', 'accountable', 'admin'] as const).map((role) => <Checkbox key={role} label={tr(role === 'responsible' ? 'Responsible (R)' : role === 'accountable' ? 'Accountable (A)' : 'App admin')} checked={(r.moveRoles ?? ['responsible', 'accountable', 'admin']).includes(role)} onCheckedChange={(checked) => { const roles = r.moveRoles ?? ['responsible', 'accountable', 'admin']; set(i, { moveRoles: checked === true ? [...roles, role] : roles.filter((item) => item !== role) }); }} />)}</div>
                  <Checkbox label={tr('Allow from any status')} checked={!r.allowedFrom} onCheckedChange={(value) => set(i, { allowedFrom: value === true ? undefined : rows.filter((row) => row.id !== r.id).map((row) => row.id) })} />
                  {r.allowedFrom && <div className="flex flex-wrap gap-x-4 gap-y-2" aria-label={tr('Allowed previous statuses')}>{rows.filter((row) => row.id !== r.id).map((row) => <Checkbox key={row.id} label={tr(row.name || 'Untitled')} checked={r.allowedFrom!.includes(row.id)} onCheckedChange={(value) => set(i, { allowedFrom: value === true ? [...r.allowedFrom!, row.id] : r.allowedFrom!.filter((id) => id !== row.id) })} />)}</div>}
                </div>
                {count && !r.locked ? (
                  <Text variant="caption" tone="muted" className="basis-full ps-26">
                    {count} {count === 1 ? tr("task uses") : tr("tasks use")} {tr("this. If you remove it, they move to “")}{tr(rows.find((x) => x.category === 'todo')?.name ?? '')}”.
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
            {tr("Add status")}</Button>
          <Text variant="bodySm" tone="muted">
            {tr("“To do” and “Done” can be renamed, not removed.")}</Text>
        </div>
      </div>
    </Modal>
  );
}
