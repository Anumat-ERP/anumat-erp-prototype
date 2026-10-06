import { canContributeToApp } from '../lib/appAccess';
import { Badge, Button, Card, EmptyState, Field, PageHeader, SearchField, Select, Text } from '@app/ui';
import { MapPin } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { AvatarGroup } from '../components/Person';
import { useStore } from '../data/store';
import type { Meeting } from '../data/types';
import { formatTime, formatWeekday } from '../lib/format';
import { useLocale } from '../i18n/LocaleProvider';
import '../styles/hr-workspace.css';

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
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const status = ['upcoming', 'past', 'cancelled'].includes(params.get('status') ?? '') ? params.get('status')! : 'all';
  const mine = params.get('mine') === '1';
  const decisions = params.get('decisions') === '1';
  const filter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  const clear = () => setParams({}, { replace: true });
  const filtered = state.meetings.filter(meeting =>
    (!query.trim() || `${meeting.title} ${meeting.location} ${meeting.agenda}`.toLowerCase().includes(query.trim().toLowerCase())) &&
    (!mine || meeting.organizerId === state.meId || meeting.attendeeIds.includes(state.meId)) && (!decisions || meeting.decisions.length > 0));
  const now = Date.now();
  const upcoming = filtered.filter((m) => m.status !== 'cancelled' && new Date(m.start).getTime() + m.durationMin * 60000 > now).sort((a, b) => a.start.localeCompare(b.start));
  const past = filtered.filter((m) => m.status !== 'cancelled' && new Date(m.start).getTime() + m.durationMin * 60000 <= now).sort((a, b) => b.start.localeCompare(a.start));

  return (
    <>
      <PageHeader
        title={tr("Meetings")}
        subtitle={tr("Agendas, decisions and the action items that come out of them.")}
        primaryAction={canContributeToApp(state, 'meetings') ? { content: tr('Schedule a meeting'), onAction: () => navigate('/meetings/new') } : undefined}
      />
      <div className="an-meeting-filters">
        <SearchField label={tr('Search meetings')} labelHidden={false} value={query} onChange={value => filter('q', value)} />
        <Field label={tr('Meeting status')}><Select value={status} onChange={event => filter('status', event.target.value)} options={[
          { value: 'all', label: tr('All meetings') }, { value: 'upcoming', label: tr('Upcoming') }, { value: 'past', label: tr('Past') }, { value: 'cancelled', label: tr('Cancelled') },
        ]} /></Field>
        <Field label={tr('Meeting participants')}><Select value={mine ? '1' : 'all'} onChange={event => filter('mine', event.target.value)} options={[
          { value: 'all', label: tr('Everyone') }, { value: '1', label: tr('Your meetings') },
        ]} /></Field>
      </div>
      {(query || status !== 'all' || mine || decisions) && <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{decisions ? tr('Meetings with recorded decisions') : tr('Filtered meetings')}</p>
        <Button variant="tertiary" onClick={clear}>{tr('Clear filters')}</Button>
      </div>}
      {[
        { id: 'upcoming', title: tr("Upcoming"), list: upcoming },
        { id: 'past', title: tr("Past"), list: past },
        ...(state.meetings.some(m => m.status === 'cancelled') || status === 'cancelled' ? [{ id: 'cancelled', title: tr('Cancelled'), list: filtered.filter(m => m.status === 'cancelled') }] : []),
      ].filter(group => status === 'all' || group.id === status).map(({ title, list }) => (
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
              <EmptyState size="card" headingAs="h3" image={null} heading={tr(query || mine || decisions || status !== 'all' ? 'No matching meetings' : 'No meetings in this section')}>
                {tr(canContributeToApp(state, 'meetings') ? 'Change the filters or schedule a meeting to start planning.' : 'Change the filters or ask your team about upcoming meetings.')}
              </EmptyState>
            )}
          </Card>
        </section>
      ))}
    </>
  );
}
