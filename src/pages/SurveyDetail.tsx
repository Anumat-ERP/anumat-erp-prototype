import {SurveyFollowUp} from '../components/SurveyFollowUp';
import { ANONYMOUS_SURVEY_MIN_RESPONSES } from '../lib/surveys';
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  CardHeader,
  DescriptionList,
  EmptyState,
  Modal,
  PageHeader,
  ProgressBar,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  useToast,
} from '@app/ui';
import { CircleCheck, EyeOff, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { FormRenderer, focusFirstError } from '../components/forms/FormRenderer';
import { headerLink } from '../components/links';
import { Person } from '../components/Person';
import { SurveyResults } from '../components/SurveyResults';
import { canManageSurveys, isOpen, surveyAudience, surveyResponsesFor, uid, useStore } from '../data/store';
import type { FormValues, Survey, SurveyResponse } from '../data/types';
import { cleanValues, formatAnswer, questionsOf, validateForm, visibleFields } from '../lib/forms';
import { formatDate, formatDateTime } from '../lib/format';
import { audienceLabel, closesLabel, surveyStatus } from './Surveys';
import { useLocale } from '../i18n/LocaleProvider';

/** Results stay hidden below this many answers on anonymous surveys, so nobody can be picked out. */
const ANON_MIN = ANONYMOUS_SURVEY_MIN_RESPONSES;

function Answers({ survey, response }: { survey: Survey; response: SurveyResponse }) {
  const { person } = useStore();
  const numbers = new Map(questionsOf(survey.fields).map((f, i) => [f.id, i + 1]));
  return (
    <DescriptionList
      layout="stacked"
      dividers
      items={questionsOf(visibleFields(survey.fields, response.answers)).map((f) => ({
        term: `${numbers.get(f.id)}. ${f.label}`,
        description: formatAnswer(f, response.answers[f.id], (id) => person(id).name),
      }))}
    />
  );
}

function AnswerPanel({ survey }: { survey: Survey }) {
  const { t: tr } = useLocale();
  const { state, me, dispatch } = useStore();
  const { toast } = useToast();
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mine = state.surveyResponses.find((r) => r.surveyId === survey.id && r.personId === me.id);
  const asked = surveyAudience(state, survey).some((p) => p.id === me.id);

  if (mine) {
    return (
      <Card className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <CircleCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-success" />
          <div className="flex flex-col gap-1">
            <Text as="h2" variant="title">
              {tr("Thanks, you answered on")}{' '}{formatDate(mine.at)}
            </Text>
            <Text variant="bodySm" tone="muted">
              {survey.anonymous ? tr('Only you see these answers with your name. Everyone else sees totals.') : tr('Here’s what you sent.')}
            </Text>
          </div>
        </div>
        <Answers survey={survey} response={mine} />
      </Card>
    );
  }
  if (!isOpen(survey)) {
    return (
      <Card>
        <EmptyState size="card" headingAs="h2" heading={tr("This survey is closed")} image={null}>
          {tr("It stopped taking answers")}{' '}{survey.closesAt ? tr('on {date}', { date: formatDate(survey.closesAt) }) : ''}.
        </EmptyState>
      </Card>
    );
  }
  if (!asked) {
    return (
      <Banner tone="info" title={tr("This survey isn’t for your department")}>
        {tr("It asks")}{' '}{audienceLabel(survey, tr)}.
      </Banner>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validateForm(survey.fields, values, tr);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => focusFirstError(survey.fields, found, 'answer'));
      return;
    }
    dispatch({ type: 'answerSurvey', surveyId: survey.id, answers: cleanValues(survey.fields, values) });
    toast({ tone: 'success', title: tr("Thanks! Your answers were sent") });
  };
  const count = Object.keys(errors).length;

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <Card className="flex flex-col gap-5">
        {survey.anonymous ? (
          <Banner tone="info" inline>
            <span className="inline-flex items-center gap-1.5">
              <EyeOff aria-hidden className="size-4" /> {tr("Anonymous: your name is never shown with your answers.")}</span>
          </Banner>
        ) : null}
        {count > 1 ? (
          <Banner tone="critical" title={tr('Answer {count} more questions to send', { count })}>
            {tr("Each one is marked below.")}</Banner>
        ) : null}
        <FormRenderer
          fields={survey.fields}
          values={values}
          onChange={(v) => {
            setValues(v);
            if (count) setErrors(validateForm(survey.fields, v, tr));
          }}
          errors={errors}
          idPrefix="answer"
          numbered
        />
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary">
          {tr("Send answers")}</Button>
        <Text variant="bodySm" tone="muted">
          {closesLabel(survey, tr)}
        </Text>
      </div>
    </form>
  );
}

function ResultsPanel({ survey, responses }: { survey: Survey; responses: SurveyResponse[] }) {
  const { t: tr } = useLocale();
  const { state } = useStore();
  const { toast } = useToast();
  const audience = surveyAudience(state, survey);
  const missing = audience.filter((p) => !responses.some((r) => r.personId === p.id));
  const hidden = survey.anonymous && responses.length < ANON_MIN;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="col-span-2 flex flex-col gap-2 sm:col-span-1">
          <Text as="span" variant="bodySm" tone="muted">
            {tr("Answered")}</Text>
          <Text as="span" variant="heading" numeric>
            {responses.length} {tr("of")}{' '}{audience.length}
          </Text>
          <ProgressBar size="sm" label={tr("Response rate")} labelHidden value={responses.length} max={Math.max(1, audience.length)} />
        </Card>
        <Card className="flex flex-col gap-1">
          <Text as="span" variant="bodySm" tone="muted">
            {tr("Status")}</Text>
          <Text as="span" variant="heading">
            {tr(surveyStatus(survey, tr).label)}
          </Text>
          <Text as="span" variant="caption" tone="subtle">
            {closesLabel(survey, tr)}
          </Text>
        </Card>
        <Card className="flex flex-col gap-1">
          {/* A timestamp could tie an answer to whoever just said they'd answered, so anonymous surveys don't show one. */}
          <Text as="span" variant="bodySm" tone="muted">
            {survey.anonymous ? tr('Privacy') : tr('Last answer')}
          </Text>
          <Text as="span" variant="heading">
            {survey.anonymous ? tr('Anonymous') : responses.length ? formatDate([...responses].sort((a, b) => b.at.localeCompare(a.at))[0]!.at) : '—'}
          </Text>
          <Text as="span" variant="caption" tone="subtle">
            {questionsOf(survey.fields).length} {tr("questions")}</Text>
        </Card>
      </div>

      {isOpen(survey) && missing.length ? (
        <Card className="flex flex-col gap-3">
          <CardHeader
            title={tr("Not answered yet")}
            description={
              survey.anonymous
                ? tr(missing.length === 1 ? '{count} person hasn’t answered. Names stay hidden on anonymous surveys.' : '{count} people haven’t answered. Names stay hidden on anonymous surveys.', { count: missing.length })
                : tr(missing.length === 1 ? '{count} person' : '{count} people', { count: missing.length })
            }
            actions={
              <Button
                size="sm"
                onClick={() =>
                  toast({ tone: 'success', title: tr(missing.length === 1 ? 'Reminder sent to {count} person' : 'Reminder sent to {count} people', { count: missing.length }), description: tr("In Anumat, and on Telegram for people who connected it.") })
                }
              >
                {tr("Send a reminder")}</Button>
            }
          />
          {!survey.anonymous ? (
            <ul className="flex flex-wrap gap-2">
              {missing.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-full border border-border py-1 ps-1 pe-3 text-sm">
                  <Avatar name={p.name} size="xs" decorative />
                  {tr(p.name)}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}

      {hidden ? (
        <Banner tone="info" title={tr('Results appear after {count} answers', { count: ANON_MIN })}>
          {tr("This survey is anonymous, so totals stay hidden until nobody can be picked out from them.")}{' '}{responses.length} {tr("so far.")}</Banner>
      ) : responses.length ? (
        <SurveyResults survey={survey} responses={responses} minAnswers={ANON_MIN} />
      ) : (
        <Card>
          <EmptyState size="card" headingAs="h2" heading={tr("No answers yet")} image={null}>
            {tr("Results appear here as people answer.")}</EmptyState>
        </Card>
      )}
    </div>
  );
}

function ResponsesPanel({ survey, responses }: { survey: Survey; responses: SurveyResponse[] }) {
  const { t: tr } = useLocale();
  if (survey.anonymous) {
    return (
      <Banner tone="info" title={tr("Individual answers are hidden")}>
        {tr("This survey is anonymous. See the totals under Results.")}</Banner>
    );
  }
  if (!responses.length) {
    return (
      <Card>
        <EmptyState size="card" headingAs="h2" heading={tr("No answers yet")} image={null}>
          {tr("Each person’s answers appear here.")}</EmptyState>
      </Card>
    );
  }
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {[...responses]
        .sort((a, b) => b.at.localeCompare(a.at))
        .map((r) => (
          <li key={r.id}>
            <Card className="flex h-full flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <Person id={r.personId} showRole />
                <Text as="span" variant="caption" tone="subtle" className="shrink-0">
                  {formatDateTime(r.at)}
                </Text>
              </div>
              <Answers survey={survey} response={r} />
            </Card>
          </li>
        ))}
    </ul>
  );
}

export function SurveyDetail() {
  const { t: tr } = useLocale();
  const { id } = useParams();
  const { state, person, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const survey = state.surveys.find((s) => s.id === id);
  const manage = canManageSurveys(state);
  // Chosen once, so answering doesn't whisk you away from the thank-you.
  const [tab, setTab] = useState(() =>
    survey && isOpen(survey) && surveyAudience(state, survey).some((p) => p.id === state.meId) && !state.surveyResponses.some((r) => r.surveyId === survey.id && r.personId === state.meId)
      ? 'answer'
      : 'results',
  );

  if (!survey || (survey.status === 'draft' && !manage)) {
    return (
      <EmptyState heading={tr("This survey isn’t available")} action={<Button onClick={() => navigate('/surveys')}>{tr("Back to surveys")}</Button>}>
        {tr("It may have been deleted, or it hasn’t been sent yet.")}</EmptyState>
    );
  }

  const responses = surveyResponsesFor(state, survey.id);
  const status = surveyStatus(survey, tr);
  const open = isOpen(survey);
  const asked = surveyAudience(state, survey).some((p) => p.id === state.meId);

  const duplicate = () => {
    const copy: Survey = {
      ...survey,
      id: uid('survey'),
      title: `${survey.title} ${tr('(copy)')}`,
      status: 'draft',
      createdBy: state.meId,
      createdAt: new Date().toISOString(),
      publishedAt: undefined,
      closesAt: undefined,
    };
    dispatch({ type: 'saveSurvey', survey: copy });
    toast({ tone: 'success', title: tr("Copied as a draft") });
    navigate(`/surveys/${copy.id}/edit`);
  };

  const actions = manage
    ? [
        ...(survey.status === 'draft' ? [] : [{ content: tr("Edit"), onAction: () => navigate(`/surveys/${survey.id}/edit`) }]),
        ...(survey.status === 'draft'
          ? [{ content: tr("Edit draft"), onAction: () => navigate(`/surveys/${survey.id}/edit`) }]
          : open
            ? [
                {
                  content: tr("Close survey"),
                  onAction: () => {
                    dispatch({ type: 'closeSurvey', surveyId: survey.id });
                    toast({ title: tr("Survey closed"), description: tr("Nobody else can answer. Results stay here.") });
                  },
                },
              ]
            : [
                {
                  content: tr("Reopen for 7 days"),
                  onAction: () => {
                    dispatch({ type: 'reopenSurvey', surveyId: survey.id, closesAt: new Date(Date.now() + 7 * 86_400_000).toISOString() });
                    toast({ tone: 'success', title: tr("Survey reopened for 7 days") });
                  },
                },
              ]),
        { content: tr("Duplicate"), onAction: duplicate },
        { content: tr("Delete"), destructive: true, onAction: () => setConfirmDelete(true) },
      ]
    : undefined;

  const meta = (
    <Text variant="bodySm" tone="muted" className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Badge size="sm" tone={status.tone}>
        {tr(status.label)}
      </Badge>
      <span className="inline-flex items-center gap-1">
        <Users aria-hidden className="size-3.5" /> {audienceLabel(survey, tr)}
      </span>
      {survey.anonymous ? (
        <span className="inline-flex items-center gap-1">
          <EyeOff aria-hidden className="size-3.5" /> {tr("Anonymous")}</span>
      ) : null}
      <span>{closesLabel(survey, tr)}</span>
      <span>{tr("From")}{' '}{tr(person(survey.createdBy).name)}</span>
    </Text>
  );

  const answerTab = asked && survey.status !== 'draft';

  return (
    <>
      <PageHeader
        title={tr(survey.title)}
        subtitle={survey.description || undefined}
        backAction={{ content: tr("Surveys"), href: '/surveys' }}
        renderLink={headerLink}
        secondaryActions={actions}
        maxVisibleSecondaryActions={1}
      />
      {meta}
      {survey.status === 'draft' ? (
        <Banner
          tone="warning"
          title={tr("Draft: nobody can see this yet")}
          action={{ label: tr("Edit and send"), onAction: () => navigate(`/surveys/${survey.id}/edit`) }}
        >
          {tr("Finish the questions and send it when you’re ready.")}</Banner>
      ) : null}

      {manage ? (
        <Tabs value={tab === 'answer' && !answerTab ? 'results' : tab} onValueChange={setTab}>
          <TabsList aria-label={tr("Survey views")}>
            <TabsTrigger value="results">{tr("Results")}</TabsTrigger>
            <TabsTrigger value="responses" badge={survey.anonymous ? undefined : responses.length || undefined}>
              {tr("Responses")}</TabsTrigger>
            {answerTab ? <TabsTrigger value="answer">{tr("Your answer")}</TabsTrigger> : null}
          </TabsList>
          <TabsContent value="results" className="pt-4">
            <ResultsPanel survey={survey} responses={responses} />
            <SurveyFollowUp key={survey.id} survey={survey} />
          </TabsContent>
          <TabsContent value="responses" className="pt-4">
            <ResponsesPanel survey={survey} responses={responses} />
          </TabsContent>
          {answerTab ? (
            <TabsContent value="answer" className="pt-4">
              <AnswerPanel survey={survey} />
            </TabsContent>
          ) : null}
        </Tabs>
      ) : (
        <div className="max-w-3xl">
          <AnswerPanel survey={survey} />
        </div>
      )}

      <Modal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        size="sm"
        title={tr("Delete this survey?")}
        primaryAction={{
          content: tr("Delete survey"),
          destructive: true,
          onAction: () => {
            dispatch({ type: 'deleteSurvey', surveyId: survey.id });
            toast({ title: tr('Deleted “{title}”', { title: survey.title }) });
            navigate('/surveys');
          },
        }}
        secondaryActions={[{ content: tr("Cancel"), onAction: () => setConfirmDelete(false) }]}
      >
        <Text>
          {responses.length ? tr("Its {value0} answers are deleted too. ", { value0: responses.length }) : ''}{tr("This can’t be undone.")}</Text>
      </Modal>
    </>
  );
}
