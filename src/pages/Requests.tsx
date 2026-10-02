import { Button, EmptyState, IndexTable, PageHeader, Tabs, TabsList, TabsTrigger, Text, type DataTableColumn } from '@app/ui';
import { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { CheckGroup } from '../components/CheckGroup';
import { Person } from '../components/Person';
import { RequestIcon } from '../components/RequestIcon';
import { StatusBadge } from '../components/StatusBadge';
import { Time } from '../components/Time';
import { useStore } from '../data/store';
import type { Request, RequestStatus, RequestType } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import { formatMoney, requestStatus, typeName } from '../lib/format';

const STATUS_OPTIONS = (Object.keys(requestStatus) as RequestStatus[]).map((s) => ({ value: s, label: requestStatus[s].label }));

export function Requests() {
  const { t: tr } = useLocale();
  const { state, me } = useStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const pendingParams = useRef(params);
  useEffect(() => { pendingParams.current = params; }, [params]);
  const scope = params.get('mine') === '1' ? 'mine' : 'all';
  const TYPE_OPTIONS = state.processes.map((p) => ({
    value: p.requestType,
    label: tr(typeName(p.requestType, state.processes)),
  }));
  const query = params.get('q') ?? '';
  const statuses = (params.get('status')?.split(',').filter(Boolean) ?? []) as RequestStatus[];
  const types = (params.get('type')?.split(',').filter(Boolean) ?? []) as RequestType[];

  // Keep quick successive actions (clear filters, then switch view) on the same URL state.
  const replaceParams = (next: URLSearchParams) => {
    pendingParams.current = next;
    setParams(next, { replace: true });
  };
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(pendingParams.current);
    if (value) next.set(key, value);
    else next.delete(key);
    replaceParams(next);
  };

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
  const clearAll = () => replaceParams(new URLSearchParams(pendingParams.current.get('mine') === '1' ? { mine: '1' } : {}));

  const columns: DataTableColumn<Request>[] = [
    {
      id: 'title',
      header: tr('Request'),
      sortable: true,
      sortValue: (r) => r.title,
      cell: (r) => (
        // On phones the title wraps and the status sits under it, since the other columns are hidden.
        <span className="flex min-w-0 items-center gap-3 whitespace-normal md:whitespace-nowrap">
          <RequestIcon type={r.type} className="size-8 shrink-0" />
          <span className="flex min-w-0 flex-col items-start">
            <Link to={`/requests/${r.id}`} className="font-medium text-fg hover:underline focus-visible:outline-2 focus-visible:outline-ring md:truncate">
              {tr(r.title)}
            </Link>
            <Text as="span" variant="caption" tone="muted">
              {r.id} · {tr(typeName(r.type, state.processes))}
            </Text>
            <span className="mt-1 md:hidden">
              <StatusBadge status={r.status} size="sm" />
            </span>
          </span>
        </span>
      ),
    },
    {
      id: 'requester',
      header: tr('Requested by'),
      hideBelow: 'md',
      cell: (r) => <Person id={r.requesterId} size="xs" />,
    },
    {
      id: 'amount',
      header: tr('Amount'),
      hideBelow: 'md',
      align: 'end',
      numeric: true,
      sortable: true,
      sortValue: (r) => r.amount ?? -1,
      cell: (r) => formatMoney(r.amount),
    },
    {
      id: 'status',
      header: tr('Status'),
      hideBelow: 'md',
      sortable: true,
      sortValue: (r) => r.status,
      cell: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      id: 'updated',
      header: tr("Updated"),
      hideBelow: 'md',
      sortable: true,
      sortValue: (r) => r.updatedAt,
      cell: (r) => (
        <span className="text-fg-muted">
          <Time iso={r.updatedAt} />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={tr('Requests')}
        subtitle={tr('Everything people have asked for, and where each one stands.')}
        primaryAction={{
          content: tr('New request'),
          onAction: () => navigate('/requests/new'),
        }}
      />
      <Tabs value={scope} onValueChange={(v) => set('mine', v === 'mine' ? '1' : '')}>
        <TabsList aria-label={tr('Whose requests')}>
          <TabsTrigger value="all">{tr('All requests')}</TabsTrigger>
          <TabsTrigger value="mine">{tr('Submitted by you')}</TabsTrigger>
        </TabsList>
      </Tabs>
      <IndexTable<Request>
        caption={tr("Requests")}
        captionHidden
        selectable={false}
        resourceName={{ singular: tr("request"), plural: tr("requests") }}
        columns={columns}
        rows={rows}
        getRowLabel={(r) => r.title}
        defaultSort={{ columnId: 'updated', direction: 'descending' }}
        filters={{
          queryValue: query,
          onQueryChange: (v) => set('q', v),
          onQueryClear: () => set('q', ''),
          queryPlaceholder: tr("Search by title or ID"),
          queryLabel: tr("Search requests"),
          onClearAll: clearAll,
          filters: [
            {
              key: 'status',
              label: tr('Status'),
              pinned: true,
              filter: <CheckGroup legend={tr("Status")} options={STATUS_OPTIONS} value={statuses} onChange={(v) => set('status', v.join(','))} />,
            },
            {
              key: 'type',
              label: tr('Type'),
              pinned: true,
              filter: <CheckGroup legend={tr("Type")} options={TYPE_OPTIONS} value={types} onChange={(v) => set('type', v.join(','))} />,
            },
          ],
          appliedFilters: [
            ...(statuses.length
              ? [
                  {
                    key: 'status',
                    label: tr("Status: {value0}", { value0: statuses.map((s) => requestStatus[s].label).join(', ') }),
                    onRemove: () => set('status', ''),
                  },
                ]
              : []),
            ...(types.length
              ? [
                  {
                    key: 'type',
                    label: tr("Type: {value0}", { value0: types.map((t) => tr(typeName(t, state.processes))).join(', ') }),
                    onRemove: () => set('type', ''),
                  },
                ]
              : []),
          ],
        }}
        emptyState={
          filtered ? (
            <EmptyState size="card" heading={tr('No requests match these filters')} action={<Button onClick={clearAll}>{tr('Clear filters')}</Button>}>
              {' '}
              {tr('Try a different search, or clear the filters to see every request.')}{' '}
            </EmptyState>
          ) : (
            <EmptyState
              size="card"
              heading={tr('Create your first request')}
              action={
                <Button variant="primary" onClick={() => navigate('/requests/new')}>
                  {' '}
                  {tr('New request')}{' '}
                </Button>
              }
            >
              {tr("Purchases, leave, expenses and contracts all start here.")}</EmptyState>
          )
        }
      />
    </>
  );
}
