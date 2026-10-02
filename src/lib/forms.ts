import type { Condition, FieldKind, FormField, FormValues } from '../data/types';
import { DEPARTMENTS } from './org';

export const FIELD_KINDS: { value: FieldKind; label: string; group: 'Text' | 'Choice' | 'Number and date' | 'People' | 'Layout' }[] = [
  { value: 'text', label: 'Short answer', group: 'Text' },
  { value: 'longtext', label: 'Paragraph', group: 'Text' },
  { value: 'email', label: 'Email', group: 'Text' },
  { value: 'phone', label: 'Phone', group: 'Text' },
  { value: 'url', label: 'Link', group: 'Text' },
  { value: 'radio', label: 'Multiple choice', group: 'Choice' },
  { value: 'checkboxes', label: 'Checkboxes', group: 'Choice' },
  { value: 'select', label: 'Dropdown', group: 'Choice' },
  { value: 'yesno', label: 'Yes / No', group: 'Choice' },
  { value: 'rating', label: 'Rating 1–5', group: 'Choice' },
  { value: 'scale', label: 'Scale 0–10', group: 'Choice' },
  { value: 'number', label: 'Number', group: 'Number and date' },
  { value: 'money', label: 'Money', group: 'Number and date' },
  { value: 'date', label: 'Date', group: 'Number and date' },
  { value: 'person', label: 'Person', group: 'People' },
  { value: 'department', label: 'Department', group: 'People' },
  { value: 'section', label: 'Section heading', group: 'Layout' },
];

export const kindLabel = (kind: FieldKind) => FIELD_KINDS.find((k) => k.value === kind)?.label ?? kind;

/** Kinds whose answers come from a list the form builder defines. */
export const hasOptions = (kind: FieldKind) => kind === 'select' || kind === 'radio' || kind === 'checkboxes';

/** Kinds that can drive "only ask when": answers from a known list. */
export const canBranchOn = (kind: FieldKind) =>
  kind === 'select' || kind === 'radio' || kind === 'yesno' || kind === 'checkboxes' || kind === 'department';

/** Kinds with a free-text box, which can show a placeholder. */
export const hasPlaceholder = (kind: FieldKind) =>
  kind === 'text' || kind === 'longtext' || kind === 'email' || kind === 'phone' || kind === 'url' || kind === 'number' || kind === 'money';

/** A section splits a form; it asks nothing. */
export const isQuestion = (f: FormField) => f.kind !== 'section';

/** The answers a question can have, for kinds with a fixed list. */
export function choicesFor(field: FormField): string[] {
  if (field.kind === 'yesno') return ['Yes', 'No'];
  if (field.kind === 'rating') return ['1', '2', '3', '4', '5'];
  if (field.kind === 'scale') return Array.from({ length: 11 }, (_, n) => String(n));
  if (field.kind === 'department') return DEPARTMENTS;
  return field.options ?? [];
}

const asText = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(', ') : (v ?? ''));
const isEmpty = (v: string | string[] | undefined) => (Array.isArray(v) ? v.length === 0 : !v?.trim());

/** Does a condition hold for these answers? An unanswered question matches neither "is" nor "is not". */
export function matches(cond: Condition, values: FormValues): boolean {
  const v = values[cond.fieldId];
  if (!cond.equals || isEmpty(v)) return false;
  const has = Array.isArray(v) ? v.includes(cond.equals) : v === cond.equals;
  return cond.op === 'isNot' ? !has : has;
}

export function describeCondition(cond: Condition, fields: FormField[]) {
  const src = fields.find((f) => f.id === cond.fieldId);
  const verb = src?.kind === 'checkboxes' ? (cond.op === 'isNot' ? 'doesn’t include' : 'includes') : cond.op === 'isNot' ? 'isn’t' : 'is';
  return `“${src?.label || 'a question'}” ${verb} “${cond.equals}”`;
}

/** Questions to ask, given the answers so far. A question hidden by its condition hides the ones that depend on it too. */
export function visibleFields(fields: FormField[], values: FormValues): FormField[] {
  const shown = new Set<string>();
  for (const f of fields) {
    if (!f.showIf || (shown.has(f.showIf.fieldId) && matches(f.showIf, values))) shown.add(f.id);
  }
  return fields.filter((f) => shown.has(f.id));
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s().-]{6,20}$/;
const NUMBER = /^-?\d+(\.\d+)?$/;
export const parseNumber = (v: string) => (NUMBER.test(v.replace(/[,\s]/g, '')) ? Number(v.replace(/[,\s]/g, '')) : NaN);

/** Error messages by field id, for visible questions only. */
export function validateForm(fields: FormField[], values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of visibleFields(fields, values).filter(isQuestion)) {
    const v = values[f.id];
    const text = Array.isArray(v) ? '' : (v ?? '').trim();
    if (isEmpty(v)) {
      if (f.required) errors[f.id] = f.kind === 'checkboxes' ? `Choose at least one answer for “${f.label}”.` : `Answer “${f.label}”.`;
      continue;
    }
    if ((f.kind === 'number' || f.kind === 'money') && Number.isNaN(parseNumber(text))) {
      errors[f.id] = f.kind === 'money' ? `Enter an amount for “${f.label}”, like 1250 or 99.50.` : `Enter a number for “${f.label}”, like 12 or 1250.`;
    } else if (f.kind === 'email' && !EMAIL.test(text)) {
      errors[f.id] = `Enter an email address, like name@company.com.`;
    } else if (f.kind === 'phone' && !PHONE.test(text)) {
      errors[f.id] = `Enter a phone number, like +855 12 345 678.`;
    } else if (f.kind === 'url' && !/^https?:\/\/\S+\.\S+/.test(text)) {
      errors[f.id] = `Enter a full link starting with https://`;
    } else if (hasOptions(f.kind) || f.kind === 'yesno' || f.kind === 'department') {
      // An answer no longer on the list (the choice was renamed or removed) doesn't count.
      const choices = choicesFor(f);
      const stale = Array.isArray(v) ? v.some((x) => !choices.includes(x)) : !choices.includes(text);
      if (stale) errors[f.id] = `Choose “${f.label}” again: the choices have changed.`;
    }
  }
  return errors;
}

/** Drops answers to hidden questions and to choices that no longer exist, so they aren't saved or shown as picked. */
export function cleanValues(fields: FormField[], values: FormValues): FormValues {
  const out: FormValues = {};
  for (const f of visibleFields(fields, values).filter(isQuestion)) {
    const v = values[f.id];
    if (isEmpty(v)) continue;
    if (hasOptions(f.kind) || f.kind === 'yesno' || f.kind === 'department') {
      const choices = choicesFor(f);
      const kept = Array.isArray(v) ? v.filter((x) => choices.includes(x)) : choices.includes(v!.trim()) ? v!.trim() : '';
      if (!isEmpty(kept)) out[f.id] = kept;
    } else {
      out[f.id] = Array.isArray(v) ? v : v!.trim();
    }
  }
  return out;
}

/** Local calendar date for a yyyy-mm-dd answer, so it doesn't shift a day west of UTC. */
export const localDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : new Date(ymd);
};
/** yyyy-mm-dd in local time, for date inputs. */
export const toDateInput = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** An answer as one line of text. `nameOf` turns a person id into a name. */
export function formatAnswer(field: FormField, value: string | string[] | undefined, nameOf?: (id: string) => string): string {
  const text = asText(value);
  if (!text) return '—';
  if (field.kind === 'rating') return `${text} of 5`;
  if (field.kind === 'scale') return `${text} of 10`;
  if (field.kind === 'person') return nameOf ? nameOf(text) : text;
  if (field.kind === 'money') {
    const n = parseNumber(text);
    return Number.isNaN(n) ? text : n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  if (field.kind === 'date') {
    const d = localDate(text);
    return Number.isNaN(d.getTime()) ? text : d.toLocaleDateString(document.documentElement.lang === 'km' ? 'km-KH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return text;
}

/** Problems that would stop a form from working, shown in the builder. */
export function formProblems(fields: FormField[]): string[] {
  const problems: string[] = [];
  fields.forEach((f, i) => {
    const name = f.label.trim() || `Question ${i + 1}`;
    if (!f.label.trim()) problems.push(f.kind === 'section' ? `Section ${i + 1} needs a heading.` : `Question ${i + 1} needs a question.`);
    if (hasOptions(f.kind)) {
      const opts = (f.options ?? []).map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) problems.push(`“${name}” needs at least two choices.`);
      else if (new Set(opts).size !== opts.length) problems.push(`“${name}” has the same choice twice.`);
    }
    if (f.showIf) {
      const src = fields.findIndex((x) => x.id === f.showIf!.fieldId);
      const equals = f.showIf.equals.trim();
      if (src < 0 || src >= i) problems.push(`“${name}” depends on a question that isn’t above it.`);
      else if (!equals || !choicesFor(fields[src]!).map((c) => c.trim()).includes(equals)) problems.push(`“${name}” depends on an answer that no longer exists.`);
    }
  });
  return problems;
}

/** Trims wording and drops empty choices before saving, keeping conditions in step with trimmed choices. */
export function cleanFields(fields: FormField[]): FormField[] {
  return fields.map((f) => ({
    ...f,
    label: f.label.trim(),
    help: f.help?.trim() || undefined,
    placeholder: hasPlaceholder(f.kind) ? f.placeholder?.trim() || undefined : undefined,
    options: hasOptions(f.kind) ? (f.options ?? []).map((o) => o.trim()).filter(Boolean) : undefined,
    showIf: f.showIf ? { ...f.showIf, equals: f.showIf.equals.trim() } : undefined,
  }));
}

/** Questions only (no sections), numbered in order. */
export const questionsOf = (fields: FormField[]) => fields.filter(isQuestion);
