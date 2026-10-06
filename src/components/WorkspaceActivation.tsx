import { Button } from '@app/ui';
import { ArrowRight, Check, Circle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { appPeople } from '../lib/appAccess';
import { businessStarter } from '../lib/businessStarter';
import '../styles/sme-experience.css';

const KEY = 'anumat-dismissed-setup-v1';
function dismissedIds(): string[] { try { const value = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(value) ? value.filter(id => typeof id === 'string') : []; } catch { return []; } }
/** Progress comes from saved work, never from clicking a tutorial checkbox. */
export function WorkspaceActivation() {
  const { state, me, activeWorkspace } = useStore();
  const { t: tr } = useLocale();
  const [dismissed, setDismissed] = useState(() => dismissedIds().includes(activeWorkspace));
  if (!state.org.starter || me.access !== 'owner') return null;
  const starter = businessStarter(state.org.starter);
  const people = starter.id === 'people';
  const app = starter.app;
  const processReady = state.processes.some(process => process.active);
  const rows = people ? [
    { title: 'Add your first employee', description: 'Start with a name, role, and employment dates.', done: !!state.hr?.employees.length, href: '/employees?tab=employees&create=1' },
    { title: 'Add a teammate to the app', description: 'Invite someone to this app, then confirm their access after acceptance.', done: appPeople(state, app).length > 1, href: `/${app}/people` },
    { title: 'Try a leave request', description: 'Use an employee record to submit dates and follow the review.', done: !!state.hr?.leaves.length, href: '/employees?tab=leaves&create=1' },
  ] : [
    { title: 'Add a teammate to the app', description: 'Invite someone to this app, then confirm their access after acceptance.', done: appPeople(state, app).length > 1, href: '/approvals/people' },
    { title: 'Set up an approval process', description: 'Choose the information to collect and who reviews the request.', done: processReady, href: '/processes' },
    { title: 'Submit your first request', description: 'Give the reviewer enough context to make a decision.', done: state.requests.some(request => request.status !== 'draft'), href: processReady ? '/requests/new' : '/processes' },
    { title: 'Create a follow-up task', description: 'Give the next action an owner, expected outcome, and due date.', done: !!state.tasks.length, href: '/tasks' },
  ];
  const complete = rows.filter(row => row.done).length;
  if (complete === rows.length) return null;
  const toggle = (value: boolean) => {
    setDismissed(value);
    try { localStorage.setItem(KEY, JSON.stringify(value ? [...new Set([...dismissedIds(), activeWorkspace])] : dismissedIds().filter(id => id !== activeWorkspace))); } catch { /* In-memory preference still works. */ }
  };
  if (dismissed) return <Button variant="tertiary" className="self-start" onClick={() => toggle(false)}>{tr('Show getting started')}<ChevronDown size={14} aria-hidden /></Button>;
  return <section className="an-activation" aria-labelledby="activation-title">
    <div className="an-activation-heading"><div><h2 id="activation-title">{tr('Get your first workflow running')}</h2><p>{tr('{complete} of {total} steps complete', { complete, total: rows.length })}</p></div><Button variant="tertiary" size="sm" onClick={() => toggle(true)}>{tr('Hide for now')}</Button></div>
    <ol>{rows.map(row => <li key={row.title} data-complete={row.done || undefined}>{row.done ? <Check size={18} aria-label={tr('Complete')} /> : <Circle size={18} aria-hidden />}<div><strong>{tr(row.title)}</strong><p>{tr(row.description)}</p>{row.title === 'Submit your first request' && !processReady && <span>{tr('Set up an active process first.')}</span>}</div>{row.done ? <span className="an-activation-done">{tr('Complete')}</span> : <Link to={row.href} aria-label={tr('Start: {step}', { step: tr(row.title) })}>{tr('Start')}<ArrowRight size={14} aria-hidden /></Link>}</li>)}</ol>
    <p className="an-activation-note">{tr('Progress updates when records are saved. Invitations are local prototype links; no email is sent.')}</p>
  </section>;
}
