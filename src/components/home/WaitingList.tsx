import { Card, EmptyState, Text } from '@app/ui';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { AppLink } from '../links';
import { RequestIcon } from '../RequestIcon';
import { StatusBadge } from '../StatusBadge';
import { Time } from '../Time';
import { useStore, waitingOnMe } from '../../data/store';
import { useLocale } from '../../i18n/LocaleProvider';
import { formatMoney, typeName } from '../../lib/format';

/** Requests whose current step is yours, oldest first so nothing sits for days. */
export function WaitingList() {
  const { t: tr } = useLocale();
  const { state, person } = useStore();
  const waiting = [...waitingOnMe(state)].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <Card flush className="flex flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <h2 className="text-md font-semibold">{tr('Waiting on you')}</h2>
          {waiting.length ? (
            <span className="rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground tabular-nums">{waiting.length}</span>
          ) : null}
        </div>
        <AppLink to="/approvals" className="inline-flex items-center gap-1 text-sm">
          {tr('View all')}
          <ChevronRight aria-hidden className="size-4" />
        </AppLink>
      </div>
      {waiting.length ? (
        <ul className="divide-y divide-border">
          {waiting.map((r) => (
            <li key={r.id}>
              <Link
                to={`/requests/${r.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-6"
              >
                <RequestIcon type={r.type} className="size-9 rounded-lg [&_svg]:size-4" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <Text as="span" variant="label" className="truncate text-sm">{tr(r.title)}</Text>
                  <Text as="span" variant="caption" tone="muted" className="truncate">
                    {tr(person(r.requesterId).name)} · {tr(typeName(r.type, state.processes))} · <Time iso={r.createdAt} />
                  </Text>
                </span>
                <span className="hidden sm:block"><StatusBadge status={r.status} size="sm" /></span>
                {r.amount !== undefined ? (
                  <Text as="span" variant="label" numeric className="w-24 shrink-0 text-end text-sm">{formatMoney(r.amount)}</Text>
                ) : (
                  <span className="hidden w-24 shrink-0 sm:block" />
                )}
                <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState size="card" headingAs="h3" heading={tr('All caught up')}>
          {tr('Nothing is waiting on your decision right now.')}
        </EmptyState>
      )}
    </Card>
  );
}
