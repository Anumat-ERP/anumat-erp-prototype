import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  DescriptionList,
  Text,
  cn,
} from '@repo/ui';
import {
  CalendarDays,
  CheckCircle2,
  CircleCheck,
  CircleHelp,
  Clock,
  Circle,
  FileText,
  FolderOpen,
  History,
  Inbox,
  ListChecks,
  Lock,
  Plane,
  Receipt,
  SearchX,
  Shield,
  ShoppingCart,
  Signature,
  Timer,
  UserX,
  Users,
  Workflow,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { ContactChannels } from '../components/ContactChannels';
import { Logo } from '../components/Logo';
import { useTour } from '../components/DemoTour';

const NAV = [
  { href: '#how', label: 'How it works' },
  { href: '#product', label: 'Product' },
  { href: '#trust', label: 'Security' },
  { href: '#faq', label: 'FAQ' },
];

const FOOTER_LINK =
  'rounded-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={`${title} links`} className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold tracking-wide text-fg uppercase">{title}</h2>
      <ul className="flex flex-col gap-3 text-md">{children}</ul>
    </nav>
  );
}

const PROBLEMS = [
  { icon: SearchX, title: 'Lost requests', text: 'Important requests get buried in email and chat threads.' },
  { icon: UserX, title: 'Unclear ownership', text: 'Nobody is sure who decides, or what happens next.' },
  { icon: Timer, title: 'Slow decisions', text: 'Approvals wait for days because nobody knows they’re stuck.' },
  { icon: CircleHelp, title: 'Missing evidence', text: 'Quotes, context and the reason for a decision are hard to find later.' },
];

const FLOW = [
  { title: 'Request', text: 'Raise it once, with every detail and file attached.' },
  { title: 'Review', text: 'It goes to the right people, by your rules.' },
  { title: 'Approve', text: 'A clear decision, with a reason on record.' },
  { title: 'Act', text: 'Decisions turn into tasks with owners and deadlines.' },
  { title: 'Track', text: 'See what’s moving, what’s stuck and why.' },
];

const MODULES = [
  { icon: FileText, color: 'var(--an-mod-requests)', title: 'Requests', text: 'Purchases, leave, expenses and contracts in one form.' },
  { icon: CheckCircle2, color: 'var(--an-mod-approvals)', title: 'Approvals', text: 'Routes by type and amount, with bulk approve.' },
  { icon: CalendarDays, color: 'var(--an-mod-meetings)', title: 'Meetings', text: 'Agendas, recorded decisions and action items.' },
  { icon: FolderOpen, color: 'var(--an-mod-documents)', title: 'Documents', text: 'Files linked to the decision they support, with versions.' },
  { icon: ListChecks, color: 'var(--an-mod-tasks)', title: 'Tasks', text: 'Follow-ups with an owner, a deadline and a source.' },
  { icon: Workflow, color: 'var(--an-mod-process)', title: 'Process Builder', text: 'Change who approves what, without code.' },
];

const USE_CASES = [
  { icon: ShoppingCart, label: 'Purchase requests' },
  { icon: Plane, label: 'Leave and time off' },
  { icon: Receipt, label: 'Expense claims' },
  { icon: Signature, label: 'Contract review' },
  { icon: FolderOpen, label: 'Policies and documents' },
  { icon: Users, label: 'Meeting decisions' },
];

const TRUST: { icon: typeof Lock; title: string; text: string; planned?: boolean }[] = [
  { icon: Users, title: 'Role-based access', text: 'Admins, approvers and members each see what they need.' },
  { icon: History, title: 'Audit trail', text: 'Every submission, decision and comment is recorded with who and when.' },
  { icon: FileText, title: 'Version history', text: 'Documents keep every version, so you know what was approved.' },
  { icon: Lock, title: 'Encryption', text: 'In transit and at rest, with data kept separate per company.', planned: true },
];

const FAQ = [
  {
    q: 'What is Anumat?',
    a: 'A decision and operations workspace. Requests, approvals, meetings, documents and tasks live in one place, linked to each other, so every request ends in a clear decision and the work that follows it.',
  },
  {
    q: 'Who is it for?',
    a: 'Operations, finance and people teams at companies of roughly 20 to 500 people who approve spend, leave and contracts over email today.',
  },
  {
    q: 'How does pricing work?',
    a: 'It’s free during the pilot, with fair-use limits on things that cost us to run, like AI summaries and file storage. We’ll agree pricing with pilot companies before it ends.',
  },
  {
    q: 'Is my data secure?',
    a: 'Access follows roles, and every action is recorded. This page links to a prototype that keeps demo data in your browser only; the pilot adds encryption in transit and at rest and keeps each company’s data separate.',
  },
];

function Section({ id, eyebrow, title, children, className }: { id?: string; eyebrow?: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn('scroll-mt-20 py-16 md:py-20', className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 md:px-6">
        <div className="flex max-w-2xl flex-col gap-3">
          {eyebrow ? <span className="text-xs font-semibold tracking-wide text-fg-link uppercase">{eyebrow}</span> : null}
          <h2 id={id ? `${id}-title` : undefined} className="text-[clamp(1.625rem,3.2vw,2.25rem)] leading-tight font-bold tracking-tight text-balance text-fg">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
}

/** A static, non-interactive miniature of the request screen, built from the real components. */
function ProductPreview() {
  const steps = [
    { name: 'Manager review', who: 'Dara Sok', state: 'Approved', Icon: CircleCheck, tone: 'text-success' },
    { name: 'Finance review', who: 'Priya Shah', state: 'Waiting', Icon: Clock, tone: 'text-warning-subtle-fg' },
    { name: 'Final approval', who: 'Sokha Chan', state: 'Not started', Icon: Circle, tone: 'text-fg-subtle' },
  ];
  return (
    <div className="relative">
      <div
        role="img"
        aria-label="Preview of a purchase request in Anumat: $12,500 for laptops, approved by the manager and waiting on finance review."
        className="relative rotate-[0.6deg] rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <div aria-hidden inert className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-fg-muted">Purchase request · PR-1042</span>
              <span className="text-lg font-semibold text-fg">Laptops for new team members</span>
            </div>
            <Badge tone="warning" dot>
              Pending
            </Badge>
          </div>
          <DescriptionList
            layout="inline"
            spacing="tight"
            items={[
              { term: 'Requested by', description: 'Alex Tan · Operations' },
              { term: 'Amount', description: <span className="font-semibold tabular-nums">$12,500.00</span> },
              { term: 'Attached', description: 'Laptop_Proposal.pdf' },
            ]}
          />
          <ol className="flex flex-col gap-2.5 rounded-lg bg-surface-sunken p-3">
            {steps.map(({ name, who, state, Icon, tone }) => (
              <li key={name} className="flex items-center gap-2.5 text-sm">
                <Icon className={cn('size-4 shrink-0', tone)} />
                <span className="font-medium text-fg">{name}</span>
                <span className="ms-auto text-fg-muted">
                  {who} · {state}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex justify-end gap-2">
            <Button size="sm" tabIndex={-1}>
              Request changes
            </Button>
            <Button size="sm" variant="primary" tabIndex={-1}>
              Approve
            </Button>
          </div>
        </div>
      </div>
      <span aria-hidden className="an-hand absolute -bottom-9 start-4 -rotate-3 text-2xl text-fg-link">
        ask → approve → move forward
      </span>
    </div>
  );
}

export function Landing() {
  const navigate = useNavigate();
  const tour = useTour();
  // During the demo tour, sign-up opens with the company already filled in.
  const startFree = () => navigate(tour.step !== null ? '/welcome?demo=1' : '/welcome');

  return (
    <div id="top" className="min-h-dvh bg-bg text-fg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-(--a-z-index-toast) focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-md"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-(--a-z-index-sticky) border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
          <Link to="/" aria-label="Anumat home" className="rounded-md text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <Logo className="h-7 w-auto" />
          </Link>
          <nav aria-label="Page sections" className="hidden md:block">
            <ul className="flex gap-5 text-md">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="rounded-sm text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/pricing" className="rounded-sm text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  Pricing
                </Link>
              </li>
            </ul>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <Button variant="tertiary" onClick={() => navigate('/signin')}>
              Sign in
            </Button>
            <Button variant="primary" onClick={startFree}>
              Start free
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="outline-none">
        {/* Hero */}
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 md:px-6 md:pt-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <span className="text-xs font-semibold tracking-wide text-fg-link uppercase">Decision &amp; operations ERP</span>
            <h1 className="text-[clamp(2.25rem,5.2vw,3.75rem)] leading-[1.05] font-bold tracking-tight text-balance">
              Every request becomes a{' '}
              <span className="bg-[linear-gradient(transparent_68%,var(--a-color-primary)_68%,var(--a-color-primary)_90%,transparent_90%)]">
                clear decision.
              </span>
            </h1>
            <p className="max-w-xl text-lg text-fg-muted">
              Requests, approvals, meetings, documents and tasks in one workspace. Everyone knows who decides, what was decided, and what happens next.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" variant="primary" onClick={startFree}>
                Start free
              </Button>
              <Button size="lg" onClick={tour.start}>
                See how it works
              </Button>
            </div>
            <Text variant="bodySm" tone="muted">
              Free during the pilot. Set up your company in about a minute.
            </Text>
          </div>
          <div className="lg:ps-6">
            <ProductPreview />
          </div>
        </div>

        {/* Problem */}
        <Section eyebrow="The problem" title="Work slows down when decisions are scattered." className="border-t border-border bg-surface">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Card className="flex h-full flex-col gap-3 p-5">
                  <span aria-hidden className="flex size-10 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-fg">
                    <Icon className="size-5" />
                  </span>
                  <Text as="h3" variant="subtitle">
                    {title}
                  </Text>
                  <Text tone="muted">{text}</Text>
                </Card>
              </li>
            ))}
          </ul>
        </Section>

        {/* Flow */}
        <Section id="how" eyebrow="How it works" title="One simple flow for faster, better decisions.">
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {FLOW.map((s, i) => (
              <li key={s.title} className="relative flex flex-col gap-2">
                <span className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-fg" aria-hidden>
                    {i + 1}
                  </span>
                  {i < FLOW.length - 1 ? <span aria-hidden className="hidden h-0.5 flex-1 bg-border-strong lg:block" /> : null}
                </span>
                <Text as="h3" variant="subtitle">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </Text>
                <Text tone="muted">{s.text}</Text>
              </li>
            ))}
          </ol>
        </Section>

        {/* Modules */}
        <Section id="product" eyebrow="Product" title="One workspace, from request to result." className="border-t border-border bg-surface">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map(({ icon: Icon, color, title, text }) => (
              <li key={title}>
                <Card className="flex h-full gap-4 p-5">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ color, background: `color-mix(in oklch, ${color} 14%, var(--a-color-surface))` }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="flex flex-col gap-1">
                    <Text as="h3" variant="subtitle">
                      {title}
                    </Text>
                    <Text tone="muted">{text}</Text>
                  </span>
                </Card>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3">
            <Text as="h3" variant="label">
              Built for the way your teams already work
            </Text>
            <ul className="flex flex-wrap gap-2">
              {USE_CASES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-md">
                  <Icon aria-hidden className="size-4 text-fg-muted" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Trust */}
        <Section id="trust" eyebrow="Security" title="Built for decisions that need accountability.">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map(({ icon: Icon, title, text, planned }) => (
              <li key={title} className="flex flex-col gap-2 rounded-lg border border-border p-5">
                <span className="flex items-center justify-between gap-2">
                  <Icon aria-hidden className="size-5 text-fg" />
                  {planned ? (
                    <Badge size="sm" tone="info">
                      In the pilot
                    </Badge>
                  ) : null}
                </span>
                <Text as="h3" variant="subtitle">
                  {title}
                </Text>
                <Text tone="muted">{text}</Text>
              </li>
            ))}
          </ul>
        </Section>

        {/* Pilot (in place of a testimonial until pilot users can be quoted) */}
        <Section eyebrow="Pilot" title="Join the pilot and shape what we build." className="border-t border-border bg-surface">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <ul className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Shield, title: 'Free while it lasts', text: 'No fee during the pilot, with fair-use limits.' },
                { icon: Timer, title: 'Live in a minute', text: 'Starter processes for purchases, expenses, leave and contracts.' },
                { icon: Inbox, title: 'Direct line to us', text: 'Your feedback goes straight into the roadmap.' },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex flex-col gap-2">
                  <Icon aria-hidden className="size-5 text-fg-link" />
                  <Text as="h3" variant="subtitle">
                    {title}
                  </Text>
                  <Text tone="muted">{text}</Text>
                </li>
              ))}
            </ul>
            <Card className="flex flex-col gap-3 p-5">
              <Text as="h3" variant="subtitle">
                Try it now
              </Text>
              <Text tone="muted">Create a workspace with demo data, or take the 3-minute guided tour.</Text>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={startFree}>
                  Start free
                </Button>
                <Button onClick={tour.start}>Take the tour</Button>
              </div>
              <Text variant="bodySm" tone="muted">
                Need your own cloud or on-premise? <Link to="/pricing" className="text-fg-link underline">See deployment options</Link>
              </Text>
            </Card>
          </div>
        </Section>

        {/* FAQ */}
        <Section id="faq" eyebrow="FAQ" title="Questions people ask first.">
          <Accordion type="single" collapsible className="max-w-3xl">
            {FAQ.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>
                  <Text tone="muted" className="max-w-prose">
                    {f.a}
                  </Text>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>

        {/* Closing CTA */}
        <section aria-labelledby="cta-title" className="bg-surface-inverse text-fg-inverse">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 py-16 md:px-6 md:py-20">
            <h2 id="cta-title" className="text-[clamp(1.75rem,3.6vw,2.5rem)] leading-tight font-bold tracking-tight text-balance">
              Bring clarity to every decision.
            </h2>
            <p className="max-w-xl text-lg opacity-80">Join the teams moving faster with Anumat.</p>
            <Button size="lg" variant="primary" onClick={startFree}>
              Start free
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 md:grid-cols-3 md:px-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-x-10">
          <div className="col-span-2 flex max-w-sm flex-col items-start gap-4 md:col-span-3 lg:col-span-1">
            <Logo className="h-7 w-auto" />
            <Text tone="muted">Decision &amp; operations ERP for modern teams. Ask, approve, move forward.</Text>
            <Button variant="primary" onClick={startFree}>
              Start free
            </Button>
          </div>
          <FooterColumn title="Product">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className={FOOTER_LINK}>
                  {n.label}
                </a>
              </li>
            ))}
          </FooterColumn>
          <FooterColumn title="Get started">
            <li>
              <Link to="/pricing" className={FOOTER_LINK}>
                Pricing &amp; deployment
              </Link>
            </li>
            <li>
              <button type="button" onClick={() => tour.start()} className={cn(FOOTER_LINK, 'text-start')}>
                3-minute tour
              </button>
            </li>
            <li>
              <Link to="/signin" className={FOOTER_LINK}>
                Sign in
              </Link>
            </li>
          </FooterColumn>
          <section aria-labelledby="footer-contact" className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <h2 id="footer-contact" className="text-sm font-semibold tracking-wide text-fg uppercase">
              Talk to us
            </h2>
            <ContactChannels compact />
          </section>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between md:px-6">
            <p>© 2026 Anumat. Prototype for demonstration.</p>
            <a href="#top" className={FOOTER_LINK}>
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
