import { Button, IconButton, Text } from '@repo/ui';
import { X } from 'lucide-react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../data/store';

interface Step {
  title: string;
  as: string;
  to: string;
  /** What the presenter says. */
  say: string;
  /** What the presenter clicks. */
  doThis: string;
}

/** The 3-minute pitch: one request from ask to decision to action to insight. */
export const TOUR: Step[] = [
  {
    title: 'The problem',
    as: 'dara',
    to: '/',
    say: 'Requests live in email, chat and spreadsheets. Nobody knows who decides, or what happens next.',
    doThis: 'Point at “Needs your decision”: everything waiting on Dara, in one place.',
  },
  {
    title: 'Ask',
    as: 'alex',
    to: '/requests/new?demo=laptops',
    say: 'Alex needs laptops for three new analysts. One form, and Anumat already shows who will approve it.',
    doThis: 'Change the amount to 500, then back to 7500: watch the route change. Then Submit for approval.',
  },
  {
    title: 'Approve',
    as: 'dara',
    to: '/approvals',
    say: 'Dara sees it at the top of her queue with everything she needs: amount, reason, files, the route.',
    doThis: 'Open “Laptops for 3 new analysts” and Approve.',
  },
  {
    title: 'Rules route it',
    as: 'priya',
    to: '/approvals',
    say: 'It’s over $1,000, so Finance reviews next. Priya was notified; nobody had to chase anyone.',
    doThis: 'Open the bell to show the notification, then approve the request.',
  },
  {
    title: 'Decide together',
    as: 'dara',
    to: '/meetings/ops-weekly',
    say: 'Bigger calls happen in meetings. The decision is recorded next to the request it belongs to.',
    doThis: 'Record a decision, then add an action item for Alex.',
  },
  {
    title: 'Act',
    as: 'alex',
    to: '/tasks',
    say: 'That action item is now Alex’s task, with a deadline and a link back to the decision.',
    doThis: 'Turn on “Only my tasks” and tick one off.',
  },
  {
    title: 'Change the rules',
    as: 'dara',
    to: '/processes/proc-purchase',
    say: 'Operations owns the process, not IT. Change who approves and when, without code.',
    doThis: 'Raise the Finance threshold, then use “Try it” with different amounts.',
  },
  {
    title: 'Track',
    as: 'sokha',
    to: '/insights',
    say: 'Leadership sees how fast decisions happen and where they get stuck. Ask, approve, move forward.',
    doThis: 'Hover “Where requests are waiting”.',
  },
];

const KEY = 'anumat-tour';

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
      return saved === null ? null : Number(saved);
    } catch {
      return null;
    }
  });

  useEffect(() => {
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
  const start = () => {
    dispatch({ type: 'reset' });
    go(0);
  };
  return <TourContext.Provider value={{ step, start, go, end: () => setStep(null) }}>{children}</TourContext.Provider>;
}

/** The presenter's panel, pinned to the bottom corner while a tour runs. */
export function TourPanel() {
  const { step, go, end } = useTour();
  const { person } = useStore();
  if (step === null) return null;
  const s = TOUR[step];
  if (!s) return null;
  const last = step === TOUR.length - 1;
  return (
    <aside
      aria-label="Demo tour"
      className="fixed end-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-(--a-z-index-overlay) flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <Text as="span" variant="caption" tone="muted" numeric>
            Demo tour · {step + 1} of {TOUR.length} · as {person(s.as).name}
          </Text>
          <Text as="h2" variant="subtitle">
            {s.title}
          </Text>
        </div>
        <IconButton size="sm" icon={<X />} label="End demo tour" onClick={end} />
      </div>
      <p className="border-s-2 border-primary ps-3 text-md text-fg">“{s.say}”</p>
      <Text variant="bodySm" tone="muted">
        <span className="font-semibold text-fg">Do: </span>
        {s.doThis}
      </Text>
      <ol className="flex gap-1" aria-hidden>
        {TOUR.map((t, i) => (
          <li key={t.title} className={i <= step ? 'h-1 flex-1 rounded-full bg-primary' : 'h-1 flex-1 rounded-full bg-border'} />
        ))}
      </ol>
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="tertiary" disabled={step === 0} onClick={() => go(step - 1)}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => go(step)}>
            Redo step
          </Button>
          {last ? (
            <Button size="sm" variant="primary" onClick={end}>
              Finish
            </Button>
          ) : (
            <Button size="sm" variant="primary" onClick={() => go(step + 1)}>
              Next: {TOUR[step + 1]?.title}
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
