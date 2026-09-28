import { ActionMenu, AppShell, Avatar, Badge, IconButton, Navigation, SearchField, useToast, type NavigationSection } from '@repo/ui';
import { CalendarDays, CheckSquare, FileText, Home, Inbox, ListChecks, Moon, RotateCcw, Sun, Workflow } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Logo } from '../components/Logo';
import { navLink } from '../components/links';
import { useStore, waitingOnMe } from '../data/store';

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

export function Shell() {
  const { state, me, dispatch } = useStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [theme, setTheme] = useTheme();

  const waiting = waitingOnMe(state).length;
  const myOpenTasks = state.tasks.filter((t) => t.ownerId === me.id && t.status !== 'done').length;
  const at = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  const sections: NavigationSection[] = [
    {
      items: [
        { label: 'Home', href: '/', icon: <Home />, selected: at('/') },
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
      ],
    },
    {
      title: 'Workspace',
      items: [{ label: 'Process Builder', href: '/processes', icon: <Workflow />, selected: at('/processes') }],
    },
  ];

  const topBar = (
    <>
      <Link
        to="/"
        className="flex shrink-0 items-center gap-2 rounded-md text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Logo className="h-7 w-auto" />
      </Link>
      <Badge tone="primary" size="sm" className="hidden sm:inline-flex">
        Prototype
      </Badge>
      <div className="ms-auto w-full max-w-80">
        <SearchField
          label="Search requests"
          labelHidden
          placeholder="Search requests…"
          size="sm"
          onChange={() => undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const q = (e.target as HTMLInputElement).value.trim();
              navigate(q ? `/requests?q=${encodeURIComponent(q)}` : '/requests');
            }
          }}
        />
      </div>
      <IconButton
        icon={theme === 'dark' ? <Sun /> : <Moon />}
        label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
      <ActionMenu
        align="end"
        trigger={
          <button
            type="button"
            aria-label={`Account: ${me.name}`}
            className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Avatar name={me.name} size="sm" decorative />
          </button>
        }
        sections={[
          { title: `${me.name} · ${me.role}`, items: [] },
          {
            items: [
              {
                content: 'Reset demo data',
                icon: <RotateCcw />,
                helpText: 'Undo everything you changed in this prototype.',
                onAction: () => {
                  dispatch({ type: 'reset' });
                  navigate('/');
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
    <AppShell topBar={topBar} navigation={<Navigation sections={sections} renderLink={navLink} />} mainClassName="md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Outlet />
      </div>
    </AppShell>
  );
}
