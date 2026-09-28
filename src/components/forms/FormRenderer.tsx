import { Checkbox, Field, Input, RadioGroup, RadioGroupItem, Select, Text, Textarea, cn, useField } from '@repo/ui';
import { useRef, type KeyboardEvent } from 'react';
import { useStore } from '../../data/store';
import type { FormField, FormValues } from '../../data/types';
import { choicesFor, isQuestion, visibleFields } from '../../lib/forms';

/**
 * A row of numbered buttons that behaves like a radio group: one tab stop,
 * arrow keys, Home and End move and select. Used for 1–5 ratings and 0–10
 * scales. Named by the surrounding Field's legend, so the question number and
 * "required" are announced once.
 */
export function ChoiceScale({
  choices,
  value,
  onChange,
  low,
  high,
  invalid,
  disabled,
}: {
  choices: string[];
  value: string;
  onChange: (v: string) => void;
  low: string;
  high: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const field = useField();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = choices.indexOf(value);
  const onKey = (e: KeyboardEvent, i: number) => {
    const last = choices.length - 1;
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? (i + 1) % choices.length
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? (i - 1 + choices.length) % choices.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(choices[next]!);
    refs.current[next]?.focus();
  };
  return (
    <div className="flex max-w-lg flex-col gap-1.5">
      {/* One row at any width: equal columns, so 0–10 still fits a phone. */}
      <div
        role="radiogroup"
        aria-labelledby={field?.labelId}
        aria-describedby={field?.describedBy}
        aria-invalid={invalid || undefined}
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${choices.length}, minmax(0, 1fr))` }}
      >
        {choices.map((c, i) => (
          <button
            key={c}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={value === c}
            // The end labels are part of the first and last options' names.
            aria-label={i === 0 ? `${c}, ${low}` : i === choices.length - 1 ? `${c}, ${high}` : undefined}
            tabIndex={i === (current < 0 ? 0 : current) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(c)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'flex h-10 min-w-0 items-center justify-center rounded-md border text-sm font-medium tabular-nums transition-colors',
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

function PersonSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { state } = useStore();
  return (
    <Select
      value={value}
      placeholder="Choose a person"
      onChange={(e) => onChange(e.target.value)}
      options={state.people.map((p) => ({ value: p.id, label: `${p.name} · ${p.role}` }))}
    />
  );
}

const INPUT_TYPE: Partial<Record<FormField['kind'], { type: string; inputMode?: 'decimal' | 'email' | 'tel' | 'url'; autoComplete?: string; narrow?: boolean }>> = {
  number: { type: 'text', inputMode: 'decimal', narrow: true },
  money: { type: 'text', inputMode: 'decimal', narrow: true },
  date: { type: 'date', narrow: true },
  email: { type: 'email', inputMode: 'email', autoComplete: 'email' },
  phone: { type: 'tel', inputMode: 'tel', autoComplete: 'tel' },
  url: { type: 'url', inputMode: 'url' },
};

/** Renders a dynamic form: request fields, approval-step fields, survey questions, and the builders' previews. */
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
  /** Show "1.", "2."… before each question, as surveys do. Sections aren't counted. */
  numbered?: boolean;
}) {
  const shown = visibleFields(fields, values);
  const set = (id: string, v: string | string[]) => onChange({ ...values, [id]: v });
  let n = 0;

  return (
    <div className="flex flex-col gap-6">
      {shown.map((f) => {
        if (!isQuestion(f)) {
          return (
            <div key={f.id} className="flex flex-col gap-1 border-t border-border pt-5 first:border-0 first:pt-0">
              <Text as="h3" variant="subtitle">
                {f.label || 'Untitled section'}
              </Text>
              {f.help ? (
                <Text variant="bodySm" tone="muted">
                  {f.help}
                </Text>
              ) : null}
            </div>
          );
        }
        n += 1;
        const id = questionId(idPrefix, f.id);
        const label = numbered ? `${n}. ${f.label || 'Untitled question'}` : f.label || 'Untitled question';
        const common = { label, required: f.required, helpText: f.help || undefined, error: errors[f.id], disabled };
        const text = typeof values[f.id] === 'string' ? (values[f.id] as string) : '';
        const list = Array.isArray(values[f.id]) ? (values[f.id] as string[]) : [];

        switch (f.kind) {
          case 'longtext':
            return (
              <Field key={f.id} id={id} {...common}>
                <Textarea rows={3} autoGrow value={text} placeholder={f.placeholder} onChange={(e) => set(f.id, e.target.value)} />
              </Field>
            );
          case 'select':
          case 'department':
            return (
              <Field key={f.id} id={id} {...common}>
                <Select
                  value={text}
                  placeholder="Choose an answer"
                  onChange={(e) => set(f.id, e.target.value)}
                  options={choicesFor(f)
                    .filter(Boolean)
                    .map((o) => ({ value: o, label: o }))}
                />
              </Field>
            );
          case 'person':
            return (
              <Field key={f.id} id={id} {...common}>
                <PersonSelect value={text} onChange={(v) => set(f.id, v)} />
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
          default: {
            const t = INPUT_TYPE[f.kind];
            return (
              <Field key={f.id} id={id} {...common}>
                <Input
                  type={t?.type ?? 'text'}
                  inputMode={t?.inputMode}
                  autoComplete={t?.autoComplete}
                  prefix={f.kind === 'money' ? '$' : undefined}
                  placeholder={f.placeholder}
                  value={text}
                  onChange={(e) => set(f.id, e.target.value)}
                  className={t?.narrow ? 'max-w-xs' : undefined}
                />
              </Field>
            );
          }
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
  const target = el?.matches('input, textarea, select, button') ? el : el?.querySelector<HTMLElement>('input, textarea, select, button, [role="radio"][tabindex="0"]');
  (target as HTMLElement | null | undefined)?.focus();
}
