import { ActionMenu, AppShell, Avatar, IconButton, Navigation, useToast, type NavigationSection } from '@app/ui';
import { BarChart3, Check, CircleHelp, FileText, Home, Inbox, MoreHorizontal, Moon, Presentation, RotateCcw, Search, Sun, UsersRound, Workflow } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { CommandPalette } from '../components/CommandPalette';
import { useTour } from '../components/DemoTour';
import { FeedbackDialog } from '../components/Feedback';
import { navLink } from '../components/links';
import { Logo } from '../components/Logo';
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

export function Shell() {
  const { t: tr } = useLocale();
  const { state, me, dispatch } = useStore();
  const { pathname } = useLocation();
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

  const sections: NavigationSection[] = [
    {
      items: [
        {
          label: tr('Home'),
          href: '/home',
          icon: <Home />,
          selected: at('/home'),
        },
        {
          label: tr('Requests'),
          href: '/requests',
          icon: <FileText />,
          selected: at('/requests'),
        },
        {
          label: tr('Approvals'),
          href: '/approvals',
          icon: <Inbox />,
          selected: at('/approvals'),
          badge: waiting || undefined,
          badgeLabel: tr('{count} waiting on you', { count: waiting }),
        },
      ],
    },
    {
      title: tr('Administration'),
      items: [
        {
          label: tr('Insights'),
          href: '/insights',
          icon: <BarChart3 />,
          selected: at('/insights'),
        },
        {
          label: tr('Approval processes'),
          href: '/processes',
          icon: <Workflow />,
          selected: at('/processes'),
        },
        {
          label: tr('People & roles'),
          href: '/settings/people',
          icon: <UsersRound />,
          selected: at('/settings/people'),
        },
      ],
    },
  ];

  const accountMenu = (
      <ActionMenu
        align="end"
        trigger={
          <button
            type="button"
            aria-label={tr("Account: {value0}, {value1}. Switch who you are viewing as.", { value0: me.name, value1: me.role })}
            className="an-account flex w-full items-center gap-3 rounded-xl p-3 text-start hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Avatar name={me.name} size="sm" decorative />
            <span className="an-account-copy flex min-w-0 flex-1 flex-col text-start leading-relaxed">
              <span className="truncate text-md font-medium text-fg">{tr(me.name)}</span>
              <span className="text-xs text-fg-muted">{tr(me.role)}</span>
            </span>
            <MoreHorizontal aria-hidden className="size-5 shrink-0 text-fg-muted" />
          </button>
        }
        sections={[
          {
            title: tr('View the prototype as'),
            items: state.people.map((p) => ({
              content: p.name,
              helpText: p.role,
              icon: p.id === me.id ? <Check /> : <span aria-hidden className="size-4" />,
              onAction: () => {
                if (p.id === me.id) return;
                dispatch({ type: 'switchUser', personId: p.id });
                toast({
                  title: `Now viewing as ${p.name}`,
                  description: p.role,
                });
              },
            })),
          },
          {
            items: [
              {
                content: tr('Notification settings'),
                helpText: tr('Email and Telegram, per kind of event.'),
                onAction: () => navigate('/settings/notifications'),
              },
              {
                content: theme === 'dark' ? tr('Light theme') : tr('Dark theme'),
                icon: theme === 'dark' ? <Sun /> : <Moon />,
                onAction: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
              },
              {
                content: density === 'compact' ? tr('Comfortable spacing') : tr('Compact spacing'),
                helpText: density === 'compact' ? tr('Roomier rows and text.') : tr('Fit more on screen: tighter rows and text.'),
                onAction: () => setDensity(density === 'compact' ? 'comfortable' : 'compact'),
              },
              {
                content: tr('Telegram preview'),
                helpText: tr('See and act on what the bot sends you.'),
                onAction: () => navigate('/telegram'),
              },
              {
                content: tr('Create a new workspace'),
                helpText: tr('See sign-up as a new company. Keeps the demo data.'),
                onAction: () => navigate('/welcome'),
              },
              {
                content: tr('Start demo tour'),
                icon: <Presentation />,
                helpText: tr('Resets the demo data and walks through a 3-minute pitch.'),
                onAction: tour.start,
              },
              {
                content: tr('Reset demo data'),
                icon: <RotateCcw />,
                helpText: tr('Undo everything you changed in this prototype.'),
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
      <IconButton icon={<Search />} label={tr('Search')} onClick={() => setSearching(true)} aria-keyshortcuts="Meta+K Control+K" />
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
      sidebarHeader={
        <>
          <Link to="/home" aria-label={tr("Anumat home")} className="an-brand inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
            <Logo className="h-9 w-auto" />
          </Link>
          <div className="an-workspace"><WorkspaceSwitcher /></div>
        </>
      }
      sidebarFooter={accountMenu}
      navigation={
        <>
          <Navigation className="an-navigation" sections={sections} renderLink={navLink} />
        </>
      }
      mainClassName="an-main"
    >
      <div key={pathname} className="an-page mx-auto flex w-full max-w-[1500px] flex-col gap-8">
        <Outlet />
      </div>
      <CommandPalette open={searching} onOpenChange={setSearching} />

      <FeedbackDialog kind={feedback} onClose={() => setFeedback(null)} />
    </AppShell>
  );
}
