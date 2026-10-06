import { Badge } from '@app/ui';
import { ChevronsUp, ChevronUp, Minus, ChevronDown, ChevronsDown } from 'lucide-react';
import type { TaskPriority } from '../data/types';
import { PRIORITY_LABELS } from '../lib/taskPriority';
import { useLocale } from '../i18n/LocaleProvider';
const ICONS = { highest: ChevronsUp, high: ChevronUp, medium: Minus, low: ChevronDown, lowest: ChevronsDown };
export function TaskPriorityBadge({ priority = 'medium' }: { priority?: TaskPriority }) {
  const { t: tr } = useLocale();
  const Icon = ICONS[priority];
  return <Badge size="sm" tone={priority === 'highest' || priority === 'high' ? 'critical' : priority === 'medium' ? 'warning' : 'neutral'}><Icon size={12} aria-hidden />{tr(PRIORITY_LABELS[priority])}</Badge>;
}
