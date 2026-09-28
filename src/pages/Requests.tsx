import { Button, EmptyState, IndexTable, PageHeader, Tabs, TabsList, TabsTrigger, Text, type DataTableColumn } from '@repo/ui';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { CheckGroup } from '../components/CheckGroup';
import { Person } from '../components/Person';
import { RequestIcon } from '../components/RequestIcon';
import { StatusBadge } from '../components/StatusBadge';
import { useStore } from '../data/store';
import type { Request, RequestStatus, RequestType } from '../data/types';
import { formatMoney, formatRelative, requestStatus, typeLabel, typeName } from '../lib/format';
import { Time } from '../components/Time';

const STATUS_OPTIONS = (Object.keys(requestStatus) as RequestStatus[]).map((s) => ({ value: s, label: requestStatus[s].label }));

export function Requests() {
  const { state, me } = useStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const TYPE_OPTIONS = state.processes.map((p) => ({ value: p.requestType, label: typeName(p.requestType, state.processes) }));
  const query = params.get('q') ?? '';
  const statuses = (params.get('status')?.split(',').filter(Boolean) ?? []) as RequestStatus[];
  const types = (params.get('type')?.split(',').filter(Boolean) ?? []) as RequestType[];

  const set = (key: string, value: string) =>
    setParams(
      (p) => {
        if (value) p.set(key, value);
        else p.delete(key);
        return p;
      },
      { replace: true },
    );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.requests
      .filter((r) => scope === 'all' || r.requesterId === me.id)
      .filter((r) => statuses.length === 0 || statuses.includes(r.status))
      .filter((r) => types.length === 0 || types.includes(r.type))
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [state.requests, scope, me.id, statuses, types, query]);

  const filtered = Boolean(query || statuses.length || types.length);
  const clearAll = () => setParams({}, { replace: true });

  const columns: DataTableColumn<Request>[] = [
    {
      id: 'title',
      header: 'Request',
      sortable: true,
      sortValue: (r) => r.title,
      cell: (r) => (
        <span className="flex min-w-0 items-center gap-3">
          <RequestIcon type={r.type} className="size-8" />
          <span className="flex min-w-0 flex-col">
            <Link
              to={`/requests/${r.id}`}
              className="truncate font-medium text-fg hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              {r.title}
            </Link>
            <Text as="span" variant="caption" tone="muted">
              {r.id} · {typeName(r.type, state.processes)}
            </Text>
          </span>
        </span>
      ),
    },
    { id: 'requester', header: 'Requested by', cell: (r) => <Person id={r.requesterId} size="xs" /> },
    {
      id: 'amount',
      header: 'Amount',
      align: 'end',
      numeric: true,
      sortable: true,
      sortValue: (r) => r.amount ?? -1,
      cell: (r) => formatMoney(r.amount),
    },
    { id: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, cell: (r) => <StatusBadge status={r.status} size="sm" /> },
    {
      id: 'updated',
      header: 'Updated',
      sortable: true,
      sortValue: (r) => r.updatedAt,
      cell: (r) => <span className="text-fg-muted"><Time iso={r.updatedAt} /></span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Requests"
        subtitle="Everything people have asked for, and where each one stands."
        primaryAction={{ content: 'New request', onAction: () => navigate('/requests/new') }}
      />
      <Tabs value={scope} onValueChange={(v) => setScope(v as 'all' | 'mine')}>
        <TabsList aria-label="Whose requests">
          <TabsTrigger value="all">All requests</TabsTrigger>
          <TabsTrigger value="mine">Submitted by you</TabsTrigger>
        </TabsList>
      </Tabs>
      <IndexTable<Request>
        caption="Requests"
        captionHidden
        selectable={false}
        resourceName={{ singular: 'request', plural: 'requests' }}
        columns={columns}
        rows={rows}
        getRowLabel={(r) => r.title}
        defaultSort={{ columnId: 'updated', direction: 'descending' }}
        filters={{
          queryValue: query,
          onQueryChange: (v) => set('q', v),
          onQueryClear: () => set('q', ''),
          queryPlaceholder: 'Search by title or ID',
          queryLabel: 'Search requests',
          onClearAll: clearAll,
          filters: [
            {
              key: 'status',
              label: 'Status',
              pinned: true,
              filter: <CheckGroup legend="Status" options={STATUS_OPTIONS} value={statuses} onChange={(v) => set('status', v.join(','))} />,
            },
            {
              key: 'type',
              label: 'Type',
              pinned: true,
              filter: <CheckGroup legend="Type" options={TYPE_OPTIONS} value={types} onChange={(v) => set('type', v.join(','))} />,
            },
          ],
          appliedFilters: [
            ...(statuses.length
              ? [{ key: 'status', label: `Status: ${statuses.map((s) => requestStatus[s].label).join(', ')}`, onRemove: () => set('status', '') }]
              : []),
            ...(types.length ? [{ key: 'type', label: `Type: ${types.map((t) => typeName(t, state.processes)).join(', ')}`, onRemove: () => set('type', '') }] : []),
          ],
        }}
        emptyState={
          filtered ? (
            <EmptyState size="card" heading="No requests match these filters" action={<Button onClick={clearAll}>Clear filters</Button>}>
              Try a different search, or clear the filters to see every request.
            </EmptyState>
          ) : (
            <EmptyState
              size="card"
              heading="Create your first request"
              action={
                <Button variant="primary" onClick={() => navigate('/requests/new')}>
                  New request
                </Button>
              }
            >
              Purchases, leave, expenses and contracts all start here.
            </EmptyState>
          )
        }
      />
    </>
  );
}
