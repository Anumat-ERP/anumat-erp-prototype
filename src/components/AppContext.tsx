import { ActionMenu, Button, cn, useSidebar } from '@app/ui';
import { Check, ChevronDown, ClipboardList, Compass, FileCheck2, ListChecks, Presentation } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { APP_NAMES, APP_ROLE_NAMES, appRole } from '../lib/appAccess';
import { type WorkspaceApp } from '../lib/moduleEntry';
import '../styles/app-context.css';
import { HR_MODULES } from '../hr/catalog';

import { APP_GROUPS } from '../lib/appCatalog';
const ICONS = { approvals: FileCheck2, tasks: ListChecks, meetings: Presentation, surveys: ClipboardList, ...Object.fromEntries(Object.entries(HR_MODULES).map(([key, module]) => [key, module.icon])) } as Record<WorkspaceApp, typeof FileCheck2>;
function AppIcon({ app, small = false }: { app: WorkspaceApp; small?: boolean }) {
  const Icon = ICONS[app];
  return <span aria-hidden data-app={app} className={cn('an-app-icon', small && 'an-app-icon-small')}><Icon size={small ? 16 : 18} /></span>;
}
function AppMenu({ app, sidebar = false }: { app: WorkspaceApp; sidebar?: boolean }) {
  const { state } = useStore();
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { t: tr } = useLocale();
  const navigate = useNavigate();
  const rail = sidebar && collapsed && !mobileOpen;
  const go = (path: string) => { setMobileOpen(false); navigate(path); };
  return <ActionMenu align="start" trigger={
    <Button variant="tertiary" aria-label={tr('Current app: {app}. Switch app.', { app: tr(APP_NAMES[app]) })} title={tr(APP_NAMES[app])}
      className={cn('an-app-switch', sidebar && 'an-app-switch-sidebar', rail && 'an-app-switch-rail')}>
      {sidebar ? <><AppIcon app={app} /><span className={cn('min-w-0 flex-1 text-start', rail && 'sr-only')}><span className="block truncate font-semibold">{tr(APP_NAMES[app])}</span><span className="block text-xs font-normal text-muted-foreground">{tr('Current app')}</span></span></> : <span>{tr('Switch app')}</span>}
      {!rail && <ChevronDown aria-hidden className="size-4" />}
    </Button>
  } sections={[
    ...APP_GROUPS.map(group => ({ title: tr(group.title), items: group.apps.map((candidate) => ({ content: tr(APP_NAMES[candidate]), icon: <AppIcon app={candidate} small />, disabled: !appRole(state, candidate), helpText: !appRole(state, candidate) ? tr('Ask an app admin for access.') : undefined, suffix: candidate === app ? <Check aria-label={tr('Current app')} size={16} /> : undefined, onAction: () => go(`/home?app=${candidate}`) })) })),
    { items: [{ content: tr('Explore modules'), icon: <Compass />, onAction: () => go('/discover') }] },
  ]} />;
}
/** A compact identity landmark remains visible while the user operates or scrolls. */
export function AppContextBar({ app }: { app: WorkspaceApp }) {
  const { state } = useStore();
  const { t: tr } = useLocale();
  const role = appRole(state, app);
  return <section aria-label={tr('Current app')} className="an-app-context" data-app={app}>
    <div className="flex min-w-0 items-center gap-2.5"><AppIcon app={app} /><span className="min-w-0 truncate text-sm font-semibold" title={tr(APP_NAMES[app])}>{tr(APP_NAMES[app])}</span>{role && <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{tr(APP_ROLE_NAMES[role])}</span>}</div>
    <AppMenu app={app} />
  </section>;
}
export function SidebarAppContext({ app }: { app: WorkspaceApp }) { return <div className="mt-3 border-t border-sidebar-border pt-3"><AppMenu app={app} sidebar /></div>; }
