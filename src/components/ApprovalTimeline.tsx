import { Text, cn } from '@repo/ui';
import { Circle, CircleCheck, CircleX, Clock, Undo2 } from 'lucide-react';
import { formatAnswer, questionsOf, visibleFields } from '../lib/forms';
import { useStore } from '../data/store';
import type { ApprovalStep } from '../data/types';
import { formatDateTime, stepStatus } from '../lib/format';
import { Changed } from '../lib/motion';

const ICON = {
  done: { Icon: CircleCheck, className: 'text-success' },
  current: { Icon: Clock, className: 'text-warning-subtle-fg' },
  waiting: { Icon: Circle, className: 'text-fg-subtle' },
  returned: { Icon: Undo2, className: 'text-critical' },
  declined: { Icon: CircleX, className: 'text-critical' },
} as const;

/** The approval route of a request, top to bottom, with who decided what. */
export function ApprovalTimeline({ steps }: { steps: ApprovalStep[] }) {
  const { person, me } = useStore();
  if (steps.length === 0) {
    return (
      <Text tone="muted" variant="bodySm">
        The route is set when the request is submitted.
      </Text>
    );
  }
  return (
    <ol className="flex flex-col">
      {steps.map((step, i) => {
        const { Icon, className } = ICON[step.status];
        const approver = person(step.approverId);
        const last = i === steps.length - 1;
        return (
          <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!last ? <span aria-hidden className="absolute start-[0.5625rem] top-6 bottom-1 w-px bg-border" /> : null}
            <Icon aria-hidden className={cn('relative mt-0.5 size-5 shrink-0', className)} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <Text as="span" variant="label">
                {step.name}
              </Text>
              <Changed value={step.status} className="-mx-1 px-1">
                <Text as="span" variant="bodySm" tone="muted">
                  {approver.id === me.id ? 'You' : approver.name} · {stepStatus[step.status]}
                  {step.at ? ` · ${formatDateTime(step.at)}` : ''}
                </Text>
              </Changed>
              {step.answers && step.fields ? (
                <dl className="mt-1 flex flex-col gap-1 rounded-md border border-border-subtle px-3 py-2 text-sm">
                  {questionsOf(visibleFields(step.fields, step.answers)).map((f) => (
                    <div key={f.id} className="flex flex-wrap gap-x-2">
                      <dt className="text-fg-muted">{f.label}:</dt>
                      <dd className="font-medium text-fg">{formatAnswer(f, step.answers?.[f.id], (id) => person(id).name)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {step.comment ? (
                <p className="mt-1 rounded-md bg-surface-sunken px-3 py-2 text-sm text-fg">“{step.comment}”</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
