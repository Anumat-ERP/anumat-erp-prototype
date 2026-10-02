import { Card, PageHeader, Text } from '@app/ui';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { DecisionTimeCard } from '../components/home/DecisionTimeCard';
import { FlowStrip } from '../components/home/FlowStrip';
import { RequestsChart } from '../components/home/RequestsChart';
import { WaitingList } from '../components/home/WaitingList';
import { homeCounts } from '../components/home/counts';
import { AppLink } from '../components/links';
import { Time } from '../components/Time';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** The dashboard: the Ask → Approve → Execute → Track loop first, then what needs you, then the trend. */
export function Home() {
  const { t: tr } = useLocale();
  const { state, me, person } = useStore();
  const navigate = useNavigate();
  const activity = state.requests
    .flatMap((r) => r.activity.map((a) => ({ ...a, request: r })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title={`${tr(greeting())}, ${me.name.split(' ')[0]}`}
        subtitle={tr("Here's what's happening in your workspace.")}
        primaryAction={{ content: tr('New request'), icon: <Plus />, onAction: () => navigate('/requests/new') }}
      />
      <FlowStrip counts={homeCounts(state)} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <WaitingList />
        </div>
        <DecisionTimeCard />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <RequestsChart />
        </div>
        <Card flush>
          <h2 className="border-b border-border px-5 py-4 text-md font-semibold sm:px-6">{tr('Recent activity')}</h2>
          {activity.length ? (
            <ol className="flex flex-col">
              {activity.map((a) => (
                <li key={`${a.request.id}-${a.id}`} className="flex gap-3 px-5 py-3 sm:px-6">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 text-sm leading-relaxed">
                    <span className="font-medium">{a.personId === me.id ? tr('You') : person(a.personId).name}</span>{' '}
                    {a.kind === 'comment' ? tr('commented on') : `${tr(a.text)} ·`}{' '}
                    <AppLink to={`/requests/${a.request.id}`}>{tr(a.request.title)}</AppLink>
                    <Text variant="caption" as="p" tone="subtle" className="mt-0.5">
                      <Time iso={a.at} />
                    </Text>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">{tr('No recent activity.')}</p>
          )}
        </Card>
      </div>
      <AppLink to="/processes" className="self-start text-sm">{tr('Manage approval processes')}</AppLink>
    </>
  );
}
