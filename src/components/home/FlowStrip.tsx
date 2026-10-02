import { FigureValue, cn } from '@app/ui';
import { ChevronRight, CircleCheckBig, FilePen, Hammer, Inbox, type LucideIcon } from 'lucide-react';
import { Fragment } from 'react';
import { Link } from 'react-router';
import { useLocale } from '../../i18n/LocaleProvider';

interface Step {
  key: 'ask' | 'approve' | 'execute' | 'track';
  label: string;
  caption: string;
  href: string;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  { key: 'ask', label: 'Ask', caption: 'Your drafts', href: '/requests?mine=1&status=draft', icon: FilePen },
  { key: 'approve', label: 'Approve', caption: 'Waiting on you', href: '/approvals', icon: Inbox },
  { key: 'execute', label: 'Execute', caption: 'Your open tasks', href: '/tasks', icon: Hammer },
  { key: 'track', label: 'Track', caption: 'Approved in 30 days', href: '/insights', icon: CircleCheckBig },
];

/**
 * Anumat's loop — Ask → Approve → Execute → Track — with today's numbers.
 * The step that needs you (Approve, when anything waits) is emphasised.
 */
export function FlowStrip({ counts }: { counts: Record<Step['key'], number> }) {
  const { t: tr } = useLocale();
  return (
    <ol
      aria-label={tr('Ask, approve, execute, track')}
      className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch lg:gap-2"
    >
      {STEPS.map((step, i) => {
        const urgent = step.key === 'approve' && counts.approve > 0;
        const Icon = step.icon;
        return (
          <Fragment key={step.key}>
            {i > 0 ? (
              <li aria-hidden role="presentation" className="hidden items-center text-muted-foreground lg:flex">
                <ChevronRight className="size-4" />
              </li>
            ) : null}
            <li className="min-w-0">
              <Link
                to={step.href}
                aria-label={`${tr(step.label)}: ${counts[step.key]} ${tr(step.caption).toLowerCase()}`}
                className={cn(
                  'group flex h-full min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 shadow-card transition-colors duration-(--a-duration-fast)',
                  'hover:border-input focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  urgent ? 'border-primary ring-1 ring-primary' : 'border-border',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">{tr(step.label)}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-7 items-center justify-center rounded-md [&_svg]:size-4',
                      step.key === 'track' ? 'bg-mint-subtle text-mint-subtle-foreground' : urgent ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground',
                    )}
                  >
                    <Icon />
                  </span>
                </span>
                <span className="flex flex-col gap-0.5">
                  <FigureValue value={counts[step.key]} />
                  <span className="text-sm text-muted-foreground">{tr(step.caption)}</span>
                </span>
              </Link>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
