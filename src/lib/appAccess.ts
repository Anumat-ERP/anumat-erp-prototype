import type { AppRole, DataState, PersonId, Task } from '../data/types';
import type { WorkspaceApp } from './moduleEntry';
export const APP_NAMES: Record<WorkspaceApp, string> = { approvals: 'Requests & approvals', tasks: 'Task management', meetings: 'Meeting management', surveys: 'Surveys & evaluations', employees: 'Employee management', recruitment: 'Recruitment management', attendance: 'Attendance management', payroll: 'Payroll management', performance: 'Performance management', training: 'Training management', assets: 'Assets management', reports: 'Report management' };
export const APP_ROLES: AppRole[] = ['admin', 'member', 'viewer'];
export const APP_ROLE_NAMES: Record<AppRole, string> = { admin: 'Admin', member: 'Member', viewer: 'Viewer' };
/** Existing workspaces keep their team on the first migration; future grants are explicit. */
export function initialAppMembers(state: DataState): NonNullable<DataState['appMembers']> {
  const people = Object.fromEntries(state.people.map((person) => [person.id, person.access === 'member' ? 'member' : 'admin'])) as Record<string, AppRole>;
  return { approvals: { ...people }, tasks: { ...people }, meetings: { ...people }, surveys: { ...people } };
}
export function appRole(state: DataState, app: WorkspaceApp, personId = state.meId): AppRole | null {
  const person = state.people.find((item) => item.id === personId);
  if (!person) return null;
  // The workspace owner retains recovery access; workspace admin is not an app role.
  if (person.access === 'owner') return 'admin';
  if (!state.appMembers && !['approvals', 'tasks', 'meetings', 'surveys'].includes(app)) return null;
  if (!state.appMembers) return person.access === 'admin' ? 'admin' : 'member';
  return state.appMembers[app]?.[personId] ?? null;
}
export const isAppAdmin = (state: DataState, app: WorkspaceApp, personId = state.meId) => appRole(state, app, personId) === 'admin';
export const canContributeToApp = (state: DataState, app: WorkspaceApp, personId = state.meId) => ['admin', 'member'].includes(appRole(state, app, personId) ?? '');
export const appPeople = (state: DataState, app: WorkspaceApp) => state.people.filter((person) => appRole(state, app, person.id));
export function taskTeamProblem(state: DataState, task: Task) {
  return [task.ownerId, task.assignedById ?? task.ownerId].some((id) => !canContributeToApp(state, 'tasks', id)) || [...(task.consultedIds ?? []), ...(task.informedIds ?? [])].some((id) => !appRole(state, 'tasks', id))
    ? 'Choose people with access to Task management. Responsible and Accountable people need Member or Admin access.' : undefined;
}
export function memberChangeProblem(state: DataState, app: WorkspaceApp, personId: PersonId, role: AppRole | null): string | undefined {
  if (!isAppAdmin(state, app)) return 'Only app admins can manage this team.';
  if (!state.people.some((person) => person.id === personId)) return 'Choose a workspace person.';
  if (personId === state.meId || state.people.find((person) => person.id === personId)?.access === 'owner') return 'You cannot change your own access or the workspace owner’s access.';
  if (app === 'employees' && role !== 'admin' && state.hr?.changes?.some(c => c.status === 'pending' && c.approvalStatus === 'pending' && c.reviewerId === personId)) return 'Resolve assigned employee change approvals before changing this person’s access.';
  if (app === 'approvals' && (role === null || role === 'viewer') && state.hr?.recruitment?.requisitions.some(q=>q.status==='pending' && q.reviewerId===personId)) return 'Resolve assigned recruitment approvals before changing this person’s access.';
  if (app === 'recruitment' && role !== 'admin' && (state.hr?.recruitment?.requisitions.some(q => q.status === 'pending' && q.reviewerId === personId) || state.hr?.recruitment?.offers.some(o => o.status === 'pending' && o.reviewerId === personId))) return 'Resolve assigned recruitment approvals before changing this person’s access.';
  if (app === 'recruitment' && (role === null || role === 'viewer') && state.hr?.recruitment?.interviews.some(i => i.status === 'scheduled' && i.interviewerId === personId)) return 'Reassign or cancel this person’s interviews before removing contributor access.';
  if (app === 'tasks' && (role === 'viewer' || role === null) && state.tasks.some((task) => state.taskStatuses.find((status) => status.id === task.status)?.category !== 'done' && (task.ownerId === personId || (task.assignedById ?? task.ownerId) === personId))) return 'Reassign this person’s unfinished work before making them a Viewer or removing access.';
  return undefined;
}
