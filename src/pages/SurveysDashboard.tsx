import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { Badge, Button, Card, PageHeader } from '@app/ui';
import { canManageSurveys, isOpen, surveysToAnswer, useStore, visibleSurveys } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { closesLabel } from './Surveys';
import '../styles/hr-workspace.css';
export function SurveysDashboard() {
  const { state } = useStore();
  const { t: tr } = useLocale();
  const manage = canManageSurveys(state);
  const visible = visibleSurveys(state);
  const waiting = surveysToAnswer(state);
  const drafts = visible.filter(survey => survey.status === 'draft');
  const open = visible.filter(isOpen);
  const closed = visible.filter(survey => survey.status !== 'draft' && !isOpen(survey));
  const stats = [
    { label: 'Open surveys', count: open.length, href: '/surveys?status=open' },
    { label: manage ? 'Draft surveys' : 'Waiting for your answer', count: manage ? drafts.length : waiting.length, href: manage ? '/surveys?status=draft' : '/surveys?waiting=1' },
    { label: 'Closed surveys', count: closed.length, href: '/surveys?status=closed' },
  ];
  const recent = [...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  return <>
    <PageHeader title={tr('Surveys & evaluations dashboard')} subtitle={tr('Team feedback and training evaluations, in one place.')}
      primaryAction={{ content: tr(manage ? 'New survey' : 'View surveys'), href: manage ? '/surveys/new' : '/surveys' }}
      secondaryActions={[{ content: tr('People & roles'), href: '/surveys/people' }]} />
    <nav className="an-hr-dashboard-summary" aria-label={tr('Workflow summary')}>
      {stats.map(stat => <Link key={stat.label} to={stat.href}><span>{tr(stat.label)}</span><strong>{stat.count}</strong><ArrowRight size={16} aria-hidden /></Link>)}
    </nav>
    {waiting.length > 0 && <Card><h2 className="text-lg font-semibold">{tr('Waiting for your answer')}</h2>
      <ul className="an-hr-dashboard-list">{waiting.slice(0, 6).map(survey => <li key={survey.id}><Link to={`/surveys/${survey.id}`}><span><strong>{survey.title}</strong><small>{closesLabel(survey, tr)}{survey.anonymous ? ` · ${tr('Anonymous')}` : ''}</small></span><span>{tr('Answer now')}</span><ArrowRight size={16} aria-hidden /></Link></li>)}</ul>
    </Card>}
    <Card><h2 className="text-lg font-semibold">{tr(manage ? 'Recent surveys' : 'Your surveys')}</h2>
      {recent.length ? <ul className="an-hr-dashboard-list">{recent.map(survey => <li key={survey.id}>
        <Link to={survey.status === 'draft' ? `/surveys/${survey.id}/edit` : `/surveys/${survey.id}`}>
          <span><strong>{survey.title}</strong></span><Badge>{tr(survey.status === 'draft' ? 'Draft' : isOpen(survey) ? 'Open' : 'Closed')}</Badge><ArrowRight size={16} aria-hidden />
        </Link>
        <p className="pb-3 text-sm text-muted-foreground">{closesLabel(survey, tr)}{survey.anonymous ? ` · ${tr('Anonymous')}` : ''}</p>
      </li>)}</ul> : <p className="py-6 text-sm text-muted-foreground">{tr(manage ? 'Create a survey to collect feedback or evaluate a training session.' : 'No surveys waiting for your answer.')}</p>}
      <Button asChild variant="tertiary"><Link to="/surveys">{tr('View surveys')}</Link></Button>
    </Card>
    <p className="text-sm text-muted-foreground">{tr('Anonymous survey totals appear after at least 3 responses.')}</p>
  </>;
}
