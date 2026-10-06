import { Card, FigureValue, ProgressBar } from '@app/ui';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { AppLink } from '../links';
import { useStore } from '../../data/store';
import { useLocale } from '../../i18n/LocaleProvider';
import { averageDecisionDays } from './counts';

const GOAL_DAYS = 2;

/** Average time to a decision against the two-day goal, and the person's own requests by stage. */
export function DecisionTimeCard({ section = 'all' }: { section?: 'all' | 'requests' | 'timing' }) {
  const { t: tr } = useLocale();
  const { state, me } = useStore();
  const average = averageDecisionDays(state);
  const onTrack = average !== null && average <= GOAL_DAYS;
  const mine = state.requests.filter((r) => r.requesterId === me.id);
  const stages = [
    { status: 'pending', label: 'In review' },
    { status: 'changes', label: 'Changes requested' },
    { status: 'draft', label: 'To do' },
  ] as const;
  return (
    <Card flush className="flex flex-col">
      {section !== 'requests' && <section aria-labelledby="decision-time" className="flex flex-col gap-3 px-5 py-4 sm:px-6">
        <h2 id="decision-time" className="text-sm font-medium text-muted-foreground">{tr('Average decision time')}</h2>
        <FigureValue value={average === null ? '—' : average.toFixed(1)} unit={average === null ? undefined : tr('days')} />
        <ProgressBar
          label={tr('Against the {count}-day goal', { count: GOAL_DAYS })}
          labelHidden
          value={average === null ? 0 : Math.min(average, GOAL_DAYS * 1.5)}
          max={GOAL_DAYS * 1.5}
          tone={onTrack ? 'success' : 'warning'}
          size="sm"
        />
        <p className="text-xs text-muted-foreground">
          {average === null
            ? tr('No decisions yet.')
            : onTrack
            ? tr('Within the {count}-day goal.', { count: GOAL_DAYS })
            : tr('Slower than the {count}-day goal.', { count: GOAL_DAYS })}
        </p>
      </section>}
      {section !== 'timing' && <section aria-labelledby="your-requests" className={section === 'all' ? 'border-t border-border' : undefined}>
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-1 sm:px-6">
          <h2 id="your-requests" className="text-sm font-medium text-muted-foreground">{tr('Your requests')}</h2>
          <AppLink to="/requests?mine=1" className="text-sm">{tr('View all')}</AppLink>
        </div>
        <ul>
          {stages.map(({ status, label }) => (
            <li key={status}>
              <Link
                to={`/requests?mine=1&status=${status}`}
                className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-6"
              >
                <span>{tr(label)}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="tabular-nums">{mine.filter((r) => r.status === status).length}</span>
                  <ChevronRight aria-hidden className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>}
    </Card>
  );
}
