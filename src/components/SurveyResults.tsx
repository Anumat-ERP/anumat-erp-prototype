import { Badge, Button, Card, Text } from '@app/ui';
import { useState } from 'react';
import type { FormField, Survey, SurveyResponse } from '../data/types';
import { useStore } from '../data/store';
import { choicesFor, describeCondition, formatAnswer, kindLabel, parseNumber, questionsOf, visibleFields } from '../lib/forms';
import { BarTable, ColumnChart } from './charts';
import { useLocale } from '../i18n/LocaleProvider';

const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);
const COLOR = 'var(--an-chart-1)';

/** Net Promoter Score for 0–10 answers: % of 9–10 minus % of 0–6. */
export function nps(scores: number[]) {
  if (!scores.length) return null;
  return Math.round(((scores.filter((s) => s >= 9).length - scores.filter((s) => s <= 6).length) / scores.length) * 100);
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col">
      <Text as="span" variant="bodySm" tone="muted">
        {label}
      </Text>
      <Text as="span" variant="heading" numeric>
        {value}
      </Text>
      {hint ? (
        <Text as="span" variant="caption" tone="subtle">
          {hint}
        </Text>
      ) : null}
    </div>
  );
}

function ChoiceBars({
  field,
  answers,
  respondents,
  labelOf = (c) => c,
}: {
  field: FormField;
  answers: (string | string[])[];
  respondents: number;
  labelOf?: (choice: string) => string;
}) {
  const { t: tr } = useLocale();
  const multi = field.kind === 'checkboxes';
  const choices = field.kind === 'rating' ? [...choicesFor(field)].reverse() : choicesFor(field);
  const count = (c: string) => answers.filter((a) => (Array.isArray(a) ? a.includes(c) : a === c)).length;
  return (
    <>
      <BarTable
        caption={tr("Answers to “{value0}”", { value0: field.label })}
        valueHeader={multi ? 'People' : 'Answers'}
        max={respondents}
        rows={choices.map((c) => {
          const n = count(c);
          const label = field.kind === 'rating' ? `${c} ${c === '5' ? '· Excellent' : c === '1' ? '· Poor' : ''}` : labelOf(c);
          return {
            id: c,
            label,
            segments: [{ value: n, color: COLOR, label: c }],
            display: `${n} · ${pct(n, respondents)}%`,
            detail: `${labelOf(c)}: ${n} of ${respondents} ${respondents === 1 ? 'person' : 'people'} (${pct(n, respondents)}%)`,
          };
        })}
      />
      {multi ? (
        <Text variant="caption" tone="subtle">
          {tr("People could choose more than one, so the percentages add up to more than 100.")}</Text>
      ) : null}
    </>
  );
}

function TextAnswers({ answers }: { answers: string[] }) {
  const { t: tr } = useLocale();
  const [all, setAll] = useState(false);
  const shown = all ? answers : answers.slice(0, 4);
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {shown.map((a, i) => (
          <li key={i} className="rounded-md border-s-2 border-border-strong bg-surface-sunken px-3 py-2 text-md break-words">
            {a}
          </li>
        ))}
      </ul>
      {answers.length > 4 ? (
        <Button size="sm" variant="plain" className="self-start" onClick={() => setAll(!all)}>
          {all ? tr("Show fewer") : tr("Show all {value0}", { value0: answers.length })}
        </Button>
      ) : null}
    </div>
  );
}

/** A stable shuffle, so anonymous comments don't come out in the order people answered. */
function shuffled<T>(items: T[], seed: string): T[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  return items
    .map((item, i) => ({ item, k: Math.sin(h + i * 997) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.item);
}

function QuestionResult({
  number,
  field,
  fields,
  responses,
  anonymous,
  minAnswers,
}: {
  number: number;
  field: FormField;
  fields: FormField[];
  responses: SurveyResponse[];
  anonymous: boolean;
  minAnswers: number;
}) {
  const { t: tr } = useLocale();
  const { person } = useStore();
  // People who were asked this question (conditions hide it for some).
  const asked = responses.filter((r) => visibleFields(fields, r.answers).some((f) => f.id === field.id));
  const given = asked.map((r) => r.answers[field.id]).filter((a): a is string | string[] => (Array.isArray(a) ? a.length > 0 : Boolean(a)));
  const answers = anonymous ? shuffled(given, field.id) : given;
  const source = field.showIf ? fields.find((f) => f.id === field.showIf!.fieldId) : undefined;
  // On anonymous surveys each question needs enough answers of its own: a follow-up asked of one person would name them.
  const tooFew = anonymous && answers.length > 0 && answers.length < minAnswers;

  let body;
  if (tooFew) {
    body = (
      <Text tone="muted" variant="bodySm">
        {tr("Hidden until")}{' '}{minAnswers} {tr("people answer this question, so nobody can be picked out.")}{' '}{answers.length} {tr("so far.")}</Text>
    );
  } else if (!answers.length) {
    body = (
      <Text tone="muted" variant="bodySm">
        {tr("No answers yet.")}</Text>
    );
  } else if (field.kind === 'scale') {
    const scores = answers.map(Number);
    const score = nps(scores);
    body = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Stat label={tr("Average")} value={(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)} hint="Out of 10" />
          {/recommend/i.test(field.label) ? (
            <Stat label={tr("Recommend score")} value={score === null ? '—' : `${score > 0 ? '+' : ''}${score}`} hint="% 9–10 minus % 0–6" />
          ) : null}
          <Stat
            label="9–10 · 7–8 · 0–6"
            value={`${scores.filter((s) => s >= 9).length} · ${scores.filter((s) => s >= 7 && s <= 8).length} · ${scores.filter((s) => s <= 6).length}`}
            hint="People"
          />
        </div>
        <ColumnChart
          caption={tr("How people scored “{value0}” from 0 to 10", { value0: field.label })}
          points={choicesFor(field).map((c) => {
            const n = scores.filter((s) => String(s) === c).length;
            return { label: c, value: n, detail: `${n} ${n === 1 ? 'person' : 'people'} chose ${c}` };
          })}
        />
      </div>
    );
  } else if (field.kind === 'rating') {
    const scores = answers.map(Number);
    body = (
      <div className="flex flex-col gap-3">
        <Stat label={tr("Average")} value={`${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)} / 5`} />
        <ChoiceBars field={field} answers={answers} respondents={answers.length} />
      </div>
    );
  } else if (field.kind === 'radio' || field.kind === 'select' || field.kind === 'yesno' || field.kind === 'checkboxes' || field.kind === 'department') {
    body = <ChoiceBars field={field} answers={answers} respondents={field.kind === 'checkboxes' ? asked.length : answers.length} />;
  } else if (field.kind === 'person') {
    const ids = [...new Set(answers.map(String))];
    body = <ChoiceBars field={{ ...field, kind: 'select', options: ids }} answers={answers} respondents={answers.length} labelOf={(id) => person(id).name} />;
  } else if (field.kind === 'number' || field.kind === 'money') {
    const nums = answers.map((a) => parseNumber(String(a))).filter((n) => !Number.isNaN(n));
    const fmt = (n: number) =>
      field.kind === 'money' ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : n.toLocaleString(undefined, { maximumFractionDigits: 1 });
    body = nums.length ? (
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <Stat label={tr("Average")} value={fmt(nums.reduce((a, b) => a + b, 0) / nums.length)} />
        <Stat label={tr("Lowest")} value={fmt(Math.min(...nums))} />
        <Stat label={tr("Highest")} value={fmt(Math.max(...nums))} />
        {field.kind === 'money' ? <Stat label={tr("Total")} value={fmt(nums.reduce((a, b) => a + b, 0))} /> : null}
      </div>
    ) : (
      <Text tone="muted" variant="bodySm">
        {tr("No numbers to add up.")}</Text>
    );
  } else if (field.kind === 'date') {
    body = <TextAnswers answers={answers.map((a) => formatAnswer(field, a))} />;
  } else {
    body = <TextAnswers answers={answers.map(String)} />;
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Text as="h3" variant="title">
          {number}. {tr(field.label)}
        </Text>
        <span className="flex flex-wrap items-center gap-2">
          <Badge size="sm" tone="neutral">
            {kindLabel(field.kind)}
          </Badge>
          <Text as="span" variant="caption" tone="muted">
            {answers.length} {tr("of")}{' '}{asked.length} {tr("answered")}{' '}{source ? tr(" · asked when {value0}", { value0: describeCondition(field.showIf!, fields) }) : ''}
          </Text>
        </span>
      </div>
      {body}
    </Card>
  );
}

export function SurveyResults({ survey, responses, minAnswers }: { survey: Survey; responses: SurveyResponse[]; minAnswers: number }) {
  return (
    <div className="flex flex-col gap-4">
      {questionsOf(survey.fields).map((f, i) => (
        <QuestionResult
          key={f.id}
          number={i + 1}
          field={f}
          fields={survey.fields}
          responses={responses}
          anonymous={survey.anonymous}
          minAnswers={minAnswers}
        />
      ))}
    </div>
  );
}
