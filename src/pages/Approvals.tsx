import { EmptyState, IndexTable, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger, Text, useToast, type DataTableColumn, type Selection } from '@repo/ui';
import { useState } from 'react';
import { Link } from 'react-router';
import { Person } from '../components/Person';
import { RequestIcon } from '../components/RequestIcon';
import { StatusBadge } from '../components/StatusBadge';
import { useStore, waitingOnMe } from '../data/store';
import type { Process, Request } from '../data/types';
import { daysUntil, formatMoney, formatRelative, stepStatus, typeLabel, typeName } from '../lib/format';

const REQUESTS = { singular: 'request', plural: 'requests' };

function titleCell(r: Request, processes: Process[]) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <RequestIcon type={r.type} className="size-8" />
      <span className="flex min-w-0 flex-col">
        <Link to={`/requests/${r.id}`} className="truncate font-medium text-fg hover:underline focus-visible:outline-2 focus-visible:outline-ring">
          {r.title}
        </Link>
        <Text as="span" variant="caption" tone="muted">
          {r.id} · {typeName(r.type, processes)}
        </Text>
      </span>
    </span>
  );
}

export function Approvals() {
  const { state, me, dispatch } = useStore();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Selection>([]);
  const waiting = waitingOnMe(state).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const decided = state.requests
    .map((r) => ({ r, step: r.steps.find((s) => s.approverId === me.id && s.at && s.status !== 'current') }))
    .filter((x) => x.step)
    .sort((a, b) => (b.step?.at ?? '').localeCompare(a.step?.at ?? ''));

  const waitingColumns: DataTableColumn<Request>[] = [
    { id: 'title', header: 'Request', cell: (r) => titleCell(r, state.processes) },
    { id: 'from', header: 'From', cell: (r) => <Person id={r.requesterId} size="xs" /> },
    { id: 'step', header: 'Your step', cell: (r) => r.steps.find((s) => s.status === 'current')?.name },
    { id: 'amount', header: 'Amount', align: 'end', numeric: true, sortable: true, sortValue: (r) => r.amount ?? -1, cell: (r) => formatMoney(r.amount) },
    {
      id: 'age',
      header: 'Waiting',
      sortable: true,
      sortValue: (r) => r.createdAt,
      cell: (r) => {
        const days = -daysUntil(r.createdAt);
        return <span className={days >= 2 ? 'font-medium text-critical-subtle-fg' : 'text-fg-muted'}>{formatRelative(r.createdAt)}</span>;
      },
    },
  ];

  const decidedColumns: DataTableColumn<(typeof decided)[number]>[] = [
    { id: 'title', header: 'Request', cell: (x) => titleCell(x.r, state.processes) },
    { id: 'decision', header: 'Your decision', cell: (x) => (x.step ? stepStatus[x.step.status] : '') },
    { id: 'status', header: 'Now', cell: (x) => <StatusBadge status={x.r.status} size="sm" /> },
    { id: 'when', header: 'When', cell: (x) => <span className="text-fg-muted">{x.step?.at ? formatRelative(x.step.at) : ''}</span> },
  ];

  return (
    <>
      <PageHeader title="Approvals" subtitle="Decide what’s waiting on you. Oldest first." />
      <Tabs defaultValue="waiting">
        <TabsList aria-label="Approvals">
          <TabsTrigger value="waiting" badge={waiting.length || undefined} badgeLabel={`${waiting.length} waiting`}>
            Waiting on you
          </TabsTrigger>
          <TabsTrigger value="decided">Decided by you</TabsTrigger>
        </TabsList>
        <TabsContent value="waiting" className="pt-4">
          <IndexTable<Request>
            caption="Requests waiting on your decision"
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
                content: 'Approve',
                onAction: (scope) => {
                  const ids = scope.all ? waiting.map((r) => r.id) : scope.ids;
                  ids.forEach((requestId) => dispatch({ type: 'decide', requestId, decision: 'approve' }));
                  setSelected([]);
                  toast({ tone: 'success', title: `Approved ${ids.length} ${ids.length === 1 ? 'request' : 'requests'}` });
                },
              },
            ]}
            emptyState={
              <EmptyState size="card" heading="All caught up">
                Nothing is waiting on your decision. New requests appear here as soon as they reach you.
              </EmptyState>
            }
          />
        </TabsContent>
        <TabsContent value="decided" className="pt-4">
          <IndexTable<(typeof decided)[number]>
            caption="Requests you decided"
            captionHidden
            selectable={false}
            resourceName={REQUESTS}
            columns={decidedColumns}
            rows={decided}
            getRowId={(x) => x.r.id}
            getRowLabel={(x) => x.r.title}
            emptyState={
              <EmptyState size="card" heading="No decisions yet">
                Requests you approve, send back or decline are listed here.
              </EmptyState>
            }
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
