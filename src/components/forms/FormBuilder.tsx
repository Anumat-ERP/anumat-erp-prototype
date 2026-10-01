import { ActionMenu, Badge, Button, Checkbox, Field, IconButton, Input, Select, Text } from '@repo/ui';
import { ArrowDown, ArrowUp, Copy, GitBranch, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { uid } from '../../data/store';
import type { Condition, FieldKind, FormField } from '../../data/types';
import { useLocale } from '../../i18n/LocaleProvider';
import { FIELD_KINDS, canBranchOn, choicesFor, hasOptions, hasPlaceholder, isQuestion, kindLabel } from '../../lib/forms';

const DEFAULT_OPTIONS = ['Option 1', 'Option 2'];

export function newField(kind: FieldKind): FormField {
  return {
    id: uid('fld'),
    label: '',
    kind,
    required: false,
    ...(hasOptions(kind) ? { options: [...DEFAULT_OPTIONS] } : {}),
  };
}

/** The first real answer of a question, used when a condition is first set up. */
const firstChoice = (f: FormField) => choicesFor(f).find((c) => c.trim()) ?? '';

function OptionsEditor({ field, onChange }: { field: FormField; onChange: (options: string[], renamed?: { from: string; to: string }) => void }) {
  const { t: tr } = useLocale();
  const options = field.options ?? [];
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const add = () => {
    onChange([...options, `Option ${options.length + 1}`]);
    // Focus and select the new choice so typing replaces the placeholder text.
    requestAnimationFrame(() => {
      const el = refs.current[options.length];
      el?.focus();
      el?.select();
    });
  };
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-fg">{tr('Choices')}</legend>
      <ul className="flex flex-col gap-2">
        {options.map((o, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              aria-hidden
              className={
                field.kind === 'checkboxes'
                  ? 'size-4 shrink-0 rounded-sm border border-border-strong'
                  : 'size-4 shrink-0 rounded-full border border-border-strong'
              }
            />
            <Input
              size="sm"
              ref={(el) => {
                refs.current[i] = el;
              }}
              aria-label={`Choice ${i + 1}`}
              value={o}
              onChange={(e) =>
                onChange(
                  options.map((x, j) => (j === i ? e.target.value : x)),
                  { from: o, to: e.target.value },
                )
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (i === options.length - 1) add();
                  else refs.current[i + 1]?.focus();
                }
              }}
              className="flex-1"
            />
            <IconButton
              size="sm"
              icon={<X />}
              label={`Remove choice “${o || i + 1}”`}
              disabled={options.length <= 1}
              onClick={() => {
                onChange(options.filter((_, j) => j !== i));
                requestAnimationFrame(() => refs.current[Math.max(0, i - 1)]?.focus());
              }}
            />
          </li>
        ))}
      </ul>
      <Button size="sm" variant="plain" icon={<Plus />} className="self-start" onClick={add}>
        {' '}
        {tr('Add choice')}{' '}
      </Button>
    </fieldset>
  );
}

/**
 * "When [question] [is / isn't] [answer]". Used for "only ask when" in forms
 * and for "only run this step when" in approval processes.
 */
export function ConditionPicker({
  sources,
  value,
  onChange,
  numberOf,
}: {
  /** Questions the condition can look at: ones with a fixed list of answers. */
  sources: FormField[];
  value: Condition;
  onChange: (c: Condition) => void;
  /** Shown before each source's name, e.g. its question number. */
  numberOf?: (f: FormField) => string;
}) {
  const { t: tr } = useLocale();
  const source = sources.find((s) => s.id === value.fieldId);
  const multi = source?.kind === 'checkboxes';
  const choices = source ? choicesFor(source).filter((c) => c.trim()) : [];
  const stale = source && !choices.includes(value.equals);
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8.5rem_minmax(0,11rem)] sm:items-end">
      <Field label={tr('When')}>
        <Select
          size="sm"
          value={value.fieldId}
          onChange={(e) => {
            const src = sources.find((x) => x.id === e.target.value)!;
            onChange({
              fieldId: src.id,
              equals: firstChoice(src),
              op: value.op,
            });
          }}
          options={sources.map((s) => ({
            value: s.id,
            label: `${numberOf ? numberOf(s) : ''}${s.label || 'Untitled'}`,
          }))}
        />
      </Field>
      <Field label={tr('Rule')} labelHidden>
        <Select
          size="sm"
          value={value.op ?? 'is'}
          onChange={(e) => onChange({ ...value, op: e.target.value as Condition['op'] })}
          options={[
            { value: 'is', label: multi ? tr('includes') : tr('is') },
            {
              value: 'isNot',
              label: multi ? tr('doesn’t include') : tr('isn’t'),
            },
          ]}
        />
      </Field>
      <Field label={tr('Answer')} labelHidden error={stale ? tr('Pick an answer again: that one no longer exists.') : undefined}>
        <Select
          size="sm"
          value={stale ? '' : value.equals}
          placeholder={stale ? tr('Choose an answer') : undefined}
          onChange={(e) => onChange({ ...value, equals: e.target.value })}
          options={choices.map((o) => ({ value: o, label: o }))}
        />
      </Field>
    </div>
  );
}

/** Groups the answer types in the "Add" menu. */
const MENU_SECTIONS = (['Text', 'Choice', 'Number and date', 'People', 'Layout'] as const).map((group) => ({
  title: group,
  kinds: FIELD_KINDS.filter((k) => k.group === group),
}));

/**
 * Edits a list of questions: type, wording, help, placeholder, choices,
 * required, and "only ask when" conditions on earlier answers. Used by
 * surveys, request forms and approval-step forms.
 */
export function FormBuilder({
  fields,
  onChange,
  noun = 'question',
  kinds,
}: {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  /** What one item is called in button labels: "question" or "field". */
  noun?: string;
  /** Limit the answer types on offer. */
  kinds?: FieldKind[];
}) {
  const { t: tr } = useLocale();
  // The question just added gets focus, so people can type its wording straight away.
  const [focusId, setFocusId] = useState<string>();
  useEffect(() => {
    if (!focusId) return;
    // Wait for the menu to close and hand focus back to its button first.
    const t = window.setTimeout(() => document.getElementById(`question-${focusId}`)?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [focusId]);

  const update = (i: number, patch: Partial<FormField>) => onChange(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const move = (i: number, by: number) => {
    const next = [...fields];
    const [item] = next.splice(i, 1);
    next.splice(i + by, 0, item!);
    // A question can only depend on one above it; drop conditions that moving broke.
    onChange(next.map((f, j) => (f.showIf && next.findIndex((x) => x.id === f.showIf!.fieldId) >= j ? { ...f, showIf: undefined } : f)));
    // Keep focus with the moved question: its arrow button may have just become disabled at the top or bottom.
    requestAnimationFrame(() => document.getElementById(`question-${item!.id}`)?.focus());
  };
  const remove = (i: number) => {
    const gone = fields[i]!.id;
    const rest = fields.filter((_, j) => j !== i);
    onChange(rest.map((f) => (f.showIf?.fieldId === gone ? { ...f, showIf: undefined } : f)));
    const neighbour = rest[i] ?? rest[i - 1];
    if (neighbour) setFocusId(`${neighbour.id}`);
    else requestAnimationFrame(() => document.getElementById(`add-${noun}`)?.focus());
  };
  const duplicate = (i: number) => {
    const copy = {
      ...fields[i]!,
      id: uid('fld'),
      label: `${fields[i]!.label} (copy)`,
      options: fields[i]!.options ? [...fields[i]!.options!] : undefined,
    };
    onChange([...fields.slice(0, i + 1), copy, ...fields.slice(i + 1)]);
    setFocusId(copy.id);
  };
  const setKind = (i: number, kind: FieldKind) => {
    const f = fields[i]!;
    const options = hasOptions(kind) ? (f.options?.length ? f.options : [...DEFAULT_OPTIONS]) : undefined;
    const probe: FormField = {
      ...f,
      kind,
      options,
      required: kind === 'section' ? false : f.required,
    };
    // Conditions on this question's answers may no longer make sense.
    onChange(
      fields
        .map((x, j) => (j === i ? probe : x))
        .map((x) => (x.showIf?.fieldId === f.id && (!canBranchOn(kind) || !choicesFor(probe).includes(x.showIf.equals)) ? { ...x, showIf: undefined } : x)),
    );
  };
  const setOptions = (i: number, options: string[], renamed?: { from: string; to: string }) => {
    const id = fields[i]!.id;
    onChange(
      fields.map((x, j) =>
        j === i
          ? { ...x, options }
          : // Renaming a choice keeps conditions that point at it.
            renamed && x.showIf?.fieldId === id && x.showIf.equals === renamed.from
            ? { ...x, showIf: { ...x.showIf, equals: renamed.to } }
            : x,
      ),
    );
  };

  const add = (kind: FieldKind) => {
    const field = newField(kind);
    setFocusId(field.id);
    onChange([...fields, field]);
  };
  const offered = (k: FieldKind) => !kinds || kinds.includes(k);

  let q = 0;
  const numbers = new Map(fields.map((f) => [f.id, isQuestion(f) ? `${++q}` : '§']));

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 ? (
        <Text variant="bodySm" tone="muted">
          {' '}
          {tr('No')} {noun}s yet.
        </Text>
      ) : null}
      <ol className="flex flex-col gap-3">
        {fields.map((f, i) => {
          const section = f.kind === 'section';
          const name = f.label.trim() || `${section ? 'section' : noun} ${i + 1}`;
          const sources = fields.slice(0, i).filter((x) => canBranchOn(x.kind));
          return (
            <li key={f.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge size="sm" tone={section ? 'info' : 'neutral'}>
                  {numbers.get(f.id)}
                </Badge>
                <Select
                  size="sm"
                  aria-label={`Answer type for “${name}”`}
                  value={f.kind}
                  onChange={(e) => setKind(i, e.target.value as FieldKind)}
                  options={FIELD_KINDS.filter((k) => offered(k.value) || k.value === f.kind).map((k) => ({ value: k.value, label: k.label }))}
                  className="w-40"
                />
                {section ? null : <Checkbox label={tr('Required')} checked={f.required} onCheckedChange={(c) => update(i, { required: c === true })} />}
                <span className="ms-auto flex items-center gap-0.5">
                  <IconButton size="sm" icon={<ArrowUp />} label={`Move “${name}” up`} disabled={i === 0} onClick={() => move(i, -1)} />
                  <IconButton size="sm" icon={<ArrowDown />} label={`Move “${name}” down`} disabled={i === fields.length - 1} onClick={() => move(i, 1)} />
                  <IconButton size="sm" icon={<Copy />} label={`Duplicate “${name}”`} onClick={() => duplicate(i)} />
                  <IconButton size="sm" icon={<Trash2 />} label={`Delete “${name}”`} onClick={() => remove(i)} />
                </span>
              </div>
              <Field label={section ? tr('Heading') : tr('Question')} id={`question-${f.id}`}>
                <Input
                  value={f.label}
                  placeholder={section ? tr('e.g. Travel details') : tr('What would you like to ask?')}
                  onChange={(e) => update(i, { label: e.target.value })}
                />
              </Field>
              <Field label={section ? tr('Text under the heading') : tr('Help text')} optional>
                <Input
                  value={f.help ?? ''}
                  placeholder={section ? tr('What this part of the form is about') : tr('Shown under the question')}
                  onChange={(e) => update(i, { help: e.target.value || undefined })}
                />
              </Field>
              {hasPlaceholder(f.kind) ? (
                <Field label={tr('Placeholder')} optional helpText={tr('Example text shown in the empty box.')}>
                  <Input value={f.placeholder ?? ''} onChange={(e) => update(i, { placeholder: e.target.value || undefined })} />
                </Field>
              ) : null}
              {hasOptions(f.kind) ? <OptionsEditor field={f} onChange={(options, renamed) => setOptions(i, options, renamed)} /> : null}
              {!hasOptions(f.kind) && !section && !hasPlaceholder(f.kind) ? (
                <Text variant="caption" tone="subtle">
                  {kindLabel(f.kind)}
                  {f.kind === 'department'
                    ? tr(': people pick one of the workspace’s departments.')
                    : f.kind === 'person'
                      ? tr(': people pick someone in the workspace.')
                      : '.'}
                </Text>
              ) : null}
              {sources.length ? (
                <div className="flex flex-col gap-2 rounded-md bg-surface-sunken p-3">
                  <Checkbox
                    label={
                      <span className="inline-flex items-center gap-1.5">
                        <GitBranch aria-hidden className="size-4 text-fg-muted" /> {tr('Only')} {section ? 'show' : 'ask'}{' '}
                        {tr('when an earlier answer matches')}{' '}
                      </span>
                    }
                    checked={Boolean(f.showIf)}
                    onCheckedChange={(c) => {
                      const src = sources[sources.length - 1]!;
                      update(i, {
                        showIf:
                          c === true
                            ? {
                                fieldId: src.id,
                                equals: firstChoice(src),
                                op: 'is',
                              }
                            : undefined,
                      });
                    }}
                  />
                  {f.showIf ? (
                    <ConditionPicker
                      sources={sources}
                      value={f.showIf}
                      onChange={(showIf) => update(i, { showIf })}
                      numberOf={(s) => (numbers.get(s.id) === '§' ? '' : `${numbers.get(s.id)}. `)}
                    />
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div>
        <ActionMenu
          align="start"
          trigger={
            <Button size="sm" icon={<Plus />} id={`add-${noun}`}>
              {' '}
              {tr('Add')} {noun}
            </Button>
          }
          sections={MENU_SECTIONS.map((s) => ({
            title: s.title,
            items: s.kinds.filter((k) => offered(k.value)).map((k) => ({ content: k.label, onAction: () => add(k.value) })),
          })).filter((s) => s.items.length)}
        />
      </div>
    </div>
  );
}
