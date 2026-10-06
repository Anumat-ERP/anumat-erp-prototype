import { Button, IconButton, Text } from '@app/ui';
import { ChevronDown, Eye, EyeOff, Presentation, RotateCcw, X } from 'lucide-react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';

interface Step {
  title: string;
  as: string;
  to: string;
  /** What the presenter says. */
  say: string;
  /** What the presenter clicks. */
  doThis: string;
}

/** A short walkthrough of the now-empty workflow workspace. */
export const TOUR: Step[] = [
  {
    title: 'Sign up',
    as: 'dara',
    to: '/welcome?demo=1',
    say: 'Dara runs operations at a logistics company where approvals live in email. She sets up Anumat for the whole company in under a minute.',
    doThis: 'Name the workspace, choose Approvals & tasks, review the setup, and create it.',
  },
  {
    title: 'The problem',
    as: 'dara',
    to: '/home',
    say: 'The workspace starts with no requests or approvals. The team can define its own process before work begins.',
    doThis: 'Review the empty approval summary and open Approval processes.',
  },
  {
    title: 'Create the rules',
    as: 'dara',
    to: '/processes',
    say: 'A workspace owner creates a process to decide who reviews each kind of request.',
    doThis: 'Choose New process, name the request type, set approvers, and save it.',
  },
  {
    title: 'Ask',
    as: 'dara',
    to: '/requests/new',
    say: 'Once a process is active, anyone allowed by its rules can submit a request and follow the decision.',
    doThis: 'If you created a process, choose its request type and submit a request. Otherwise, return to Approval processes.',
  },
];

const KEY = 'anumat-tour';
const SCRIPT_KEY = 'anumat-tour-script';

interface TourState {
  step: number | null;
  start: () => void;
  go: (step: number) => void;
  end: () => void;
}

const TourContext = createContext<TourState | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside <TourProvider>.');
  return ctx;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<number | null>(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      const index = saved === null ? NaN : Number(saved);
      return Number.isInteger(index) && index >= 0 && index < TOUR.length ? index : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Leave room below the page so the pinned panel never covers its last buttons.
    document.documentElement.toggleAttribute('data-tour', step !== null);
    try {
      if (step === null) sessionStorage.removeItem(KEY);
      else sessionStorage.setItem(KEY, String(step));
    } catch {
      // The tour still works for this visit.
    }
  }, [step]);

  const go = (i: number) => {
    const s = TOUR[i];
    if (!s) return;
    dispatch({ type: 'switchUser', personId: s.as });
    navigate(s.to);
    setStep(i);
  };
  // Presentation clickers send PageDown/PageUp (some send arrow keys).
  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      const typing = t?.closest('input, textarea, select, [contenteditable="true"]');
      // Arrow keys belong to focused widgets (tabs, radios, menus); only take them from the page itself.
      const inWidget = t && t !== document.body && t.closest('button, a, [role]');
      const forward = e.key === 'PageDown' || (e.key === 'ArrowRight' && !inWidget);
      const back = e.key === 'PageUp' || (e.key === 'ArrowLeft' && !inWidget);
      if (typing || (!forward && !back)) return;
      e.preventDefault();
      if (forward && step < TOUR.length - 1) go(step + 1);
      if (back && step > 0) go(step - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const start = () => {
    dispatch({ type: 'reset' });
    go(0);
  };
  return <TourContext.Provider value={{ step, start, go, end: () => setStep(null) }}>{children}</TourContext.Provider>;
}

/** The presenter's panel, pinned to the bottom corner while a tour runs. */
export function TourPanel() {
  const { t: tr } = useLocale();
  const { step, go, end } = useTour();
  const { person } = useStore();
  const [minimized, setMinimized] = useState(false);
  // The script is hidden by default so the audience doesn't read it off the projector.
  const [showScript, setShowScript] = useState(() => {
    try {
      return sessionStorage.getItem(SCRIPT_KEY) === 'show';
    } catch {
      return false;
    }
  });
  const toggleScript = () => {
    const next = !showScript;
    setShowScript(next);
    try {
      sessionStorage.setItem(SCRIPT_KEY, next ? 'show' : 'hide');
    } catch {
      // Still toggles for this visit.
    }
  };
  if (step === null) return null;
  const s = TOUR[step];
  if (!s) return null;
  const last = step === TOUR.length - 1;
  if (minimized) {
    return (
      <Button
        variant="secondary"
        icon={<Presentation />}
        onClick={() => setMinimized(false)}
        className="fixed end-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-(--a-z-index-overlay) shadow-md"
      >
        {tr("Tour")}{' '}{step + 1}/{TOUR.length}: {tr(s.title)}
      </Button>
    );
  }
  return (
    <aside
      aria-label={tr('Demo tour')}
      className="fixed end-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-(--a-z-index-overlay) flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <Text as="span" variant="caption" tone="muted" numeric>
            <span className="whitespace-nowrap">{tr("Demo tour ·")}{' '}{step + 1} {tr("of")}{' '}{TOUR.length}</span>{' '}
            <span className="whitespace-nowrap">{tr("· as")}{' '}{tr(person(s.as).name)}</span>
            <span className="sr-only">{tr(". Page Down for the next step, Page Up to go back.")}</span>
          </Text>
          <Text as="h2" variant="subtitle">
            {tr(s.title)}
          </Text>
        </div>
        <div className="flex shrink-0">
          <IconButton
            size="sm"
            icon={showScript ? <EyeOff /> : <Eye />}
            label={showScript ? tr("Hide the script") : tr("Show the script")}
            aria-pressed={showScript}
            onClick={toggleScript}
          />
          <IconButton size="sm" icon={<ChevronDown />} label={tr("Minimize demo tour")} onClick={() => setMinimized(true)} />
          <IconButton size="sm" icon={<X />} label={tr("End demo tour")} onClick={end} />
        </div>
      </div>
      {showScript ? <p className="border-s-2 border-primary ps-3 text-md text-fg">“{tr(s.say)}”</p> : null}
      <Text variant="bodySm" tone="muted">
        <span className="font-semibold text-fg">{tr('Do:')}{' '}</span>
        {tr(s.doThis)}
      </Text>
      <ol className="flex gap-1" aria-label={tr('Demo tour')}>
        {TOUR.map((t, i) => (
          <li key={t.title} className="min-w-0 flex-1">
            <Button variant="tertiary"
              type="button"
              onClick={() => go(i)}
              aria-label={`${i + 1}. ${tr(t.title)}`}
              aria-current={i === step ? 'step' : undefined}
              title={`${i + 1}. ${tr(t.title)}`}
              className="h-auto p-0 justify-start whitespace-normal flex h-6 w-full items-center rounded focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className={i <= step ? 'h-1 w-full rounded-full bg-primary' : 'h-1 w-full rounded-full bg-border'} />
            </Button>
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="tertiary" className="whitespace-nowrap" disabled={step === 0} onClick={() => go(step - 1)}>
          {' '}
          {tr('Back')}{' '}
        </Button>
        <div className="flex items-center gap-2">
          <IconButton size="sm" icon={<RotateCcw />} label={tr("Redo step")} onClick={() => go(step)} />
          {last ? (
            <Button size="sm" variant="primary" onClick={end}>
              {' '}
              {tr('Finish')}{' '}
            </Button>
          ) : (
            <Button size="sm" variant="primary" className="whitespace-nowrap" onClick={() => go(step + 1)}>
              {tr("Next:")}{' '}{tr(TOUR[step + 1]?.title ?? '')}
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
