import type { WorkspaceApp } from './moduleEntry';

export const BUSINESS_STARTERS = [
  { id: 'work', title: 'Approvals & tasks', description: 'Organize purchases, expenses, and the work that follows a decision.', app: 'approvals', apps: ['approvals', 'tasks', 'meetings'] },
  { id: 'people', title: 'People & HR', description: 'Start with employee records and leave, then add hiring and development.', app: 'employees', apps: ['employees', 'attendance', 'recruitment'] },
  { id: 'all', title: 'Explore every app', description: 'Browse the complete workspace and choose your own starting point.', app: 'approvals', apps: ['approvals', 'tasks', 'employees', 'reports'] },
] as const satisfies readonly { id: string; title: string; description: string; app: WorkspaceApp; apps: readonly WorkspaceApp[] }[];
export type BusinessStarter = typeof BUSINESS_STARTERS[number]['id'];
export const isBusinessStarter = (value: unknown): value is BusinessStarter => BUSINESS_STARTERS.some(starter => starter.id === value);
export const businessStarter = (value: unknown) => BUSINESS_STARTERS.find(starter => starter.id === value) ?? BUSINESS_STARTERS[0];
