import { TASK_PRIORITIES } from './taskPriority';
import type { DataState, Task, TaskDefaults, WorkItemType } from '../data/types';

export const TASK_DEFAULTS: TaskDefaults = {
  readiness: ['Scope and expected outcome are clear', 'Dependencies are identified', 'Owner and estimate are agreed'],
  completion: ['Work has been reviewed', 'Supporting evidence is recorded'],
};
export const WORK_TYPES: WorkItemType[] = ['epic', 'story', 'task', 'bug', 'subtask'];
export const WORK_TYPE_LABELS: Record<WorkItemType, string> = { epic: 'Epic', story: 'Story', task: 'Task', bug: 'Bug', subtask: 'Subtask' };
export function parentCandidates(state: DataState, task: Task) {
  const type = task.workType ?? 'task';
  return state.tasks.filter((candidate) => candidate.id !== task.id && (type === 'subtask' ? ['story', 'task', 'bug'].includes(candidate.workType ?? 'task') : type !== 'epic' && candidate.workType === 'epic'));
}
export function taskStructureProblem(state: DataState, task: Task): string | undefined {
  if (task.priority && !TASK_PRIORITIES.includes(task.priority)) return 'Choose a valid priority.';
  if (!WORK_TYPES.includes(task.workType ?? 'task')) return 'Choose a valid work item type.';
  if (task.workType === 'subtask' && !task.parentId) return 'A subtask needs a parent story, task, or bug.';
  if (task.parentId && !parentCandidates(state, task).some((item) => item.id === task.parentId)) return 'Choose a parent that matches this work item type.';
  const parent = state.tasks.find((item) => item.id === task.parentId);
  if (parent && state.taskStatuses.some((status) => status.id === parent.status && status.category === 'done') && !state.taskStatuses.some((status) => status.id === task.status && status.category === 'done')) return 'Reopen the parent before adding unfinished work.';
  if (state.tasks.some((item) => item.parentId === task.id && !parentCandidates({ ...state, tasks: state.tasks.map((old) => old.id === task.id ? task : old) }, item).some((parent) => parent.id === task.id))) return 'Move child items to another parent before changing this type.';
}
export function requirementProblem(task: Task, gate: 'ready' | 'done'): string | undefined {
  if (!task.expectedOutcome?.trim()) return 'Describe the expected outcome before moving this task.';
  if (!task.acceptanceCriteria?.length) return 'Add acceptance criteria before moving this task.';
  if ([...(task.acceptanceCriteria ?? []), ...(task.readiness ?? []), ...(task.completion ?? [])].some((check) => !check.text.trim())) return 'Give every requirement a description, or remove it.';
  if (gate === 'ready') {
    if (!task.readiness?.length) return 'Add ready-to-start requirements first.';
    if (task.readiness?.some((check) => !check.done)) return 'Complete the ready-to-start checklist first.';
  } else {
    if (!task.completion?.length) return 'Add completion requirements first.';
    if (task.acceptanceCriteria.some((check) => !check.done)) return 'Verify every acceptance criterion first.';
    if (task.completion?.some((check) => !check.done)) return 'Complete the completion requirements first.';
    if (!task.evidence?.trim()) return 'Record completion evidence before marking this task done.';
  }
}
