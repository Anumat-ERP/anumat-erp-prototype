import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Banner, Button, Card, Field, Input, Select, Text, Textarea, useToast } from '@app/ui';
import { ArrowDown, ArrowRight, Building2, Check, Cloud, Mail, Server } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ContactChannels } from '../components/ContactChannels';
import { PublicHeader } from '../components/PublicHeader';
import { Logo } from '../components/Logo';
import { CONFIG, isSet } from '../config';
import { useStore } from '../data/store';
import type { Lead } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import { prefersReducedMotion } from '../lib/motion';

const OPTIONS: {
  id: Lead['deployment'];
  icon: typeof Cloud;
  name: string;
  tagline: string;
  price: string;
  points: string[];
  badge?: string;
}[] = [
  {
    id: 'cloud',
    icon: Cloud,
    name: 'Anumat Cloud',
    tagline: 'We host and run it for you.',
    price: 'Free during the pilot',
    badge: 'Fastest start',
    points: ['Ready in a minute', 'Automatic updates and backups', 'Fair-use limits during the pilot'],
  },
  {
    id: 'private-cloud',
    icon: Building2,
    name: 'Your own cloud',
    tagline: 'Runs in your AWS, Azure, Google Cloud or local provider.',
    price: 'Contact us',
    points: ['Data stays in your account', 'We install and keep it updated', 'Your network and security rules'],
  },
  {
    id: 'on-premise',
    icon: Server,
    name: 'On-premise',
    tagline: 'Runs on servers in your own building.',
    price: 'Contact us',
    points: ['For strict data or no-internet rules', 'Installation and training included', 'Support contract for updates'],
  },
];

const COMPARE: [string, string, string, string][] = [
  ['Who runs the servers', 'Anumat', 'You, in your cloud account', 'You, on your hardware'],
  ['Set-up time', 'About a minute', 'About a week', '2–4 weeks'],
  ['Updates', 'Automatic', 'Installed by us, when you choose', 'Installed by us, when you choose'],
  ['Where data lives', 'Anumat’s cloud', 'Your cloud account', 'Your building'],
  ['Best for', 'Most teams', 'Companies with a cloud policy', 'Regulated or offline sites'],
];

const FAQ = [
  { q: 'How does pricing work after the pilot?', a: 'Pricing will be agreed with pilot companies before the pilot ends. Contact us to discuss your company, deployment needs and a plan that fits.' },
  { q: 'What is included in the workspace?', a: 'Requests, approvals, meetings, documents and tasks in one workspace. Everyone knows who decides, what was decided, and what happens next.' },
  { q: 'Which deployment should I choose?', a: 'Choose Anumat Cloud for the fastest start. Your own cloud keeps data in your cloud account. On-premise runs on your own hardware for strict data or no-internet requirements.' },
  { q: 'What can I try in the prototype?', a: 'Submit requests, review approvals, build approval processes and switch between demo people. Changes are saved in your browser. Reset the demo from the account menu whenever you want.' },
];

export function Pricing() {
  const { t: tr } = useLocale();
  const { dispatch } = useStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    size: '50–199',
    deployment: 'not-sure' as Lead['deployment'],
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<'name' | 'email' | 'company', string>>>({});
  const [sent, setSent] = useState(false);

  const choose = (deployment: Lead['deployment']) => {
    setSent(false);
    setForm((f) => ({ ...f, deployment }));
    requestAnimationFrame(() => {
      const contact = document.getElementById('contact-sales');
      contact?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      contact?.querySelector('input')?.focus({ preventScroll: true });
    });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter your work email, like name@company.com.';
    if (!form.company.trim()) next.company = 'Enter your company’s name.';
    setErrors(next);
    if (Object.keys(next).length) return;
    dispatch({
      type: 'addLead',
      lead: {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        message: form.message.trim(),
      },
    });
    setSent(true);
    toast({ tone: 'success', title: tr("Message received") });
  };

  return (
    <div className="an-marketing min-h-dvh bg-bg text-fg">
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="an-pricing-main mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 outline-none md:px-8 md:py-16">
        <div className="an-pricing-hero">
          <span className="an-eyebrow">{tr('Pricing & deployment')}</span>
          <h1 className="text-[clamp(2rem,4vw,3rem)] leading-tight font-semibold tracking-tight text-balance">{tr("Run Anumat where your data needs to live.")}</h1>
          <Text tone="muted" className="text-lg">
            {tr("The same product in all three. Free while we run the pilot; we’ll agree pricing with pilot companies before it ends.")}</Text>
        </div>

        <ul className="an-pricing-plans" aria-label={tr('Deployment options')}>
          {OPTIONS.map(({ id, icon: Icon, name, tagline, price, points, badge }) => (
            <li key={id}>
              <Card className="an-price-card" data-featured={id === 'cloud' || undefined}>
                <div className="an-plan-heading">
                  <Icon aria-hidden className="size-5 text-muted-foreground" />
                  <h2>{tr(name)}</h2>
                  {badge ? <Badge tone="primary">{tr(badge)}</Badge> : null}
                </div>
                <p className="an-plan-description">{tr(tagline)}</p>
                <div className="an-plan-price">
                  <p>{id === 'cloud' ? <><strong>$0</strong><span>{tr('during the pilot')}</span></> : <strong className="an-plan-custom-price">{tr(price)}</strong>}</p>
                  <span>{tr(id === 'cloud' ? 'Free during the pilot' : 'A plan for your infrastructure')}</span>
                </div>
                <div className="an-plan-action">
                  {id === 'cloud' ? (
                    <Button variant="primary" fullWidth asChild>
                      <Link to="/welcome">{tr("Start free")}<ArrowRight aria-hidden className="size-4" /></Link>
                    </Button>
                  ) : (
                    <Button fullWidth onClick={() => choose(id)} aria-label={tr('Contact sales about {deployment}', { deployment: tr(name) })}>
                      {tr("Contact sales")}<ArrowRight aria-hidden className="size-4" /></Button>
                  )}
                </div>
                <div className="an-plan-features"><p>{tr(id === 'cloud' ? 'A simple start for your team' : 'Your deployment, supported by us')}</p><ul>
                  {points.map((p) => <li key={p}><Check aria-hidden className="size-4" /><span>{tr(p)}</span></li>)}
                </ul></div>
              </Card>
            </li>
          ))}
        </ul>

        <div className="an-pricing-pilot"><div><span className="an-pricing-pilot-icon"><Cloud aria-hidden className="size-5" /></span><div><h2>{tr('One workspace, in all three options')}</h2><p>{tr('Choose where Anumat runs. Keep your requests, decisions and follow-up work together.')}</p></div></div><a href="#compare-deployments">{tr('Compare deployments')}<ArrowDown aria-hidden className="size-4" /></a></div>

        <section id="compare-deployments" className="an-pricing-comparison" aria-labelledby="comparison-title">
          <div className="an-pricing-section-heading"><h2 id="comparison-title">{tr('Find the right home for your workspace.')}</h2><p>{tr('The same product. Three ways to run it.')}</p></div>
          <div tabIndex={0} role="region" aria-label={tr("How the deployment options compare")} className="an-pricing-table overflow-x-auto rounded-lg border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <table className="w-full min-w-[40rem] border-collapse text-md">
            <caption className="sr-only">{tr("How the deployment options compare")}</caption>
            <thead>
              <tr className="border-b border-border text-start">
                <th scope="col" className="p-3 text-start font-medium text-fg-muted">
                  {tr('Deployment')}
                </th>
                {OPTIONS.map((o) => (
                  <th key={o.id} scope="col" className="p-3 text-start font-semibold">
                    {tr(o.name)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([q, ...cells]) => (
                <tr key={q} className="border-b border-border-subtle last:border-0">
                  <th scope="row" className="p-3 text-start font-medium text-fg-muted">
                    {tr(q)}
                  </th>
                  {cells.map((c, i) => (
                    <td key={i} className="p-3">
                      {tr(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </section>

        <section className="an-pricing-faq" aria-labelledby="pricing-faq-title"><div className="an-pricing-section-heading"><span className="an-eyebrow">{tr('A few things to know')}</span><h2 id="pricing-faq-title">{tr('Questions before you get started?')}</h2><p>{tr('Help & support')} <Link to="/support">{tr('Contact us')}<ArrowRight aria-hidden className="size-4" /></Link></p></div><Accordion type="single" collapsible>{FAQ.map(({ q, a }, i) => <AccordionItem value={`pricing-faq-${i}`} key={q}><AccordionTrigger>{tr(q)}</AccordionTrigger><AccordionContent>{tr(a)}</AccordionContent></AccordionItem>)}</Accordion></section>

        <section id="contact-sales" aria-labelledby="contact-title" className="an-pricing-contact grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="an-sales-intro flex flex-col gap-4">
            <span className="an-eyebrow">{tr('Contact sales')}</span>
            <h2 id="contact-title" className="text-[clamp(1.5rem,3vw,2rem)] leading-tight font-bold tracking-tight">
              {tr('Let’s find the right setup for your team.')}</h2>
            <Text tone="muted">{tr('Planning to run Anumat in your own cloud or on-premise? Share your needs so we can discuss deployment, support and pricing.')}</Text>
            <div className="an-sales-direct">
            {isSet(CONFIG.sales.email) ? (
                <a href={`mailto:${CONFIG.sales.email}`} className="an-sales-email">
                  <span className="an-sales-channel-icon"><Mail aria-hidden className="size-5" /></span>
                  <span><span className="an-sales-channel-label">{tr('Email sales')}</span><strong>{CONFIG.sales.email}</strong></span>
                  <ArrowRight aria-hidden className="size-4" />
                </a>
            ) : null}
            <div className="an-sales-other">
              <Text variant="label">{tr('Other ways to reach us')}</Text>
              <ContactChannels compact labelsOnly />
            </div>
            </div>
          </div>
          <Card className="an-sales-form-card">
            {sent ? (
              <div className="flex flex-col gap-3" role="status">
                <Text as="h3" variant="title">
                  {tr("Thanks,")}{' '}{form.name.split(' ')[0]}.
                </Text>
                <Text tone="muted">{tr("We’ve got your message about")}{' '}{form.company}.</Text>
                <Banner tone="info">
                  {isSet(CONFIG.forms.salesUrl) ? (
                    <>
                      {tr("This prototype keeps your message in this browser. To be sure it reaches us,")}{' '}
                      <a href={CONFIG.forms.salesUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        {tr("send it through our form")}</a>
                      .
                    </>
                  ) : (
                    tr('Prototype: your message is saved in this browser only and shown to admins under Feedback.')
                  )}
                </Banner>
                <Button className="self-start" onClick={() => setSent(false)}>
                  {tr("Send another")}</Button>
              </div>
            ) : (
              <form noValidate onSubmit={submit} className="flex flex-col gap-4">
                <div className="an-sales-form-heading"><h3>{tr('Tell us about your company')}</h3><p>{tr('A few details will help us understand what you need.')}</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={tr('Your name')} required error={errors.name && tr(errors.name)}>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
                  </Field>
                  <Field label={tr('Work email')} required error={errors.email && tr(errors.email)}>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
                  </Field>
                  <Field label={tr('Company')} required error={errors.company && tr(errors.company)}>
                    <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} autoComplete="organization" />
                  </Field>
                  <Field label={tr('Company size')}>
                    <Select
                      value={form.size}
                      onChange={(e) => setForm({ ...form, size: e.target.value })}
                      options={['1–49', '50–199', '200–499', '500+'].map((s) => ({ value: s, label: tr('{size} people', { size: s }) }))}
                    />
                  </Field>
                </div>
                <Field label={tr("Where do you want to run Anumat?")}>
                  <Select
                    value={form.deployment}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        deployment: e.target.value as Lead['deployment'],
                      })
                    }
                    options={[{ value: 'not-sure', label: tr("Not sure yet") }, ...OPTIONS.map((o) => ({ value: o.id, label: tr(o.name) }))]}
                  />
                </Field>
                <Field label={tr("Anything we should know?")} optional={tr("(optional)")}>
                  <Textarea rows={4} placeholder={tr('Your current tools, hosting requirements or questions…')} autoGrow value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </Field>
                <Button type="submit" variant="primary" fullWidth>
                  {tr("Contact sales")}<ArrowRight aria-hidden className="size-4" /></Button>
                <p className="an-sales-form-note">{tr('Prototype: this form saves your enquiry on this device. Email sales to reach our team.')}</p>
              </form>
            )}
          </Card>
        </section>
      </main>
      <footer className="an-pricing-footer"><Link to="/" aria-label={tr('Anumat home')}><Logo className="h-7 w-auto" /></Link><span>{tr('Every request becomes a clear decision.')}</span><nav aria-label={tr('Help & support')}><Link to="/docs">{tr('Documentation')}</Link><Link to="/support">{tr('Help & support')}</Link></nav></footer>
    </div>
  );
}
