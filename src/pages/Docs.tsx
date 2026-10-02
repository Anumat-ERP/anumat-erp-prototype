import { ArrowRight, BookOpen, FileText, Inbox, Search, Workflow } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { PublicHeader } from '../components/PublicHeader';
import { useLocale } from '../i18n/LocaleProvider';

const GUIDES = [
  { slug: '', title: 'Introduction', icon: BookOpen, summary: 'Every request becomes a clear decision.', sections: [
    { id: 'overview', title: 'One workspace, from request to result', text: 'Requests, approvals, meetings, documents and tasks live in one place, linked to each other, so every request ends in a clear decision and the work that follows it.' },
    { id: 'workflow', title: 'How it works', text: 'Raise a request with the details and supporting files. Your approval process routes it to the right people. Reviewers make a decision with a reason on record, and your team follows up with tasks and deadlines.' },
    { id: 'prototype', title: 'Explore the prototype', text: 'Submit requests, review approvals, build approval processes and switch between demo people. Changes are saved in your browser. Reset the demo from the account menu whenever you want.' },
  ] },
  { slug: 'quickstart', title: 'Quickstart', icon: ArrowRight, summary: 'Create an approval process, then try your first request.', sections: [
    { id: 'workspace', title: '1. Open the workspace', text: 'Open the prototype to explore the demo company, or choose Create a workspace to walk through setup. Requests and approval processes start empty.' },
    { id: 'process', title: '2. Create a process', text: 'Open Approval processes, choose New process, assign the reviewers, and save it as active.' },
    { id: 'request', title: '3. Raise a request', text: 'Open Requests and choose New request. Pick the active request type, add a title and the required details, and submit it for approval.' },
    { id: 'decision', title: '4. Follow the decision', text: 'Open the request to see its approval steps and history. Switch to its approver from the account menu, then open Approvals to review the request.' },
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

export function Docs() {
  const { topic = '' } = useParams();
  const { t: tr } = useLocale();
  const [query, setQuery] = useState('');
  const guide = GUIDES.find(item => item.slug === topic);
  const matches = GUIDES.filter(item => tr(item.title).toLowerCase().includes(query.trim().toLowerCase()) || tr(item.summary).toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="an-docs min-h-dvh bg-surface text-fg">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-surface focus:p-3">{tr('Skip to content')}</a>
    <PublicHeader />
    <div className="an-docs-layout">
      <aside className="an-docs-sidebar">
        <Link className="an-docs-brand" to="/docs"><BookOpen aria-hidden className="size-4" />{tr('Documentation')}</Link>
        <label className="an-docs-search"><Search aria-hidden className="size-4" /><input type="search" aria-label={tr('Search documentation')} placeholder={tr('Search documentation')} value={query} onChange={event => setQuery(event.target.value)} /></label>
        <nav aria-label={tr('Documentation')}><span className="an-docs-group">{tr('Get started')}</span>{matches.map(({ slug, title, icon: Icon }) => <Link key={slug} to={`/docs${slug ? `/${slug}` : ''}`} aria-current={topic === slug ? 'page' : undefined}><Icon aria-hidden className="size-4" />{tr(title)}</Link>)}{matches.length === 0 && <p role="status">{tr('No results found')}</p>}</nav>
        <Link className="an-docs-open" to="/home">{tr('Open the prototype')}<ArrowRight aria-hidden className="size-4" /></Link>
      </aside>
      <main id="main-content" tabIndex={-1} className="an-docs-article outline-none" key={topic}>
        {guide ? <>
          <span className="an-eyebrow">{tr('Get started')}</span><h1>{tr(guide.title)}</h1><p className="an-docs-lead">{tr(guide.summary)}</p>
          <div className="an-docs-notice">{tr('Browser-only prototype. Changes stay on this device.')}</div>
          {guide.sections.map(section => <section key={section.id} id={section.id}><h2>{tr(section.title)}</h2><p>{tr(section.text)}</p></section>)}
          {topic === '' && <div className="an-docs-cards">{GUIDES.slice(1).map(({ slug, title, summary, icon: Icon }) => <Link to={`/docs/${slug}`} key={slug}><Icon aria-hidden className="size-5" /><h3>{tr(title)}</h3><p>{tr(summary)}</p><ArrowRight aria-hidden className="size-4" /></Link>)}</div>}
          <div className="an-docs-bottom"><Link to="/support">{tr('Help & support')}</Link><Link to={topic === '' ? '/docs/quickstart' : '/home'}>{tr(topic === '' ? 'Quickstart' : 'Open the prototype')}<ArrowRight aria-hidden className="size-4" /></Link></div>
        </> : <><h1>{tr('Page not found')}</h1><Link to="/docs" className="text-fg-link">{tr('Documentation')}</Link></>}
      </main>
      {guide && <nav className="an-docs-toc" aria-label={tr('On this page')}><span>{tr('On this page')}</span>{guide.sections.map(section => <Link key={section.id} to={`#${section.id}`}>{tr(section.title)}</Link>)}</nav>}
    </div>
  </div>;
}
