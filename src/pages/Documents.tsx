import { ButtonBase } from '@mui/material';
import { Badge, Drawer, EmptyState, IndexTable, PageHeader, Text, type DataTableColumn } from '@app/ui';
import { File, FileSpreadsheet, FileText } from 'lucide-react';
import { useState } from 'react';
import { CheckGroup } from '../components/CheckGroup';
import { AppLink } from '../components/links';
import { Person } from '../components/Person';
import { useStore } from '../data/store';
import type { Doc, DocumentStatus } from '../data/types';
import { docStatus, formatBytesShort, formatDateTime, formatRelative } from '../lib/format';
import { useLocale } from '../i18n/LocaleProvider';

const KIND_ICON = { pdf: FileText, sheet: FileSpreadsheet, doc: File };
const STATUS_OPTIONS = (Object.keys(docStatus) as DocumentStatus[]).map((s) => ({ value: s, label: docStatus[s].label }));

export function Documents() {
  const { t: tr } = useLocale();
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const [statuses, setStatuses] = useState<DocumentStatus[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = state.documents.find((d) => d.id === openId);

  const q = query.trim().toLowerCase();
  const rows = state.documents
    .filter((d) => statuses.length === 0 || statuses.includes(d.status))
    .filter((d) => !q || d.name.toLowerCase().includes(q) || d.linkedTo?.label.toLowerCase().includes(q));

  const columns: DataTableColumn<Doc>[] = [
    {
      id: 'name',
      header: tr("Name"),
      sortable: true,
      sortValue: (d) => d.name,
      cell: (d) => {
        const Icon = KIND_ICON[d.kind];
        return (
          <ButtonBase
            type="button"
            onClick={() => setOpenId(d.id)}
            className="flex min-w-0 items-center gap-2 rounded-sm text-start font-medium text-fg hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Icon aria-hidden className="size-4 shrink-0 text-fg-subtle" />
            <span className="truncate">{tr(d.name)}</span>
          </ButtonBase>
        );
      },
    },
    { id: 'linked', header: tr("Linked to"), cell: (d) => (d.linkedTo ? <AppLink to={d.linkedTo.href}>{tr(d.linkedTo.label)}</AppLink> : <span className="text-fg-subtle">—</span>) },
    { id: 'version', header: tr("Version"), cell: (d) => <span className="font-mono text-sm">{d.versions[0]?.version}</span> },
    { id: 'status', header: tr("Status"), cell: (d) => <Badge size="sm" tone={docStatus[d.status].tone}>{tr(docStatus[d.status].label)}</Badge> },
    { id: 'owner', header: tr("Owner"), cell: (d) => <Person id={d.ownerId} size="xs" /> },
    {
      id: 'updated',
      header: tr("Updated"),
      sortable: true,
      sortValue: (d) => d.versions[0]?.at ?? '',
      cell: (d) => <span className="text-fg-muted">{d.versions[0] ? formatRelative(d.versions[0].at) : ''}</span>,
    },
  ];

  return (
    <>
      <PageHeader title={tr("Documents")} subtitle={tr("Proposals, contracts and policies, each linked to the decision it supports.")} />
      <IndexTable<Doc>
        caption={tr("Documents")}
        captionHidden
        selectable={false}
        resourceName={{ singular: tr("document"), plural: tr("documents") }}
        columns={columns}
        rows={rows}
        getRowLabel={(d) => d.name}
        defaultSort={{ columnId: 'updated', direction: 'descending' }}
        filters={{
          queryValue: query,
          onQueryChange: setQuery,
          onQueryClear: () => setQuery(''),
          queryPlaceholder: tr("Search documents"),
          queryLabel: tr("Search documents"),
          onClearAll: () => {
            setQuery('');
            setStatuses([]);
          },
          filters: [{ key: 'status', label: tr("Status"), pinned: true, filter: <CheckGroup legend={tr("Status")} options={STATUS_OPTIONS.map((option) => ({ ...option, label: tr(option.label) }))} value={statuses} onChange={setStatuses} /> }],
          appliedFilters: statuses.length
            ? [{ key: 'status', label: tr("Status: {value0}", { value0: statuses.map((s) => tr(docStatus[s].label)).join(', ') }), onRemove: () => setStatuses([]) }]
            : [],
        }}
        emptyState={
          <EmptyState size="card" heading={tr("No documents match")}>
            {tr("Try another search or clear the status filter.")}</EmptyState>
        }
      />
      <Drawer
        open={open !== undefined}
        onOpenChange={(o) => (o ? undefined : setOpenId(null))}
        title={open?.name ?? ''}
        description={open ? `${formatBytesShort(open.size)} · ${tr(docStatus[open.status].label)}` : undefined}
        size="md"
      >
        {open ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <Text variant="caption" tone="muted">
                {tr("Owner")}</Text>
              <Person id={open.ownerId} showRole />
            </div>
            {open.linkedTo ? (
              <div className="flex flex-col gap-1">
                <Text variant="caption" tone="muted">
                  {tr("Linked to")}</Text>
                <AppLink to={open.linkedTo.href}>{tr(open.linkedTo.label)}</AppLink>
              </div>
            ) : null}
            <div className="flex flex-col gap-3">
              <Text variant="subtitle" as="h3">
                {tr("Version history")}</Text>
              <ol className="flex flex-col gap-3">
                {open.versions.map((v, i) => (
                  <li key={v.version} className="flex gap-3 rounded-md border border-border p-3">
                    <span className="font-mono text-sm font-semibold">{v.version}</span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span>{v.note}</span>
                      <Text as="span" variant="bodySm" tone="muted">
                        {v.authorId ? `${state.people.find((p) => p.id === v.authorId)?.name} · ` : ''}
                        {formatDateTime(v.at)}
                      </Text>
                    </span>
                    {i === 0 ? (
                      <Badge size="sm" tone="primary">
                        {tr("Current")}</Badge>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
