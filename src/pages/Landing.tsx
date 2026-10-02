import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button } from '@app/ui';
import { ArrowRight, Check, FileText, History, Inbox, ShieldCheck, Workflow } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { ContactChannels } from '../components/ContactChannels';
import { useTour } from '../components/DemoTour';
import { Logo } from '../components/Logo';
import { PublicHeader } from '../components/PublicHeader';
import { useLocale } from '../i18n/LocaleProvider';
import workspaceArt from '../assets/illustrations/workspace-folder.webp';
import dashboardPreview from '../assets/illustrations/dashboard-preview.webp';

const MODULES = [
  { icon: FileText, title: 'Requests', text: 'Purchases, leave, expenses and contracts. Raise a request with the details your approvers need.', to: '/requests', tone: 'blue' },
  { icon: Inbox, title: 'Approvals', text: 'A focused queue for each approver. Review the context, make a decision and keep work moving.', to: '/approvals', tone: 'purple' },
  { icon: Workflow, title: 'Approval processes', text: 'Choose who approves what. Route requests by type and amount, with rules you can change.', to: '/processes', tone: 'green' },
];
const FLOW = [
  { title: 'Raise a request', text: 'Add the context, amount and supporting files in one place.' },
  { title: 'Send it to the right people', text: 'Your approval process decides the route, so ownership is clear.' },
  { title: 'Make a decision', text: 'Approve, decline or ask for changes, with a reason on record.' },
  { title: 'Keep the full picture', text: 'Follow the status and return to the history whenever you need it.' },
];
const FAQ = [
  { q: 'What is Anumat?', a: 'A decision and operations workspace. Requests, approvals and approval processes live in one place, so everyone knows who decides and what happens next.' },
  { q: 'What can I try in the prototype?', a: 'Submit requests, review approvals, build approval processes and switch between demo people. Changes are saved in your browser. Reset the demo from the account menu whenever you want.' },
  { q: 'How does pricing work?', a: 'It’s free during the pilot, with fair-use limits. Pricing will be agreed with pilot companies before the pilot ends. Cloud, private cloud and on-premise deployment options are described on the pricing page.' },
  { q: 'Does this prototype send real messages?', a: 'No. This prototype keeps demo data in your browser. Email, Telegram and sign-in interactions are demonstrations.' },
];

export function Landing() {
  const { t: tr } = useLocale();
  const navigate = useNavigate();
  const tour = useTour();
  const startFree = () => navigate(tour.step !== null ? '/welcome?demo=1' : '/welcome');
  return <div className="an-marketing min-h-dvh bg-bg text-fg">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-surface focus:p-3">{tr('Skip to content')}</a>
    <PublicHeader />
    <main id="main-content" tabIndex={-1} className="outline-none">
      <section className="an-marketing-hero" aria-labelledby="hero-title">
        <div className="an-hero-copy">
          <h1 id="hero-title">{tr('Requests + approvals.')}<br />{tr('All together.')}</h1>
          <p>{tr('One workspace for the decisions that keep your company moving. Request, review and approve with clear ownership at every step.')}</p>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" size="lg" trailingIcon={<ArrowRight />} onClick={tour.start}>{tr('See how it works')}</Button>
            <Button size="lg" onClick={startFree}>{tr('Create a workspace')}</Button>
          </div>
          <p className="an-hero-note">{tr('Explore the prototype with demo data. No account needed.')}</p>
        </div>
        <div className="an-hero-preview">
          <span className="an-preview-tag"><Check aria-hidden className="size-4" />{tr('Clear decisions')}</span>
          <img src={dashboardPreview} alt={tr('Anumat dashboard with requests waiting for approval and a team overview.')} width="1440" height="1000" fetchPriority="high" />
          <div className="an-preview-decision"><span className="an-preview-check"><Check aria-hidden className="size-5" /></span><div><strong>{tr('A decision, with context')}</strong><p>{tr('Every step stays on record.')}</p></div></div>
        </div>
      </section>
      <div className="an-use-cases" aria-label={tr('Request types')}>
        {['Purchase requests', 'Leave and time off', 'Expense claims', 'Contract review'].map((label) => <span key={label}><Check aria-hidden className="size-4" />{tr(label)}</span>)}
      </div>
      <section id="how" className="an-public-section an-flow-section" aria-labelledby="how-title">
        <div className="an-flow-art"><img src={workspaceArt} alt="" width="1024" height="1024" loading="lazy" /></div>
        <div>

          <h2 id="how-title">{tr('Good decisions start with a clear process.')}</h2>
          <ol className="an-flow-list">{FLOW.map((step, i) => <li key={step.title}><span aria-hidden>{i + 1}</span><div><h3>{tr(step.title)}</h3><p>{tr(step.text)}</p></div></li>)}</ol>
          <Button variant="primary" trailingIcon={<ArrowRight />} onClick={() => navigate('/home')}>{tr('Open the prototype')}</Button>
        </div>
      </section>
      <section id="product" className="an-public-section" aria-labelledby="product-title">
        <div className="an-section-intro"><h2 id="product-title">{tr('One workspace. Less back and forth.')}</h2><p>{tr('Keep the request, the people and the decision connected.')}</p></div>
        <div className="an-module-grid">{MODULES.map(({ icon: Icon, title, text, to, tone }) => <Link className="an-module-card" to={to} key={title}>
          <span className={`an-module-icon an-module-${tone}`} aria-hidden><Icon className="size-6" /></span><h3>{tr(title)}</h3><p>{tr(text)}</p><span className="an-module-link">{tr('Explore')}<ArrowRight aria-hidden className="size-4" /></span>
        </Link>)}</div>
      </section>
      <section id="trust" className="an-public-section an-trust-section" aria-labelledby="trust-title">
        <div><h2 id="trust-title">{tr('Know who decides. Know what happened.')}</h2><p>{tr('Approvers are assigned by your process. Decisions and comments stay with the request, so the history is easy to follow.')}</p></div>
        <div className="an-trust-list"><div><ShieldCheck aria-hidden /><h3>{tr('People and roles')}</h3><p>{tr('Choose who manages your workspace and who reviews each request.')}</p></div><div><History aria-hidden /><h3>{tr('A history you can follow')}</h3><p>{tr('See every submission, decision and comment, with who and when.')}</p></div></div>
      </section>
      <section id="faq" className="an-public-section an-faq-section" aria-labelledby="faq-title"><h2 id="faq-title">{tr('A few things to know')}</h2><Accordion type="single" collapsible>{FAQ.map(({q,a},i) => <AccordionItem value={`faq-${i}`} key={q}><AccordionTrigger>{tr(q)}</AccordionTrigger><AccordionContent>{tr(a)}</AccordionContent></AccordionItem>)}</Accordion></section>
      <section className="an-public-section an-public-close"><h2>{tr('Make the next decision clearer.')}</h2><p>{tr('Try the approval workflow with a ready-to-use demo workspace.')}</p><Button size="lg" trailingIcon={<ArrowRight />} variant="primary" onClick={() => navigate('/home')}>{tr('Open the prototype')}</Button></section>
    </main>
    <footer className="an-public-footer"><div><Logo className="h-8 w-auto" /><p>{tr('Requests, approvals and a clear way forward.')}</p><p className="text-sm text-fg-muted">{tr('Browser-only prototype. Changes stay on this device.')}</p></div><nav aria-label="Footer"><Link to="/pricing">{tr('Pricing & deployment')}</Link><Link to="/signin">{tr('Sign in')}</Link><Link to="/support">{tr('Help & support')}</Link><ContactChannels /></nav></footer>
  </div>;
}
