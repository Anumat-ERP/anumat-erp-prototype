import { Button, EmptyState, SearchField } from '@app/ui';
import { ArrowRight, BookOpen, LockKeyhole } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { selectWorkspaceApp } from '../lib/moduleEntry';
import { APP_CATALOG, APP_GROUPS } from '../lib/appCatalog';
import { appRole } from '../lib/appAccess';
import { WorkspaceGuide } from '../components/WorkspaceGuide';
import { WorkspaceWelcomeMotion } from '../components/WorkspaceWelcomeMotion';
import approvalsArt from '../assets/illustrations/app-approvals.webp';
import tasksArt from '../assets/illustrations/app-tasks.webp';
import meetingsArt from '../assets/illustrations/app-meetings.webp';
import surveysArt from '../assets/illustrations/app-surveys.webp';
import '../styles/module-catalog.css';

const illustrations: Record<string, string> = { approvals: approvalsArt, tasks: tasksArt, meetings: meetingsArt, surveys: surveysArt };
export function Discover() {
  const { t: tr } = useLocale();
  const { state, activeWorkspace } = useStore();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const category = APP_GROUPS.some(group => group.id === params.get('group')) ? params.get('group')! : 'all';
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); if (value && value !== 'all') next.set(key, value); else next.delete(key); setParams(next, { replace: true }); };
  const visibleGroups = APP_GROUPS.filter(group => category === 'all' || category === group.id).map(group => ({ ...group, apps: group.apps.filter(app => {
    const guide = APP_CATALOG[app];
    return [guide.title, guide.description, group.title, ...guide.steps.flatMap(step => [step.title, step.text])].some(text => tr(text).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  }) })).filter(group => group.apps.length);
  const count = visibleGroups.reduce((total, group) => total + group.apps.length, 0);
  return <div className="an-modules">
    <header className="an-modules-intro">
      <div className="an-modules-intro-copy"><h1>{tr('What would you like to work on?')}</h1><p>{tr('Choose a part of {name} to get started.', { name: state.org.name })}</p></div>
      <WorkspaceWelcomeMotion />
    </header>
    <div className="an-catalog-toolbar">
      <SearchField label={tr('Find an app or workflow')} placeholder={tr('Search apps, leave, hiring, approvals…')} value={query} onChange={value => update('q', value)} debounceMs={0} onClear={() => update('q', '')} />
      <Link to="/docs/quickstart" className="an-app-overview-link"><BookOpen size={16} aria-hidden />{tr('Quickstart')}</Link>
    </div>
    <div className="an-catalog-filters" role="group" aria-label={tr('Filter apps by category')}>
      {[{ id: 'all', title: 'All apps' }, ...APP_GROUPS].map(group => <Button key={group.id} variant={category === group.id ? 'secondary' : 'tertiary'} aria-pressed={category === group.id} onClick={() => update('group', group.id)}>{tr(group.title)}</Button>)}
    </div>
    <p className="an-catalog-count" role="status" aria-live="polite">{tr('{count} apps found', { count })}</p>
    {visibleGroups.map(group => <section key={group.id} aria-labelledby={`apps-${group.id}`}>
      <div className="an-modules-section-heading"><h2 id={`apps-${group.id}`}>{tr(group.title)}</h2><p>{tr(group.description)}</p></div>
      <div className={group.id === 'work' ? 'an-modules-grid' : 'an-planned-apps'}>
        {group.apps.map(app => {
          const { title, description, icon: Icon, steps } = APP_CATALOG[app];
          const allowed = !!appRole(state, app);
          const image = illustrations[app];
          const body = <>
            {image ? <img className="an-module-illustration" src={image} alt="" width="512" height="512" decoding="async" /> : <span className="an-planned-app-icon"><Icon size={24} aria-hidden /></span>}
            <span className="an-module-body"><strong>{tr(title)}</strong><span>{tr(description)}</span><span className="an-catalog-sequence">{steps.map((step, index) => <span key={index}>{index > 0 && <ArrowRight size={12} aria-hidden />}{tr(step.title)}</span>)}</span></span>
            <span className="an-module-action">{allowed ? <>{tr(image ? 'Open app' : 'Open prototype')}<ArrowRight size={16} aria-hidden /></> : <><LockKeyhole size={16} aria-hidden />{tr('Ask an app admin for access.')}</>}</span>
          </>;
          return allowed ? <Link key={app} to={`/home?app=${app}`} onClick={() => selectWorkspaceApp(activeWorkspace, app)} className={image ? 'an-module-card' : 'an-planned-app an-catalog-app'}>{body}</Link> : <div key={app} className={image ? 'an-module-card an-catalog-locked' : 'an-planned-app an-catalog-app an-catalog-locked'}>{body}</div>;
        })}
      </div>
    </section>)}
    {!count && <EmptyState image={null} heading={tr('No apps match your search')} action={<Button onClick={() => setParams({})}>{tr('Clear filters')}</Button>}>{tr('Try an app name or a task such as leave, hiring, or approvals.')}</EmptyState>}
    <WorkspaceGuide />
  </div>;
}
