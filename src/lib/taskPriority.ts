import type { TaskPriority } from '../data/types';
export const TASK_PRIORITIES: TaskPriority[] = ['highest', 'high', 'medium', 'low', 'lowest'];
export const PRIORITY_LABELS: Record<TaskPriority, string> = { highest: 'Highest', high: 'High', medium: 'Medium', low: 'Low', lowest: 'Lowest' };
export const priorityRank = (priority?: TaskPriority) => TASK_PRIORITIES.indexOf(priority ?? 'medium');
