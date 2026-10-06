import { MeetingsDashboard } from './MeetingsDashboard';
import { SurveysDashboard } from './SurveysDashboard';
import { RecruitmentDashboard } from '../hr/RecruitmentWorkspace';
import { HRDashboard } from '../hr/HRWorkspace';
import { isHRApp } from '../hr/types';
import { canContributeToApp } from '../lib/appAccess';
import { Card, PageHeader } from '@app/ui';
import { ArrowRight } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router';
import { isDone, useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { daysUntil, formatShortDate } from '../lib/format';
import { resolveWorkspaceApp } from '../lib/moduleEntry';
import { Home } from './Home';
import '../styles/module-catalog.css';

/** Each selected app has its own home; an unselected workspace opens the launcher. */
export function AppDashboard() {
  const { state, activeWorkspace } = useStore();
  const { pathname, search } = useLocation();
  const { t: tr } = useLocale();
  const app = resolveWorkspaceApp(pathname, search, activeWorkspace);
  if (!app) return <Navigate to="/discover" replace />;
  if (app === 'recruitment') return <RecruitmentDashboard />;
  if (isHRApp(app)) return <HRDashboard app={app} />;
  if (app === 'approvals') return <Home />;
  if (app === 'surveys') return <SurveysDashboard />;
  if (app === 'meetings') return <MeetingsDashboard />;

  const tasks = app === 'tasks';
  const openTasks = state.tasks.filter((task) => !isDone(state, task));
  const upcoming = state.meetings.filter((meeting) => meeting.status !== 'cancelled' && new Date(meeting.start).getTime() >= Date.now()).sort((a, b) => a.start.localeCompare(b.start));
  const stats = tasks ? [
    { label: 'Open tasks', count: openTasks.length },
    { label: 'Assigned to you', count: openTasks.filter((task) => task.ownerId === state.meId).length },
    { label: 'Overdue', count: openTasks.filter((task) => daysUntil(task.due) < 0).length },
  ] : [
    { label: 'Upcoming meetings', count: upcoming.length },
    { label: 'Your upcoming meetings', count: upcoming.filter((meeting) => meeting.organizerId === state.meId || meeting.attendeeIds.includes(state.meId)).length },
    { label: 'Decisions recorded', count: state.meetings.reduce((sum, meeting) => sum + meeting.decisions.length, 0) },
  ];
  const items = tasks ? [...openTasks].sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5).map((task) => ({ id: task.id, title: task.title, date: task.due, href: '/tasks' })) : upcoming.slice(0, 5).map((meeting) => ({ id: meeting.id, title: meeting.title, date: meeting.start, href: `/meetings/${meeting.id}` }));

  return <>
    <PageHeader title={tr(tasks ? 'Tasks dashboard' : 'Meetings dashboard')} subtitle={tr(tasks ? 'Plan your next sprint and keep your team’s work moving.' : 'Make space for the next conversation.')} primaryAction={{ content: tr(tasks ? 'Open tasks' : 'Schedule a meeting'), href: tasks ? '/tasks' : canContributeToApp(state, 'meetings') ? '/meetings/new' : '/meetings' }} />
    {tasks && <Card><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">{state.sprints.find((sprint) => sprint.status === 'active')?.name ?? tr('Plan your next sprint')}</h2><p className="mt-1 text-sm text-muted-foreground">{tr('Choose a one-week, two-week or custom sprint, then plan tasks from your backlog.')}</p></div><Link to="/tasks" className="an-app-overview-link">{tr('Open tasks')}<ArrowRight size={16} aria-hidden /></Link></div></Card>}
    <div className="an-app-overview-stats">
      {stats.map(({ label, count }) => <Card key={label}><div className="an-app-overview-stat"><span>{tr(label)}</span><strong>{count}</strong></div></Card>)}
    </div>
    <Card>
      <h2 className="text-lg font-semibold">{tr(tasks ? 'Next tasks' : 'Upcoming meetings')}</h2>
      {items.length ? <ul className="mt-4 divide-y divide-border">
        {items.map((item) => <li key={item.id}><Link to={item.href} className="flex min-h-14 items-center justify-between gap-4 rounded-sm py-3 text-sm hover:text-link focus-visible:outline-2 focus-visible:outline-ring"><span className="min-w-0 break-words font-medium">{item.title}</span><span className="shrink-0 text-muted-foreground">{formatShortDate(item.date)}</span></Link></li>)}
      </ul> : <p className="py-8 text-sm text-muted-foreground">{tr(tasks ? 'No open tasks. Your team is all caught up.' : 'No upcoming meetings. Schedule one when you’re ready.')}</p>}
      <Link to={tasks ? '/tasks' : '/meetings'} className="an-app-overview-link">{tr(tasks ? 'Open tasks' : 'Open meetings')}<ArrowRight size={16} aria-hidden /></Link>
    </Card>
  </>;
}

