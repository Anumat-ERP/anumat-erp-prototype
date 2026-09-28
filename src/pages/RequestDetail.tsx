import {
  Banner,
  Button,
  Card,
  CardHeader,
  DescriptionList,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Text,
  Textarea,
  useToast,
} from '@repo/ui';
import { formatAnswer, questionsOf, visibleFields } from '../lib/forms';
import { Paperclip } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ApprovalTimeline } from '../components/ApprovalTimeline';
import { MobileActionBar } from '../components/MobileActionBar';
import { DecisionModal, type Decision } from '../components/DecisionModal';
import { AppLink, headerLink } from '../components/links';
import { Person } from '../components/Person';
import { StatusBadge } from '../components/StatusBadge';
import { stepForm, useStore } from '../data/store';
import type { FormValues } from '../data/types';
import { formatBytesShort, formatDate, formatDateTime, formatMoney, formatRelative, typeLabel, typeName } from '../lib/format';

export function RequestDetail() {
  const { id } = useParams();
  const { state, me, person, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [comment, setComment] = useState('');
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const r = state.requests.find((x) => x.id === id);
  if (!r) {
    return (
      <EmptyState
        heading="This request doesn’t exist"
        action={<Button onClick={() => navigate('/requests')}>Back to requests</Button>}
      >
        It may have been removed, or the link is wrong.
      </EmptyState>
    );
  }

  const i = r.steps.findIndex((s) => s.status === 'current');
  const current = r.steps[i];
  const next = r.steps[i + 1];
  const mine = r.status === 'pending' && current?.approverId === me.id;
  const requester = r.requesterId === me.id;
  const open = r.status === 'pending' || r.status === 'changes';
  const meeting = state.meetings.find((m) => m.id === r.meetingId);
  const tasks = state.tasks.filter((t) => t.source?.href === `/requests/${r.id}`);

  const decide = (d: Decision, text: string, answers?: FormValues) => {
    dispatch({ type: 'decide', requestId: r.id, decision: d, comment: text, answers });
    if (d === 'approve') {
      toast({
        tone: 'success',
        title: `Approved ${r.id}`,
        description: next ? `Sent to ${person(next.approverId).name} for ${next.name.toLowerCase()}.` : 'The request is fully approved.',
      });
    } else {
      toast({ title: d === 'changes' ? `Sent ${r.id} back to ${person(r.requesterId).name}` : `Declined ${r.id}` });
    }
  };

  const details = [
    { term: 'Request ID', description: <span className="font-mono text-sm">{r.id}</span> },
    { term: 'Type', description: typeName(r.type, state.processes) },
    { term: 'Requested by', description: <Person id={r.requesterId} showRole /> },
    { term: 'Department', description: r.department },
    ...(r.amount !== undefined ? [{ term: 'Amount', description: <span className="font-semibold tabular-nums">{formatMoney(r.amount)}</span> }] : []),
    ...(r.startDate && r.endDate ? [{ term: 'Dates', description: `${formatDate(r.startDate)} – ${formatDate(r.endDate)}` }] : []),
    // The form as it was when submitted, so later edits to the process don't relabel or hide answers.
    ...questionsOf(visibleFields(r.form ?? state.processes.find((p) => p.requestType === r.type)?.fields ?? [], r.fields ?? {})).map((f) => ({
      term: f.label,
      description: formatAnswer(f, r.fields?.[f.id], (pid) => person(pid).name),
    })),
    { term: 'Submitted', description: r.status === 'draft' ? 'Not yet' : formatDateTime(r.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title={r.title}
        titleMetadata={<StatusBadge status={r.status} />}
        subtitle={`${typeName(r.type, state.processes)} request from ${person(r.requesterId).name} · updated ${formatRelative(r.updatedAt)}`}
        backAction={{ content: 'Requests', href: '/requests' }}
        renderLink={headerLink}
        primaryAction={
          mine
            ? { content: 'Approve', onAction: () => setDecision('approve') }
            : requester && r.status === 'draft'
              ? {
                  content: 'Submit for approval',
                  onAction: () => {
                    dispatch({ type: 'submit', requestId: r.id });
                    toast({ tone: 'success', title: `Submitted ${r.id}` });
                  },
                }
              : requester && r.status === 'changes'
                ? { content: 'Edit and resubmit', onAction: () => navigate(`/requests/${r.id}/edit`) }
                : undefined
        }
        secondaryActions={[
          ...(mine
            ? [
                { content: 'Request changes', onAction: () => setDecision('changes') },
                { content: 'Decline', destructive: true, onAction: () => setDecision('decline') },
              ]
            : []),
          ...(requester && r.status === 'draft' ? [{ content: 'Edit draft', onAction: () => navigate(`/requests/${r.id}/edit`) }] : []),
          ...(open ? [{ content: 'Schedule a meeting', onAction: () => navigate(`/meetings/new?request=${r.id}`) }] : []),
          ...(requester && open ? [{ content: 'Withdraw', destructive: true, onAction: () => setConfirmWithdraw(true) }] : []),
        ]}
        maxVisibleSecondaryActions={mine ? 2 : 1}
      />

      {mine ? (
        <Banner tone="warning" title="Waiting on your decision">
          You are the approver for <strong>{current?.name}</strong>.
          {next ? ` After you, it goes to ${person(next.approverId).name} for ${next.name.toLowerCase()}.` : ' Yours is the final step.'}
        </Banner>
      ) : r.status === 'changes' ? (
        <Banner
          tone="critical"
          title="Changes requested"
          action={requester ? { label: 'Edit and resubmit', onAction: () => navigate(`/requests/${r.id}/edit`) } : undefined}
        >
          {r.steps.find((s) => s.status === 'returned')?.comment ?? 'The approver asked for changes.'}
        </Banner>
      ) : r.status === 'withdrawn' ? (
        <Banner tone="info">{requester ? 'You' : person(r.requesterId).name} withdrew this request. Nobody needs to act on it.</Banner>
      ) : r.status === 'pending' && current ? (
        <Banner tone="info">
          Waiting on {person(current.approverId).name} for {current.name.toLowerCase()}.
        </Banner>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Details" />
            <DescriptionList className="mt-4" layout="inline" dividers items={details} />
            <div className="mt-6 flex flex-col gap-1">
              <Text as="h3" variant="label">
                Description
              </Text>
              <Text className="max-w-prose">{r.description}</Text>
            </div>
          </Card>

          <Card>
            <CardHeader title="Attachments" description={r.attachments.length ? undefined : 'No files attached.'} />
            {r.attachments.length ? (
              <ul className="mt-3 flex flex-col gap-2">
                {r.attachments.map((a) => (
                  <li key={a.name} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                    <Paperclip aria-hidden className="size-4 text-fg-subtle" />
                    <span className="min-w-0 flex-1 truncate font-medium">{a.name}</span>
                    <Text as="span" variant="bodySm" tone="muted" numeric>
                      {formatBytesShort(a.size)}
                    </Text>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>

          <Card>
            <CardHeader title="Activity" />
            <ol className="mt-4 flex flex-col gap-4">
              {r.activity.map((a) => (
                <li key={a.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <Person id={a.personId} size="xs" />
                    <Text as="span" variant="caption" tone="subtle" className="shrink-0">
                      {formatRelative(a.at)}
                    </Text>
                  </div>
                  <div className="min-w-0 ps-7">
                    {a.kind === 'comment' ? (
                      <p className="rounded-md bg-surface-sunken px-3 py-2 break-words">{a.text}</p>
                    ) : (
                      <Text tone="muted">{a.text}</Text>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            <form
              className="mt-5 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                dispatch({ type: 'comment', requestId: r.id, text: comment.trim() });
                setComment('');
              }}
            >
              <Field label="Add a comment" labelHidden>
                <Textarea rows={2} autoGrow placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
              </Field>
              <div>
                <Button type="submit" disabled={!comment.trim()}>
                  Comment
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="RACI" description="Worked out from the approval route and the linked meeting." />
            {(() => {
              const approvers = [...new Set(r.steps.map((s) => s.approverId))];
              const accountable = r.steps[r.steps.length - 1]?.approverId;
              const consulted = approvers.filter((id) => id !== accountable && id !== r.requesterId);
              const informed = (meeting?.attendeeIds ?? []).filter((id) => id !== r.requesterId && !approvers.includes(id));
              const rows: [string, string, string[], string][] = [
                ['R', 'Responsible', [r.requesterId], 'raised it and does the work'],
                ['A', 'Accountable', accountable ? [accountable] : [], 'makes the final call'],
                ['C', 'Consulted', consulted, 'review it on the way'],
                ['I', 'Informed', informed, 'follow it from the meeting'],
              ];
              return (
                <dl className="mt-3 grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-md">
                  {rows.map(([letter, word, ids, hint]) => (
                    <div key={letter} className="contents">
                      <dt className="pt-0.5 font-mono text-sm font-semibold text-fg-muted" title={word}>
                        {letter}
                        <span className="sr-only">{word.slice(1)}</span>
                      </dt>
                      <dd className="flex flex-col">
                        <span>{ids.length ? ids.map((id) => (id === me.id ? 'You' : person(id).name)).join(', ') : '—'}</span>
                        <Text as="span" variant="caption" tone="muted">
                          {ids.length ? hint : r.status === 'draft' ? 'Set when submitted' : 'Nobody'}
                        </Text>
                      </dd>
                    </div>
                  ))}
                </dl>
              );
            })()}
          </Card>
          <Card>
            <CardHeader title="Approval route" />
            <div className="mt-4">
              <ApprovalTimeline steps={r.steps} />
            </div>
          </Card>
          {meeting || tasks.length ? (
            <Card>
              <CardHeader title="Linked" />
              <ul className="mt-3 flex flex-col gap-2">
                {meeting ? (
                  <li className="flex flex-col items-start gap-0.5">
                    <Text as="span" variant="caption" tone="muted">
                      Meeting
                    </Text>
                    <AppLink to={`/meetings/${meeting.id}`}>{meeting.title}</AppLink>
                  </li>
                ) : null}
                {tasks.map((t) => (
                  <li key={t.id} className="flex flex-col items-start gap-0.5">
                    <Text as="span" variant="caption" tone="muted">
                      Task · {person(t.ownerId).name}
                    </Text>
                    <AppLink to="/tasks">{t.title}</AppLink>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>

      {mine ? (
        <MobileActionBar label="Your decision">
          <Button onClick={() => setDecision('decline')}>Decline</Button>
          <Button onClick={() => setDecision('changes')}>Send back</Button>
          <Button variant="primary" onClick={() => setDecision('approve')}>
            Approve
          </Button>
        </MobileActionBar>
      ) : requester && r.status === 'changes' ? (
        <MobileActionBar label="Next step">
          <Button variant="primary" onClick={() => navigate(`/requests/${r.id}/edit`)}>
            Edit and resubmit
          </Button>
        </MobileActionBar>
      ) : null}
      <DecisionModal
        decision={decision}
        requestTitle={`${r.id} · ${r.title}`}
        nextStep={next ? `${person(next.approverId).name} for ${next.name.toLowerCase()}` : undefined}
        onClose={() => setDecision(null)}
        onConfirm={decide}
        fields={mine ? stepForm(state, r) : []}
      />
      <Modal
        open={confirmWithdraw}
        onOpenChange={setConfirmWithdraw}
        title="Withdraw this request?"
        description={`${r.id} · ${r.title}`}
        primaryAction={{
          content: 'Withdraw',
          destructive: true,
          onAction: () => {
            dispatch({ type: 'withdraw', requestId: r.id });
            setConfirmWithdraw(false);
            toast({ title: `Withdrew ${r.id}` });
          },
        }}
        secondaryActions={[{ content: 'Keep it', onAction: () => setConfirmWithdraw(false) }]}
      >
        <Text>Approvers stop seeing it in their queue. To ask again, create a new request.</Text>
      </Modal>
    </>
  );
}
