import { APP_CATALOG, APP_GROUPS } from '../lib/appCatalog';
import { BUSINESS_STARTERS } from '../lib/businessStarter';
import '../styles/sme-experience.css';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@app/ui';
import { ArrowRight, ArrowUp, Check, History, ShieldCheck } from 'lucide-react';
import { useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { ContactChannels } from '../components/ContactChannels';
import { useTour } from '../components/DemoTour';
import { Logo } from '../components/Logo';
import { PublicHeader } from '../components/PublicHeader';
import { WorkflowIllustration } from '../components/WorkflowIllustration';
import { useLocale } from '../i18n/LocaleProvider';
import { useStore } from '../data/store';
import { workspaceEntryPath } from '../lib/moduleEntry';
import { useReveal } from '../lib/motion';
import workspaceArt from '../assets/illustrations/workspace-folder.webp';
import dashboardPreview from '../assets/illustrations/dashboard-preview.webp';

const FLOW = [
  { title: 'Raise a request', text: 'Add the context, amount and supporting files in one place.' },
  { title: 'Send it to the right people', text: 'Your approval process decides the route, so ownership is clear.' },
  { title: 'Make a decision', text: 'Approve, decline or ask for changes, with a reason on record.' },
  { title: 'Act', text: 'Decisions turn into tasks with owners and deadlines.' },
  { title: 'Keep the full picture', text: 'Follow the status and return to the history whenever you need it.' },
];
const FAQ = [
  { q: 'What is Anumat?', a: 'A decision and operations workspace. Requests, approvals, meetings, documents and tasks live in one place, linked to each other, so every request ends in a clear decision and the work that follows it.' },
  { q: 'Who is it for?', a: 'Small and medium businesses that need clearer approvals, task ownership, and people operations. Start with the workflow that causes the most chasing today.' },
  { q: 'What can I try in the prototype?', a: 'Submit requests, review approvals, build approval processes and switch between demo people. Changes are saved in your browser. Reset the demo from the account menu whenever you want.' },
  { q: 'How does pricing work?', a: 'The browser prototype is free to explore. A live pilot, pricing, support, and deployment need an agreed scope before a customer rollout.' },
  { q: 'Does this prototype send real messages?', a: 'No. This prototype keeps demo data in your browser. Email, Telegram and sign-in interactions are demonstrations.' },
];

export function Landing() {
  const { activeWorkspace } = useStore();
  const entryPath = workspaceEntryPath(activeWorkspace);
  const { t: tr } = useLocale();
  const navigate = useNavigate();
  const tour = useTour();
  const mainRef = useRef<HTMLElement>(null);
  useReveal(mainRef);
  const startFree = () => navigate(tour.step !== null ? '/welcome?demo=1' : '/welcome');
  return <div id="top" className="an-marketing min-h-dvh bg-bg text-fg">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-surface focus:p-3">{tr('Skip to content')}</a>
    <PublicHeader />
    <main ref={mainRef} id="main-content" tabIndex={-1} className="outline-none">
      <section className="an-marketing-hero" aria-labelledby="hero-title">
        <div className="an-hero-copy an-stagger">

          <h1 id="hero-title">{tr('Your team’s work, with a clear next step.')}</h1>
          <p>{tr('For small and medium businesses: keep approvals, tasks, and people operations together. Know who owns the work, what needs a decision, and what happens next.')}</p>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" size="lg" trailingIcon={<ArrowRight />} onClick={() => navigate(entryPath)}>{tr('Explore the demo')}</Button>
            <Button size="lg" asChild><Link to="/pricing#contact-sales">{tr('Plan your rollout')}</Link></Button>
          </div>
          <p className="an-hero-note">{tr('Explore in English or Khmer. This browser prototype saves changes on your device.')}</p>
        </div>
        <div className="an-hero-preview">
          <span className="an-preview-tag"><Check aria-hidden className="size-4" />{tr('Clear decisions')}</span>
          <img src={dashboardPreview} alt={tr('Anumat dashboard with requests waiting for approval and a team overview.')} width="1440" height="1000" fetchPriority="high" />
          <div className="an-preview-decision"><span className="an-preview-check"><Check aria-hidden className="size-5" /></span><div><strong>{tr('A decision, with context')}</strong><p>{tr('Every step stays on record.')}</p></div></div>
        </div>
      </section>
      <div className="an-use-cases" aria-label={tr('Request types')}>
        {['Purchase requests', 'Leave and time off', 'Expense claims', 'Contract review', 'Policies and documents', 'Meeting decisions'].map((label) => <span key={label}><Check aria-hidden className="size-4" />{tr(label)}</span>)}
      </div>
      <section data-reveal className="an-public-section" aria-labelledby="problem-title">
        <div className="an-section-intro"><h2 id="problem-title">{tr('Work slows down when decisions are scattered.')}</h2></div>
        <div className="an-problem-grid">{[
          { title: 'Lost requests', text: 'Important requests get buried in email and chat threads.' },
          { title: 'Unclear ownership', text: 'Nobody is sure who decides, or what happens next.' },
          { title: 'Slow decisions', text: 'Approvals wait for days because nobody knows they’re stuck.' },
          { title: 'Missing evidence', text: 'Quotes, context and the reason for a decision are hard to find later.' },
        ].map(({ title, text }) => <div key={title}><h3>{tr(title)}</h3><p>{tr(text)}</p></div>)}</div>
      </section>
      <section data-reveal id="how" className="an-public-section an-flow-section" aria-labelledby="how-title">
        <div className="an-flow-art"><img src={workspaceArt} alt="" width="1024" height="1024" loading="lazy" /></div>
        <div>

          <h2 id="how-title">{tr('Good decisions start with a clear process.')}</h2>
          <ol className="an-flow-list">{FLOW.map((step, i) => <li key={step.title}><span aria-hidden>{i + 1}</span><div><h3>{tr(step.title)}</h3><p>{tr(step.text)}</p></div></li>)}</ol>
          <Button variant="primary" trailingIcon={<ArrowRight />} onClick={() => navigate(entryPath)}>{tr('Open the prototype')}</Button>
        </div>
      </section>
      <section data-reveal id="product" className="an-public-section" aria-labelledby="product-title">
        <div className="an-section-intro"><h2 id="product-title">{tr('Start with the work that matters most.')}</h2><p>{tr('Choose a starting point, then add more apps as your team grows.')}</p></div>
        <Tabs defaultValue="work"><TabsList aria-label={tr('Choose a business starting point')} className="an-business-tabs">{BUSINESS_STARTERS.map(option => <TabsTrigger key={option.id} value={option.id}>{tr(option.title)}</TabsTrigger>)}</TabsList>
          {BUSINESS_STARTERS.map(option => <TabsContent key={option.id} value={option.id}><div className="an-business-overview"><div><div className="an-business-intro"><div><h3>{tr(option.title)}</h3><p>{tr(option.description)}</p></div><WorkflowIllustration starter={option.id} className="an-business-illustration" /></div><ol className="an-business-steps">{APP_CATALOG[option.app].steps.map((step, index) => <li key={step.title}><span>{index + 1}</span><div><strong>{tr(step.title)}</strong><p>{tr(step.text)}</p></div></li>)}</ol><Button asChild variant="primary"><Link to={`/welcome?starter=${option.id}`}>{tr('Set up this workflow')}<ArrowRight size={16} aria-hidden /></Link></Button></div><ul className="an-business-apps">{(option.id === 'all' ? APP_GROUPS.flatMap(group => [...group.apps]) : option.apps).map(app => { const guide = APP_CATALOG[app]; const Icon = guide.icon; return <li key={app}><Link to={`/docs/${app === 'approvals' ? 'workflow-approvals' : app}`}><Icon size={20} aria-hidden /><span><strong>{tr(guide.title)}</strong><span>{tr(guide.description)}</span></span><ArrowRight size={16} aria-hidden /></Link></li>; })}</ul></div></TabsContent>)}
        </Tabs>
      </section>
      <section data-reveal id="trust" className="an-public-section an-trust-section" aria-labelledby="trust-title">
        <div><h2 id="trust-title">{tr('Know who decides. Know what happened.')}</h2><p>{tr('Approvers are assigned by your process. Decisions and comments stay with the request, so the history is easy to follow.')}</p></div>
        <div className="an-trust-list"><div><ShieldCheck aria-hidden /><h3>{tr('People and roles')}</h3><p>{tr('Choose who manages your workspace and who reviews each request.')}</p></div><div><History aria-hidden /><h3>{tr('A history you can follow')}</h3><p>{tr('See every submission, decision and comment, with who and when.')}</p></div></div>
      </section>
      <section data-reveal id="faq" className="an-public-section an-faq-section" aria-labelledby="faq-title"><h2 id="faq-title">{tr('A few things to know')}</h2><Accordion type="single" collapsible>{FAQ.map(({q,a},i) => <AccordionItem value={`faq-${i}`} key={q}><AccordionTrigger>{tr(q)}</AccordionTrigger><AccordionContent>{tr(a)}</AccordionContent></AccordionItem>)}</Accordion></section>
      <section data-reveal className="an-public-section an-public-close"><h2>{tr('Start small. Build a workflow your team can follow.')}</h2><p>{tr('Explore the prototype, choose one real business problem, and plan a pilot around it.')}</p><div className="an-pilot-grid">{[
        { title: 'Try the workflow', text: 'Explore the browser prototype before deciding on a rollout.' },
        { title: 'Agree the pilot scope', text: 'Choose the people, workflow, and outcome you want to test.' },
        { title: 'Plan the next step', text: 'Discuss pricing, support, and hosting before a live deployment.' },
      ].map(({ title, text }) => <div key={title}><h3>{tr(title)}</h3><p>{tr(text)}</p></div>)}</div><Button size="lg" trailingIcon={<ArrowRight />} variant="primary" onClick={startFree}>{tr('Create a workspace')}</Button></section>
    </main>
    <footer className="an-public-footer">
      <div className="an-footer-grid">
        <div className="an-footer-brand">
          <a href="#top" className="an-footer-logo"><Logo className="h-8 w-auto" /></a>
          <p>{tr('Decision & operations ERP for modern teams. Ask, approve, move forward.')}</p>
          <Link to={entryPath} className="an-footer-demo">{tr('Explore the prototype')}<ArrowRight aria-hidden className="size-4" /></Link>
        </div>
        <nav aria-label={tr('Product')} className="an-footer-col">
          <h2>{tr('Product')}</h2>
          <Link to="/#product">{tr('Product')}</Link>
          <Link to="/#how">{tr('How it works')}</Link>
          <Link to="/pricing" viewTransition>{tr('Pricing & deployment')}</Link>
        </nav>
        <nav aria-label={tr('Help & support')} className="an-footer-col">
          <h2>{tr('Help & support')}</h2>
          <Link to="/docs" viewTransition>{tr('Documentation')}</Link>
          <Link to="/support" viewTransition>{tr('Help & support')}</Link>
          <Link to="/signin" viewTransition>{tr('Sign in')}</Link>
          <Link to="/welcome" viewTransition>{tr('Create a workspace')}</Link>
        </nav>
        <div className="an-footer-col an-footer-contact">
          <h2>{tr('Contact us')}</h2>
          <ContactChannels compact labelsOnly />
        </div>
      </div>
      <div className="an-footer-base">
        <span>© {new Date().getFullYear()} Anumat</span>
        <span className="an-footer-note">{tr('Browser-only prototype. Changes stay on this device.')}</span>
        <a href="#top" className="an-footer-top">{tr('Back to top')}<ArrowUp aria-hidden className="size-4" /></a>
      </div>
    </footer>
  </div>;
}
