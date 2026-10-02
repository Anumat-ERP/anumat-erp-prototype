import { Badge, Card, PageHeader, Text } from '@app/ui';
import { MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { AvatarGroup } from '../components/Person';
import { useStore } from '../data/store';
import type { Meeting } from '../data/types';
import { formatTime, formatWeekday } from '../lib/format';
import { useLocale } from '../i18n/LocaleProvider';

function MeetingRow({ m }: { m: Meeting }) {
  const { t: tr } = useLocale();
  const d = new Date(m.start);
  return (
    <li>
      <Link
        to={`/meetings/${m.id}`}
        className="flex items-center gap-4 px-4 py-3 hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex w-14 shrink-0 flex-col items-center rounded-md border border-border bg-surface-muted py-1.5">
          <Text as="span" variant="caption" tone="muted">
            {d.toLocaleDateString('en-GB', { month: 'short' })}
          </Text>
          <Text as="span" variant="title" numeric>
            {d.getDate()}
          </Text>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <Text as="span" variant="label" truncate>
            {tr(m.title)}
          </Text>
          <Text as="span" variant="bodySm" tone="muted" className="flex items-center gap-1">
            {formatWeekday(m.start)}, {formatTime(m.start)} · {m.durationMin} {tr("min ·")}{' '}<MapPin aria-hidden className="size-3.5" /> {tr(m.location)}
          </Text>
        </span>
        {m.decisions.length ? (
          <Badge tone="success" size="sm" className="hidden sm:inline-flex">
            {m.decisions.length} {m.decisions.length === 1 ? tr("decision") : tr("decisions")}
          </Badge>
        ) : null}
        <AvatarGroup ids={m.attendeeIds} max={3} />
      </Link>
    </li>
  );
}

export function Meetings() {
  const { t: tr } = useLocale();
  const { state } = useStore();
  const navigate = useNavigate();
  const now = Date.now();
  const upcoming = state.meetings.filter((m) => new Date(m.start).getTime() >= now).sort((a, b) => a.start.localeCompare(b.start));
  const past = state.meetings.filter((m) => new Date(m.start).getTime() < now).sort((a, b) => b.start.localeCompare(a.start));

  return (
    <>
      <PageHeader
        title={tr("Meetings")}
        subtitle={tr("Agendas, decisions and the action items that come out of them.")}
        primaryAction={{ content: tr("Schedule a meeting"), onAction: () => navigate('/meetings/new') }}
      />
      {[
        { title: tr("Upcoming"), list: upcoming },
        { title: tr("Past"), list: past },
      ].map(({ title, list }) => (
        <section key={title} className="flex flex-col gap-3" aria-labelledby={`h-${title}`}>
          <Text as="h2" id={`h-${title}`} variant="subtitle">
            {title}
          </Text>
          <Card flush>
            {list.length ? (
              <ul className="divide-y divide-border">
                {list.map((m) => (
                  <MeetingRow key={m.id} m={m} />
                ))}
              </ul>
            ) : (
              <Text tone="muted" className="p-4">
                {tr("No")}{' '}{title.toLowerCase()} {tr("meetings.")}</Text>
            )}
          </Card>
        </section>
      ))}
    </>
  );
}
