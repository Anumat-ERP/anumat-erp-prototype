import { Banner, Button, Card, CardHeader, DatePicker, Field, Input, PageHeader, Select, Text, Textarea, useToast } from '@repo/ui';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ApprovalTimeline } from '../components/ApprovalTimeline';
import { headerLink } from '../components/links';
import { routeFor, uid, useStore } from '../data/store';
import type { RequestType } from '../data/types';
import { typeLabel } from '../lib/format';

const PREFIX: Record<RequestType, string> = { purchase: 'PR', leave: 'LV', expense: 'EX', contract: 'CT' };
const DEPARTMENTS = ['Operations', 'Finance', 'People', 'Product', 'IT', 'Legal', 'Leadership'];

type Errors = Partial<Record<'title' | 'amount' | 'startDate' | 'endDate' | 'description', string>>;

export function NewRequest() {
  const { state, me, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [type, setType] = useState<RequestType>('purchase');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState(me.department);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const hasAmount = type !== 'leave';
  const amountNumber = Number(amount.replace(/,/g, ''));
  const route = routeFor(state.processes, type, hasAmount && amountNumber > 0 ? amountNumber : undefined);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!title.trim()) e.title = 'Give the request a short title, like “Laptops for new hires”.';
    if (hasAmount && type !== 'contract' && !(amountNumber > 0)) e.amount = 'Enter the amount in US dollars, for example 1250.';
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
    const n = Math.max(0, ...state.requests.filter((r) => r.type === type).map((r) => Number(r.id.split('-')[1]) || 0)) + 1;
    const id = `${PREFIX[type]}-${String(n).padStart(4, '0')}`;
    const time = new Date().toISOString();
    dispatch({
      type: 'create',
      request: {
        id,
        type,
        title: title.trim(),
        requesterId: me.id,
        department,
        amount: hasAmount && amountNumber > 0 ? amountNumber : undefined,
        startDate: type === 'leave' ? new Date(startDate).toISOString() : undefined,
        endDate: type === 'leave' ? new Date(endDate).toISOString() : undefined,
        description: description.trim(),
        status: submit ? 'pending' : 'draft',
        createdAt: time,
        updatedAt: time,
        steps: submit ? route : [],
        attachments: [],
        activity: submit ? [{ id: uid('a'), at: time, personId: me.id, kind: 'event', text: 'submitted the request' }] : [],
      },
    });
    toast({ tone: 'success', title: submit ? `Submitted ${id}` : `Saved ${id} as a draft` });
    navigate(`/requests/${id}`);
  };

  return (
    <>
      <PageHeader title="New request" backAction={{ content: 'Requests', href: '/requests' }} renderLink={headerLink} />
      <form noValidate onSubmit={save(true)} className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <div className="flex flex-col gap-5">
            {Object.keys(errors).length > 1 ? (
              <Banner tone="critical" title={`Fix ${Object.keys(errors).length} fields to submit`}>
                Each problem is described next to its field.
              </Banner>
            ) : null}
            <Field label="What kind of request?" required>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as RequestType)}
                options={(Object.keys(typeLabel) as RequestType[]).map((t) => ({ value: t, label: typeLabel[t] }))}
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
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <DatePicker label="First day" value={startDate} onChange={(e) => setStartDate(e.target.value)} error={errors.startDate} />
                <DatePicker label="Last day" value={endDate} onChange={(e) => setEndDate(e.target.value)} error={errors.endDate} />
              </div>
            )}
            <Field label="Department" required>
              <Select value={department} onChange={(e) => setDepartment(e.target.value)} options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} />
            </Field>
            <Field label="Description" required helpText="What it’s for and why now. Approvers read this first." error={errors.description}>
              <Textarea rows={4} autoGrow value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" onClick={save(false)}>
                Save draft
              </Button>
              <Button type="submit" variant="primary">
                Submit for approval
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
                <Text tone="muted">No active process for {typeLabel[type].toLowerCase()} requests.</Text>
              )}
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}
