import { Banner, Button, Card, CardHeader, Checkbox, EmptyState, Field, IconButton, Input, PageHeader, Select, Switch, Text, useToast } from '@repo/ui';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ApprovalTimeline } from '../components/ApprovalTimeline';
import { headerLink } from '../components/links';
import { canBuildProcesses, routeFor, uid, useStore } from '../data/store';
import { CheckGroup } from '../components/CheckGroup';
import type { FormField, Process, ProcessStep } from '../data/types';
import { formatMoney, isBuiltInType, typeName } from '../lib/format';

const DEPARTMENTS = ['Operations', 'Finance', 'People', 'Product', 'IT', 'Legal', 'Leadership'];

export function ProcessEditor() {
  const { id } = useParams();
  const { state, person, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const original = state.processes.find((p) => p.id === id);
  const [draft, setDraft] = useState<Process | undefined>(original);
  const [tryAmount, setTryAmount] = useState('12500');
  const builder = canBuildProcesses(state);

  if (!original || !draft) {
    return (
      <EmptyState heading="This process doesn’t exist" action={<Button onClick={() => navigate('/processes')}>Back to processes</Button>}>
        The link may be wrong.
      </EmptyState>
    );
  }

  const setStep = (i: number, patch: Partial<ProcessStep>) =>
    setDraft({ ...draft, steps: draft.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const move = (i: number, by: -1 | 1) => {
    const steps = [...draft.steps];
    const [s] = steps.splice(i, 1);
    if (s) steps.splice(i + by, 0, s);
    setDraft({ ...draft, steps });
  };
  const changed = JSON.stringify(draft) !== JSON.stringify(original);
  const amount = Number(tryAmount.replace(/,/g, '')) || 0;
  const preview = routeFor([{ ...draft, active: true }], draft.requestType, draft.requestType === 'leave' ? undefined : amount);
  const hasAmount = isBuiltInType(draft.requestType) ? draft.requestType !== 'leave' : Boolean(draft.hasAmount);

  return (
    <>
      <PageHeader
        title={draft.name}
        subtitle={`Runs when ${draft.trigger.toLowerCase()}.`}
        backAction={{ content: 'Process Builder', href: '/processes' }}
        renderLink={headerLink}
        primaryAction={{
          content: 'Save process',
          disabled: !changed || !builder,
          onAction: () => {
            dispatch({ type: 'saveProcess', process: draft });
            toast({ tone: 'success', title: `Saved ${draft.name}`, description: 'New requests follow the updated route.' });
          },
        }}
        secondaryActions={changed ? [{ content: 'Discard changes', onAction: () => setDraft(original) }] : undefined}
      />
      {!builder ? (
        <Banner tone="info" title="View only">
          Only admins, and people an admin allows under People &amp; roles, can change processes.
        </Banner>
      ) : null}
      <fieldset disabled={!builder} className="contents">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col">
          <ol className="flex flex-col">
            {draft.steps.map((s, i) => (
              <li key={s.id} className="relative flex flex-col pb-6 last:pb-0">
                {i < draft.steps.length - 1 ? <span aria-hidden className="absolute start-5 top-10 bottom-0 w-0.5 bg-border-strong" /> : null}
                <div className="flex gap-3">
                  <span
                    aria-hidden
                    className="relative z-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-fg"
                  >
                    {i + 1}
                  </span>
                  <Card className="flex min-w-0 flex-1 flex-col gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <Text as="h2" variant="subtitle">
                        Step {i + 1}: {s.name || 'Untitled step'}
                      </Text>
                      <div className="flex shrink-0 gap-1">
                        <IconButton size="sm" icon={<ArrowUp />} label={`Move step ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)} />
                        <IconButton
                          size="sm"
                          icon={<ArrowDown />}
                          label={`Move step ${i + 1} down`}
                          disabled={i === draft.steps.length - 1}
                          onClick={() => move(i, 1)}
                        />
                        <IconButton
                          size="sm"
                          icon={<Trash2 />}
                          label={`Remove step ${i + 1}`}
                          disabled={draft.steps.length === 1}
                          onClick={() => setDraft({ ...draft, steps: draft.steps.filter((_, j) => j !== i) })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Step name">
                        <Input value={s.name} onChange={(e) => setStep(i, { name: e.target.value })} />
                      </Field>
                      <Field label="Approver">
                        <Select
                          value={s.approverId}
                          onChange={(e) => {
                            const p = person(e.target.value);
                            setStep(i, { approverId: p.id, role: p.role });
                          }}
                          options={state.people.map((p) => ({ value: p.id, label: `${p.name} · ${p.role}` }))}
                        />
                      </Field>
                      {hasAmount ? (
                        <Field label="Runs when" helpText={s.minAmount === undefined ? 'Every request goes through this step.' : undefined}>
                          <Select
                            value={s.minAmount === undefined ? 'always' : 'over'}
                            onChange={(e) => setStep(i, { minAmount: e.target.value === 'always' ? undefined : (s.minAmount ?? 1000) })}
                            options={[
                              { value: 'always', label: 'Always' },
                              { value: 'over', label: 'Amount is over…' },
                            ]}
                          />
                        </Field>
                      ) : null}
                      {hasAmount && s.minAmount !== undefined ? (
                        <Field label="Amount threshold">
                          <Input
                            prefix="$"
                            inputMode="numeric"
                            value={String(s.minAmount)}
                            onChange={(e) => setStep(i, { minAmount: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                          />
                        </Field>
                      ) : null}
                      <Field label="Respond within" helpText="Approvers get a reminder after this.">
                        <Input
                          suffix="hours"
                          inputMode="numeric"
                          value={String(s.slaHours)}
                          onChange={(e) => setStep(i, { slaHours: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                        />
                      </Field>
                    </div>
                  </Card>
                </div>
              </li>
            ))}
          </ol>
          <div className="ms-13 mt-4">
            <Button
              icon={<Plus />}
              onClick={() =>
                setDraft({
                  ...draft,
                  steps: [...draft.steps, { id: uid('step'), name: 'New step', role: 'Chief executive', approverId: 'sokha', slaHours: 48 }],
                })
              }
            >
              Add step
            </Button>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {!isBuiltInType(draft.requestType) ? (
            <Card className="flex flex-col gap-4">
              <CardHeader title="Request type" description="A request type you created. People pick it on the New request form." />
              <Field label="Request type name">
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </Field>
              <Field label="ID prefix" helpText={`Requests are numbered ${(draft.prefix || 'XX').toUpperCase()}-0001, ${(draft.prefix || 'XX').toUpperCase()}-0002…`}>
                <Input value={draft.prefix ?? ''} maxLength={3} onChange={(e) => setDraft({ ...draft, prefix: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })} />
              </Field>
              <Switch
                label="Has an amount"
                helpText="Adds an amount field, so steps can run only above a threshold."
                checked={Boolean(draft.hasAmount)}
                onCheckedChange={(on) => setDraft({ ...draft, hasAmount: on })}
              />
            </Card>
          ) : null}
          <Card className="flex flex-col gap-3">
            <CardHeader title="Who can submit" description="Everyone, or only some departments." />
            <Switch
              label="Everyone"
              checked={!draft.submitters?.length}
              onCheckedChange={(on) => setDraft({ ...draft, submitters: on ? [] : ['Operations'] })}
            />
            {draft.submitters?.length ? (
              <CheckGroup
                legend="Departments that can submit"
                options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                value={draft.submitters}
                onChange={(v) => setDraft({ ...draft, submitters: v.length ? v : ['Operations'] })}
              />
            ) : null}
          </Card>
          <Card className="flex flex-col gap-3">
            <CardHeader title="Form fields" description="Extra questions on the request form, after title and description." />
            {(draft.fields ?? []).length ? (
              <ul className="flex flex-col gap-3">
                {(draft.fields ?? []).map((f, i) => {
                  const setField = (patch: Partial<FormField>) =>
                    setDraft({ ...draft, fields: (draft.fields ?? []).map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                  return (
                    <li key={f.id} className="flex flex-col gap-2 rounded-md border border-border p-3">
                      <div className="flex items-end gap-2">
                        <Field label="Question" className="flex-1">
                          <Input value={f.label} onChange={(e) => setField({ label: e.target.value })} />
                        </Field>
                        <IconButton
                          size="sm"
                          icon={<Trash2 />}
                          label={`Remove “${f.label || 'field'}”`}
                          onClick={() => setDraft({ ...draft, fields: (draft.fields ?? []).filter((_, j) => j !== i) })}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <Select
                          size="sm"
                          aria-label={`Answer type for ${f.label || 'field'}`}
                          value={f.kind}
                          onChange={(e) => setField({ kind: e.target.value as FormField['kind'] })}
                          options={[
                            { value: 'text', label: 'Text' },
                            { value: 'number', label: 'Number' },
                            { value: 'date', label: 'Date' },
                          ]}
                          className="w-32"
                        />
                        <Checkbox label="Required" checked={f.required} onCheckedChange={(c) => setField({ required: c === true })} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Text variant="bodySm" tone="muted">
                No extra fields.
              </Text>
            )}
            <Button
              size="sm"
              icon={<Plus />}
              className="self-start"
              onClick={() => setDraft({ ...draft, fields: [...(draft.fields ?? []), { id: uid('fld'), label: '', kind: 'text', required: false }] })}
            >
              Add field
            </Button>
          </Card>
          <Card className="lg:sticky lg:top-20">
            <CardHeader title="Try it" description={`Which steps a ${typeName(draft.requestType, state.processes).toLowerCase()} request would go through.`} />
            {hasAmount ? (
              <Field label="Request amount" className="mt-4">
                <Input prefix="$" inputMode="decimal" value={tryAmount} onChange={(e) => setTryAmount(e.target.value)} />
              </Field>
            ) : null}
            <div className="mt-4">
              <ApprovalTimeline steps={preview.map((s) => ({ ...s, status: 'waiting' as const }))} />
            </div>
            {hasAmount ? (
              <Text variant="bodySm" tone="muted" className="mt-4">
                {preview.length} of {draft.steps.length} steps run for {formatMoney(amount)}.
              </Text>
            ) : null}
          </Card>
        </div>
      </div>
      </fieldset>
    </>
  );
}
