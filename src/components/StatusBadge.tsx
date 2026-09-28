import { cn } from '@repo/ui';
import type { RequestStatus } from '../data/types';
import { requestStatus } from '../lib/format';

const DOT: Record<string, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-critical',
  info: 'bg-info',
  primary: 'bg-primary',
  neutral: 'bg-fg-subtle',
};

/** Status as a small coloured dot and a word: calm in long lists, still clear at a glance. */
export function StatusBadge({ status, size = 'md' }: { status: RequestStatus; size?: 'sm' | 'md' }) {
  const s = requestStatus[status];
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 font-medium whitespace-nowrap text-fg', size === 'sm' ? 'text-sm' : 'text-md')}>
      <span aria-hidden className={cn('size-2 rounded-full', DOT[s.tone] ?? DOT.neutral)} />
      {s.label}
    </span>
  );
}
