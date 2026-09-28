import { ActionMenu, AppShell, Avatar, Badge, Button, IconButton, KbdShortcut, Navigation, useToast, type NavigationSection } from '@repo/ui';
import { BarChart3, CalendarDays, Check, CircleHelp, ClipboardList, Presentation, UsersRound, CheckSquare, FileText, Home, Inbox, ListChecks, Moon, RotateCcw, Search, Sun, Workflow } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Logo } from '../components/Logo';
import { Notifications } from '../components/Notifications';
import { WorkspaceSwitcher } from '../components/WorkspaceSwitcher';
import { FeedbackDialog, SurveyPrompt } from '../components/Feedback';
import { useTour } from '../components/DemoTour';
import { CommandPalette, commandKey } from '../components/CommandPalette';
import { navLink } from '../components/links';
import { isDone, surveysToAnswer, useStore, waitingOnMe } from '../data/store';

type Theme = 'light' | 'dark';

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('anumat-theme', theme);
    } catch {
      // Theme still applies for this visit.
    }
  }, [theme]);
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
  const myOpenTasks = state.tasks.filter((t) => t.ownerId === me.id && !isDone(state, t)).length;
  const toAnswer = surveysToAnswer(state).length;
  const at = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const sections: NavigationSection[] = [
    {
      items: [
        { label: 'Home', href: '/home', icon: <Home />, selected: at('/home') },
        { label: 'Requests', href: '/requests', icon: <FileText />, selected: at('/requests') },
        {
          label: 'Approvals',
          href: '/approvals',
          icon: <Inbox />,
          selected: at('/approvals'),
          badge: waiting || undefined,
          badgeLabel: `${waiting} waiting on you`,
        },
        { label: 'Meetings', href: '/meetings', icon: <CalendarDays />, selected: at('/meetings') },
        { label: 'Documents', href: '/documents', icon: <ListChecks />, selected: at('/documents') },
        {
          label: 'Tasks',
          href: '/tasks',
          icon: <CheckSquare />,
          selected: at('/tasks'),
          badge: myOpenTasks || undefined,
          badgeLabel: `${myOpenTasks} open tasks assigned to you`,
        },
        {
          label: 'Surveys',
          href: '/surveys',
          icon: <ClipboardList />,
          selected: at('/surveys'),
          badge: toAnswer || undefined,
          badgeLabel: `${toAnswer} surveys waiting for your answer`,
        },
      ],
    },
    {
      title: 'Workspace',
      items: [
        { label: 'Insights', href: '/insights', icon: <BarChart3 />, selected: at('/insights') },
        { label: 'Process Builder', href: '/processes', icon: <Workflow />, selected: at('/processes') },
        { label: 'People & roles', href: '/settings/people', icon: <UsersRound />, selected: at('/settings/people') },
      ],
    },
  ];

  const topBar = (
    <>
      <Link
        to="/home"
        className="flex shrink-0 items-center gap-2 rounded-md text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Logo className="h-7 w-auto" />
      </Link>
      <Badge tone="primary" size="sm" className="hidden sm:inline-flex">
        Prototype
      </Badge>
      <button
        type="button"
        onClick={() => setSearching(true)}
        aria-keyshortcuts="Meta+K Control+K"
        className="ms-auto hidden h-8 w-full max-w-80 items-center gap-2 rounded-md border border-border-input/60 bg-surface px-2.5 text-start text-md text-fg-subtle hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex"
      >
        <Search aria-hidden className="size-4" />
        <span className="flex-1">Search or jump to…</span>
        <KbdShortcut size="sm" keys={[commandKey, 'K']} />
      </button>
      <IconButton icon={<Search />} label="Search" className="ms-auto sm:hidden" onClick={() => setSearching(true)} />
      <Button
        size="sm"
        variant="tertiary"
        icon={<Presentation />}
        className="ms-auto hidden sm:ms-0 md:inline-flex"
        onClick={tour.start}
        title="Resets the demo data and walks through a 3-minute pitch"
      >
        Demo tour
      </Button>
      <span>
        <Notifications />
      </span>
      <ActionMenu
        align="end"
        trigger={<IconButton icon={<CircleHelp />} label="Help" />}
        items={[
          { content: 'Help & support', onAction: () => navigate('/support') },
          { content: 'Send feedback', onAction: () => setFeedback('feedback') },
          { content: 'Report a problem', onAction: () => setFeedback('problem') },
          { content: 'Pricing & deployment', onAction: () => navigate('/pricing') },
          { content: 'Start demo tour', icon: <Presentation />, onAction: tour.start },
        ]}
      />
      {/* Phones: the theme switch lives in the account menu, so the top bar fits. */}
      <IconButton
        icon={theme === 'dark' ? <Sun /> : <Moon />}
        label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
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
            title: 'View the prototype as',
            items: state.people.map((p) => ({
              content: p.name,
              helpText: p.role,
              icon: p.id === me.id ? <Check /> : <span aria-hidden className="size-4" />,
              onAction: () => {
                if (p.id === me.id) return;
                dispatch({ type: 'switchUser', personId: p.id });
                toast({ title: `Now viewing as ${p.name}`, description: p.role });
              },
            })),
          },
          {
            items: [
              {
                content: 'Notification settings',
                helpText: 'Email and Telegram, per kind of event.',
                onAction: () => navigate('/settings/notifications'),
              },
              {
                content: theme === 'dark' ? 'Light theme' : 'Dark theme',
                icon: theme === 'dark' ? <Sun /> : <Moon />,
                onAction: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
              },
              {
                content: density === 'compact' ? 'Comfortable spacing' : 'Compact spacing',
                helpText: density === 'compact' ? 'Roomier rows and text.' : 'Fit more on screen: tighter rows and text.',
                onAction: () => setDensity(density === 'compact' ? 'comfortable' : 'compact'),
              },
              {
                content: 'Telegram preview',
                helpText: 'See and act on what the bot sends you.',
                onAction: () => navigate('/telegram'),
              },
              {
                content: 'Create a new workspace',
                helpText: 'See sign-up as a new company. Keeps the demo data.',
                onAction: () => navigate('/welcome'),
              },
              {
                content: 'Start demo tour',
                icon: <Presentation />,
                helpText: 'Resets the demo data and walks through a 3-minute pitch.',
                onAction: tour.start,
              },
              {
                content: 'Reset demo data',
                icon: <RotateCcw />,
                helpText: 'Undo everything you changed in this prototype.',
                onAction: () => {
                  dispatch({ type: 'reset' });
                  navigate('/home');
                  toast({ title: 'Demo data reset' });
                },
              },
            ],
          },
        ]}
      />
    </>
  );

  return (
    <AppShell topBar={topBar} navigation={
        <>
          <WorkspaceSwitcher />
          <Navigation sections={sections} renderLink={navLink} />
        </>
      } mainClassName="md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Outlet />
      </div>
      <CommandPalette open={searching} onOpenChange={setSearching} />
      <SurveyPrompt />
      <FeedbackDialog kind={feedback} onClose={() => setFeedback(null)} />
    </AppShell>
  );
}
