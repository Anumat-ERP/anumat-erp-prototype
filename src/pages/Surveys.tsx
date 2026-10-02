import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar, Tabs, TabsContent, TabsList, TabsTrigger, Text, type BadgeTone } from '@app/ui';
import { EyeOff, Users } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { questionsOf } from '../lib/forms';
import { FeedbackInbox } from '../components/FeedbackInbox';
import { canManageSurveys, hasAnswered, isOpen, surveyAudience, surveyResponsesFor, surveysToAnswer, useStore } from '../data/store';
import type { DataState, Survey } from '../data/types';
import { daysUntil, formatDate } from '../lib/format';
import { useLocale } from '../i18n/LocaleProvider';
import type { createTranslator } from '../i18n/locale';

type Translator = ReturnType<typeof createTranslator>;

export function surveyStatus(survey: Survey, tr: Translator): { label: string; tone: BadgeTone } {
  if (survey.status === 'draft') return { label: tr('Draft'), tone: 'neutral' };
  return isOpen(survey) ? { label: tr('Open'), tone: 'success' } : { label: tr('Closed'), tone: 'info' };
}

export function audienceLabel(survey: Survey, tr: Translator) {
  return survey.audience.length ? survey.audience.map((department) => tr(department)).join(', ') : tr('Everyone');
}

export function closesLabel(survey: Survey, tr: Translator) {
  if (survey.status === 'draft') return tr('Not sent yet');
  if (!isOpen(survey)) return survey.closesAt ? tr('Closed {date}', { date: formatDate(survey.closesAt) }) : tr('Closed');
  if (!survey.closesAt) return tr('No closing date');
  const d = daysUntil(survey.closesAt);
  return d <= 0 ? tr('Closes today') : d === 1 ? tr('Closes tomorrow') : tr('Closes in {count} days', { count: d });
}

const minutes = (s: Survey) => Math.max(1, Math.round(questionsOf(s.fields).length * 0.4));

function SurveyRow({ state, survey, manage }: { state: DataState; survey: Survey; manage: boolean }) {
  const { t: tr } = useLocale();
  const status = surveyStatus(survey, tr);
  const audience = surveyAudience(state, survey);
  const answered = surveyResponsesFor(state, survey.id).length;
  const mine = hasAnswered(state, survey.id);
  const asked = audience.some((p) => p.id === state.meId);
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <Link
            to={survey.status === 'draft' ? `/surveys/${survey.id}/edit` : `/surveys/${survey.id}`}
            className="font-semibold text-fg underline-offset-2 hover:underline"
          >
            {tr(survey.title)}
          </Link>
          <Badge size="sm" tone={status.tone}>
            {tr(status.label)}
          </Badge>
          {mine ? (
            <Badge size="sm" tone="success">
              {tr("You answered")}</Badge>
          ) : null}
        </span>
        <Text variant="bodySm" tone="muted" className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <Users aria-hidden className="size-3.5" /> {audienceLabel(survey, tr)}
          </span>
          {survey.anonymous ? (
            <span className="inline-flex items-center gap-1">
              <EyeOff aria-hidden className="size-3.5" /> {tr("Anonymous")}</span>
          ) : null}
          <span>
            {tr('{count} questions', { count: questionsOf(survey.fields).length })} · {closesLabel(survey, tr)}
          </span>
        </Text>
      </div>
      {manage && survey.status !== 'draft' ? (
        <div className="w-full sm:w-44">
          <ProgressBar
            size="sm"
            label={tr('{answered} of {count} answered', { answered, count: audience.length })}
            value={answered}
            max={Math.max(1, audience.length)}
            tone={isOpen(survey) ? 'primary' : 'success'}
          />
        </div>
      ) : null}
      {asked && isOpen(survey) && !mine ? (
        <Button asChild variant="primary" size="sm">
          <Link to={`/surveys/${survey.id}`}>{tr("Answer")}</Link>
        </Button>
      ) : manage ? (
        <Button asChild size="sm">
          <Link to={survey.status === 'draft' ? `/surveys/${survey.id}/edit` : `/surveys/${survey.id}`}>
            {survey.status === 'draft' ? tr('Edit draft') : tr('See results')}
          </Link>
        </Button>
      ) : null}
    </li>
  );
}

function SurveyList({ surveys, manage }: { surveys: Survey[]; manage: boolean }) {
  const { t: tr } = useLocale();
  const { state } = useStore();
  const navigate = useNavigate();
  if (!surveys.length) {
    return (
      <Card>
        <EmptyState
          size="card"
          headingAs="h3"
          heading={manage ? tr('No surveys yet') : tr('No surveys for you')}
          action={manage ? <Button onClick={() => navigate('/surveys/new')}>{tr("New survey")}</Button> : undefined}
        >
          {manage ? tr('Ask the whole team or a few departments, and see the answers as they come in.') : tr('When someone asks you for your view, it shows up here.')}
        </EmptyState>
      </Card>
    );
  }
  return (
    <Card flush>
      <ul className="divide-y divide-border">
        {surveys.map((s) => (
          <SurveyRow key={s.id} state={state} survey={s} manage={manage} />
        ))}
      </ul>
    </Card>
  );
}

export function Surveys() {
  const { t: tr } = useLocale();
  const { state } = useStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const manage = canManageSurveys(state);
  const me = state.people.find((p) => p.id === state.meId);
  const toAnswer = surveysToAnswer(state);

  // Admins see every survey; others see the published ones that ask them.
  const order = (s: Survey) => (s.status === 'draft' ? 1 : isOpen(s) ? 0 : 2);
  const visible = state.surveys
    .filter((s) => manage || (s.status !== 'draft' && (s.audience.length === 0 || (me && s.audience.includes(me.department)))))
    .sort((a, b) => order(a) - order(b) || (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt));

  const waiting = toAnswer.length ? (
    <section aria-labelledby="to-answer" className="flex flex-col gap-3">
      <Text as="h2" id="to-answer" variant="title">
        {tr("Waiting for your answer")}</Text>
      <div className="grid gap-3 md:grid-cols-2">
        {toAnswer.map((s) => (
          <Card key={s.id} className="flex flex-col gap-3 border-primary/40">
            <div className="flex flex-col gap-1">
              <Text as="h3" variant="subtitle">
                {tr(s.title)}
              </Text>
              <Text variant="bodySm" tone="muted">
                {tr('{count} questions', { count: questionsOf(s.fields).length })} · {tr('about {count} min', { count: minutes(s) })} · {closesLabel(s, tr)}
                {s.anonymous ? ` · ${tr('Anonymous')}` : ''}
              </Text>
            </div>
            {s.description ? <Text variant="bodySm">{tr(s.description)}</Text> : null}
            <Button variant="primary" className="self-start" onClick={() => navigate(`/surveys/${s.id}`)}>
              {tr("Answer now")}</Button>
          </Card>
        ))}
      </div>
    </section>
  ) : null;

  return (
    <>
      <PageHeader
        title={tr("Surveys")}
        subtitle={manage ? tr('Ask your team with your own questions, and see the answers as they come in.') : tr('Share your view when your team asks.')}
        primaryAction={manage ? { content: tr("New survey"), onAction: () => navigate('/surveys/new') } : undefined}
      />
      {manage ? (
        <Tabs value={params.get('tab') === 'feedback' ? 'feedback' : 'surveys'} onValueChange={(v) => setParams(v === 'feedback' ? { tab: 'feedback' } : {}, { replace: true })}>
          <TabsList aria-label={tr("Surveys and feedback")}>
            <TabsTrigger value="surveys" badge={visible.length || undefined}>
              {tr("Team surveys")}</TabsTrigger>
            <TabsTrigger value="feedback" badge={state.feedback.length + state.leads.length || undefined}>
              {tr("Feedback & enquiries")}</TabsTrigger>
          </TabsList>
          <TabsContent value="surveys" className="flex flex-col gap-6 pt-4">
            {waiting}
            <SurveyList surveys={visible} manage />
          </TabsContent>
          <TabsContent value="feedback" className="pt-4">
            <FeedbackInbox />
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {waiting}
          {!toAnswer.length || visible.some((s) => !toAnswer.includes(s)) ? (
            <section aria-labelledby="earlier" className="flex flex-col gap-3">
              {toAnswer.length ? (
                <Text as="h2" id="earlier" variant="title">
                  {tr("Other surveys")}</Text>
              ) : (
                <h2 id="earlier" className="sr-only">
                  {tr("Your surveys")}</h2>
              )}
              <SurveyList surveys={visible.filter((s) => !toAnswer.includes(s))} manage={false} />
            </section>
          ) : null}
        </>
      )}
    </>
  );
}
