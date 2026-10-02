import { ActionMenu, AppShell, Avatar, IconButton, Navigation, SidebarProvider, useSidebar, useToast, cn, type NavigationSection } from '@app/ui';
import { BarChart3, Bell, Check, Plus, Rows3, Send, ChevronsUpDown, CircleHelp, FileText, LayoutDashboard, LayoutTemplate, ListChecks, Inbox, Moon, Presentation, RotateCcw, Search, Sun, UsersRound, Workflow } from 'lucide-react';
import { useEffect, useState, type ComponentPropsWithRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { CommandPalette } from '../components/CommandPalette';
import { useTour } from '../components/DemoTour';
import { FeedbackDialog } from '../components/Feedback';
import { navLink } from '../components/links';
import { Logo, LogoMark } from '../components/Logo';
import { Notifications } from '../components/Notifications';
import { WorkspaceSwitcher } from '../components/WorkspaceSwitcher';
import { useStore, waitingOnMe } from '../data/store';
import { LanguageSwitch } from '../i18n/LanguageSwitch';
import { useLocale } from '../i18n/LocaleProvider';
import { withViewTransition } from '../lib/motion';

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
  ['/home', 'Dashboard'],
  ['/requests', 'Requests'],
  ['/approvals', 'Approvals'],
  ['/tasks', 'Tasks'],
  ['/insights', 'Insights'],
  ['/processes', 'Approval processes'],
  ['/settings/people', 'People & roles'],
  ['/settings/notifications', 'Notification settings'],
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
  const { t: tr } = useLocale();
  const { state, me, dispatch } = useStore();
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

  const templates = pathname === '/processes' && (hash === '#templates' || new URLSearchParams(search).get('tab') === 'marketplace');
  const sections: NavigationSection[] = [
    {
      title: tr('Workspace'),
      items: [
        { label: tr('Dashboard'), href: '/home', icon: <LayoutDashboard />, selected: at('/home') },
        { label: tr('Requests'), href: '/requests', icon: <FileText />, selected: at('/requests') },
        {
          label: tr('Approvals'),
          href: '/approvals',
          icon: <Inbox />,
          selected: at('/approvals'),
          badge: waiting || undefined,
          badgeLabel: tr('{count} waiting on you', { count: waiting }),
        },
        { label: tr('Tasks'), href: '/tasks', icon: <ListChecks />, selected: at('/tasks') },
        { label: tr('Insights'), href: '/insights', icon: <BarChart3 />, selected: at('/insights') },
      ],
    },
    {
      title: tr('Administration'),
      items: [
        { label: tr('Approval processes'), href: '/processes', icon: <Workflow />, selected: at('/processes') && !templates },
        { label: tr('Templates'), href: '/processes?tab=marketplace', icon: <LayoutTemplate />, selected: templates },
        { label: tr('People & roles'), href: '/settings/people', icon: <UsersRound />, selected: at('/settings/people') },
      ],
    },
  ];
  const pageName = PAGE_NAMES.find(([href]) => at(href))?.[1];

  // The four people the demo story needs (requester, manager, finance, final sign-off), plus whoever you are now.
  const personas = state.people.length <= 5 ? state.people : state.people.filter((p) => p.id in DEMO_ROLES || p.id === me.id);
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
      <button
        type="button"
        onClick={() => setSearching(true)}
        aria-keyshortcuts="Meta+K Control+K"
        aria-label={tr('Search')}
        className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-card px-2.5 text-sm text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:w-56"
      >
        <Search aria-hidden className="size-4" />
        <span className="hidden lg:inline">{tr('Search…')}</span>
        <kbd aria-hidden className="ms-auto hidden rounded-sm border border-border bg-muted px-1.5 font-sans text-xs lg:inline">⌘K</kbd>
      </button>
      <LanguageSwitch />
      <ActionMenu
        align="end"
        trigger={<IconButton icon={<CircleHelp />} label={tr('Help')} />}
        items={[
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
      sidebarHeader={<SidebarBrand homeLabel={tr('Anumat home')} />}
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
        <Outlet />
      </div>
      <CommandPalette open={searching} onOpenChange={setSearching} />

      <FeedbackDialog kind={feedback} onClose={() => setFeedback(null)} />
    </AppShell>
  );
}

/** Logo and workspace switcher at the top of the sidebar; the mark alone when collapsed. */
function SidebarBrand({ homeLabel }: { homeLabel: string }) {
  const { collapsed } = useSidebar();
  return (
    <div className={cn('flex flex-col gap-3', collapsed && 'items-center')}>
      <Link
        to="/home"
        aria-label={homeLabel}
        className={cn('an-brand inline-flex h-9 items-center rounded-md focus-visible:outline-2 focus-visible:outline-ring', !collapsed && 'px-1')}
      >
        {collapsed ? <LogoMark className="size-8" /> : <Logo className="h-7 w-auto text-foreground" />}
      </Link>
      <WorkspaceSwitcher />
    </div>
  );
}

/** The account menu trigger: name and role, or just the avatar in the rail and on phones. */
function AccountButton({ label, name, role, avatarName, className, ...props }: ComponentPropsWithRef<'button'> & { label: string; name: string; role: string; avatarName: string }) {
  const { collapsed } = useSidebar();
  return (
    <button
      type="button"
      aria-label={label}
      {...props}
      className={cn(
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
    </button>
  );
}
