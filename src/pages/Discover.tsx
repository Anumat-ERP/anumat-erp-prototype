import { ArrowRight, CalendarDays, ClipboardCheck, FolderOpen, ListChecks, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router';
import { useEffect } from 'react';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { markModuleCatalogSeen } from '../lib/moduleEntry';
import '../styles/module-catalog.css';

const modules = [
  { title: 'Requests & approvals', description: 'Review decisions and keep the full approval history together.', action: 'Open approvals', href: '/approvals', icon: ClipboardCheck, tone: 'blue' },
  { title: 'Tasks', description: 'See what needs doing, assign work, and follow progress through completion.', action: 'Open tasks', href: '/tasks', icon: ListChecks, tone: 'green' },
  { title: 'Meetings', description: 'Plan a meeting, capture decisions, and keep the next steps visible.', action: 'Open meetings', href: '/meetings', icon: CalendarDays, tone: 'violet' },
] as const;

/** First visit entry point, available later from the workspace sidebar. */
export function Discover() {
  const { t: tr } = useLocale();
  const { state, activeWorkspace } = useStore();
  useEffect(() => { markModuleCatalogSeen(activeWorkspace); }, [activeWorkspace]);

  return <div className="an-modules">
    <div className="an-modules-intro">
      <div>
        <p className="an-modules-eyebrow">{tr('YOUR WORKSPACE')}</p>
        <h1>{tr('What would you like to work on?')}</h1>
        <p>{tr('Choose a part of {name} to get started.', { name: state.org.name })}</p>
      </div>
      <Link to="/home" className="an-modules-dashboard"><LayoutDashboard size={17} aria-hidden />{tr('Go to dashboard')}<ArrowRight size={16} aria-hidden /></Link>
    </div>
    <div className="an-modules-grid">
      {modules.map(({ title, description, action, href, icon: Icon, tone }) => <Link key={href} to={href} className="an-module-card">
        <span className={`an-module-icon an-module-icon--${tone}`}><Icon size={22} strokeWidth={1.8} aria-hidden /></span>
        <span className="an-module-body"><strong>{tr(title)}</strong><span>{tr(description)}</span></span>
        <span className="an-module-action">{tr(action)} <ArrowRight size={16} aria-hidden /></span>
      </Link>)}
      <div className="an-module-card an-module-card--upcoming" aria-label={`${tr('Resources')} — ${tr('Coming soon')}`}>
        <span className="an-module-icon an-module-icon--amber"><FolderOpen size={22} strokeWidth={1.8} aria-hidden /></span>
        <span className="an-module-body"><strong>{tr('Resources')}</strong><span>{tr('See available rooms, equipment, and other shared resources in one place.')}</span></span>
        <span className="an-module-soon">{tr('Coming soon')}</span>
      </div>
    </div>
  </div>;
}
