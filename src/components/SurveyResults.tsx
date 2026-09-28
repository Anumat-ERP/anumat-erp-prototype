import { Badge, Button, Card, Text } from '@repo/ui';
import { useState } from 'react';
import type { FormField, Survey, SurveyResponse } from '../data/types';
import { choicesFor, kindLabel, visibleFields } from '../lib/forms';
import { BarTable, ColumnChart } from './charts';

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

function ChoiceBars({ field, answers, respondents }: { field: FormField; answers: (string | string[])[]; respondents: number }) {
  const multi = field.kind === 'checkboxes';
  const choices = field.kind === 'rating' ? [...choicesFor(field)].reverse() : choicesFor(field);
  const count = (c: string) => answers.filter((a) => (Array.isArray(a) ? a.includes(c) : a === c)).length;
  return (
    <>
      <BarTable
        caption={`Answers to “${field.label}”`}
        valueHeader={multi ? 'People' : 'Answers'}
        max={respondents}
        rows={choices.map((c) => {
          const n = count(c);
          const label = field.kind === 'rating' ? `${c} ${c === '5' ? '· Excellent' : c === '1' ? '· Poor' : ''}` : c;
          return {
            id: c,
            label,
            segments: [{ value: n, color: COLOR, label: c }],
            display: `${n} · ${pct(n, respondents)}%`,
            detail: `${c}: ${n} of ${respondents} ${respondents === 1 ? 'person' : 'people'} (${pct(n, respondents)}%)`,
          };
        })}
      />
      {multi ? (
        <Text variant="caption" tone="subtle">
          People could choose more than one, so the percentages add up to more than 100.
        </Text>
      ) : null}
    </>
  );
}

function TextAnswers({ answers }: { answers: string[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? answers : answers.slice(0, 4);
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {shown.map((a, i) => (
          <li key={i} className="rounded-md border-s-2 border-border-strong bg-surface-sunken px-3 py-2 text-md">
            {a}
          </li>
        ))}
      </ul>
      {answers.length > 4 ? (
        <Button size="sm" variant="plain" className="self-start" onClick={() => setAll(!all)}>
          {all ? 'Show fewer' : `Show all ${answers.length}`}
        </Button>
      ) : null}
    </div>
  );
}

function QuestionResult({ index, field, fields, responses }: { index: number; field: FormField; fields: FormField[]; responses: SurveyResponse[] }) {
  // People who were asked this question (conditions hide it for some).
  const asked = responses.filter((r) => visibleFields(fields, r.answers).some((f) => f.id === field.id));
  const answers = asked.map((r) => r.answers[field.id]).filter((a): a is string | string[] => (Array.isArray(a) ? a.length > 0 : Boolean(a)));
  const source = field.showIf ? fields.find((f) => f.id === field.showIf!.fieldId) : undefined;

  let body;
  if (!answers.length) {
    body = (
      <Text tone="muted" variant="bodySm">
        No answers yet.
      </Text>
    );
  } else if (field.kind === 'scale') {
    const scores = answers.map(Number);
    const score = nps(scores);
    body = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Stat label="Average" value={(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)} hint="Out of 10" />
          <Stat label="Recommend score" value={score === null ? '—' : `${score > 0 ? '+' : ''}${score}`} hint="% 9–10 minus % 0–6" />
          <Stat
            label="9–10 · 7–8 · 0–6"
            value={`${scores.filter((s) => s >= 9).length} · ${scores.filter((s) => s >= 7 && s <= 8).length} · ${scores.filter((s) => s <= 6).length}`}
            hint="People"
          />
        </div>
        <ColumnChart
          caption={`How people scored “${field.label}” from 0 to 10`}
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
        <Stat label="Average" value={`${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)} / 5`} />
        <ChoiceBars field={field} answers={answers} respondents={answers.length} />
      </div>
    );
  } else if (field.kind === 'radio' || field.kind === 'select' || field.kind === 'yesno' || field.kind === 'checkboxes') {
    body = <ChoiceBars field={field} answers={answers} respondents={field.kind === 'checkboxes' ? asked.length : answers.length} />;
  } else if (field.kind === 'number') {
    const nums = answers.map((a) => Number(String(a).replace(/,/g, ''))).filter(Number.isFinite);
    body = (
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <Stat label="Average" value={(nums.reduce((a, b) => a + b, 0) / Math.max(1, nums.length)).toLocaleString(undefined, { maximumFractionDigits: 1 })} />
        <Stat label="Lowest" value={Math.min(...nums).toLocaleString()} />
        <Stat label="Highest" value={Math.max(...nums).toLocaleString()} />
      </div>
    );
  } else {
    body = <TextAnswers answers={answers.map(String)} />;
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Text as="h3" variant="title">
          {index + 1}. {field.label}
        </Text>
        <span className="flex flex-wrap items-center gap-2">
          <Badge size="sm" tone="neutral">
            {kindLabel(field.kind)}
          </Badge>
          <Text as="span" variant="caption" tone="muted">
            {answers.length} of {asked.length} answered
            {source ? ` · asked when ${fields.indexOf(source) + 1}. is “${field.showIf!.equals}”` : ''}
          </Text>
        </span>
      </div>
      {body}
    </Card>
  );
}

export function SurveyResults({ survey, responses }: { survey: Survey; responses: SurveyResponse[] }) {
  return (
    <div className="flex flex-col gap-4">
      {survey.fields.map((f, i) => (
        <QuestionResult key={f.id} index={i} field={f} fields={survey.fields} responses={responses} />
      ))}
    </div>
  );
}
