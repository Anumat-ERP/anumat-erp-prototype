import { Banner, Button, Card, CardHeader, DescriptionList, EmptyState, Field, IconButton, Kbd, Modal, PageHeader, Text, Textarea, useToast } from '@app/ui';
import { Copy, Paperclip } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ApprovalTimeline } from '../components/ApprovalTimeline';
import { DecisionModal, type Decision } from '../components/DecisionModal';
import { headerLink } from '../components/links';
import { MobileActionBar } from '../components/MobileActionBar';
import { Person } from '../components/Person';
import { StatusBadge } from '../components/StatusBadge';
import { Time } from '../components/Time';
import { stepForm, useStore } from '../data/store';
import type { FormValues } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import { formatBytesShort, formatDate, formatDateTime, formatMoney, formatRelative, typeName } from '../lib/format';
import { formatAnswer, questionsOf, visibleFields } from '../lib/forms';
import { Changed } from '../lib/motion';

export function RequestDetail() {
  const { t: tr } = useLocale();
  const { id } = useParams();
  const { state, me, person, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [comment, setComment] = useState('');
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const r = state.requests.find((x) => x.id === id);
  const canDecideNow = Boolean(r && r.status === 'pending' && r.steps.find((st) => st.status === 'current')?.approverId === me.id);

  // Keyboard: A approve, R request changes, D decline. Never while typing or with a dialog open.
  useEffect(() => {
    if (!canDecideNow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || decision) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, [contenteditable="true"]') || document.querySelector('[role="dialog"]')) return;
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'r' || k === 'd') {
        e.preventDefault();
        setDecision(k === 'a' ? 'approve' : k === 'r' ? 'changes' : 'decline');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canDecideNow, decision]);

  if (!r) {
    return (
      <EmptyState heading={tr('This request doesn’t exist')} action={<Button onClick={() => navigate('/requests')}>{tr('Back to requests')}</Button>}>
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
    dispatch({
      type: 'decide',
      requestId: r.id,
      decision: d,
      comment: text,
      answers,
    });
    if (d === 'approve') {
      toast({
        tone: 'success',
        title: `Approved ${r.id}`,
        description: next ? `Sent to ${person(next.approverId).name} for ${next.name.toLowerCase()}.` : tr('The request is fully approved.'),
      });
    } else {
      toast({
        title: d === 'changes' ? `Sent ${r.id} back to ${person(r.requesterId).name}` : `Declined ${r.id}`,
      });
    }
  };

  const details = [
    {
      term: tr('Request ID'),
      description: (
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono text-sm">{r.id}</span>
          <IconButton
            size="sm"
            variant="tertiary"
            icon={<Copy />}
            label={`Copy ${r.id}`}
            onClick={() => {
              navigator.clipboard?.writeText(r.id).then(
                () => toast({ title: `Copied ${r.id}` }),
                () =>
                  toast({
                    tone: 'critical',
                    title: tr('Couldn’t copy'),
                    description: 'Select the ID and copy it instead.',
                  }),
              );
            }}
          />
        </span>
      ),
    },
    { term: tr('Type'), description: tr(typeName(r.type, state.processes)) },
    {
      term: tr('Requested by'),
      description: <Person id={r.requesterId} showRole />,
    },
    { term: tr('Department'), description: r.department },
    ...(r.amount !== undefined
      ? [
          {
            term: tr('Amount'),
            description: <span className="font-semibold tabular-nums">{formatMoney(r.amount)}</span>,
          },
        ]
      : []),
    ...(r.startDate && r.endDate
      ? [
          {
            term: tr('Dates'),
            description: `${formatDate(r.startDate)} – ${formatDate(r.endDate)}`,
          },
        ]
      : []),
    // The form as it was when submitted, so later edits to the process don't relabel or hide answers.
    ...questionsOf(visibleFields(r.form ?? state.processes.find((p) => p.requestType === r.type)?.fields ?? [], r.fields ?? {}))
      // Requests from before a question existed have no copy of the form: show only what they answered.
      .filter((f) => r.form || r.fields?.[f.id] !== undefined)
      .map((f) => ({
        term: f.label,
        description: formatAnswer(f, r.fields?.[f.id], (pid) => person(pid).name),
      })),
    {
      term: tr('Submitted'),
      description: r.status === 'draft' ? tr('Not yet') : formatDateTime(r.createdAt),
    },
  ];

  return (
    <>
      <PageHeader
        title={r.title}
        titleMetadata={
          <Changed value={r.status} className="-mx-1 px-1">
            <StatusBadge status={r.status} />
          </Changed>
        }
        subtitle={`${tr(typeName(r.type, state.processes))} request from ${person(r.requesterId).name} · updated ${formatRelative(r.updatedAt)}`}
        backAction={{ content: tr('Requests'), href: '/requests' }}
        renderLink={headerLink}
        primaryAction={
          mine
            ? { content: tr('Approve'), onAction: () => setDecision('approve') }
            : requester && r.status === 'draft'
              ? {
                  content: tr('Submit for approval'),
                  onAction: () => {
                    dispatch({ type: 'submit', requestId: r.id });
                    toast({ tone: 'success', title: `Submitted ${r.id}` });
                  },
                }
              : requester && r.status === 'changes'
                ? {
                    content: tr('Edit and resubmit'),
                    onAction: () => navigate(`/requests/${r.id}/edit`),
                  }
                : undefined
        }
        secondaryActions={[
          ...(mine
            ? [
                {
                  content: tr('Request changes'),
                  onAction: () => setDecision('changes'),
                },
                {
                  content: tr('Decline'),
                  destructive: true,
                  onAction: () => setDecision('decline'),
                },
              ]
            : []),
          ...(requester && r.status === 'draft'
            ? [
                {
                  content: tr('Edit draft'),
                  onAction: () => navigate(`/requests/${r.id}/edit`),
                },
              ]
            : []),
          ...(requester && open
            ? [
                {
                  content: tr('Withdraw'),
                  destructive: true,
                  onAction: () => setConfirmWithdraw(true),
                },
              ]
            : []),
        ]}
        maxVisibleSecondaryActions={mine ? 2 : 1}
      />

      {mine ? (
        <Banner tone="warning" title={tr('Waiting on your decision')}>
          You are the approver for <strong>{current?.name}</strong>.
          {next ? ` After you, it goes to ${person(next.approverId).name} for ${next.name.toLowerCase()}.` : tr('Yours is the final step.')}
          <span aria-hidden className="mt-2 hidden items-center gap-3 text-sm text-fg-muted md:flex">
            Shortcuts:
            <span className="inline-flex items-center gap-1">
              <Kbd size="sm">A</Kbd> approve
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd size="sm">R</Kbd> request changes
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd size="sm">D</Kbd> decline
            </span>
          </span>
        </Banner>
      ) : r.status === 'changes' ? (
        <Banner
          tone="critical"
          title={tr('Changes requested')}
          action={
            requester
              ? {
                  label: tr('Edit and resubmit'),
                  onAction: () => navigate(`/requests/${r.id}/edit`),
                }
              : undefined
          }
        >
          {r.steps.find((s) => s.status === 'returned')?.comment ?? 'The approver asked for changes.'}
        </Banner>
      ) : r.status === 'withdrawn' ? (
        <Banner tone="info">{requester ? tr('You') : person(r.requesterId).name} withdrew this request. Nobody needs to act on it.</Banner>
      ) : r.status === 'pending' && current ? (
        <Banner tone="info">
          {' '}
          {tr('Waiting on')} {person(current.approverId).name} for {current.name.toLowerCase()}.
        </Banner>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title={tr('Details')} />
            <DescriptionList className="mt-4" layout="inline" dividers items={details} />
            <div className="mt-6 flex flex-col gap-1">
              <Text as="h3" variant="label">
                {' '}
                {tr('Description')}{' '}
              </Text>
              <Text className="max-w-prose">{r.description}</Text>
            </div>
          </Card>

          <Card>
            <CardHeader title={tr('Attachments')} description={r.attachments.length ? undefined : tr('No files attached.')} />
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
            <CardHeader title={tr('Activity')} />
            <ol className="mt-4 flex flex-col gap-4">
              {r.activity.map((a) => (
                <li key={a.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <Person id={a.personId} size="xs" />
                    <Text as="span" variant="caption" tone="subtle" className="shrink-0">
                      <Time iso={a.at} />
                    </Text>
                  </div>
                  <div className="min-w-0 ps-7">
                    {a.kind === 'comment' ? <p className="rounded-md bg-surface-sunken px-3 py-2 break-words">{a.text}</p> : <Text tone="muted">{a.text}</Text>}
                  </div>
                </li>
              ))}
            </ol>
            <form
              className="mt-5 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                dispatch({
                  type: 'comment',
                  requestId: r.id,
                  text: comment.trim(),
                });
                setComment('');
              }}
            >
              <Field label={tr('Add a comment')} labelHidden>
                <Textarea rows={2} autoGrow placeholder={tr('Add a comment…')} value={comment} onChange={(e) => setComment(e.target.value)} />
              </Field>
              <div>
                <Button type="submit" disabled={!comment.trim()}>
                  {' '}
                  {tr('Comment')}{' '}
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
                        <span>{ids.length ? ids.map((id) => (id === me.id ? tr('You') : person(id).name)).join(', ') : '—'}</span>
                        <Text as="span" variant="caption" tone="muted">
                          {ids.length ? hint : r.status === 'draft' ? tr('Set when submitted') : tr('Nobody')}
                        </Text>
                      </dd>
                    </div>
                  ))}
                </dl>
              );
            })()}
          </Card>
          <Card>
            <CardHeader title={tr('Approval route')} />
            <div className="mt-4">
              <ApprovalTimeline steps={r.steps} />
            </div>
          </Card>
        </div>
      </div>

      {mine ? (
        <MobileActionBar label={tr('Your decision')}>
          <Button onClick={() => setDecision('decline')}>{tr('Decline')}</Button>
          <Button onClick={() => setDecision('changes')}>{tr('Send back')}</Button>
          <Button variant="primary" onClick={() => setDecision('approve')}>
            {' '}
            {tr('Approve')}{' '}
          </Button>
        </MobileActionBar>
      ) : requester && r.status === 'changes' ? (
        <MobileActionBar label={tr('Next step')}>
          <Button variant="primary" onClick={() => navigate(`/requests/${r.id}/edit`)}>
            {' '}
            {tr('Edit and resubmit')}{' '}
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
        title={tr('Withdraw this request?')}
        description={`${r.id} · ${r.title}`}
        primaryAction={{
          content: tr('Withdraw'),
          destructive: true,
          onAction: () => {
            dispatch({ type: 'withdraw', requestId: r.id });
            setConfirmWithdraw(false);
            toast({ title: `Withdrew ${r.id}` });
          },
        }}
        secondaryActions={[{ content: 'Keep it', onAction: () => setConfirmWithdraw(false) }]}
      >
        <Text>{tr('Approvers stop seeing it in their queue. To ask again, create a new request.')}</Text>
      </Modal>
    </>
  );
}
