import { Badge, Banner, Button, Card, CardHeader, EmptyState, Field, IconButton, Input, PageHeader, Select, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Text, cn, useToast } from '@app/ui';
import { ArrowDown, ArrowUp, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { appPeople, canContributeToApp } from '../lib/appAccess';
import { lazy, Suspense, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
const ProcessSimulation = lazy(() => import('../components/ProcessSimulation'));
import { CheckGroup } from '../components/CheckGroup';
import { ConditionPicker, FormBuilder } from '../components/forms/FormBuilder';
import { FormRenderer } from '../components/forms/FormRenderer';
import { headerLink } from '../components/links';
import { MobileActionBar } from '../components/MobileActionBar';
import { canBuildProcesses, routeFor, uid, useStore } from '../data/store';
import type { FormValues, Process, ProcessStep } from '../data/types';
import type { Translate } from '../i18n/locale';
import { useLocale } from '../i18n/LocaleProvider';
import { formatMoney, isBuiltInType, typeName } from '../lib/format';
import { canBranchOn, choicesFor, cleanFields, cleanValues, formProblems, questionsOf } from '../lib/forms';
import { DEPARTMENTS } from '../lib/org';

const BUILT_IN_PREFIXES = ['PR', 'LV', 'EX', 'CT'];

/** Everything that would make a saved process misbehave, in words an admin can act on. */
function processProblems(p: Process, all: Process[], tr: Translate): string[] {
  const out: string[] = [];
  if (!p.name.trim()) out.push(tr('Give the request type a name.'));
  if (!isBuiltInType(p.requestType)) {
    const prefix = (p.prefix ?? '').trim().toUpperCase();
    const clash = all.find((o) => o.id !== p.id && (o.prefix ?? '').toUpperCase() === prefix);
    if (prefix.length < 2) out.push(tr('Add an ID prefix of 2–3 letters, like TR.'));
    else if (BUILT_IN_PREFIXES.includes(prefix)) out.push(tr('The ID prefix “{prefix}” is used by a built-in request type. Pick another.', { prefix }));
    else if (clash) out.push(tr('The ID prefix “{prefix}” is already used by {name}. Pick another.', { prefix, name: clash.name }));
  }
  const fields = cleanFields(p.fields ?? []);
  out.push(...formProblems(fields, tr).map((problem) => tr('Request form: {problem}', { problem })));
  p.steps.forEach((st, i) => {
    const label = `${tr('Step {count}', { count: i + 1 })}${st.name.trim() ? ` (${st.name.trim()})` : ''}`;
    if (!st.name.trim()) out.push(tr('Step {count} needs a name.', { count: i + 1 }));
    out.push(...formProblems(cleanFields(st.fields ?? []), tr).map((x) => `${label}: ${x}`));
    if (st.when) {
      const src = fields.find((f) => f.id === st.when!.fieldId);
      if (!src) out.push(tr('{step} runs on a form question that no longer exists.', { step: label }));
      else if (!choicesFor(src).includes(st.when.equals.trim())) out.push(tr('{step} runs on an answer to “{field}” that no longer exists.', { step: label, field: src.label }));
    }
  });
  return out;
}

export function ProcessEditor() {
  const { t: tr } = useLocale();
  const { id } = useParams();
  const { state, person, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const original = state.processes.find((p) => p.id === id);
  const [draft, setDraft] = useState<Process | undefined>(original);
  const [section, setSection] = useState('details');
  const [tryAmount, setTryAmount] = useState('12500');
  const [tryAnswers, setTryAnswers] = useState<FormValues>({});
  const [showProblems, setShowProblems] = useState(false);
  const [openForms, setOpenForms] = useState<string[]>(() => original?.steps.filter((s) => s.fields?.length).map((s) => s.id) ?? []);
  const builder = canBuildProcesses(state);

  if (!original || !draft) {
    return (
      <EmptyState heading={tr('This process doesn’t exist')} action={<Button onClick={() => navigate('/processes')}>{tr('Back to processes')}</Button>}>
        {' '}
        {tr('The link may be wrong.')}{' '}
      </EmptyState>
    );
  }

  const setStep = (i: number, patch: Partial<ProcessStep>) =>
    setDraft({
      ...draft,
      steps: draft.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    });
  const move = (i: number, by: -1 | 1) => {
    const steps = [...draft.steps];
    const [s] = steps.splice(i, 1);
    if (s) steps.splice(i + by, 0, s);
    setDraft({ ...draft, steps });
  };
  // Empty lists and missing ones mean the same thing, so saving doesn't leave "unsaved changes" behind.
  const normal = (p: Process) =>
    JSON.stringify({
      ...p,
      fields: p.fields?.length ? p.fields : undefined,
      steps: p.steps.map((st) => ({
        ...st,
        fields: st.fields?.length ? st.fields : undefined,
      })),
    });
  const changed = normal(draft) !== normal(original);
  const amount = Number(tryAmount.replace(/,/g, '')) || 0;
  const hasAmount = isBuiltInType(draft.requestType) ? draft.requestType !== 'leave' : Boolean(draft.hasAmount);
  // Request-form questions a step can depend on: ones with a fixed list of answers.
  const branchSources = (draft.fields ?? []).filter((f) => canBranchOn(f.kind) && f.label.trim());
  const preview = routeFor([{ ...draft, active: true }], draft.requestType, hasAmount ? amount : undefined, cleanValues(draft.fields ?? [], tryAnswers));
  const approvers = appPeople(state, 'approvals').filter((p) => canContributeToApp(state, 'approvals', p.id));
  const problems = [...processProblems(draft, state.processes, tr),
    ...(!draft.steps.length ? [tr('Add at least one approval step.')] : []),
    ...draft.steps.flatMap((step, i) => [
      ...(!approvers.some((p) => p.id === step.approverId) ? [tr('Step {count}: choose an approver with access to this app.', { count: i + 1 })] : []),
      ...(!Number.isFinite(step.slaHours) || step.slaHours <= 0 ? [tr('Step {count}: enter a response time greater than zero.', { count: i + 1 })] : []),
    ])];

  const save = () => {
    if (problems.length) {
      setShowProblems(true);
      toast({
        tone: 'critical',
        title: tr('Fix {count} problems to save', { count: problems.length }),
        description: problems[0],
      });
      return;
    }
    setShowProblems(false);
    dispatch({
      type: 'saveProcess',
      process: {
        ...draft,
        name: draft.name.trim(),
        fields: draft.fields?.length ? cleanFields(draft.fields) : undefined,
        steps: draft.steps.map((st) => ({
          ...st,
          name: st.name.trim(),
          fields: st.fields?.length ? cleanFields(st.fields) : undefined,
        })),
      },
    });
    toast({
      tone: 'success',
      title: `Saved ${draft.name}`,
      description: tr('New requests follow the updated route.'),
    });
  };

  return (
    <>
      <PageHeader
        title={tr(draft.name)}
        subtitle={tr("Runs when {value0}.", { value0: tr(draft.trigger).toLowerCase() })}
        backAction={{ content: tr('Approval processes'), href: '/processes' }}
        renderLink={headerLink}
        primaryAction={{
          content: tr('Save process'),
          disabled: !changed || !builder,
          onAction: save,
        }}
        secondaryActions={
          changed
            ? [
                {
                  content: tr('Discard changes'),
                  onAction: () => (setDraft(original), setShowProblems(false)),
                },
              ]
            : undefined
        }
      />
      {!draft.active ? (
        <Banner
          tone="warning"
          title={tr('This process is paused')}
          action={builder ? { label: tr('Turn on'), onAction: () => setDraft({ ...draft, active: true }) } : undefined}
        >
          {tr('People can’t raise this request until it’s on. Check the steps, turn it on, then save.')}
        </Banner>
      ) : !original.active ? (
        <Banner tone="info" title={tr('Turned on. Save to apply')}>
          {tr('People can raise this request once you save.')}
        </Banner>
      ) : null}
      {showProblems && problems.length && section !== 'preview' ? (
        <Banner tone="critical" title={tr("Fix {value0} to save", { value0: problems.length === 1 ? 'this' : 'these' })}>
          <ul className="list-disc ps-5">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Banner>
      ) : null}
      {!builder ? (
        <Banner tone="info" title={tr('View only')}>
          {' '}
          {tr('Only admins, and people an admin allows under People & roles, can change processes.')}{' '}
        </Banner>
      ) : null}
      <Tabs value={section} onValueChange={setSection}>
        <TabsList aria-label={tr('Process builder sections')} className="grid h-auto grid-cols-2 gap-1 sm:inline-flex">
          <TabsTrigger className="h-9" value="details">{tr('Details')}</TabsTrigger>
          <TabsTrigger className="h-9" value="form">{tr('Request form')}</TabsTrigger>
          <TabsTrigger className="h-9" value="steps" badge={draft.steps.length}>{tr('Approval steps')}</TabsTrigger>
          <TabsTrigger className="h-9" value="preview">{tr('Preview & check')}</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="pt-4">
          <fieldset disabled={!builder} className="grid items-start gap-4 lg:grid-cols-3">
            <Card className="flex flex-col gap-3">
              <CardHeader title={tr('Status')} description={draft.active ? tr('On: people can raise this request.') : tr('Paused: hidden from New request.')} />
              <Switch label={tr('Active')} checked={draft.active} onCheckedChange={(active) => setDraft({ ...draft, active })} />
            </Card>
            {!isBuiltInType(draft.requestType) ? (
              <Card className="flex flex-col gap-4">
                <CardHeader title={tr('Request type')} description={tr("A request type you created. People pick it on the New request form.")} />
                <Field label={tr('Request type name')}>
                  <Input value={tr(draft.name)} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </Field>
                <Field
                  label={tr('ID prefix')}
                  helpText={tr('Requests are numbered {first}, {second}…', { first: `${(draft.prefix || 'XX').toUpperCase()}-0001`, second: `${(draft.prefix || 'XX').toUpperCase()}-0002` })}
                >
                  <Input
                    value={draft.prefix ?? ''}
                    maxLength={3}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        prefix: e.target.value.toUpperCase().replace(/[^A-Z]/g, ''),
                      })
                    }
                  />
                </Field>
                <Switch
                  label={tr('Has an amount')}
                  helpText={tr('Adds an amount field, so steps can run only above a threshold.')}
                  checked={Boolean(draft.hasAmount)}
                  onCheckedChange={(on) =>
                    setDraft({
                      ...draft,
                      hasAmount: on,
                      steps: on
                        ? draft.steps
                        : draft.steps.map((st) => ({
                            ...st,
                            minAmount: undefined,
                          })),
                    })
                  }
                />
              </Card>
            ) : null}
            <Card className="flex flex-col gap-3">
              <CardHeader title={tr('Who can submit')} description={tr('Everyone, or only some departments.')} />
              <Switch
                label={tr('Everyone')}
                checked={!draft.submitters?.length}
                onCheckedChange={(on) => setDraft({ ...draft, submitters: on ? [] : ['Operations'] })}
              />
              {draft.submitters?.length ? (
                <CheckGroup
                  legend={tr("Departments that can submit")}
                  options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                  value={draft.submitters}
                  onChange={(v) =>
                    setDraft({
                      ...draft,
                      submitters: v.length ? v : ['Operations'],
                    })
                  }
                />
              ) : null}
            </Card>
          </fieldset>
        </TabsContent>
        <TabsContent value="form" className="pt-4">
          <fieldset disabled={!builder} className="min-w-0 max-w-3xl">
            <Card className="flex flex-col gap-3">
              <CardHeader
                title={tr('Request form')}
                description={tr("Extra questions on the request form, after title and description. Choices, yes/no, ratings, and questions that only appear for certain answers.")}
              />
              <FormBuilder noun={tr('field')} fields={draft.fields ?? []} onChange={(fields) => setDraft({ ...draft, fields })} />
              {formProblems(draft.fields ?? [], tr).length ? (
                <Banner tone="warning" inline title={tr('Fix these before saving')}>
                  <ul className="list-disc ps-5">
                    {formProblems(draft.fields ?? [], tr).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </Banner>
              ) : null}
            </Card>
</fieldset>
        </TabsContent>
        <TabsContent value="steps" className="pt-4">
          <fieldset disabled={!builder} className="min-w-0 max-w-4xl">
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
                          {' '}
                          {tr('Step')} {i + 1}: {s.name || 'Untitled step'}
                        </Text>
                        <div className="flex shrink-0 gap-1">
                          <IconButton size="sm" icon={<ArrowUp />} label={tr("Move step {value0} up", { value0: i + 1 })} disabled={i === 0} onClick={() => move(i, -1)} />
                          <IconButton
                            size="sm"
                            icon={<ArrowDown />}
                            label={tr("Move step {value0} down", { value0: i + 1 })}
                            disabled={i === draft.steps.length - 1}
                            onClick={() => move(i, 1)}
                          />
                          <IconButton
                            size="sm"
                            icon={<Trash2 />}
                            label={tr("Remove step {value0}", { value0: i + 1 })}
                            disabled={draft.steps.length === 1}
                            onClick={() =>
                              setDraft({
                                ...draft,
                                steps: draft.steps.filter((_, j) => j !== i),
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={tr('Step name')}>
                          <Input value={tr(s.name)} onChange={(e) => setStep(i, { name: e.target.value })} />
                        </Field>
                        <Field label={tr('Approver')}>
                          <Select
                            value={s.approverId}
                            onChange={(e) => {
                              const p = person(e.target.value);
                              setStep(i, { approverId: p.id, role: p.role });
                            }}
                            options={approvers.map((p) => ({
                              value: p.id,
                              label: `${p.name} · ${p.role}`,
                            }))}
                          />
                        </Field>
                        <Field
                          label={tr('Runs when')}
                          helpText={
                            s.when
                              ? tr('Only when the request form has this answer.')
                              : s.minAmount === undefined
                                ? tr('Every request goes through this step.')
                                : undefined
                          }
                        >
                          <Select
                            value={s.when ? 'answer' : s.minAmount !== undefined && hasAmount ? 'over' : 'always'}
                            onChange={(e) => {
                              const v = e.target.value;
                              const src = branchSources[0];
                              setStep(i, {
                                minAmount: v === 'over' ? (s.minAmount ?? 1000) : undefined,
                                when:
                                  v === 'answer' && src
                                    ? {
                                        fieldId: src.id,
                                        equals: choicesFor(src)[0] ?? '',
                                        op: 'is',
                                      }
                                    : undefined,
                              });
                            }}
                            options={[
                              { value: 'always', label: tr('Always') },
                              ...(hasAmount
                                ? [
                                    {
                                      value: 'over',
                                      label: tr('Amount is over…'),
                                    },
                                  ]
                                : []),
                              ...(branchSources.length || s.when
                                ? [
                                    {
                                      value: 'answer',
                                      label: tr('A form answer matches…'),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </Field>
                        {hasAmount && s.minAmount !== undefined && !s.when ? (
                          <Field label={tr('Amount threshold')}>
                            <Input
                              prefix="$"
                              inputMode="numeric"
                              value={String(s.minAmount)}
                              onChange={(e) =>
                                setStep(i, {
                                  minAmount: Number(e.target.value.replace(/\D/g, '')) || 0,
                                })
                              }
                            />
                          </Field>
                        ) : null}
                        {s.when ? (
                          <div className="sm:col-span-2">
                            <ConditionPicker sources={branchSources} value={s.when} onChange={(when) => setStep(i, { when })} />
                          </div>
                        ) : null}
                        <Field label={tr('Respond within')} helpText={tr('Response time target for this step.')}>
                          <Input
                            suffix={tr('hours')}
                            inputMode="numeric"
                            value={String(s.slaHours)}
                            onChange={(e) =>
                              setStep(i, {
                                slaHours: Number(e.target.value.replace(/\D/g, '')) || 0,
                              })
                            }
                          />
                        </Field>
                      </div>
                      <div className="flex flex-col gap-3 border-t border-border pt-3">
                        <Button variant="tertiary"
                          type="button"
                          aria-expanded={openForms.includes(s.id)}
                          onClick={() => setOpenForms(openForms.includes(s.id) ? openForms.filter((x) => x !== s.id) : [...openForms, s.id])}
                          className="h-auto p-0 justify-start whitespace-normal flex items-center gap-2 self-start rounded-sm text-md font-medium text-fg hover:text-fg-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <ChevronRight aria-hidden className={cn('size-4 transition-transform', openForms.includes(s.id) && 'rotate-90')} />{' '}
                          {tr('Approver fills in')}{' '}
                          <Badge size="sm" tone={s.fields?.length ? 'primary' : 'neutral'}>
                            {s.fields?.length ? tr("{value0} fields", { value0: questionsOf(s.fields).length }) : tr('Nothing')}
                          </Badge>
                        </Button>
                        {openForms.includes(s.id) ? (
                          <>
                            <Text variant="bodySm" tone="muted">
                              {' '}
                              {tr('Details')} {person(s.approverId).name.split(' ')[0]} {tr("adds when approving, like a budget code or PO number. Required ones must be filled in to approve, so this step can’t be approved in bulk.")}</Text>
                            <FormBuilder noun={tr('field')} fields={s.fields ?? []} onChange={(fields) => setStep(i, { fields })} />
                          </>
                        ) : null}
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
                    steps: [
                      ...draft.steps,
                      {
                        id: uid('step'),
                        name: 'New step',
                        role: approvers[0]?.role ?? '',
                        approverId: approvers[0]?.id ?? '',
                        slaHours: 48,
                      },
                    ],
                  })
                }
              >
                {' '}
                {tr('Add step')}{' '}
              </Button>
            </div>
          </div></fieldset>
        </TabsContent>
        <TabsContent value="preview" className="flex flex-col gap-4 pt-4">
          <Banner tone={problems.length ? 'warning' : 'success'} title={problems.length ? tr('Fix these before saving') : tr('Configuration checks passed')}>
            {problems.length ? <ul className="list-disc ps-5">{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul> : tr('Try different answers and amounts to check which approval steps run. Preview answers are not saved.')}
          </Banner>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <Card className="flex flex-col gap-4" data-form-preview>
              <CardHeader title={tr('Request form preview')} description={tr('This previews your extra questions. Standard request fields are added when someone submits a request.')} />
              {draft.fields?.length ? <FormRenderer fields={draft.fields} values={tryAnswers} onChange={setTryAnswers} idPrefix="process-preview" /> : <Text tone="muted">{tr('No extra questions. Add fields in Request form to try them here.')}</Text>}
            </Card>
            <Card className="flex flex-col gap-4">
              <CardHeader
                title={tr('Approval route')}
                description={tr("Which steps a {value0} request would go through.", { value0: tr(typeName(draft.requestType, state.processes)).toLowerCase() })}
              />
              {hasAmount ? (
                <Field label={tr('Request amount')} className="mt-4">
                  <Input prefix="$" inputMode="decimal" value={tryAmount} onChange={(e) => setTryAmount(e.target.value)} />
                </Field>
              ) : null}
              <Text variant="bodySm" tone="muted" className="mt-4">
                {preview.length} {tr("of")}{' '}{draft.steps.length} {tr('steps run')}
                {hasAmount ? ` ${tr("for {value0}", { value0: formatMoney(amount) })}` : ''}.
              </Text>
            </Card>
          </div>
          <Card>
            <Suspense fallback={<Text tone="muted">{tr('Loading simulation…')}</Text>}>
              <ProcessSimulation key={JSON.stringify({ preview, amount, tryAnswers })} steps={preview} allSteps={draft.steps} />
            </Suspense>
          </Card>
        </TabsContent>
      </Tabs>

      {changed && builder ? (
        <MobileActionBar label={tr('Unsaved changes')}>
          <Button onClick={() => (setDraft(original), setShowProblems(false))}>{tr('Discard')}</Button>
          <Button variant="primary" onClick={save}>
            {' '}
            {tr('Save process')}{' '}
          </Button>
        </MobileActionBar>
      ) : null}
    </>
  );
}
