export const WORKSPACE_APPS = ['approvals', 'tasks', 'meetings', 'surveys', 'employees', 'recruitment', 'attendance', 'payroll', 'performance', 'training', 'assets', 'reports'] as const;
export type WorkspaceApp = typeof WORKSPACE_APPS[number];
const STORAGE_KEY = 'anumat-workspace-app-v1';

export function isWorkspaceApp(value: unknown): value is WorkspaceApp {
  return typeof value === 'string' && (WORKSPACE_APPS as readonly string[]).includes(value);
}

export function selectedWorkspaceApp(workspaceId: string): WorkspaceApp | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')[workspaceId];
    return isWorkspaceApp(value) ? value : null;
  } catch { return null; }
}

export function selectWorkspaceApp(workspaceId: string, app: WorkspaceApp): void {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    const apps = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...apps, [workspaceId]: app }));
  } catch { /* App links also carry the selection when storage is unavailable. */ }
}

export function appFromRoute(pathname: string): WorkspaceApp | null {
  const routePath = pathname.split(/[?#]/)[0] ?? pathname;
  if (/^\/(requests|approvals|insights|processes)(\/|$)/.test(routePath) || routePath === '/settings/people') return 'approvals';
  if (/^\/tasks(\/|$)/.test(routePath)) return 'tasks';
  if (/^\/meetings(\/|$)/.test(routePath)) return 'meetings';
  if (/^\/surveys(\/|$)/.test(routePath) || routePath === '/settings/feedback') return 'surveys';
  const segment = routePath.split('/')[1];
  return isWorkspaceApp(segment) ? segment : null;
}

export function resolveWorkspaceApp(pathname: string, search: string, workspaceId: string): WorkspaceApp | null {
  if (['/settings/package','/operator','/discover', '/work', '/settings/company', '/settings/data', '/settings/delivery'].includes(pathname)) return null;
  const routeApp = appFromRoute(pathname);
  if (routeApp) return routeApp;
  const requested = new URLSearchParams(search).get('app');
  return pathname === '/home' && isWorkspaceApp(requested) ? requested : selectedWorkspaceApp(workspaceId);
}

export function workspaceEntryPath(workspaceId: string): string {
  const app = selectedWorkspaceApp(workspaceId);
  return app ? `/home?app=${app}` : '/discover';
}
