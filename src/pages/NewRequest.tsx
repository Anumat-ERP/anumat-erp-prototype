import {
  Banner,
  Button,
  Card,
  CardHeader,
  DatePicker,
  DropZone,
  DropZoneFileList,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Text,
  Textarea,
  useToast,
} from '@repo/ui';
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ApprovalTimeline } from '../components/ApprovalTimeline';
import { FormRenderer } from '../components/forms/FormRenderer';
import { headerLink } from '../components/links';
import { canSubmit, routeFor, uid, useStore } from '../data/store';
import type { Attachment, FormValues, Request, RequestType } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import { isBuiltInType, typeName } from '../lib/format';
import { cleanValues, validateForm } from '../lib/forms';
import { DEPARTMENTS } from '../lib/org';

const PREFIX: Record<string, string> = {
  purchase: 'PR',
  leave: 'LV',
  expense: 'EX',
  contract: 'CT',
};

type Errors = Partial<Record<string, string>>;

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '');

/** New request, or editing one of your drafts / a request sent back for changes. */
export function NewRequest() {
  const { t: tr } = useLocale();
  const { id } = useParams();
  const [params] = useSearchParams();
  const { state, me } = useStore();
  const navigate = useNavigate();
  if (!id) return <RequestForm key={params.get('demo') ?? 'new'} />;
  const existing = state.requests.find((r) => r.id === id);
  const editable = existing && existing.requesterId === me.id && (existing.status === 'draft' || existing.status === 'changes');
  if (!existing || !editable) {
    return (
      <EmptyState
        heading={tr('You can’t edit this request')}
        action={<Button onClick={() => navigate(existing ? `/requests/${id}` : '/requests')}>{tr('Go back')}</Button>}
      >
        {' '}
        {tr('Only the requester can edit, and only while it is a draft or has been sent back for changes.')}{' '}
      </EmptyState>
    );
  }
  return <RequestForm key={existing.id} existing={existing} />;
}

const DEMO: Record<string, Partial<Request>> = {
  laptops: {
    type: 'purchase',
    title: 'Laptops for 3 new analysts',
    amount: 7500,
    fields: { 'new-supplier': 'No' },
    department: 'Operations',
    description: 'Three laptops for the analysts starting next month. Two quotes attached; we recommend the cheaper one with the 3-year warranty.',
    attachments: [
      { name: 'Quote_Supplier_A.pdf', size: 312_000 },
      { name: 'Quote_Supplier_B.pdf', size: 298_000 },
    ],
  },
};

function RequestForm({ existing: saved }: { existing?: Request }) {
  const { t: tr } = useLocale();
  const [params] = useSearchParams();
  const demo = DEMO[params.get('demo') ?? ''];
  const existing = saved;
  // Starting values: the request being edited, or a demo prefill (?demo=laptops).
  const initial: Partial<Request> | undefined = saved ?? demo;
  const { state, me, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Start on a type this person may actually raise.
  const [type, setType] = useState<RequestType>(() => initial?.type ?? state.processes.find((p) => p.active && canSubmit(state, p))?.requestType ?? 'purchase');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [amount, setAmount] = useState(initial?.amount !== undefined ? String(initial.amount) : '');
  const [startDate, setStartDate] = useState(toDateInput(initial?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(initial?.endDate));
  const [department, setDepartment] = useState(initial?.department ?? me.department);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(initial?.attachments ?? []);
  const [fileError, setFileError] = useState<string>();
  // Drop answers the current form can't show (a renamed choice, a removed field), so nothing looks picked that isn't.
  const [answers, setAnswers] = useState<FormValues>(() =>
    cleanValues(state.processes.find((p) => p.requestType === (initial?.type ?? type))?.fields ?? [], initial?.fields ?? {}),
  );
  const [errors, setErrors] = useState<Errors>({});
  const returned = existing?.steps.find((s) => s.status === 'returned');

  // Request types this person may raise: active processes open to their department.
  const allowed = state.processes.filter((p) => p.active && canSubmit(state, p));
  const typeOptions = allowed.map((p) => ({
    value: p.requestType,
    label: tr(typeName(p.requestType, state.processes)),
  }));
  if (existing && !typeOptions.some((o) => o.value === type))
    typeOptions.push({
      value: type,
      label: tr(typeName(type, state.processes)),
    });
  const process = state.processes.find((p) => p.requestType === type);
  const builtIn = isBuiltInType(type);
  const customFields = process?.fields ?? [];

  const hasAmount = builtIn ? type !== 'leave' : Boolean(process?.hasAmount);
  const amountNumber = Number(amount.replace(/,/g, ''));
  const route = routeFor(state.processes, type, hasAmount && amountNumber > 0 ? amountNumber : undefined, cleanValues(customFields, answers));

  const validate = (): Errors => {
    const e: Errors = {};
    if (!existing && !allowed.some((p) => p.requestType === type)) e.type = 'You can’t raise this kind of request. Pick another type.';
    else if (route.length === 0) e.type = 'Nobody approves this type yet: its approval process is off. Ask an admin to turn it on.';
    if (!title.trim()) e.title = 'Give the request a short title, like “Laptops for new hires”.';
    if (hasAmount && type !== 'contract' && !(amountNumber > 0)) e.amount = 'Enter the amount in US dollars, for example 1250.';
    for (const [id, message] of Object.entries(validateForm(customFields, answers))) e[`field-${id}`] = message;
    if (type === 'leave') {
      if (!startDate) e.startDate = 'Choose the first day of leave.';
      if (!endDate) e.endDate = 'Choose the last day of leave.';
      else if (startDate && endDate < startDate) e.endDate = 'The last day must be on or after the first day.';
    }
    if (!description.trim()) e.description = 'Explain what this is for, so approvers can decide without asking.';
    return e;
  };

  const save = (submit: boolean) => (event?: FormEvent) => {
    event?.preventDefault();
    const e = submit ? validate() : title.trim() ? {} : { title: tr('A draft needs at least a title.') };
    setErrors(e);
    if (Object.keys(e).length) {
      // Take people to the first problem instead of leaving them to hunt for it.
      requestAnimationFrame(() => document.querySelector<HTMLElement>('main [aria-invalid="true"]')?.focus());
      return;
    }
    const fields = {
      type,
      title: title.trim(),
      department,
      amount: hasAmount && amountNumber > 0 ? amountNumber : undefined,
      startDate: type === 'leave' && startDate ? new Date(startDate).toISOString() : undefined,
      endDate: type === 'leave' && endDate ? new Date(endDate).toISOString() : undefined,
      description: description.trim(),
      attachments,
      fields: customFields.length ? cleanValues(customFields, answers) : undefined,
      form: customFields.length ? customFields : undefined,
    };
    if (existing) {
      dispatch({
        type: 'update',
        requestId: existing.id,
        patch: fields,
        submit,
      });
      toast({
        tone: 'success',
        title: submit ? (existing.status === 'changes' ? `Resubmitted ${existing.id}` : `Submitted ${existing.id}`) : `Saved ${existing.id}`,
      });
      navigate(`/requests/${existing.id}`);
      return;
    }
    const prefix = PREFIX[type] ?? (process?.prefix?.trim().toUpperCase() || type.slice(0, 2).toUpperCase());
    // Number by prefix across every request, so two types can never hand out the same ID.
    const n = Math.max(0, ...state.requests.filter((r) => r.id.startsWith(`${prefix}-`)).map((r) => Number(r.id.split('-')[1]) || 0)) + 1;
    const id = `${prefix}-${String(n).padStart(4, '0')}`;
    const time = new Date().toISOString();
    dispatch({
      type: 'create',
      request: {
        id,
        ...fields,
        requesterId: me.id,
        status: submit ? 'pending' : 'draft',
        createdAt: time,
        updatedAt: time,
        steps: submit ? route : [],
        activity: submit
          ? [
              {
                id: uid('a'),
                at: time,
                personId: me.id,
                kind: 'event',
                text: tr('submitted the request'),
              },
            ]
          : [],
      },
    });
    toast({
      tone: 'success',
      title: submit ? `Submitted ${id}` : `Saved ${id} as a draft`,
    });
    navigate(`/requests/${id}`);
  };

  return (
    <>
      <PageHeader
        title={existing ? `Edit ${existing.id}` : tr('New request')}
        subtitle={existing?.status === 'changes' ? tr('Make the changes, then resubmit. It starts the approval route again.') : undefined}
        backAction={existing ? { content: existing.title, href: `/requests/${existing.id}` } : { content: tr('Requests'), href: '/requests' }}
        renderLink={headerLink}
      />
      <form noValidate onSubmit={save(true)} className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <div className="flex flex-col gap-5">
            {returned?.comment ? (
              <Banner tone="warning" title={tr('What the approver asked for')}>
                “{returned.comment}”
              </Banner>
            ) : null}
            {Object.keys(errors).length > 1 ? (
              <Banner tone="critical" title={`Fix ${Object.keys(errors).length} fields to submit`}>
                {' '}
                {tr('Each problem is described next to its field.')}{' '}
              </Banner>
            ) : null}
            <Field
              label={tr('What kind of request?')}
              required
              disabled={existing !== undefined && existing.status !== 'draft'}
              error={errors.type ? tr(errors.type!) : undefined}
            >
              <Select value={type} onChange={(e) => setType(e.target.value as RequestType)} options={typeOptions} />
            </Field>
            <Field label={tr('Title')} required error={errors.title ? tr(errors.title!) : undefined}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tr('Laptops for new team members')} maxLength={80} />
            </Field>
            {hasAmount ? (
              <Field
                label={tr('Amount')}
                required={type !== 'contract'}
                optional={type === 'contract' ? tr('Optional') : undefined}
                helpText={tr('In US dollars, including tax.')}
                error={errors.amount ? tr(errors.amount!) : undefined}
              >
                <Input prefix="$" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </Field>
            ) : type === 'leave' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <DatePicker
                  label={tr('First day')}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  error={errors.startDate ? tr(errors.startDate!) : undefined}
                />
                <DatePicker
                  label={tr('Last day')}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  error={errors.endDate ? tr(errors.endDate!) : undefined}
                />
              </div>
            ) : null}
            {customFields.length ? (
              <FormRenderer
                fields={customFields}
                values={answers}
                onChange={setAnswers}
                idPrefix="field"
                errors={Object.fromEntries(Object.entries(errors).flatMap(([k, v]) => (k.startsWith('field-') && v ? [[k.slice(6), v]] : [])))}
              />
            ) : null}
            <Field label={tr('Department')} required>
              <Select value={department} onChange={(e) => setDepartment(e.target.value)} options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} />
            </Field>
            <Field
              label={tr('Description')}
              required
              helpText={tr('What it’s for and why now. Approvers read this first.')}
              error={errors.description ? tr(errors.description!) : undefined}
            >
              <Textarea rows={4} autoGrow value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <div className="flex flex-col gap-2">
              <DropZone
                label={tr('Attachments')}
                multiple
                maxFiles={10}
                maxSize={20_000_000}
                hint={tr('Quotes, receipts or contracts. PDF, images or spreadsheets, up to 20 MB each.')}
                error={fileError}
                size="sm"
                onDrop={(accepted, rejected) => {
                  setAttachments((list) => [...list, ...accepted.map((f) => ({ name: f.name, size: f.size }))]);
                  setFileError(rejected[0]?.message);
                }}
              >
                {tr('Choose files or drag them here')}
              </DropZone>
              {attachments.length ? (
                <DropZoneFileList
                  files={attachments.map((a) => ({
                    id: a.name,
                    name: a.name,
                    size: a.size,
                  }))}
                  onRemove={(name) => setAttachments((list) => list.filter((a) => a.name !== name))}
                />
              ) : null}
              <Text variant="caption" tone="muted">
                {' '}
                {tr('In this prototype only the file name and size are kept.')}{' '}
              </Text>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {existing?.status !== 'changes' ? (
                <Button type="button" onClick={save(false)}>
                  {' '}
                  {tr('Save draft')}{' '}
                </Button>
              ) : null}
              <Button type="submit" variant="primary">
                {existing?.status === 'changes' ? tr('Resubmit') : tr('Submit for approval')}
              </Button>
            </div>
          </div>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title={tr('Approval route')} description={tr('Who decides, based on the process for this type and amount.')} />
            <div className="mt-4">
              {route.length ? (
                <ApprovalTimeline
                  steps={route.map((s) => ({
                    ...s,
                    status: 'waiting' as const,
                  }))}
                />
              ) : (
                <Text tone="muted">No active process for {tr(typeName(type, state.processes)).toLowerCase()} requests.</Text>
              )}
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}
