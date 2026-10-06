import { Button, cn, Field, Input, RadioGroup, RadioGroupItem, Select, Text, useToast } from '@app/ui';
import { ArrowRight, Check, FileCheck2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { PublicHeader } from '../components/PublicHeader';
import { WorkflowIllustration } from '../components/WorkflowIllustration';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { BUSINESS_STARTERS, businessStarter, isBusinessStarter, type BusinessStarter } from '../lib/businessStarter';
import { APP_CATALOG } from '../lib/appCatalog';
import { prefersReducedMotion } from '../lib/motion';
import '../styles/sme-experience.css';

const SIZES = ['1–9', '10–49', '50–199', '200–499', '500+'];
const STEPS = ['Your company', 'Your starting point', 'Review & create'];
const DRAFT_KEY = 'anumat-workspace-setup-v1';
function loadDraft() {
  try { const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}'); return { name: typeof draft.name === 'string' ? draft.name : '', size: SIZES.includes(draft.size) ? draft.size : '10–49', starter: isBusinessStarter(draft.starter) ? draft.starter : 'work' as BusinessStarter, step: draft.name?.trim() && [0, 1, 2].includes(draft.step) ? draft.step as number : 0 }; }
  catch { return { name: '', size: '10–49', starter: 'work' as BusinessStarter, step: 0 }; }
}

export function Welcome() {
  const { t: tr } = useLocale();
  const { state, me, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const demo = params.get('demo') === '1';
  const [draft] = useState(loadDraft);
  const [step, setStepState] = useState(demo ? 0 : draft.step);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const setStep = (next: number) => { setDirection(next > step ? 'forward' : 'back'); setStepState(next); };
  const [name, setName] = useState(demo ? state.org.name : draft.name);
  const [size, setSize] = useState(demo && SIZES.includes(state.org.size) ? state.org.size : draft.size);
  const [starter, setStarter] = useState<BusinessStarter>(isBusinessStarter(params.get('starter')) ? params.get('starter') as BusinessStarter : draft.starter);
  const [nameError, setNameError] = useState<string>();
  const [draftSaved, setDraftSaved] = useState(false);
  const submitting = useRef(false);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    document.querySelector<HTMLElement>('.an-step-panel h1')?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => {
    if (demo || submitting.current) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, size, starter, step })); setDraftSaved(!!name.trim()); }
    catch { setDraftSaved(false); }
  }, [name, size, starter, step, demo]);
  const selected = businessStarter(starter);
  const next = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { setNameError(tr('Enter your company’s name. You can change it later.')); setStep(0); return; }
    if (step < 2) { setStep(step + 1); return; }
    submitting.current = true;
    if (demo) dispatch({ type: 'setupOrg', name: name.trim(), size, starter, activeProcessIds: state.processes.filter(process => process.active).map(process => process.id) });
    else dispatch({ type: 'createWorkspace', name: name.trim(), size, starter, activeProcessIds: [] });
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* Creation works when draft storage is unavailable. */ }
    toast({ tone: 'success', title: tr('Workspace created'), description: tr('Start with one workflow. Add your team when you are ready.') });
    navigate(starter === 'all' ? '/discover' : `/home?app=${selected.app}`);
  };
  return <div className="an-setup min-h-dvh bg-bg text-fg">
    <PublicHeader setup={tr('Set up account')} progress={(step + 1) / 3 * 100} onBack={() => step ? setStep(step - 1) : navigate('/')} />
    <main id="main-content" tabIndex={-1} className="an-setup-main an-sme-setup outline-none">
      <div className="an-setup-copy">
        <ol className="an-sme-setup-progress" aria-label={tr('Sign-up steps')}>{STEPS.map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined}><span aria-hidden className={cn('an-step-dot', index <= step && 'an-step-dot-active')}>{index < step ? <Check size={14} /> : index + 1}</span><span>{tr(label)}</span></li>)}</ol>
        <form noValidate onSubmit={next} className="an-setup-form">
          <div key={step} data-direction={direction} className="an-step-panel an-sme-setup-panel">
            {step === 0 && <><h1 tabIndex={-1} className="an-setup-title outline-none">{tr('Create your workspace')}</h1><p>{tr('Tell us about your company. Start with one workflow and grow from there.')}</p>
              <Field label={tr('Company name')} required error={nameError}><Input autoFocus value={name} maxLength={120} onChange={event => { setName(event.target.value); setNameError(undefined); }} placeholder={tr('Your company name')} autoComplete="organization" /></Field>
              <Field label={tr('Company size')}><Select value={size} onChange={event => setSize(event.target.value)} options={SIZES.map(value => ({ value, label: tr('{size} people', { size: value }) }))} /></Field>
              <p className="an-sme-setup-note">{tr('Workspace owner: {name}', { name: me.name })}</p></>}
            {step === 1 && <><h1 tabIndex={-1} className="an-setup-title outline-none">{tr('What would you like to improve first?')}</h1><p>{tr('Choose a starting point. All twelve apps remain available; this does not change permissions.')}</p>
              <RadioGroup legend={tr('Your starting point')} legendHidden value={starter} onValueChange={value => { if (isBusinessStarter(value)) setStarter(value); }} className="an-starter-choices">{BUSINESS_STARTERS.map(option => <RadioGroupItem key={option.id} value={option.id} label={tr(option.title)} helpText={tr(option.description)} className="an-starter-choice" />)}</RadioGroup>
              <p className="an-sme-setup-note">{tr('Invite teammates from People & roles inside an app after setup.')}</p></>}
            {step === 2 && <><h1 tabIndex={-1} className="an-setup-title outline-none">{tr('Ready for your first workflow')}</h1><p>{tr('Check your choices, then open your workspace.')}</p>
              <dl className="an-sme-review">{[{ label: 'Company', value: name.trim(), edit: 0 }, { label: 'Company size', value: tr('{size} people', { size }), edit: 0 }, { label: 'Your starting point', value: tr(selected.title), edit: 1 }].map(row => <div key={row.label}><dt>{tr(row.label)}</dt><dd>{row.value}</dd><Button variant="tertiary" size="sm" aria-label={tr('Edit {field}', { field: tr(row.label) })} onClick={() => setStep(row.edit)}>{tr('Edit')}</Button></div>)}</dl>
              <div className="an-sme-first-step"><FileCheck2 size={20} aria-hidden /><div><strong>{tr('Your first step')}</strong><p>{tr(starter === 'people' ? 'Add your first employee record, then invite an HR teammate.' : starter === 'all' ? 'Explore the app groups and choose one workflow to try.' : 'Create an approval process, then submit your first request.')}</p></div></div>
              {!demo && <p className="an-sme-setup-note">{tr('A new workspace starts empty. No teammates are invited during setup.')}</p>}
            </>}
          </div>
          <div className="an-sme-setup-actions"><Button variant="tertiary" onClick={() => step ? setStep(step - 1) : navigate('/')}>{tr(step ? 'Back' : 'Cancel')}</Button><Button type="submit" variant="primary" trailingIcon={<ArrowRight size={16} />}>{tr(step === 2 ? 'Create workspace' : 'Continue')}</Button></div>
        </form>
        {draftSaved && <Text variant="caption" tone="muted">{tr('Your progress is saved on this device.')}</Text>}
        <p className="an-sme-setup-note">{tr('Browser-only prototype. Changes stay on this device.')}</p>
      </div>
      <aside className="an-sme-setup-aside"><WorkflowIllustration starter={starter} loading="eager" /><h2>{tr('Small start. Room to grow.')}</h2><p>{tr('Keep decisions, responsibilities, and next steps together. Add more apps as your team needs them.')}</p><ul>{selected.apps.map(app => { const Icon = APP_CATALOG[app].icon; return <li key={app}><Icon size={18} aria-hidden />{tr(APP_CATALOG[app].title)}</li>; })}</ul></aside>
    </main>
  </div>;
}
