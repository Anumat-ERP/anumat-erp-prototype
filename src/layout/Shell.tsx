import { WorkspaceActivation } from '../components/WorkspaceActivation';
import { AppWorkflowGuide } from '../components/AppWorkflowGuide';
import { HR_MODULES } from '../hr/catalog';
import { isHRApp } from '../hr/types';
import { APP_NAMES } from '../lib/appAccess';
import { AppContextBar, SidebarAppContext } from '../components/AppContext';
import type { WorkspaceApp } from '../lib/moduleEntry';
import { EmptyState } from '@app/ui';
import { appRole } from '../lib/appAccess';
import { Button, ActionMenu, AppShell, Avatar, IconButton, Navigation, SidebarProvider, useSidebar, useToast, cn, type NavigationSection } from '@app/ui';
import { ClipboardList, MessageSquare, BarChart3, Bell, Check, Plus, Rows3, Send, ChevronsUpDown, CircleHelp, Compass, FileText, LayoutDashboard, LayoutTemplate, ListChecks, Inbox, Moon, Presentation, RotateCcw, Search, Sun, UsersRound, Workflow } from 'lucide-react';
import { useEffect, useState, type ComponentPropsWithRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { CommandPalette } from '../components/CommandPalette';
import { useTour } from '../components/DemoTour';
import { FeedbackDialog } from '../components/Feedback';
import { navLink } from '../components/links';
import { Notifications } from '../components/Notifications';
import { WorkspaceSwitcher } from '../components/WorkspaceSwitcher';
import { canManageSurveys, useStore, waitingOnMe } from '../data/store';
import { LanguageSwitch } from '../i18n/LanguageSwitch';
import { useLocale } from '../i18n/LocaleProvider';
import { withViewTransition } from '../lib/motion';
import { resolveWorkspaceApp, selectWorkspaceApp } from '../lib/moduleEntry';

type Theme = 'light' | 'dark';

function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('anumat-theme', theme);
    } catch {
      // Theme still applies for this visit.
    }
  }, [theme]);
  // Cross-fade between light and dark instead of flashing.
  const setTheme = (next: Theme) =>
    withViewTransition(() => {
      document.documentElement.dataset.theme = next;
      setThemeState(next);
    });
  return [theme, setTheme] as const;
}

type Density = 'comfortable' | 'compact';

/** Comfortable or compact spacing, remembered on this device. */
function useDensity() {
  const [density, setDensity] = useState<Density>(() => {
    try {
      return localStorage.getItem('anumat-density') === 'compact' ? 'compact' : 'comfortable';
    } catch {
      return 'comfortable';
    }
  });
  useEffect(() => {
    document.documentElement.dataset.density = density;
    try {
      localStorage.setItem('anumat-density', density);
    } catch {
      // Density still applies for this visit.
    }
  }, [density]);
  return [density, setDensity] as const;
}

/** What each demo persona shows in the story. */
const DEMO_ROLES: Record<string, string> = {
  dara: 'Approves team requests',
  alex: 'Raises requests',
  priya: 'Finance approval',
  sokha: 'Final sign-off',
};

/** Page names for the breadcrumb, by top-level path. */
const PAGE_NAMES: Array<[string, string]> = [
  ['/discover', 'Explore modules'],
  ['/home', 'Dashboard'],
  ['/requests', 'Requests'],
  ['/approvals', 'Approvals'],
  ['/tasks', 'Tasks'],
  ['/insights', 'Insights'],
  ['/processes', 'Approval processes'],
  ['/settings/people', 'People & roles'],
  ['/settings/notifications', 'Notification settings'],
  ['/settings/package', 'Package & support'],
  ['/operator', 'Operator preview'],
  ['/work', 'My work'],
  ['/settings/company', 'Company settings'],
  ['/settings/data', 'Workspace data'],
  ['/settings/delivery', 'Delivery previews'],
  ['/meetings', 'Meetings'],
  ['/documents', 'Documents'],
  ['/surveys', 'Surveys'],
  ['/support', 'Help & support'],
  ['/telegram', 'Telegram preview'],
];

export function Shell() {
  return (
    <SidebarProvider>
      <ShellFrame />
    </SidebarProvider>
  );
}

function ShellFrame() {
  useEffect(() => {
    document.documentElement.classList.add('an-workspace-theme');
    return () => document.documentElement.classList.remove('an-workspace-theme');
  }, []);
  const { t: tr } = useLocale();
  const { state, me, dispatch, activeWorkspace } = useStore();
  const { pathname, hash, search } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [theme, setTheme] = useTheme();
  const [density, setDensity] = useDensity();
  const [searching, setSearching] = useState(false);
  const tour = useTour();

  // ⌘K / Ctrl+K opens search from anywhere, even while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearching((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const [feedback, setFeedback] = useState<'feedback' | 'problem' | null>(null);

  const waiting = waitingOnMe(state).length;
  const at = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const app = resolveWorkspaceApp(pathname, search, activeWorkspace);
  const approvalApp = app === 'approvals';
  const taskApp = app === 'tasks';
  const surveyApp = app === 'surveys';
  const meetingApp = app === 'meetings';
  useEffect(() => {
    if (app) selectWorkspaceApp(activeWorkspace, app);
  }, [app, activeWorkspace]);

  const templates = pathname === '/processes' && (hash === '#templates' || new URLSearchParams(search).get('tab') === 'marketplace');
  const sections: NavigationSection[] = [
    {
      title: tr('Workspace'),
      items: [
        { label: tr('Explore modules'), href: '/discover', icon: <Compass />, selected: at('/discover') },
        { label: tr('My work'), href: '/work', icon: <ClipboardList />, selected: at('/work') },
        ...(app ? [{ label: tr('Dashboard'), href: `/home?app=${app}`, icon: <LayoutDashboard />, selected: at('/home') }] : []),
      ],
    },
    ...(approvalApp ? [{
      title: tr('Requests & approvals'),
      items: [
        { label: tr('Requests'), href: '/requests', icon: <FileText />, selected: at('/requests') },
        {
          label: tr('Approvals'),
          href: '/approvals',
          icon: <Inbox />,
          selected: at('/approvals') && !at('/approvals/people'),
          badge: waiting || undefined,
          badgeLabel: tr('{count} waiting on you', { count: waiting }),
        },
        { label: tr('Insights'), href: '/insights', icon: <BarChart3 />, selected: at('/insights') },
      ],
    }, {
      title: tr('Administration'),
      items: [
        { label: tr('Approval processes'), href: '/processes', icon: <Workflow />, selected: at('/processes') && !templates },
        { label: tr('Templates'), href: '/processes?tab=marketplace', icon: <LayoutTemplate />, selected: templates },
        { label: tr('People & roles'), href: '/approvals/people', icon: <UsersRound />, selected: at('/approvals/people') },
      ],
    }] : []),
    ...(taskApp ? [{ title: tr('Task management'), items: [
      { label: tr('Tasks'), href: '/tasks', icon: <ListChecks />, selected: pathname === '/tasks' },
      { label: tr('People & roles'), href: '/tasks/people', icon: <UsersRound />, selected: at('/tasks/people') },
    ] }] : []),
    ...(meetingApp ? [{ title: tr('Meeting management'), items: [
      { label: tr('Meetings'), href: '/meetings', icon: <Presentation />, selected: pathname === '/meetings' },
      { label: tr('People & roles'), href: '/meetings/people', icon: <UsersRound />, selected: at('/meetings/people') },
    ] }] : []),
    ...(surveyApp ? [{ title: tr('Surveys & evaluations'), items: [
      { label: tr('Surveys'), href: '/surveys', icon: <ClipboardList />, selected: at('/surveys') && !at('/surveys/people') && new URLSearchParams(search).get('tab') !== 'feedback' },
      { label: tr('People & roles'), href: '/surveys/people', icon: <UsersRound />, selected: at('/surveys/people') },
      ...(canManageSurveys(state) ? [{ label: tr('Feedback & enquiries'), href: '/surveys?tab=feedback', icon: <MessageSquare />, selected: at('/surveys') && new URLSearchParams(search).get('tab') === 'feedback' }] : []),
    ] }] : []),
  ];
  if (app && isHRApp(app)) {
    const Icon = HR_MODULES[app].icon;
    sections.push({ title: tr(APP_NAMES[app]), items: [
      { label: tr(APP_NAMES[app]), href: `/${app}`, icon: <Icon />, selected: pathname === `/${app}` },
      { label: tr('People & roles'), href: `/${app}/people`, icon: <UsersRound />, selected: pathname === `/${app}/people` },
    ] });
  }
  const teamPage = /\/people$/.test(pathname);
  const pageName = teamPage ? 'People & roles' : app && isHRApp(app) ? APP_NAMES[app] : PAGE_NAMES.find(([href]) => at(href))?.[1];

  // The four people the demo story needs (requester, manager, finance, final sign-off), plus whoever you are now.
  const personas = state.people.length <= 5 ? state.people : state.people.filter((p) => p.id in DEMO_ROLES || p.email || p.id === me.id);
  const accountMenu = (
      <ActionMenu
        align="end"
        trigger={<AccountButton label={tr("Account: {value0}, {value1}. Switch who you are viewing as.", { value0: me.name, value1: me.role })} name={tr(me.name)} role={tr(me.role)} avatarName={me.name} />}
        sections={[
          {
            title: tr('View the prototype as'),
            items: personas.map((p) => ({
              content: p.name,
              helpText: DEMO_ROLES[p.id] ? tr(DEMO_ROLES[p.id]!) : tr(p.role),
              icon: p.id === me.id ? <Check /> : <Avatar name={p.name} size="xs" decorative />,
              onAction: () => {
                if (p.id === me.id) return;
                dispatch({ type: 'switchUser', personId: p.id });
                toast({ title: tr('Now viewing as {name}', { name: p.name }), description: tr(p.role) });
              },
            })),
          },
          {
            title: tr('Preferences'),
            items: [
              { content: tr('Package & support'), onAction: () => navigate('/settings/package') },
              { content: tr('Company settings'), onAction: () => navigate('/settings/company') },
              { content: tr('Workspace data'), onAction: () => navigate('/settings/data') },
              { content: tr('Delivery previews'), onAction: () => navigate('/settings/delivery') },
              { content: tr('Notification settings'), icon: <Bell />, onAction: () => navigate('/settings/notifications') },
              {
                content: theme === 'dark' ? tr('Light theme') : tr('Dark theme'),
                icon: theme === 'dark' ? <Sun /> : <Moon />,
                onAction: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
              },
              {
                content: density === 'compact' ? tr('Comfortable spacing') : tr('Compact spacing'),
                icon: <Rows3 />,
                onAction: () => setDensity(density === 'compact' ? 'comfortable' : 'compact'),
              },
            ],
          },
          {
            title: tr('Demo'),
            items: [
              { content: tr('Start demo tour'), icon: <Presentation />, onAction: tour.start },
              { content: tr('Telegram preview'), icon: <Send />, onAction: () => navigate('/telegram') },
              { content: tr('Create a new workspace'), icon: <Plus />, onAction: () => navigate('/welcome') },
              {
                content: tr('Reset demo data'),
                icon: <RotateCcw />,
                destructive: true,
                onAction: () => {
                  dispatch({ type: 'reset' });
                  navigate('/home');
                  toast({ title: tr('Demo data reset') });
                },
              },
            ],
          },
        ]}
      />
  );


  const topBar = (
    <>
      <Button variant="tertiary"
        type="button"
        onClick={() => setSearching(true)}
        aria-keyshortcuts="Meta+K Control+K"
        aria-label={tr('Search')}
        className="h-auto p-0 justify-start whitespace-normal inline-flex h-8 items-center gap-2 rounded-md border border-input bg-card px-2.5 text-sm text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:w-56"
      >
        <Search aria-hidden className="size-4" />
        <span className="hidden lg:inline">{tr('Search…')}</span>
        <kbd aria-hidden className="ms-auto hidden rounded-sm border border-border bg-muted px-1.5 font-sans text-xs lg:inline">⌘K</kbd>
      </Button>
      <LanguageSwitch />
      <ActionMenu
        align="end"
        trigger={<IconButton icon={<CircleHelp />} label={tr('Help')} />}
        items={[
          { content: tr('Read the full guide'), icon: <CircleHelp />, onAction: () => navigate(app ? `/docs/${app === 'approvals' ? 'workflow-approvals' : app}` : '/docs/quickstart') },
          {
            content: tr('Help & support'),
            onAction: () => navigate('/support'),
          },
          {
            content: tr('Send feedback'),
            onAction: () => setFeedback('feedback'),
          },
          {
            content: tr('Report a problem'),
            onAction: () => setFeedback('problem'),
          },
          {
            content: tr('Pricing & deployment'),
            onAction: () => navigate('/pricing'),
          },
          {
            content: tr('Start demo tour'),
            icon: <Presentation />,
            onAction: tour.start,
          },
        ]}
      />
      <Notifications />
    </>
  );


  return (
    <AppShell
      skipLinkLabel={tr('Skip to content')}
      navigationLabel={tr('Navigation')}
      openNavigationLabel={tr('Open navigation')}
      closeNavigationLabel={tr('Close navigation')}
      topBar={topBar}
      toggleSidebarLabel={tr('Toggle sidebar')}
      sidebarHeader={<SidebarBrand homeLabel={tr('Anumat home')} app={app} />}
      contextBar={app ? <AppContextBar app={app} /> : undefined}
      breadcrumb={
        <nav aria-label={tr('Breadcrumb')}>
          <ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <li className="hidden lg:block">{tr(state.org.name)}</li>
            {pageName ? (
              <>
                <li aria-hidden className="hidden lg:block">/</li>
                <li aria-current="page" className="truncate font-medium text-foreground">{tr(pageName)}</li>
              </>
            ) : null}
          </ol>
        </nav>
      }
      sidebarFooter={accountMenu}
      navigation={<Navigation sections={sections} renderLink={navLink} aria-label={tr('Main navigation')} />}
    >
      <div key={pathname} className={cn('an-page mx-auto flex w-full max-w-7xl flex-col gap-6', ['/support', '/settings/notifications'].includes(pathname) && 'max-w-4xl')}>
        {app && appRole(state, app) && pathname === '/home' && <WorkspaceActivation key={activeWorkspace} />}
        {app && !appRole(state, app) ? <EmptyState heading={tr('You do not have access to this app')} action={<Button variant="primary" onClick={() => navigate('/discover')}>{tr('Explore modules')}</Button>}>{tr('Ask an app admin to add you or share an invitation link.')}</EmptyState> : <Outlet />}
        {app && appRole(state, app) && (pathname === '/home' || ['/tasks', '/requests', '/approvals', '/meetings', '/surveys'].includes(pathname)) && <AppWorkflowGuide app={app} />}
      </div>
      <CommandPalette open={searching} onOpenChange={setSearching} />

      <FeedbackDialog kind={feedback} onClose={() => setFeedback(null)} />
    </AppShell>
  );
}

/** Logo and workspace switcher at the top of the sidebar; the mark alone when collapsed. */
function SidebarBrand({ homeLabel, app }: { homeLabel: string; app: WorkspaceApp | null }) {
  const { collapsed } = useSidebar();
  return (
    <div className={cn('flex flex-col', collapsed && 'items-center')} aria-label={homeLabel}>
      <WorkspaceSwitcher />
      {app && <SidebarAppContext app={app} />}
    </div>
  );
}

/** The account menu trigger: name and role, or just the avatar in the rail and on phones. */
function AccountButton({ label, name, role, avatarName, className, ...props }: ComponentPropsWithRef<'button'> & { label: string; name: string; role: string; avatarName: string }) {
  const { collapsed } = useSidebar();
  return (
    <Button variant="tertiary"
      type="button"
      aria-label={label}
      {...props}
      className={cn('h-auto p-0 justify-start whitespace-normal',
        'an-account flex w-full items-center gap-2.5 rounded-md p-1.5 text-start hover:bg-sidebar-accent/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
        collapsed && 'justify-center',
        className,
      )}
    >
      <Avatar name={avatarName} size="sm" decorative />
      {collapsed ? null : (
        <>
          <span className="an-account-copy flex min-w-0 flex-1 flex-col text-start leading-tight">
            <span className="truncate text-sm font-medium text-foreground">{name}</span>
            <span className="truncate text-xs text-muted-foreground">{role}</span>
          </span>
          <ChevronsUpDown aria-hidden className="an-account-chevron size-4 shrink-0 text-muted-foreground" />
        </>
      )}
    </Button>
  );
}
