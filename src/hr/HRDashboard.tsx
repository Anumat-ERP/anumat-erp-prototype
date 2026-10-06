import { HRWorkflowGuide } from './WorkspaceGuide';
import { ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { Badge, Banner, Button, Card, PageHeader } from '@app/ui';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { APP_NAMES } from '../lib/appAccess';
import { HR_MODULES, STATUS_NAMES } from './catalog';
import { canLoadExamples } from './engine';
import { hrDashboard, type DashboardItem } from './dashboard';
import type { HRApp } from './types';
import '../styles/hr-workspace.css';

function DashboardList({ title, items, empty }: { title: string; items: DashboardItem[]; empty: string }) {
  const { t: tr } = useLocale();
  return <Card className="min-w-0">
    <h2 className="text-lg font-semibold">{tr(title)}</h2>
    {items.length ? <ul className="an-hr-dashboard-list">{items.slice(0, 8).map(item => <li key={item.id}>
      <Link to={item.href}>
        <span className="min-w-0"><strong>{item.title}</strong><small>{item.detail}</small></span>
        <Badge>{tr(STATUS_NAMES[item.status] ?? item.status)}</Badge>
        <ArrowRight size={16} aria-hidden className="shrink-0" />
      </Link>
    </li>)}</ul> : <p className="py-6 text-sm text-muted-foreground">{tr(empty)}</p>}
    {items.length > 8 && <p className="mt-3 text-sm text-muted-foreground">{tr('Showing the first {count} records. Open the workspace to see all.', { count: 8 })}</p>}
  </Card>;
}
export function HRDashboard({ app }: { app: HRApp }) {
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const model = hrDashboard(state, app);
  return <>
    <PageHeader title={tr(APP_NAMES[app])} subtitle={tr(HR_MODULES[app].description)}
      primaryAction={{ content: tr('Open workspace'), href: `/${app}`, icon: <ArrowRight /> }}
      secondaryActions={[{ content: tr('People & roles'), href: `/${app}/people` }]}
      titleMetadata={<Badge>{tr('Prototype')}</Badge>} />
    <nav className="an-hr-dashboard-summary" aria-label={tr('Workflow summary')}>
      {model.metrics.map(metric => <Link key={metric.label} to={metric.href}><span>{tr(metric.label)}</span><strong>{metric.count}</strong><ArrowRight size={16} aria-hidden /></Link>)}
    </nav>
    <section className="an-hr-dashboard-actions" aria-label={tr('Get started')}>
      <p>{tr(model.guidance)}</p>
      <div className="flex flex-wrap gap-2">
        {model.actions.map(action => <Button key={action.href} asChild icon={<Plus aria-hidden />}><Link to={action.href}>{tr(action.label)}</Link></Button>)}
        {model.dependencies.map(action => <Button key={action.href} variant="secondary" asChild><Link to={action.href}>{tr(action.label)}</Link></Button>)}
      </div>
    </section>
    <div className="an-hr-dashboard-grid">
      <DashboardList title="Needs attention" items={model.queue} empty="No records need attention right now." />
      <DashboardList title={app === 'attendance' ? 'Attendance periods' : app === 'training' ? 'Courses' : app === 'assets' ? 'Room reservations' : 'Recent records'} items={model.recent} empty="Create a record to start this workflow." />
    </div>
    <HRWorkflowGuide app={app} />
    {canLoadExamples(state) && <Banner title={tr('Explore with fictional data')}
      action={{ label: tr('Load HR examples'), onAction: () => dispatch({ type: 'hr', command: { kind: 'loadExamples' } }) }}>
      {tr('Create records or load fictional examples to explore the prototype.')}
    </Banner>}
    {app === 'payroll' ? <Banner tone="warning" title={tr('Illustrative payroll only')}>{tr('Preview = full base pay + flat adjustment. Tax, NSSF, overtime pay and payments are not calculated.')}</Banner> : <p className="text-sm text-muted-foreground">{tr('Records stay in this browser and workspace.')}</p>}
  </>;
}
