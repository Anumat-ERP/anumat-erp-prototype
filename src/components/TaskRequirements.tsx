import { Button, Checkbox, Field, IconButton, Input, Text, Textarea } from '@app/ui';
import { Plus, Trash2 } from 'lucide-react';
import type { Task, TaskCheck } from '../data/types';
import { uid } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';

export function TaskChecklist({ title, description, checks, onChange, disabled }: { title: string; description: string; checks: TaskCheck[]; onChange: (checks: TaskCheck[]) => void; disabled?: boolean }) {
  const { t: tr } = useLocale();
  return <section className="flex flex-col gap-3" aria-label={tr(title)}>
    <div><Text as="h3" variant="label">{tr(title)}</Text><Text variant="caption" tone="muted">{tr(description)}</Text></div>
    {checks.map((check, index) => <div key={check.id} className="flex items-center gap-2">
      <Checkbox disabled={disabled} label={tr('Verify {name}', { name: check.text || tr('requirement') })} labelHidden checked={check.done} onCheckedChange={(done) => onChange(checks.map((item) => item.id === check.id ? { ...item, done: done === true } : item))} />
      <Input className="min-w-0 flex-1" disabled={disabled} aria-label={tr('{name} requirement {number}', { name: tr(title), number: index + 1 })} value={check.text} onChange={(event) => onChange(checks.map((item) => item.id === check.id ? { ...item, text: event.target.value, done: false } : item))} />
      {!disabled && <IconButton icon={<Trash2 />} label={tr('Remove requirement {number}', { number: index + 1 })} onClick={() => onChange(checks.filter((item) => item.id !== check.id))} />}
    </div>)}
    {!disabled && <Button size="sm" icon={<Plus />} className="self-start" onClick={() => onChange([...checks, { id: uid('check'), text: '', done: false }])}>{tr('Add requirement')}</Button>}
  </section>;
}
export function TaskRequirements({ task, onChange, disabled }: { task: Task; onChange: (patch: Partial<Task>) => void; disabled?: boolean }) {
  const { t: tr } = useLocale();
  return <div className="flex flex-col gap-5 border-t border-border pt-5">
    <Field label={tr('Expected outcome')} helpText={tr('Describe the result that makes this work successful.')} disabled={disabled}><Textarea rows={2} value={task.expectedOutcome ?? ''} onChange={(event) => onChange({ expectedOutcome: event.target.value })} /></Field>
    <TaskChecklist title="Acceptance criteria" description="Specific results to verify for this work item." checks={task.acceptanceCriteria ?? []} disabled={disabled} onChange={(acceptanceCriteria) => onChange({ acceptanceCriteria })} />
    <TaskChecklist title="Ready to start" description="Definition of Ready (DoR): confirm scope, dependencies, and ownership." checks={task.readiness ?? []} disabled={disabled} onChange={(readiness) => onChange({ readiness })} />
    <TaskChecklist title="Completion requirements" description="Definition of Done (DoD): shared quality checks before completion." checks={task.completion ?? []} disabled={disabled} onChange={(completion) => onChange({ completion })} />
    <Field label={tr('Completion evidence')} helpText={tr('Add a result, document link, or verification notes for the reviewer.')} disabled={disabled}><Textarea rows={2} value={task.evidence ?? ''} onChange={(event) => onChange({ evidence: event.target.value })} /></Field>
  </div>;
}
