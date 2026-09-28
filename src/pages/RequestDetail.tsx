import {
  Banner,
  Button,
  Card,
  CardHeader,
  DescriptionList,
  EmptyState,
  Field,
  PageHeader,
  Text,
  Textarea,
  useToast,
} from '@repo/ui';
import { Paperclip } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ApprovalTimeline } from '../components/ApprovalTimeline';
import { DecisionModal, type Decision } from '../components/DecisionModal';
import { AppLink, headerLink } from '../components/links';
import { Person } from '../components/Person';
import { StatusBadge } from '../components/StatusBadge';
import { useStore } from '../data/store';
import { formatBytesShort, formatDate, formatDateTime, formatMoney, formatRelative, typeLabel } from '../lib/format';

export function RequestDetail() {
  const { id } = useParams();
  const { state, me, person, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [comment, setComment] = useState('');

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
  const meeting = state.meetings.find((m) => m.id === r.meetingId);
  const tasks = state.tasks.filter((t) => t.source?.href === `/requests/${r.id}`);

  const decide = (d: Decision, text: string) => {
    dispatch({ type: 'decide', requestId: r.id, decision: d, comment: text });
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
    { term: 'Type', description: typeLabel[r.type] },
    { term: 'Requested by', description: <Person id={r.requesterId} showRole /> },
    { term: 'Department', description: r.department },
    ...(r.amount !== undefined ? [{ term: 'Amount', description: <span className="font-semibold tabular-nums">{formatMoney(r.amount)}</span> }] : []),
    ...(r.startDate && r.endDate ? [{ term: 'Dates', description: `${formatDate(r.startDate)} – ${formatDate(r.endDate)}` }] : []),
    { term: 'Submitted', description: r.status === 'draft' ? 'Not yet' : formatDateTime(r.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title={r.title}
        titleMetadata={<StatusBadge status={r.status} />}
        subtitle={`${typeLabel[r.type]} request from ${person(r.requesterId).name} · updated ${formatRelative(r.updatedAt)}`}
        backAction={{ content: 'Requests', href: '/requests' }}
        renderLink={headerLink}
        primaryAction={
          mine
            ? { content: 'Approve', onAction: () => setDecision('approve') }
            : r.status === 'draft' && r.requesterId === me.id
              ? {
                  content: 'Submit for approval',
                  onAction: () => {
                    dispatch({ type: 'submit', requestId: r.id });
                    toast({ tone: 'success', title: `Submitted ${r.id}` });
                  },
                }
              : undefined
        }
        secondaryActions={
          mine
            ? [
                { content: 'Request changes', onAction: () => setDecision('changes') },
                { content: 'Decline', destructive: true, onAction: () => setDecision('decline') },
              ]
            : undefined
        }
      />

      {mine ? (
        <Banner tone="warning" title="Waiting on your decision">
          You are the approver for <strong>{current?.name}</strong>.
          {next ? ` After you, it goes to ${person(next.approverId).name} for ${next.name.toLowerCase()}.` : ' Yours is the final step.'}
        </Banner>
      ) : r.status === 'changes' ? (
        <Banner tone="critical" title="Changes requested">
          {r.steps.find((s) => s.status === 'returned')?.comment ?? 'The approver asked for changes.'}
        </Banner>
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
                <li key={a.id} className="flex gap-3">
                  <Person id={a.personId} size="xs" />
                  <div className="min-w-0 flex-1">
                    {a.kind === 'comment' ? (
                      <p className="rounded-md bg-surface-sunken px-3 py-2">{a.text}</p>
                    ) : (
                      <Text tone="muted">{a.text}</Text>
                    )}
                  </div>
                  <Text as="span" variant="caption" tone="subtle" className="shrink-0">
                    {formatRelative(a.at)}
                  </Text>
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

      <DecisionModal
        decision={decision}
        requestTitle={`${r.id} · ${r.title}`}
        nextStep={next ? `${person(next.approverId).name} for ${next.name.toLowerCase()}` : undefined}
        onClose={() => setDecision(null)}
        onConfirm={decide}
      />
    </>
  );
}
