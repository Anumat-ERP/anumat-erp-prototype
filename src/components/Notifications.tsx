import { IconButton, Popover, PopoverContent, PopoverTrigger, Text } from '@app/ui';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { notificationsFor, useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { Person } from './Person';
import { Time } from './Time';

/** Bell in the top bar: what others did on requests and meetings you are part of. */
export function Notifications() {
  const { t: tr } = useLocale();
  const { state, person, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const items = notificationsFor(state).filter((item) => item.href.startsWith('/requests'));
  const seen = state.lastSeen[state.meId] ?? '';
  const unread = items.filter((n) => n.at > seen).length;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Mark as read when the list closes, so unread items stay highlighted while open.
        if (!next && unread) dispatch({ type: 'markSeen' });
      }}
    >
      <PopoverTrigger asChild>
        <span className="relative inline-flex">
          <IconButton icon={<Bell />} label={unread ? `Notifications, ${unread} unread` : tr('Notifications')} />
          {unread ? (
            <span
              aria-hidden
              className="pointer-events-none absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-fg tabular-nums"
            >
              {unread}
            </span>
          ) : null}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" flush className="w-96">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Text as="h2" variant="label">
            {' '}
            {tr('Notifications')}{' '}
          </Text>
          <span className="flex items-center gap-3">
            <Text as="span" variant="caption" tone="muted">
              {unread ? `${unread} new` : tr('All read')}
            </Text>
            <Link to="/settings/notifications" onClick={() => setOpen(false)} className="text-sm text-fg-link underline underline-offset-2">
              {' '}
              {tr('Settings')}{' '}
            </Link>
          </span>
        </div>
        {items.length ? (
          <ul className="max-h-96 divide-y divide-border overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  to={n.href}
                  onClick={() => setOpen(false)}
                  className="flex gap-3 px-4 py-3 hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  <span aria-hidden className={n.at > seen ? 'mt-2 size-2 shrink-0 rounded-full bg-primary' : 'mt-2 size-2 shrink-0'} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-md">
                      <span className="font-medium">{person(n.personId).name}</span> {n.text}
                    </span>
                    <Text as="span" variant="caption" tone="subtle">
                      <Time iso={n.at} />
                      {n.at > seen ? <span className="sr-only"> (unread)</span> : null}
                    </Text>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 px-4 py-6">
            <Person id={state.meId} size="xs" />
            <Text tone="muted">{tr('Nothing new.')}</Text>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
