import { Badge, Card, CardHeader, EmptyState, Text } from '@app/ui';
import { Person } from './Person';
import { useStore } from '../data/store';
import { formatDateTime } from '../lib/format';

const DEPLOY = { cloud: 'Anumat Cloud', 'private-cloud': 'Own cloud', 'on-premise': 'On-premise', 'not-sure': 'Not sure' } as const;

/** Net Promoter Score: % of 9–10 answers minus % of 0–6 answers. */
function nps(scores: number[]) {
  if (!scores.length) return null;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

/** What people told the Anumat team (survey, feedback, problems) and sales enquiries. Shown to admins on the Surveys page. */
export function FeedbackInbox() {
  const { state } = useStore();
  const surveys = state.feedback.filter((f) => f.kind === 'survey' && f.score !== undefined);
  const scores = surveys.map((f) => f.score as number);
  const score = nps(scores);
  const band = (s: number) => (s >= 9 ? 'Promoter' : s >= 7 ? 'Passive' : 'Detractor');

  return (
    <div className="flex flex-col gap-6">
      <Text tone="muted">What people in this workspace told the Anumat team from Help &amp; support, and who asked about buying.</Text>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Recommend score (NPS)', score === null ? '—' : `${score > 0 ? '+' : ''}${score}`, `From ${scores.length} survey answers, −100 to +100`],
          ['Average rating', scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—', 'Out of 10'],
          ['Comments', String(state.feedback.filter((f) => f.text).length), 'Survey, feedback and problems'],
          ['Sales enquiries', String(state.leads.length), 'From the pricing page'],
        ].map(([label, value, hint]) => (
          <Card key={label} className="flex flex-col gap-1">
            <Text as="span" variant="bodySm" tone="muted">
              {label}
            </Text>
            <Text as="span" variant="display" numeric>
              {value}
            </Text>
            <Text as="span" variant="caption" tone="subtle">
              {hint}
            </Text>
          </Card>
        ))}
      </div>
      <section aria-labelledby="inbox-feedback" className="flex flex-col gap-3">
        <Text as="h2" id="inbox-feedback" variant="title">
          Feedback to Anumat
        </Text>
        <Card flush>
          {state.feedback.length ? (
            <ul className="divide-y divide-border">
              {state.feedback.map((f) => (
                <li key={f.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4">
                  <div className="w-44 shrink-0">
                    <Person id={f.personId} size="xs" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge size="sm" tone={f.kind === 'problem' ? 'critical' : f.kind === 'survey' ? 'info' : 'neutral'}>
                        {f.kind === 'survey' ? 'Survey' : f.kind === 'problem' ? 'Problem' : 'Feedback'}
                      </Badge>
                      {f.score !== undefined ? (
                        <Text as="span" variant="bodySm">
                          <span className="font-semibold tabular-nums">{f.score}/10</span> · {band(f.score)}
                        </Text>
                      ) : null}
                    </span>
                    {f.text ? <Text>{f.text}</Text> : <Text tone="muted">No comment</Text>}
                  </div>
                  <Text as="span" variant="caption" tone="subtle" className="shrink-0">
                    {formatDateTime(f.at)}
                  </Text>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="card" heading="No feedback yet">
              Answers to the survey and feedback from Help &amp; support show up here.
            </EmptyState>
          )}
        </Card>
      </section>
      <section aria-labelledby="inbox-leads" className="flex flex-col gap-3">
        <Text as="h2" id="inbox-leads" variant="title">
          Sales enquiries
        </Text>
        <Card flush>
          {state.leads.length ? (
            <ul className="divide-y divide-border">
              {state.leads.map((l) => (
                <li key={l.id} className="flex flex-col gap-1 p-4">
                  <span className="flex flex-wrap items-center gap-2">
                    <Text as="span" variant="label">
                      {l.company}
                    </Text>
                    <Badge size="sm" tone="primary">
                      {DEPLOY[l.deployment]}
                    </Badge>
                    <Text as="span" variant="caption" tone="muted">
                      {l.size} people · {formatDateTime(l.at)}
                    </Text>
                  </span>
                  <Text variant="bodySm">
                    {l.name} · <span className="font-mono">{l.email}</span>
                  </Text>
                  {l.message ? <Text tone="muted">{l.message}</Text> : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4">
              <CardHeader title="No enquiries yet" description="Messages from the Contact sales form on the pricing page appear here." />
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
