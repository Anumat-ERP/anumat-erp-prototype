import { Checkbox, Field, Input, RadioGroup, RadioGroupItem, Select, Textarea, cn } from '@repo/ui';
import { useRef, type KeyboardEvent } from 'react';
import type { FormField, FormValues } from '../../data/types';
import { choicesFor, visibleFields } from '../../lib/forms';

/**
 * A row of numbered buttons that behaves like a radio group: one tab stop,
 * arrow keys move and select. Used for 1–5 ratings and 0–10 scales.
 */
export function ChoiceScale({
  label,
  choices,
  value,
  onChange,
  low,
  high,
  invalid,
  disabled,
}: {
  label: string;
  choices: string[];
  value: string;
  onChange: (v: string) => void;
  low: string;
  high: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = choices.indexOf(value);
  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + choices.length) % choices.length;
    onChange(choices[next]!);
    refs.current[next]?.focus();
  };
  return (
    <div className="flex max-w-lg flex-col gap-1.5">
      <div role="radiogroup" aria-label={label} aria-invalid={invalid || undefined} className="flex flex-wrap gap-1">
        {choices.map((c, i) => (
          <button
            key={c}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={value === c}
            tabIndex={i === (current < 0 ? 0 : current) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(c)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'flex h-9 min-w-9 flex-1 items-center justify-center rounded-md border px-2 text-sm font-medium tabular-nums transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60',
              value === c
                ? 'border-primary bg-primary text-primary-fg'
                : cn('bg-surface text-fg hover:bg-surface-hover', invalid ? 'border-critical' : 'border-border-strong'),
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-fg-muted" aria-hidden>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

/** Element id of a question, so a submit with errors can move focus to the first one. */
export const questionId = (prefix: string, fieldId: string) => `${prefix}-${fieldId}`;

/** Renders a dynamic form: request fields, survey questions, and the builder's preview. */
export function FormRenderer({
  fields,
  values,
  onChange,
  errors = {},
  idPrefix = 'q',
  disabled,
  numbered,
}: {
  fields: FormField[];
  values: FormValues;
  onChange: (values: FormValues) => void;
  errors?: Record<string, string>;
  idPrefix?: string;
  disabled?: boolean;
  /** Show "1.", "2."… before each question, as surveys do. */
  numbered?: boolean;
}) {
  const shown = visibleFields(fields, values);
  const set = (id: string, v: string | string[]) => onChange({ ...values, [id]: v });

  return (
    <div className="flex flex-col gap-6">
      {shown.map((f, i) => {
        const id = questionId(idPrefix, f.id);
        const label = numbered ? `${i + 1}. ${f.label || 'Untitled question'}` : f.label || 'Untitled question';
        const common = { label, required: f.required, helpText: f.help || undefined, error: errors[f.id], disabled };
        const text = typeof values[f.id] === 'string' ? (values[f.id] as string) : '';
        const list = Array.isArray(values[f.id]) ? (values[f.id] as string[]) : [];

        switch (f.kind) {
          case 'longtext':
            return (
              <Field key={f.id} id={id} {...common}>
                <Textarea rows={3} autoGrow value={text} onChange={(e) => set(f.id, e.target.value)} />
              </Field>
            );
          case 'select':
            return (
              <Field key={f.id} id={id} {...common}>
                <Select
                  value={text}
                  placeholder="Choose an answer"
                  onChange={(e) => set(f.id, e.target.value)}
                  options={(f.options ?? []).filter(Boolean).map((o) => ({ value: o, label: o }))}
                />
              </Field>
            );
          case 'radio':
          case 'yesno':
            return (
              <Field key={f.id} group {...common}>
                <RadioGroup
                  id={id}
                  value={text}
                  onValueChange={(v) => set(f.id, v)}
                  orientation={f.kind === 'yesno' ? 'horizontal' : 'vertical'}
                >
                  {choicesFor(f)
                    .filter(Boolean)
                    .map((o) => (
                      <RadioGroupItem key={o} value={o} label={o} />
                    ))}
                </RadioGroup>
              </Field>
            );
          case 'checkboxes':
            return (
              <Field key={f.id} group {...common}>
                <div id={id} className="flex flex-col gap-2.5">
                  {(f.options ?? []).filter(Boolean).map((o) => (
                    <Checkbox
                      key={o}
                      label={o}
                      checked={list.includes(o)}
                      onCheckedChange={(c) => set(f.id, c === true ? [...list, o] : list.filter((x) => x !== o))}
                    />
                  ))}
                </div>
              </Field>
            );
          case 'rating':
          case 'scale':
            return (
              <Field key={f.id} group {...common}>
                <div id={id}>
                  <ChoiceScale
                    label={f.label}
                    choices={choicesFor(f)}
                    value={text}
                    onChange={(v) => set(f.id, v)}
                    low={f.kind === 'rating' ? 'Poor' : 'Not at all'}
                    high={f.kind === 'rating' ? 'Excellent' : 'Extremely'}
                    invalid={Boolean(errors[f.id])}
                    disabled={disabled}
                  />
                </div>
              </Field>
            );
          default:
            return (
              <Field key={f.id} id={id} {...common}>
                <Input
                  type={f.kind === 'date' ? 'date' : 'text'}
                  inputMode={f.kind === 'number' ? 'decimal' : undefined}
                  value={text}
                  onChange={(e) => set(f.id, e.target.value)}
                  className={f.kind === 'date' || f.kind === 'number' ? 'max-w-xs' : undefined}
                />
              </Field>
            );
        }
      })}
    </div>
  );
}

/** Moves focus to the first question with an error. */
export function focusFirstError(fields: FormField[], errors: Record<string, string>, idPrefix = 'q') {
  const first = fields.find((f) => errors[f.id]);
  if (!first) return;
  const el = document.getElementById(questionId(idPrefix, first.id));
  const target = el?.matches('input, textarea, select, button') ? el : el?.querySelector<HTMLElement>('input, textarea, select, button, [role="radio"]');
  (target as HTMLElement | null | undefined)?.focus();
}
