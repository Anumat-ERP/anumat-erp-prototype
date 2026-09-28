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
import { cleanValues, validateForm } from '../lib/forms';
import { isBuiltInType, typeName } from '../lib/format';

const PREFIX: Record<string, string> = { purchase: 'PR', leave: 'LV', expense: 'EX', contract: 'CT' };
const DEPARTMENTS = ['Operations', 'Finance', 'People', 'Product', 'IT', 'Legal', 'Leadership'];

type Errors = Partial<Record<string, string>>;

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '');

/** New request, or editing one of your drafts / a request sent back for changes. */
export function NewRequest() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { state, me } = useStore();
  const navigate = useNavigate();
  if (!id) return <RequestForm key={params.get('demo') ?? 'new'} />;
  const existing = state.requests.find((r) => r.id === id);
  const editable = existing && existing.requesterId === me.id && (existing.status === 'draft' || existing.status === 'changes');
  if (!existing || !editable) {
    return (
      <EmptyState heading="You can’t edit this request" action={<Button onClick={() => navigate(existing ? `/requests/${id}` : '/requests')}>Go back</Button>}>
        Only the requester can edit, and only while it is a draft or has been sent back for changes.
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
    department: 'Operations',
    description: 'Three laptops for the analysts starting next month. Two quotes attached; we recommend the cheaper one with the 3-year warranty.',
    attachments: [
      { name: 'Quote_Supplier_A.pdf', size: 312_000 },
      { name: 'Quote_Supplier_B.pdf', size: 298_000 },
    ],
  },
};

function RequestForm({ existing: saved }: { existing?: Request }) {
  const [params] = useSearchParams();
  const demo = DEMO[params.get('demo') ?? ''];
  const existing = saved;
  // Starting values: the request being edited, or a demo prefill (?demo=laptops).
  const initial: Partial<Request> | undefined = saved ?? demo;
  const { state, me, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [type, setType] = useState<RequestType>(initial?.type ?? 'purchase');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [amount, setAmount] = useState(initial?.amount !== undefined ? String(initial.amount) : '');
  const [startDate, setStartDate] = useState(toDateInput(initial?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(initial?.endDate));
  const [department, setDepartment] = useState(initial?.department ?? me.department);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(initial?.attachments ?? []);
  const [fileError, setFileError] = useState<string>();
  const [answers, setAnswers] = useState<FormValues>(initial?.fields ?? {});
  const [errors, setErrors] = useState<Errors>({});
  const returned = existing?.steps.find((s) => s.status === 'returned');

  // Request types this person may raise: active processes open to their department.
  const allowed = state.processes.filter((p) => p.active && canSubmit(state, p));
  const typeOptions = allowed.map((p) => ({ value: p.requestType, label: typeName(p.requestType, state.processes) }));
  if (existing && !typeOptions.some((o) => o.value === type)) typeOptions.push({ value: type, label: typeName(type, state.processes) });
  const process = state.processes.find((p) => p.requestType === type);
  const builtIn = isBuiltInType(type);
  const customFields = process?.fields ?? [];

  const hasAmount = builtIn ? type !== 'leave' : Boolean(process?.hasAmount);
  const amountNumber = Number(amount.replace(/,/g, ''));
  const route = routeFor(state.processes, type, hasAmount && amountNumber > 0 ? amountNumber : undefined);

  const validate = (): Errors => {
    const e: Errors = {};
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
    const e = submit ? validate() : title.trim() ? {} : { title: 'A draft needs at least a title.' };
    setErrors(e);
    if (Object.keys(e).length) return;
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
    };
    if (existing) {
      dispatch({ type: 'update', requestId: existing.id, patch: fields, submit });
      toast({
        tone: 'success',
        title: submit ? (existing.status === 'changes' ? `Resubmitted ${existing.id}` : `Submitted ${existing.id}`) : `Saved ${existing.id}`,
      });
      navigate(`/requests/${existing.id}`);
      return;
    }
    const n = Math.max(0, ...state.requests.filter((r) => r.type === type).map((r) => Number(r.id.split('-')[1]) || 0)) + 1;
    const prefix = PREFIX[type] ?? process?.prefix ?? type.slice(0, 2).toUpperCase();
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
        activity: submit ? [{ id: uid('a'), at: time, personId: me.id, kind: 'event', text: 'submitted the request' }] : [],
      },
    });
    toast({ tone: 'success', title: submit ? `Submitted ${id}` : `Saved ${id} as a draft` });
    navigate(`/requests/${id}`);
  };

  return (
    <>
      <PageHeader
        title={existing ? `Edit ${existing.id}` : 'New request'}
        subtitle={existing?.status === 'changes' ? 'Make the changes, then resubmit. It starts the approval route again.' : undefined}
        backAction={existing ? { content: existing.title, href: `/requests/${existing.id}` } : { content: 'Requests', href: '/requests' }}
        renderLink={headerLink}
      />
      <form noValidate onSubmit={save(true)} className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <div className="flex flex-col gap-5">
            {returned?.comment ? (
              <Banner tone="warning" title="What the approver asked for">
                “{returned.comment}”
              </Banner>
            ) : null}
            {Object.keys(errors).length > 1 ? (
              <Banner tone="critical" title={`Fix ${Object.keys(errors).length} fields to submit`}>
                Each problem is described next to its field.
              </Banner>
            ) : null}
            <Field label="What kind of request?" required disabled={existing !== undefined && existing.status !== 'draft'}>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as RequestType)}
                options={typeOptions}
              />
            </Field>
            <Field label="Title" required error={errors.title}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Laptops for new team members" maxLength={80} />
            </Field>
            {hasAmount ? (
              <Field
                label="Amount"
                required={type !== 'contract'}
                optional={type === 'contract' ? 'Optional' : undefined}
                helpText="In US dollars, including tax."
                error={errors.amount}
              >
                <Input prefix="$" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </Field>
            ) : type === 'leave' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <DatePicker label="First day" value={startDate} onChange={(e) => setStartDate(e.target.value)} error={errors.startDate} />
                <DatePicker label="Last day" value={endDate} onChange={(e) => setEndDate(e.target.value)} error={errors.endDate} />
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
            <Field label="Department" required>
              <Select value={department} onChange={(e) => setDepartment(e.target.value)} options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} />
            </Field>
            <Field label="Description" required helpText="What it’s for and why now. Approvers read this first." error={errors.description}>
              <Textarea rows={4} autoGrow value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <div className="flex flex-col gap-2">
              <DropZone
                label="Attachments"
                multiple
                maxFiles={10}
                maxSize={20_000_000}
                hint="Quotes, receipts or contracts. PDF, images or spreadsheets, up to 20 MB each."
                error={fileError}
                size="sm"
                onDrop={(accepted, rejected) => {
                  setAttachments((list) => [...list, ...accepted.map((f) => ({ name: f.name, size: f.size }))]);
                  setFileError(rejected[0]?.message);
                }}
              />
              {attachments.length ? (
                <DropZoneFileList
                  files={attachments.map((a) => ({ id: a.name, name: a.name, size: a.size }))}
                  onRemove={(name) => setAttachments((list) => list.filter((a) => a.name !== name))}
                />
              ) : null}
              <Text variant="caption" tone="muted">
                In this prototype only the file name and size are kept.
              </Text>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {existing?.status !== 'changes' ? (
                <Button type="button" onClick={save(false)}>
                  Save draft
                </Button>
              ) : null}
              <Button type="submit" variant="primary">
                {existing?.status === 'changes' ? 'Resubmit' : 'Submit for approval'}
              </Button>
            </div>
          </div>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Approval route" description="Who decides, based on the process for this type and amount." />
            <div className="mt-4">
              {route.length ? (
                <ApprovalTimeline steps={route.map((s) => ({ ...s, status: 'waiting' as const }))} />
              ) : (
                <Text tone="muted">No active process for {typeName(type, state.processes).toLowerCase()} requests.</Text>
              )}
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}
