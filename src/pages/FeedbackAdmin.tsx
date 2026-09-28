import { Badge, Banner, Card, CardHeader, EmptyState, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger, Text } from '@repo/ui';
import { Person } from '../components/Person';
import { isAdmin, useStore } from '../data/store';
import { formatDateTime } from '../lib/format';

const DEPLOY = { cloud: 'Anumat Cloud', 'private-cloud': 'Own cloud', 'on-premise': 'On-premise', 'not-sure': 'Not sure' } as const;

/** Net Promoter Score: % of 9–10 answers minus % of 0–6 answers. */
function nps(scores: number[]) {
  if (!scores.length) return null;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

export function FeedbackAdmin() {
  const { state } = useStore();
  if (!isAdmin(state)) {
    return (
      <>
        <PageHeader title="Feedback" />
        <Banner tone="info" title="Only admins can see feedback">
          You can still send feedback from Help &amp; support.
        </Banner>
      </>
    );
  }
  const surveys = state.feedback.filter((f) => f.kind === 'survey' && f.score !== undefined);
  const scores = surveys.map((f) => f.score as number);
  const score = nps(scores);
  const band = (s: number) => (s >= 9 ? 'Promoter' : s >= 7 ? 'Passive' : 'Detractor');

  return (
    <>
      <PageHeader title="Feedback" subtitle="What people in this workspace tell us, and who asked about buying." />
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
      <Tabs defaultValue="feedback">
        <TabsList aria-label="Feedback type">
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="leads" badge={state.leads.length || undefined}>
            Sales enquiries
          </TabsTrigger>
        </TabsList>
        <TabsContent value="feedback" className="pt-4">
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
        </TabsContent>
        <TabsContent value="leads" className="pt-4">
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
        </TabsContent>
      </Tabs>
    </>
  );
}
