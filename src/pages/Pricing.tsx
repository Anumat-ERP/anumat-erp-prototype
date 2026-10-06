import { BUSINESS_STARTERS } from '../lib/businessStarter';
import '../styles/sme-experience.css';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Button, Card, Field, Input, Select, Text, Textarea, useToast } from '@app/ui';
import { ArrowDown, ArrowRight, Building2, Check, Cloud, Copy, Mail, Server } from 'lucide-react';
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
    tagline: 'Discuss a hosted workspace for your team.',
    price: 'Quote after scoping',
    badge: 'Start here',
    points: ['Agree one workflow and a pilot team', 'Confirm hosting, backups, and support', 'Expand after reviewing the pilot'],
  },
  {
    id: 'private-cloud',
    icon: Building2,
    name: 'Your own cloud',
    tagline: 'Discuss deployment in your own cloud account.',
    price: 'Quote after scoping',
    points: ['Review your cloud and data requirements', 'Agree installation and update ownership', 'Confirm network and access controls'],
  },
  {
    id: 'on-premise',
    icon: Server,
    name: 'On-premise',
    tagline: 'Discuss deployment on your own infrastructure.',
    price: 'Quote after scoping',
    points: ['Assess hardware and connectivity', 'Agree training and maintenance scope', 'Confirm support and recovery arrangements'],
  },
];

const COMPARE: [string, string, string, string][] = [
  ['Who runs the servers', 'Confirm hosted service scope', 'Your cloud account', 'Your infrastructure'],
  ['Where data lives', 'Confirm hosting location', 'Your cloud account', 'Your infrastructure'],
  ['Updates & backups', 'Agree service responsibilities', 'Agree shared responsibilities', 'Agree maintenance responsibilities'],
  ['Best for', 'Teams seeking managed hosting', 'Companies with a cloud policy', 'Sites with infrastructure requirements'],
];

const FAQ = [
  { q: 'How will a pilot be priced?', a: 'The browser prototype is free to explore. Live pricing is not published yet. Agree the workflow, team size, hosting, support, and commercial terms before starting a customer pilot.' },
  { q: 'What is included in the workspace?', a: 'Explore twelve apps for collaboration, people operations, and reporting. Choose one workflow first; the prototype does not include a live hosted service.' },
  { q: 'Which deployment should I choose?', a: 'Start by discussing your data and support requirements. Hosted, private-cloud, and on-premise options require a feasibility review and an agreed rollout scope.' },
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
    size: '10–49',
    deployment: 'not-sure' as Lead['deployment'],
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<'name' | 'email' | 'company', string>>>({});
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const enquiryText = `${tr('Your name')}: ${form.name.trim()}\n${tr('Work email')}: ${form.email.trim()}\n${tr('Company')}: ${form.company.trim()}\n${tr('Company size')}: ${form.size}\n${tr('Deployment')}: ${tr(OPTIONS.find(option => option.id === form.deployment)?.name ?? 'Not sure yet')}\n\n${form.message.trim()}`;
  const emailDraft = `mailto:${CONFIG.sales.email}?subject=${encodeURIComponent(tr('Anumat pilot enquiry') + ' · ' + form.company.trim())}&body=${encodeURIComponent(enquiryText)}`;
  const copyEnquiry = async () => {
    try { await navigator.clipboard.writeText(enquiryText); setCopied(true); toast({ title: tr('Enquiry copied') }); }
    catch { toast({ title: tr('Copy failed. Select and copy the enquiry summary below.') }); }
  };

  const choose = (deployment: Lead['deployment']) => {
    setSent(false);
    setCopied(false);
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
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0];
      requestAnimationFrame(() => document.getElementById(`sales-${first}`)?.focus());
      return;
    }
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
    setCopied(false);
    toast({ tone: 'success', title: tr("Enquiry draft saved") });
  };

  return (
    <div className="an-marketing min-h-dvh bg-bg text-fg">
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="an-pricing-main mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 outline-none md:px-8 md:py-16">
        <div className="an-pricing-hero">

          <h1 className="text-[clamp(2rem,4vw,3rem)] leading-tight font-semibold tracking-tight text-balance">{tr("Start with one workflow. Plan a rollout that fits.")}</h1>
          <Text tone="muted" className="text-lg">
            {tr("Explore the prototype for free. Before a live pilot, agree the workflow, team size, hosting, support, and price.")}</Text>
        </div>

        <section className="an-sme-packages" aria-labelledby="starter-packages-title"><h2 id="starter-packages-title">{tr('Choose your starting scope')}</h2><p>{tr('These starting points help scope a pilot. They are not paid subscriptions or feature limits.')}</p><ul className="an-sme-package-list">{BUSINESS_STARTERS.map(starter => <li key={starter.id}><h3>{tr(starter.title)}</h3><p>{tr(starter.description)}</p><Button asChild variant="secondary"><Link to={`/welcome?starter=${starter.id}`}>{tr('Try this starting point')}<ArrowRight size={16} aria-hidden /></Link></Button></li>)}</ul></section>
        <section aria-labelledby="prototype-scope-title"><div className="an-pricing-section-heading"><h2 id="prototype-scope-title">{tr('What you can explore today')}</h2></div><div className="an-prototype-scope"><div><h3>{tr('Available in the prototype')}</h3><p>{tr('App workflows, configurable approvals, task ownership, people records, English and Khmer, and local history. Changes stay in this browser.')}</p></div><div><h3>{tr('Confirm before a live rollout')}</h3><p>{tr('Real sign-in, server permissions, shared data, backups, message delivery, commercial terms, and support. Payroll previews do not pay employees.')}</p></div></div></section>
        <div className="an-pricing-section-heading"><h2>{tr('Deployment options to discuss')}</h2><p>{tr('Live pricing is not published yet. Request a scoped proposal.')}</p></div>
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
                  <p><strong className="an-plan-custom-price">{tr(price)}</strong></p>
                  <span>{tr('Confirm scope and availability before deployment')}</span>
                </div>
                <div className="an-plan-action">
                  <Button fullWidth variant={id === 'cloud' ? 'primary' : 'secondary'} onClick={() => choose(id)} aria-label={tr('Contact sales about {deployment}', { deployment: tr(name) })}>{tr('Discuss this option')}<ArrowRight aria-hidden className="size-4" /></Button>
                </div>
                <div className="an-plan-features"><p>{tr('Include in your pilot discussion')}</p><ul>
                  {points.map((p) => <li key={p}><Check aria-hidden className="size-4" /><span>{tr(p)}</span></li>)}
                </ul></div>
              </Card>
            </li>
          ))}
        </ul>

        <div className="an-pricing-pilot"><div><span className="an-pricing-pilot-icon"><Cloud aria-hidden className="size-5" /></span><div><h2>{tr('Plan before you deploy')}</h2><p>{tr('Confirm the data location, support ownership, and recovery plan.')}</p></div></div><a href="#compare-deployments">{tr('Compare deployments')}<ArrowDown aria-hidden className="size-4" /></a></div>

        <section id="compare-deployments" className="an-pricing-comparison" aria-labelledby="comparison-title">
          <div className="an-pricing-section-heading"><h2 id="comparison-title">{tr('Find the right home for your workspace.')}</h2><p>{tr('Compare responsibilities before choosing a deployment.')}</p></div>
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

        <section className="an-pricing-faq" aria-labelledby="pricing-faq-title"><div className="an-pricing-section-heading"><h2 id="pricing-faq-title">{tr('Questions before you get started?')}</h2><p>{tr('Help & support')} <Link to="/support">{tr('Contact us')}<ArrowRight aria-hidden className="size-4" /></Link></p></div><Accordion type="single" collapsible>{FAQ.map(({ q, a }, i) => <AccordionItem value={`pricing-faq-${i}`} key={q}><AccordionTrigger>{tr(q)}</AccordionTrigger><AccordionContent>{tr(a)}</AccordionContent></AccordionItem>)}</Accordion></section>

        <section id="contact-sales" aria-labelledby="contact-title" className="an-pricing-contact grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="an-sales-intro flex flex-col gap-4">

            <h2 id="contact-title" className="text-[clamp(1.5rem,3vw,2rem)] leading-tight font-bold tracking-tight">
              {tr('Let’s find the right setup for your team.')}</h2>
            <Text tone="muted">{tr('Describe your team and the workflow you want to improve. Prepare an enquiry below, then copy it or open your email app to send it.')}</Text>
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
                <Text as="h3" variant="title">{tr('Your enquiry draft is ready')}</Text>
                <Text tone="muted">{tr('Saved on this device. Nothing has been sent to the sales team.')}</Text>
                <Field label={tr('Enquiry summary')}><Textarea readOnly value={enquiryText} rows={7} /></Field>
                <div className="an-enquiry-actions"><Button onClick={copyEnquiry} icon={<Copy size={16} />}>{tr(copied ? 'Copied' : 'Copy enquiry')}</Button>{isSet(CONFIG.sales.email) && <Button asChild variant="primary"><a href={emailDraft}>{tr('Open email draft')}<ArrowRight size={16} aria-hidden /></a></Button>}</div>
                {isSet(CONFIG.forms.salesUrl) && <Button asChild><a href={CONFIG.forms.salesUrl} target="_blank" rel="noopener noreferrer">{tr('Open sales form')}</a></Button>}
                <Button variant="tertiary" className="self-start" onClick={() => setSent(false)}>{tr('Edit enquiry')}</Button>
              </div>
            ) : (
              <form noValidate onSubmit={submit} className="flex flex-col gap-4">
                <div className="an-sales-form-heading"><h3>{tr('Tell us about your company')}</h3><p>{tr('A few details will help us understand what you need.')}</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="sales-name" label={tr('Your name')} required error={errors.name && tr(errors.name)}>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
                  </Field>
                  <Field id="sales-email" label={tr('Work email')} required error={errors.email && tr(errors.email)}>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
                  </Field>
                  <Field id="sales-company" label={tr('Company')} required error={errors.company && tr(errors.company)}>
                    <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} autoComplete="organization" />
                  </Field>
                  <Field label={tr('Company size')}>
                    <Select
                      value={form.size}
                      onChange={(e) => setForm({ ...form, size: e.target.value })}
                      options={['1–9', '10–49', '50–199', '200–499', '500+'].map((s) => ({ value: s, label: tr('{size} people', { size: s }) }))}
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
                  {tr("Prepare enquiry")}<ArrowRight aria-hidden className="size-4" /></Button>
                <p className="an-sales-form-note">{tr('This form prepares a local draft. Copy it or open your email app to send it.')}</p>
              </form>
            )}
          </Card>
        </section>
      </main>
      <footer className="an-pricing-footer"><Link to="/" aria-label={tr('Anumat home')}><Logo className="h-7 w-auto" /></Link><span>{tr('Every request becomes a clear decision.')}</span><nav aria-label={tr('Help & support')}><Link to="/docs">{tr('Documentation')}</Link><Link to="/support">{tr('Help & support')}</Link></nav></footer>
    </div>
  );
}
