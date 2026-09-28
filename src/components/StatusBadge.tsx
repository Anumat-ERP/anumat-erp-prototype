import { Badge } from '@repo/ui';
import type { RequestStatus } from '../data/types';
import { requestStatus } from '../lib/format';

export function StatusBadge({ status, size }: { status: RequestStatus; size?: 'sm' | 'md' }) {
  const s = requestStatus[status];
  return (
    <Badge tone={s.tone} size={size} dot>
      {s.label}
    </Badge>
  );
}
