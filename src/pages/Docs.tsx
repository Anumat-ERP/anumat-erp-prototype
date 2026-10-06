import { APP_CATALOG, APP_GROUPS } from '../lib/appCatalog';
import { WORKSPACE_APPS } from '../lib/moduleEntry';
import { Button, SearchField } from '@app/ui';
import { ArrowRight, BookOpen, FileText, Inbox, Workflow } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { PublicHeader } from '../components/PublicHeader';
import { useLocale } from '../i18n/LocaleProvider';

const START_GUIDES = [
  { slug: '', title: 'Introduction', icon: BookOpen, summary: 'Find your app, understand your role, and follow the workflow.', sections: [
    { id: 'overview', title: 'Find your app', text: 'Explore modules groups apps into Work & collaboration, People & growth, and Operations & reporting. Search by app name or by the work you need to do.', href: '/discover' },
    { id: 'roles', title: 'Understand your role', text: 'Access belongs to each app. Admins manage configuration and membership, members contribute, and viewers read. Task responsibilities are separate from app roles.' },
    { id: 'workflow', title: 'Follow the workflow', text: 'Open an app dashboard, expand How this app works, and follow the links to the relevant work. Switch app keeps you in the same workspace.' },
    { id: 'prototype', title: 'Explore the prototype', text: 'Changes are saved in this browser. Use the account menu to switch demo people and explore their access. Reset demo data only when you want to clear the current demo workspace.' },
  ] },
  { slug: 'quickstart', title: 'Quickstart', icon: ArrowRight, summary: 'Choose an app and find your first task.', sections: [
    { id: 'workspace', title: '1. Open the workspace', text: 'Open the prototype to explore the demo company, or choose Create a workspace to walk through setup. Requests and approval processes start empty.', href: '/home' },
    { id: 'app', title: '2. Choose your app', text: 'Search for the work you need to do, or browse the three app groups. A locked app requires an invitation or access from its admin.', href: '/discover' },
    { id: 'guide', title: '3. Learn the workflow', text: 'Read the three-step guide on the app dashboard. Use its links to reach the work, and check People & roles when you need help with access.' },
    { id: 'request', title: '4. Try a request', text: 'For an approval example, ask an app admin to create an active process. Then submit a request and follow its decision history.', href: '/docs/requests' },
  ] },
  { slug: 'requests', title: 'Requests', icon: FileText, summary: 'Give approvers the context they need to make a decision.', sections: [
    { id: 'create', title: 'Create a request', text: 'Purchases, leave, expenses and contracts each have a request type. Choose New request, fill in the details required by the form and add supporting files when needed.' },
    { id: 'submit', title: 'Submit for approval', text: 'Submit the completed request to start its approval process. The process determines who reviews it and which steps apply to the request.' },
    { id: 'track', title: 'Track the outcome', text: 'Return to the request to follow its status, comments and approval history. Search and filter the Requests list to find the work you need.' },
  ] },
  { slug: 'approvals', title: 'Approvals', icon: Inbox, summary: 'Review the context, make a decision and keep work moving.', sections: [
    { id: 'queue', title: 'Your approval queue', text: 'Open Approvals to see the requests waiting for your review. Open a request to check its details, supporting files and earlier decisions.' },
    { id: 'review', title: 'Make a decision', text: 'Approve, decline or ask for changes, with a reason on record. Complete any required approver fields before approving.' },
    { id: 'history', title: 'Keep the full picture', text: 'Decisions and comments stay with the request. The history records who acted and when, so the team can return to the context later.' },
  ] },
  { slug: 'processes', title: 'Approval processes', icon: Workflow, summary: 'Choose who approves what, without code.', sections: [
    { id: 'process', title: 'Choose a process', text: 'Open Approval processes and select a request type. Starter processes cover purchases, expenses, leave and contracts.' },
    { id: 'steps', title: 'Set the approval steps', text: 'Choose an approver for each step. Steps can run for every request, above an amount threshold or when a form answer matches a condition.' },
    { id: 'fields', title: 'Collect the right details', text: 'Edit the request form to collect the context reviewers need. Add approver fields for information provided during review, such as a budget code or purchase order number.' },
  ] },
];

const APP_GUIDES = WORKSPACE_APPS.map(app => ({ slug: app === 'approvals' ? 'workflow-approvals' : app, title: APP_CATALOG[app].title, icon: APP_CATALOG[app].icon, summary: APP_CATALOG[app].description, app, sections: APP_CATALOG[app].steps.map((step, index) => ({ id: `step-${index + 1}`, title: step.title, text: step.text, href: step.href })) }));
const GUIDES = [...START_GUIDES, ...APP_GUIDES];

export function Docs() {
  const { topic = '' } = useParams();
  const { t: tr } = useLocale();
  const [query, setQuery] = useState('');
  const [navigationOpen, setNavigationOpen] = useState(false);
  const guide = GUIDES.find(item => item.slug === topic);
  const matches = GUIDES.filter(item => [item.title, item.summary, ...item.sections.flatMap(section => [section.title, section.text])].some(text => tr(text).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())));
  return <div className="an-docs min-h-dvh bg-surface text-fg">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-surface focus:p-3">{tr('Skip to content')}</a>
    <PublicHeader />
    <div className="an-docs-layout">
      <aside className="an-docs-sidebar">
        <Link className="an-docs-brand" to="/docs"><BookOpen aria-hidden className="size-4" />{tr('Documentation')}</Link>
        <SearchField label={tr('Search documentation')} placeholder={tr('Search documentation')} value={query} onChange={setQuery} debounceMs={0} />
        <Button variant="secondary" className="an-docs-nav-toggle" aria-expanded={navigationOpen || !!query} aria-controls="docs-navigation" onClick={() => { const open = navigationOpen || !!query; setQuery(''); setNavigationOpen(!open); }}>{tr('Browse guides')}</Button>
        <nav id="docs-navigation" className={navigationOpen || query ? 'an-docs-navigation-open' : ''} aria-label={tr('Documentation')}>
          {[{ title: 'Get started', guides: START_GUIDES }, ...APP_GROUPS.map(group => ({ title: group.title, guides: APP_GUIDES.filter(guide => (group.apps as readonly string[]).includes(guide.app)) }))].map(group => {
            const entries = group.guides.filter(item => matches.some(match => match.slug === item.slug));
            return entries.length ? <div className="an-docs-nav-group" key={group.title}><span className="an-docs-group">{tr(group.title)}</span>{entries.map(({ slug, title, icon: Icon }) => <Link key={slug} to={`/docs${slug ? `/${slug}` : ''}`} onClick={() => { setNavigationOpen(false); setQuery(''); }} aria-current={topic === slug ? 'page' : undefined}><Icon aria-hidden className="size-4" />{tr(title)}</Link>)}</div> : null;
          })}
          {matches.length === 0 && <p role="status">{tr('No results found')}</p>}
        </nav>
        <Link className="an-docs-open" to="/home">{tr('Open the prototype')}<ArrowRight aria-hidden className="size-4" /></Link>
      </aside>
      <main id="main-content" tabIndex={-1} className="an-docs-article outline-none" key={topic}>
        {guide ? <>
          <h1>{tr(guide.title)}</h1><p className="an-docs-lead">{tr(guide.summary)}</p>
          <div className="an-docs-notice">{tr('Browser-only prototype. Changes stay on this device.')}</div>
          {guide.sections.map(section => <section key={section.id} id={section.id}><h2>{tr(section.title)}</h2><p>{tr(section.text)}</p>{'href' in section && <Link className="an-docs-step-link" to={String(section.href)}>{tr('Open {section}', { section: tr(section.title) })}<ArrowRight size={16} aria-hidden /></Link>}</section>)}
          {topic === '' && <div className="an-docs-cards">{START_GUIDES.slice(1).map(({ slug, title, summary, icon: Icon }) => <Link to={`/docs/${slug}`} key={slug}><Icon aria-hidden className="size-5" /><h3>{tr(title)}</h3><p>{tr(summary)}</p><ArrowRight aria-hidden className="size-4" /></Link>)}</div>}
          {topic === '' && APP_GROUPS.map(group => <section key={group.id}><h2>{tr(group.title)}</h2><p>{tr(group.description)}</p><ul className="an-docs-app-index">{group.apps.map(app => <li key={app}><Link to={`/docs/${app === 'approvals' ? 'workflow-approvals' : app}`}><strong>{tr(APP_CATALOG[app].title)}</strong><span>{tr(APP_CATALOG[app].description)}</span><ArrowRight size={16} aria-hidden /></Link></li>)}</ul></section>)}
          <div className="an-docs-bottom"><Link to="/support">{tr('Help & support')}</Link><Link to={topic === '' ? '/docs/quickstart' : '/home'}>{tr(topic === '' ? 'Quickstart' : 'Open the prototype')}<ArrowRight aria-hidden className="size-4" /></Link></div>
        </> : <><h1>{tr('Page not found')}</h1><Link to="/docs" className="text-fg-link">{tr('Documentation')}</Link></>}
      </main>
      {guide && <nav className="an-docs-toc" aria-label={tr('On this page')}><span>{tr('On this page')}</span>{guide.sections.map(section => <a key={section.id} href={`#${section.id}`}>{tr(section.title)}</a>)}</nav>}
    </div>
  </div>;
}
