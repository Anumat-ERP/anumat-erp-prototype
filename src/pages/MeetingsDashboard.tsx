import { useState } from 'react';
import { TaskDrawer } from '../components/TaskDrawer';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { Button, Card, PageHeader } from '@app/ui';
import { appRole, canContributeToApp } from '../lib/appAccess';
import { isDone, useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { formatDate, formatDateTime } from '../lib/format';
import '../styles/hr-workspace.css';
export function MeetingsDashboard() {
  const { state } = useStore();
  const { t: tr } = useLocale();
  const [taskId, setTaskId] = useState<string>();
  const contribute = canContributeToApp(state, 'meetings');
  const now = Date.now();
  const upcoming = state.meetings.filter(meeting => meeting.status !== 'cancelled' && Date.parse(meeting.start) + meeting.durationMin * 60000 > now).sort((a, b) => a.start.localeCompare(b.start));
  const mine = upcoming.filter(meeting => meeting.organizerId === state.meId || meeting.attendeeIds.includes(state.meId));
  const actions = appRole(state, 'tasks') ? state.tasks.filter(task => !isDone(state, task) && task.source?.href.startsWith('/meetings/') && (task.ownerId === state.meId || task.assignedById === state.meId)) : [];
  const stats = [
    { label: 'Upcoming meetings', count: upcoming.length, href: '/meetings?status=upcoming' },
    { label: 'Your upcoming meetings', count: mine.length, href: '/meetings?status=upcoming&mine=1' },
    { label: 'Decisions recorded', count: state.meetings.reduce((sum, meeting) => sum + meeting.decisions.length, 0), href: '/meetings?decisions=1' },
  ];
  return <>
    <PageHeader title={tr('Meetings dashboard')} subtitle={tr('Prepare the agenda, record decisions and follow through on assigned actions.')}
      primaryAction={{ content: tr(contribute ? 'Schedule a meeting' : 'Open meetings'), href: contribute ? '/meetings/new' : '/meetings' }}
      secondaryActions={[{ content: tr('People & roles'), href: '/meetings/people' }]} />
    <nav className="an-hr-dashboard-summary" aria-label={tr('Workflow summary')}>
      {stats.map(stat => <Link key={stat.label} to={stat.href}><span>{tr(stat.label)}</span><strong>{stat.count}</strong><ArrowRight size={16} aria-hidden /></Link>)}
    </nav>
    <div className="an-hr-dashboard-grid">
      <Card className="min-w-0"><h2 className="text-lg font-semibold">{tr('Your next meetings')}</h2>
        {mine.length ? <ul className="an-hr-dashboard-list">{mine.slice(0, 6).map(meeting => <li key={meeting.id}><Link to={`/meetings/${meeting.id}`}>
          <span><strong>{meeting.title}</strong><small>{formatDateTime(meeting.start)} · {meeting.location}</small></span><ArrowRight size={16} aria-hidden />
        </Link></li>)}</ul> : <p className="py-6 text-sm text-muted-foreground">{tr('No upcoming meetings assigned to you.')}</p>}
        <Button asChild variant="tertiary"><Link to="/meetings">{tr('Open meetings')}</Link></Button>
      </Card>
      <Card className="min-w-0"><h2 className="text-lg font-semibold">{tr('Your meeting actions')}</h2>
        {actions.length ? <ul className="an-hr-dashboard-list">{actions.slice(0, 6).map(task => <li key={task.id}><Button variant="tertiary" className="h-auto min-h-9 w-full justify-between whitespace-normal py-3 text-start" onClick={() => setTaskId(task.id)}>
          <span><strong>{task.title}</strong><small>{task.due ? formatDate(task.due) : tr('No due date')}</small></span><ArrowRight size={16} aria-hidden />
        </Button></li>)}</ul> : <p className="py-6 text-sm text-muted-foreground">{tr('No open meeting actions assigned to you.')}</p>}
        {appRole(state, 'tasks') && <Button asChild variant="tertiary"><Link to="/tasks">{tr('Open tasks')}</Link></Button>}
      </Card>
    </div>
    {upcoming.some(meeting => !mine.includes(meeting)) && <Card><h2 className="text-lg font-semibold">{tr('Other upcoming meetings')}</h2>
      <ul className="an-hr-dashboard-list">{upcoming.filter(meeting => !mine.includes(meeting)).slice(0, 5).map(meeting => <li key={meeting.id}><Link to={`/meetings/${meeting.id}`}><span><strong>{meeting.title}</strong><small>{formatDateTime(meeting.start)}</small></span><ArrowRight size={16} aria-hidden /></Link></li>)}</ul>
    </Card>}
    {taskId && <TaskDrawer task={state.tasks.find(task => task.id === taskId) ?? null} creating={false} onClose={() => setTaskId(undefined)} />}
  </>;
}
