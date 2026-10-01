import { Badge, Banner, Button, Card, Field, Input, Select, Text, Textarea, cn, useToast } from '@repo/ui';
import { Building2, Check, Cloud, Server } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ContactChannels } from '../components/ContactChannels';
import { Logo } from '../components/Logo';
import { CONFIG, isSet } from '../config';
import { useStore } from '../data/store';
import type { Lead } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';

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
    setForm((f) => ({ ...f, deployment }));
    document.getElementById('contact-sales')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    toast({ tone: 'success', title: 'Message received' });
  };

  return (
    <div className="an-marketing min-h-dvh bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <Link
            to="/"
            aria-label={tr('Anumat home')}
            className="rounded-md text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Logo className="h-7 w-auto" />
          </Link>
          <Link to="/welcome" className="text-md font-medium text-fg-link underline underline-offset-2">
            Start free
          </Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 outline-none md:px-6 md:py-16">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="text-xs font-semibold tracking-wide text-fg-link uppercase">{tr('Pricing & deployment')}</span>
          <h1 className="text-[clamp(2rem,4.5vw,3rem)] leading-tight font-bold tracking-tight text-balance">Run Anumat where your data needs to live.</h1>
          <Text tone="muted" className="text-lg">
            The same product in all three. Free while we run the pilot; we’ll agree pricing with pilot companies before it ends.
          </Text>
        </div>

        <ul className="grid gap-4 lg:grid-cols-3">
          {OPTIONS.map(({ id, icon: Icon, name, tagline, price, points, badge }) => (
            <li key={id}>
              <Card className={cn('flex h-full flex-col gap-4 p-6', id === 'cloud' && 'border-primary-border')}>
                <div className="flex items-start justify-between gap-2">
                  <span aria-hidden className="flex size-10 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-fg">
                    <Icon className="size-5" />
                  </span>
                  {badge ? <Badge tone="primary">{badge}</Badge> : null}
                </div>
                <div className="flex flex-col gap-1">
                  <Text as="h2" variant="title">
                    {name}
                  </Text>
                  <Text tone="muted">{tagline}</Text>
                </div>
                <Text variant="subtitle">{price}</Text>
                <ul className="flex flex-col gap-2">
                  {points.map((p) => (
                    <li key={p} className="flex gap-2 text-md">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-2">
                  {id === 'cloud' ? (
                    <Button variant="primary" fullWidth asChild>
                      <Link to="/welcome">Start free</Link>
                    </Button>
                  ) : (
                    <Button fullWidth onClick={() => choose(id)}>
                      Contact sales
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[40rem] border-collapse text-md">
            <caption className="sr-only">How the deployment options compare</caption>
            <thead>
              <tr className="border-b border-border text-start">
                <th scope="col" className="p-3 text-start font-medium text-fg-muted">
                  <span className="sr-only">{tr('Question')}</span>
                </th>
                {OPTIONS.map((o) => (
                  <th key={o.id} scope="col" className="p-3 text-start font-semibold">
                    {o.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([q, ...cells]) => (
                <tr key={q} className="border-b border-border-subtle last:border-0">
                  <th scope="row" className="p-3 text-start font-medium text-fg-muted">
                    {q}
                  </th>
                  {cells.map((c, i) => (
                    <td key={i} className="p-3">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section id="contact-sales" aria-labelledby="contact-title" className="grid scroll-mt-8 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="flex flex-col gap-4">
            <h2 id="contact-title" className="text-[clamp(1.5rem,3vw,2rem)] leading-tight font-bold tracking-tight">
              Talk to us about your own cloud or on-premise
            </h2>
            <Text tone="muted">Tell us a little about your company and we’ll get back to you with a plan and price.</Text>
            {isSet(CONFIG.sales.email) ? (
              <Text>
                Or email{' '}
                <a href={`mailto:${CONFIG.sales.email}`} className="text-fg-link underline">
                  {CONFIG.sales.email}
                </a>
              </Text>
            ) : null}
            <div className="flex flex-col gap-2">
              <Text variant="label">Or message us</Text>
              <ContactChannels compact />
            </div>
          </div>
          <Card className="p-6">
            {sent ? (
              <div className="flex flex-col gap-3" role="status">
                <Text as="h3" variant="title">
                  Thanks, {form.name.split(' ')[0]}.
                </Text>
                <Text tone="muted">We’ve got your message about {form.company}.</Text>
                <Banner tone="info">
                  {isSet(CONFIG.forms.salesUrl) ? (
                    <>
                      This prototype keeps your message in this browser. To be sure it reaches us,{' '}
                      <a href={CONFIG.forms.salesUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        send it through our form
                      </a>
                      .
                    </>
                  ) : (
                    'Prototype: your message is saved in this browser only and shown to admins under Feedback.'
                  )}
                </Banner>
                <Button className="self-start" onClick={() => setSent(false)}>
                  Send another
                </Button>
              </div>
            ) : (
              <form noValidate onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={tr('Your name')} required error={errors.name}>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
                  </Field>
                  <Field label={tr('Work email')} required error={errors.email}>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
                  </Field>
                  <Field label={tr('Company')} required error={errors.company}>
                    <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} autoComplete="organization" />
                  </Field>
                  <Field label={tr('Company size')}>
                    <Select
                      value={form.size}
                      onChange={(e) => setForm({ ...form, size: e.target.value })}
                      options={['1–49', '50–199', '200–499', '500+'].map((s) => ({ value: s, label: `${s} people` }))}
                    />
                  </Field>
                </div>
                <Field label="Where do you want to run Anumat?">
                  <Select
                    value={form.deployment}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        deployment: e.target.value as Lead['deployment'],
                      })
                    }
                    options={[{ value: 'not-sure', label: 'Not sure yet' }, ...OPTIONS.map((o) => ({ value: o.id, label: o.name }))]}
                  />
                </Field>
                <Field label="Anything we should know?" optional>
                  <Textarea rows={3} autoGrow value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </Field>
                <Button type="submit" variant="primary" className="self-start">
                  Contact sales
                </Button>
              </form>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}
