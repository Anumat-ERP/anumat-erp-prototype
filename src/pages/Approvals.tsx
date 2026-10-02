import { EmptyState, IndexTable, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger, Text, useToast, type DataTableColumn, type Selection } from '@app/ui';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Person } from '../components/Person';
import { RequestIcon } from '../components/RequestIcon';
import { StatusBadge } from '../components/StatusBadge';
import { Time } from '../components/Time';
import { needsDetails, useStore, waitingOnMe } from '../data/store';
import type { Process, Request } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import { daysUntil, formatMoney, formatRelative, stepStatus, typeName } from '../lib/format';

const REQUESTS = { singular: 'request', plural: 'requests' };

function titleCell(r: Request, processes: Process[], tr: (message: string) => string) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <RequestIcon type={r.type} className="size-8" />
      <span className="flex min-w-0 flex-col">
        <Link to={`/requests/${r.id}`} className="truncate font-medium text-fg hover:underline focus-visible:outline-2 focus-visible:outline-ring">
          {r.title}
        </Link>
        <Text as="span" variant="caption" tone="muted">
          {r.id} · {tr(typeName(r.type, processes))}
        </Text>
      </span>
    </span>
  );
}

export function Approvals() {
  const { t: tr, locale } = useLocale();
  const { state, me, person, dispatch } = useStore();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Selection>([]);
  const waiting = waitingOnMe(state).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const decided = state.requests
    .map((r) => ({
      r,
      step: r.steps.find((s) => s.approverId === me.id && s.at && s.status !== 'current'),
    }))
    .filter((x) => x.step)
    .sort((a, b) => (b.step?.at ?? '').localeCompare(a.step?.at ?? ''));

  const waitingColumns: DataTableColumn<Request>[] = [
    {
      id: 'title',
      header: tr('Request'),
      cell: (r) => titleCell(r, state.processes, tr),
    },
    {
      id: 'from',
      header: tr('From'),
      cell: (r) => <Person id={r.requesterId} size="xs" />,
    },
    {
      id: 'step',
      header: tr('Your step'),
      cell: (r) => (
        <span className="flex flex-col">
          {tr(r.steps.find((s) => s.status === 'current')?.name ?? '')}
          {needsDetails(state, r) ? (
            <Text as="span" variant="caption" tone="muted">
              {' '}
              {tr('Asks for details')}{' '}
            </Text>
          ) : null}
        </span>
      ),
    },
    {
      id: 'amount',
      header: tr('Amount'),
      align: 'end',
      numeric: true,
      sortable: true,
      sortValue: (r) => r.amount ?? -1,
      cell: (r) => formatMoney(r.amount),
    },
    {
      id: 'age',
      header: tr('Waiting'),
      sortable: true,
      sortValue: (r) => r.createdAt,
      cell: (r) => {
        const days = -daysUntil(r.createdAt);
        return (
          <span className={days >= 2 ? 'font-medium text-critical-subtle-fg' : 'text-fg-muted'}>
            <Time iso={r.createdAt} />
          </span>
        );
      },
    },
  ];

  const decidedColumns: DataTableColumn<(typeof decided)[number]>[] = [
    {
      id: 'title',
      header: tr('Request'),
      cell: (x) => titleCell(x.r, state.processes, tr),
    },
    {
      id: 'decision',
      header: tr('Your decision'),
      cell: (x) => (x.step ? tr(stepStatus[x.step.status]) : ''),
    },
    {
      id: 'status',
      header: tr('Now'),
      cell: (x) => <StatusBadge status={x.r.status} size="sm" />,
    },
    {
      id: 'when',
      header: tr('When'),
      cell: (x) => <span className="text-fg-muted">{x.step?.at ? formatRelative(x.step.at) : ''}</span>,
    },
  ];

  return (
    <>
      <PageHeader title={tr('Approvals')} subtitle={tr('Decide what’s waiting on you. Oldest first.')} />
      <Tabs defaultValue="waiting">
        <TabsList aria-label={tr('Approvals')}>
          <TabsTrigger value="waiting" badge={waiting.length || undefined} badgeLabel={tr('{count} waiting', { count: waiting.length })}>
            {' '}
            {tr('Waiting on you')}{' '}
          </TabsTrigger>
          <TabsTrigger value="decided">{tr('Decided by you')}</TabsTrigger>
        </TabsList>
        <TabsContent value="waiting" className="pt-4">
          {/* Phones: one card per request, with the step and a way in. */}
          <ul className="flex flex-col gap-3 md:hidden" aria-label={tr('Requests waiting on your decision')}>
            {waiting.length === 0 ? (
              <li>
                <EmptyState size="card" heading={tr('All caught up')}>
                  {' '}
                  {tr('Nothing is waiting on your decision.')}{' '}
                </EmptyState>
              </li>
            ) : null}
            {waiting.map((r) => {
              const days = -daysUntil(r.createdAt);
              return (
                <li key={r.id}>
                  <Link
                    to={`/requests/${r.id}`}
                    className="flex gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs active:bg-surface-hover focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <RequestIcon type={r.type} className="size-9 shrink-0" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-medium text-fg">{tr(r.title)}</span>
                        {r.amount !== undefined ? <span className="shrink-0 font-semibold tabular-nums">{formatMoney(r.amount)}</span> : null}
                      </span>
                      <Text as="span" variant="caption" tone="muted">
                        {r.id} · {tr(typeName(r.type, state.processes))} · {tr(person(r.requesterId).name)}
                      </Text>
                      <span className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-fg-muted">
                          {tr('Your step:')} {tr(r.steps.find((st) => st.status === 'current')?.name ?? '')}
                        </span>
                        <span className={days >= 2 ? 'font-medium text-critical-subtle-fg' : 'text-fg-muted'}>
                          <Time iso={r.createdAt} />
                        </span>
                      </span>
                    </span>
                    <ChevronRight aria-hidden className="size-4 shrink-0 self-center text-fg-subtle" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="hidden md:block">
            <IndexTable<Request>
              caption={tr("Requests waiting on your decision")}
              captionHidden
              resourceName={REQUESTS}
              columns={waitingColumns}
              rows={waiting}
              getRowId={(r) => r.id}
              getRowLabel={(r) => r.title}
              selectedRows={selected}
              onSelectionChange={setSelected}
              promotedBulkActions={[
                {
                  content: tr('Approve'),
                  onAction: (scope) => {
                    const ids = scope.all ? waiting.map((r) => r.id) : scope.ids;
                    // Steps that ask the approver for details (a budget line…) can't be approved blind.
                    const skip = waiting.filter((r) => ids.includes(r.id) && needsDetails(state, r)).map((r) => r.id);
                    const done = ids.filter((x) => !skip.includes(x));
                    done.forEach((requestId) =>
                      dispatch({
                        type: 'decide',
                        requestId,
                        decision: 'approve',
                      }),
                    );
                    setSelected(skip);
                    if (done.length)
                      toast({
                        tone: 'success',
                        title: `Approved ${done.length} ${done.length === 1 ? 'request' : 'requests'}`,
                      });
                    if (skip.length)
                      toast({
                        title: `${skip.length} ${skip.length === 1 ? 'needs' : 'need'} details first`,
                        description: `Open ${skip.join(', ')} to fill in what your step asks for.`,
                      });
                  },
                },
              ]}
              emptyState={
                <EmptyState size="card" heading={tr('All caught up')}>
                  {' '}
                  {tr('Nothing is waiting on your decision. New requests appear here as soon as they reach you.')}{' '}
                </EmptyState>
              }
            />
          </div>
        </TabsContent>
        <TabsContent value="decided" className="pt-4">
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface md:hidden" aria-label={tr('Requests you decided')}>
            {decided.map((x) => (
              <li key={x.r.id}>
                <Link
                  to={`/requests/${x.r.id}`}
                  className="flex items-center gap-3 p-4 active:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-medium text-fg">{tr(x.r.title)}</span>
                    <Text as="span" variant="caption" tone="muted">
                      {x.step ? tr(stepStatus[x.step.status]) : ''} · {x.step?.at ? formatRelative(x.step.at, locale) : ''}
                    </Text>
                  </span>
                  <StatusBadge status={x.r.status} size="sm" />
                </Link>
              </li>
            ))}
            {decided.length === 0 ? (
              <li className="p-4">
                <Text tone="muted">{tr('Requests you decide are listed here.')}</Text>
              </li>
            ) : null}
          </ul>
          <div className="hidden md:block">
            <IndexTable<(typeof decided)[number]>
              caption={tr("Requests you decided")}
              captionHidden
              selectable={false}
              resourceName={REQUESTS}
              columns={decidedColumns}
              rows={decided}
              getRowId={(x) => x.r.id}
              getRowLabel={(x) => x.r.title}
              emptyState={
                <EmptyState size="card" heading={tr('No decisions yet')}>
                  {' '}
                  {tr('Requests you approve, send back or decline are listed here.')}{' '}
                </EmptyState>
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
