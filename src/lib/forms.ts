import type { FieldKind, FormField, FormValues } from '../data/types';

export const FIELD_KINDS: { value: FieldKind; label: string }[] = [
  { value: 'text', label: 'Short answer' },
  { value: 'longtext', label: 'Paragraph' },
  { value: 'radio', label: 'Multiple choice' },
  { value: 'checkboxes', label: 'Checkboxes' },
  { value: 'select', label: 'Dropdown' },
  { value: 'yesno', label: 'Yes / No' },
  { value: 'rating', label: 'Rating 1–5' },
  { value: 'scale', label: 'Scale 0–10' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
];

export const kindLabel = (kind: FieldKind) => FIELD_KINDS.find((k) => k.value === kind)?.label ?? kind;

/** Kinds whose answers come from a list the form builder defines. */
export const hasOptions = (kind: FieldKind) => kind === 'select' || kind === 'radio' || kind === 'checkboxes';

/** Kinds that can drive "show only if": one answer from a known list. */
export const canBranchOn = (kind: FieldKind) => kind === 'select' || kind === 'radio' || kind === 'yesno';

/** The answers a question can have, for kinds with a fixed list. */
export function choicesFor(field: FormField): string[] {
  if (field.kind === 'yesno') return ['Yes', 'No'];
  if (field.kind === 'rating') return ['1', '2', '3', '4', '5'];
  if (field.kind === 'scale') return Array.from({ length: 11 }, (_, n) => String(n));
  return field.options ?? [];
}

const asText = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(', ') : (v ?? ''));

/** Questions to ask, given the answers so far. A question hidden by its condition hides the ones that depend on it too. */
export function visibleFields(fields: FormField[], values: FormValues): FormField[] {
  const shown = new Set<string>();
  for (const f of fields) {
    if (!f.showIf) {
      shown.add(f.id);
      continue;
    }
    if (shown.has(f.showIf.fieldId) && asText(values[f.showIf.fieldId]) === f.showIf.equals) shown.add(f.id);
  }
  return fields.filter((f) => shown.has(f.id));
}

/** Error messages by field id, for visible questions only. */
export function validateForm(fields: FormField[], values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of visibleFields(fields, values)) {
    const v = values[f.id];
    const empty = Array.isArray(v) ? v.length === 0 : !v?.trim();
    if (f.required && empty) {
      errors[f.id] = f.kind === 'checkboxes' ? `Choose at least one answer for “${f.label}”.` : `Answer “${f.label}”.`;
      continue;
    }
    if (!empty && f.kind === 'number' && !Number.isFinite(Number(String(v).replace(/,/g, '')))) {
      errors[f.id] = `Enter a number for “${f.label}”, like 12 or 1250.`;
    }
  }
  return errors;
}

/** Drops answers to questions that ended up hidden, so they aren't saved. */
export function cleanValues(fields: FormField[], values: FormValues): FormValues {
  const out: FormValues = {};
  for (const f of visibleFields(fields, values)) {
    const v = values[f.id];
    if (Array.isArray(v) ? v.length : v?.trim()) out[f.id] = Array.isArray(v) ? v : v!.trim();
  }
  return out;
}

/** An answer as one line of text. */
export function formatAnswer(field: FormField, value: string | string[] | undefined): string {
  const text = asText(value);
  if (!text) return '—';
  if (field.kind === 'rating') return `${text} of 5`;
  if (field.kind === 'scale') return `${text} of 10`;
  if (field.kind === 'date') {
    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? text : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return text;
}

/** Problems that would stop a form from working, shown in the builder. */
export function formProblems(fields: FormField[]): string[] {
  const problems: string[] = [];
  fields.forEach((f, i) => {
    const name = f.label.trim() || `Question ${i + 1}`;
    if (!f.label.trim()) problems.push(`Question ${i + 1} needs a question.`);
    if (hasOptions(f.kind)) {
      const opts = (f.options ?? []).map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) problems.push(`“${name}” needs at least two choices.`);
      else if (new Set(opts).size !== opts.length) problems.push(`“${name}” has the same choice twice.`);
    }
    if (f.showIf) {
      const src = fields.findIndex((x) => x.id === f.showIf!.fieldId);
      if (src < 0 || src >= i) problems.push(`“${name}” depends on a question that isn’t above it.`);
      else if (!choicesFor(fields[src]!).includes(f.showIf.equals)) problems.push(`“${name}” depends on an answer that no longer exists.`);
    }
  });
  return problems;
}

/** Trims wording and drops empty choices before saving. */
export function cleanFields(fields: FormField[]): FormField[] {
  return fields.map((f) => ({
    ...f,
    label: f.label.trim(),
    help: f.help?.trim() || undefined,
    options: hasOptions(f.kind) ? (f.options ?? []).map((o) => o.trim()).filter(Boolean) : undefined,
  }));
}
