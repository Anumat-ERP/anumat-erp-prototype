import {
  Avatar,
  Banner,
  Button,
  Card,
  Checkbox,
  Field,
  IconButton,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  Text,
  useToast,
  cn,
} from '@repo/ui';
import { Check, Copy, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Logo } from '../components/Logo';
import { useStore } from '../data/store';
import { formatMoney } from '../lib/format';

const SIZES = [
  { value: '1–49', label: '1–49 people' },
  { value: '50–199', label: '50–199 people' },
  { value: '200–499', label: '200–499 people' },
  { value: '500+', label: '500 or more' },
];

const ROLES = [
  { value: 'admin', label: 'Admin', help: 'Manages people, processes and statuses' },
  { value: 'member', label: 'Member', help: 'Raises requests, works on tasks' },
];

/** Suggested role for each demo person, based on their job. */
const DEFAULT_ROLE: Record<string, string> = { sokha: 'admin' };

const STEPS = ['Your company', 'Invite your team', 'Approval processes'];

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'yourcompany';

interface Invite {
  email: string;
  name?: string;
  role: string;
}

/**
 * Sign-up for a new workspace: the organisation is the account. A mock for
 * the demo; nothing leaves the browser and no email is sent.
 */
export function Welcome() {
  const { state, me, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  // The demo tour opens sign-up with the company already named, to save time on stage.
  const [name, setName] = useState(params.get('demo') ? 'Lotus Logistics' : '');
  const [size, setSize] = useState('50–199');
  const [nameError, setNameError] = useState<string>();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [processIds, setProcessIds] = useState<string[]>(state.processes.map((p) => p.id));
  const [processError, setProcessError] = useState<string>();

  const domain = `${slug(name)}.com`;
  const code = `${slug(name).slice(0, 5).toUpperCase()}-7F2K`;

  const next = (e: FormEvent) => {
    e.preventDefault();
    if (step === 0) {
      if (!name.trim()) {
        setNameError('Enter your company’s name. You can change it later.');
        return;
      }
      if (invites.length === 0) {
        // Suggest the rest of the demo team, with addresses on the company’s domain.
        setInvites(
          state.people
            .filter((p) => p.id !== me.id)
            .map((p) => ({
              email: `${p.name.split(' ')[0]?.toLowerCase()}@${domain}`,
              name: p.name,
              role: DEFAULT_ROLE[p.id] ?? 'member',
            })),
        );
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    if (processIds.length === 0) {
      setProcessError('Turn on at least one process, so requests have somewhere to go.');
      return;
    }
    const access = Object.fromEntries(
      invites.flatMap((i) => {
        const p = state.people.find((x) => x.name === i.name);
        return p ? [[p.id, i.role as 'admin' | 'member']] : [];
      }),
    );
    // The demo tour renames the current workspace; everyone else gets a new one.
    if (params.get('demo')) dispatch({ type: 'setupOrg', name: name.trim(), size, activeProcessIds: processIds, access });
    else dispatch({ type: 'createWorkspace', name: name.trim(), size, activeProcessIds: processIds, access });
    toast({
      tone: 'success',
      title: `Welcome to ${name.trim()}`,
      description: `${invites.length} teammates invited · ${processIds.length} approval processes on.`,
    });
    navigate('/home');
  };

  const addInvite = () => {
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter an email address, like name@company.com.');
      return;
    }
    if (invites.some((i) => i.email === email)) {
      setEmailError('That person is already on the list.');
      return;
    }
    setInvites([...invites, { email, role: 'member' }]);
    setNewEmail('');
    setEmailError(undefined);
  };

  const copyCode = () => {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    try {
      navigator.clipboard.writeText(code).then(done, done);
    } catch {
      done();
    }
  };

  return (
    <div className="min-h-dvh bg-bg px-4 py-8 text-fg sm:py-12">
      <main id="main-content" tabIndex={-1} className="mx-auto flex w-full max-w-2xl flex-col gap-6 outline-none">
        <Logo className="h-8 w-auto self-start" />

        <ol className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Sign-up steps">
          {STEPS.map((label, i) => (
            <li key={label} aria-current={i === step ? 'step' : undefined} className="flex items-center gap-2 text-sm">
              <span
                aria-hidden
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                  i < step && 'bg-success text-success-fg',
                  i === step && 'bg-primary text-primary-fg',
                  i > step && 'border border-border-strong text-fg-muted',
                )}
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={i === step ? 'font-semibold text-fg' : 'text-fg-muted'}>
                {label}
                {i < step ? <span className="sr-only"> (done)</span> : null}
              </span>
            </li>
          ))}
        </ol>

        <form noValidate onSubmit={next}>
          <Card className="flex flex-col gap-6 p-6">
            {step === 0 ? (
              <>
                <div className="flex flex-col gap-1">
                  <Text as="h1" variant="heading">
                    Create your workspace
                  </Text>
                  <Text tone="muted">One workspace for your whole company. You’ll be its owner.</Text>
                </div>
                <Field label="Company name" required error={nameError}>
                  <Input
                    autoFocus
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError(undefined);
                    }}
                    placeholder="Lotus Logistics"
                  />
                </Field>
                <RadioGroup legend="How many people work there?" value={size} onValueChange={setSize}>
                  {SIZES.map((s) => (
                    <RadioGroupItem key={s.value} value={s.value} label={s.label} />
                  ))}
                </RadioGroup>
                <div className="flex items-center gap-3 rounded-md bg-surface-sunken p-3">
                  <Avatar name={me.name} size="sm" decorative />
                  <Text variant="bodySm" tone="muted">
                    Signed up as <span className="font-medium text-fg">{me.name}</span>, {me.role}
                  </Text>
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <div className="flex flex-col gap-1">
                  <Text as="h1" variant="heading">
                    Invite your team
                  </Text>
                  <Text tone="muted">They join {name.trim()} when they accept. Admins manage the workspace; who approves what comes from your approval processes, next.</Text>
                </div>
                <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {invites.map((inv) => (
                    <li key={inv.email} className="flex flex-wrap items-center gap-3 px-3 py-2">
                      <Avatar name={inv.name ?? inv.email} size="sm" decorative />
                      <span className="flex min-w-40 flex-1 flex-col">
                        <span className="truncate text-md">{inv.name ?? inv.email}</span>
                        {inv.name ? <span className="truncate text-sm text-fg-muted">{inv.email}</span> : null}
                      </span>
                      <Select
                        size="sm"
                        aria-label={`Role for ${inv.name ?? inv.email}`}
                        value={inv.role}
                        onChange={(e) => setInvites(invites.map((i) => (i.email === inv.email ? { ...i, role: e.target.value } : i)))}
                        options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
                        className="w-32"
                      />
                      <IconButton
                        size="sm"
                        icon={<X />}
                        label={`Remove ${inv.name ?? inv.email}`}
                        onClick={() => setInvites(invites.filter((i) => i.email !== inv.email))}
                      />
                    </li>
                  ))}
                  {invites.length === 0 ? (
                    <li className="px-3 py-4 text-md text-fg-muted">No one yet. Add people below, or share the invite code.</li>
                  ) : null}
                </ul>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <Field label="Add by email" error={emailError} className="flex-1">
                    <Input
                      type="email"
                      value={newEmail}
                      placeholder={`name@${domain}`}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addInvite();
                        }
                      }}
                    />
                  </Field>
                  <Button className="sm:mt-6" onClick={addInvite}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-muted p-3">
                  <div className="flex flex-col">
                    <Text variant="label">Or share an invite code</Text>
                    <Text variant="bodySm" tone="muted">
                      Anyone with it can ask to join. You approve them.
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-surface px-2 py-1 font-mono text-md tracking-wide select-all">{code}</span>
                    <Button size="sm" icon={copied ? <Check /> : <Copy />} onClick={copyCode}>
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
                <Text variant="caption" tone="subtle">
                  Roles: {ROLES.map((r) => `${r.label}, ${r.help.toLowerCase()}`).join(' · ')}.
                </Text>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="flex flex-col gap-1">
                  <Text as="h1" variant="heading">
                    Choose how things get approved
                  </Text>
                  <Text tone="muted">Starter processes with sensible rules. Change any of them later in Process Builder.</Text>
                </div>
                {processError ? <Banner tone="critical">{processError}</Banner> : null}
                <fieldset className="flex flex-col gap-3">
                  <legend className="sr-only">Approval processes to turn on</legend>
                  {state.processes.map((p) => (
                    <div key={p.id} className="rounded-lg border border-border p-3">
                      <Checkbox
                        label={<span className="font-medium">{p.name}</span>}
                        helpText={p.steps
                          .map((s) => (s.minAmount === undefined ? s.name : `${s.name} over ${formatMoney(s.minAmount).replace('.00', '')}`))
                          .join(' → ')}
                        checked={processIds.includes(p.id)}
                        onCheckedChange={(c) => {
                          setProcessIds(c === true ? [...processIds, p.id] : processIds.filter((id) => id !== p.id));
                          setProcessError(undefined);
                        }}
                      />
                    </div>
                  ))}
                </fieldset>
              </>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              {step > 0 ? (
                <Button variant="tertiary" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              ) : (
                <Button variant="tertiary" onClick={() => navigate('/')}>
                  Cancel
                </Button>
              )}
              <div className="flex gap-2">
                {step === 1 ? (
                  <Button variant="tertiary" onClick={() => setStep(2)}>
                    Skip for now
                  </Button>
                ) : null}
                <Button type="submit" variant="primary">
                  {step === 2 ? 'Create workspace' : 'Continue'}
                </Button>
              </div>
            </div>
          </Card>
        </form>
        <Text variant="caption" tone="subtle" align="center">
          Prototype: nothing leaves your browser and no emails are sent.
        </Text>
      </main>
    </div>
  );
}
