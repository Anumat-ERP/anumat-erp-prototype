import { ActionMenu, AppShell, Avatar, Badge, Button, IconButton, KbdShortcut, Navigation, useToast, type NavigationSection } from '@repo/ui';
import { BarChart3, Check, CircleHelp, FileText, Home, Inbox, Moon, Presentation, RotateCcw, Search, Sun, UsersRound, Workflow } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { CommandPalette, commandKey } from '../components/CommandPalette';
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
          badgeLabel: `${waiting} waiting on you`,
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

  const topBar = (
    <>
      <Link
        to="/home"
        className="flex shrink-0 items-center gap-2 rounded-md text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Logo className="hidden h-7 w-auto sm:block" />
        <span className="sm:hidden" aria-label="Anumat">
          <LogoMark className="size-7" />
        </span>
      </Link>
      <Badge tone="primary" size="sm" className="hidden sm:inline-flex">
        {' '}
        {tr('Prototype')}{' '}
      </Badge>
      <button
        type="button"
        onClick={() => setSearching(true)}
        aria-keyshortcuts="Meta+K Control+K"
        className="ms-auto hidden h-8 w-full max-w-80 items-center gap-2 rounded-md border border-border-input/60 bg-surface px-2.5 text-start text-md text-fg-subtle hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex"
      >
        <Search aria-hidden className="size-4" />
        <span className="flex-1">{tr('Search or jump to…')}</span>
        <KbdShortcut size="sm" keys={[commandKey, 'K']} />
      </button>
      <IconButton icon={<Search />} label={tr('Search')} className="ms-auto sm:hidden" onClick={() => setSearching(true)} />
      <Button
        size="sm"
        variant="tertiary"
        icon={<Presentation />}
        className="ms-auto hidden sm:ms-0 md:inline-flex"
        onClick={tour.start}
        title={tr('Resets the demo data and walks through a 3-minute pitch')}
      >
        {' '}
        {tr('Demo tour')}{' '}
      </Button>
      <LanguageSwitch />
      <span>
        <Notifications />
      </span>
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
      {/* Phones: the theme switch lives in the account menu, so the top bar fits. */}
      <IconButton
        icon={theme === 'dark' ? <Sun /> : <Moon />}
        label={theme === 'dark' ? tr('Switch to light theme') : tr('Switch to dark theme')}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="hidden sm:inline-flex"
      />
      <ActionMenu
        align="end"
        trigger={
          <button
            type="button"
            aria-label={`Account: ${me.name}, ${me.role}. Switch who you are viewing as.`}
            className="flex items-center gap-2 rounded-full py-0.5 ps-0.5 pe-2 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Avatar name={me.name} size="sm" decorative />
            <span className="hidden flex-col text-start leading-tight lg:flex">
              <span className="text-sm font-medium text-fg">{me.name}</span>
              <span className="text-xs text-fg-muted">{me.role}</span>
            </span>
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
    </>
  );

  return (
    <AppShell
      topBar={topBar}
      navigation={
        <>
          <WorkspaceSwitcher />
          <Navigation className="an-navigation" sections={sections} renderLink={navLink} />
        </>
      }
      mainClassName="md:p-8"
    >
      <div key={pathname} className="an-page mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Outlet />
      </div>
      <CommandPalette open={searching} onOpenChange={setSearching} />

      <FeedbackDialog kind={feedback} onClose={() => setFeedback(null)} />
    </AppShell>
  );
}
