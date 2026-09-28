import { Button, Field, IconButton, Modal, Text, Textarea, cn, useToast } from '@repo/ui';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CONFIG, isSet } from '../config';
import { surveyDue, useStore } from '../data/store';
import { useTour } from './DemoTour';

type Kind = 'survey' | 'feedback' | 'problem';

/** 0–10 "how likely to recommend", as a row of radio buttons. */
function ScoreScale({ value, onChange }: { value: number | null; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div role="radiogroup" aria-label="How likely are you to recommend Anumat, from 0 (not at all) to 10 (extremely)" className="flex flex-wrap gap-1">
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className={cn(
              'flex size-8 items-center justify-center rounded-md border text-sm font-medium tabular-nums transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              value === n ? 'border-primary bg-primary text-primary-fg' : 'border-border-strong bg-surface text-fg hover:bg-surface-hover',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-fg-muted" aria-hidden>
        <span>Not at all likely</span>
        <span>Extremely likely</span>
      </div>
    </div>
  );
}

const COPY: Record<Kind, { title: string; label: string; help: string; placeholder: string }> = {
  survey: {
    title: 'How are we doing?',
    label: 'What’s the one thing we should improve?',
    help: 'Optional. We read every answer.',
    placeholder: 'I’d use Anumat more if…',
  },
  feedback: {
    title: 'Send feedback',
    label: 'Your feedback',
    help: 'Ideas, what you like, what gets in the way.',
    placeholder: 'It would help if…',
  },
  problem: {
    title: 'Report a problem',
    label: 'What went wrong?',
    help: 'What you were doing, and what you expected to happen.',
    placeholder: 'I clicked Approve and…',
  },
};

/** One dialog for the survey, general feedback and problem reports. */
export function FeedbackDialog({ kind, onClose }: { kind: Kind | null; onClose: () => void }) {
  const { dispatch } = useStore();
  const { toast } = useToast();
  const [score, setScore] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const copy = COPY[kind ?? 'feedback'];

  useEffect(() => {
    setScore(null);
    setText('');
    setError(undefined);
  }, [kind]);

  const submit = () => {
    if (!kind) return;
    if (kind === 'survey' && score === null) return setError('Pick a number from 0 to 10.');
    if (kind !== 'survey' && !text.trim()) return setError('Write a sentence or two, so we know what you mean.');
    dispatch({ type: 'addFeedback', kind, score: score ?? undefined, text: text.trim() });
    toast({ tone: 'success', title: 'Thank you', description: kind === 'problem' ? 'We’ll look into it.' : 'Your feedback shapes what we build next.' });
    onClose();
  };

  return (
    <Modal
      open={kind !== null}
      onOpenChange={(o) => (o ? undefined : onClose())}
      title={copy.title}
      primaryAction={{ content: 'Send', onAction: submit }}
      secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
    >
      <div className="flex flex-col gap-4">
        {kind === 'survey' ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-md font-medium">How likely are you to recommend Anumat to a colleague?</legend>
            <ScoreScale value={score} onChange={(n) => (setScore(n), setError(undefined))} />
          </fieldset>
        ) : null}
        <Field label={copy.label} helpText={copy.help} error={error} optional={kind === 'survey'}>
          <Textarea rows={3} autoGrow value={text} placeholder={copy.placeholder} onChange={(e) => (setText(e.target.value), setError(undefined))} />
        </Field>
        <Text variant="caption" tone="muted">
          {isSet(CONFIG.forms.feedbackUrl) ? (
            <>
              Prefer a longer survey?{' '}
              <a href={CONFIG.forms.feedbackUrl} target="_blank" rel="noopener noreferrer" className="text-fg-link underline">
                Open the full form
              </a>
              .
            </>
          ) : (
            'Prototype: answers are saved in this browser and shown to admins under Feedback.'
          )}
        </Text>
      </div>
    </Modal>
  );
}

/**
 * A small, dismissible card asking for a 0–10 score right after someone makes
 * a decision. Never during the demo tour; at most every 30 days.
 */
export function SurveyPrompt() {
  const { state, dispatch } = useStore();
  const { step } = useTour();
  const decisions = state.requests.reduce((n, r) => n + r.steps.filter((s) => s.approverId === state.meId && s.at && s.status !== 'current').length, 0);
  const last = useRef({ me: state.meId, decisions });
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    const prev = last.current;
    if (prev.me === state.meId && decisions > prev.decisions && surveyDue(state) && step === null) {
      setScore(null);
      setText('');
      setOpen(true);
    }
    last.current = { me: state.meId, decisions };
  }, [decisions, state, step]);

  if (!open || step !== null) return null;
  const close = (dismiss: boolean) => {
    if (dismiss) dispatch({ type: 'dismissSurvey' });
    setOpen(false);
  };
  return (
    <aside
      aria-label="Quick survey"
      className="fixed start-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-(--a-z-index-overlay) flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <Text as="h2" variant="label">
          Quick question
        </Text>
        <IconButton size="sm" icon={<X />} label="Not now" onClick={() => close(true)} />
      </div>
      <Text>How likely are you to recommend Anumat to a colleague?</Text>
      <ScoreScale value={score} onChange={setScore} />
      {score !== null ? (
        <>
          <Field label={score >= 9 ? 'What do you like most?' : 'What would make it a 10?'} optional>
            <Textarea rows={2} autoGrow value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <Button
            variant="primary"
            size="sm"
            className="self-end"
            onClick={() => {
              dispatch({ type: 'addFeedback', kind: 'survey', score, text: text.trim() });
              close(false);
            }}
          >
            Send
          </Button>
        </>
      ) : null}
    </aside>
  );
}
