import { ButtonBase } from '@mui/material';
import { Banner, Button, cn, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Switch, Text, Textarea, useToast } from '@app/ui';
import { CalendarCheck, ClipboardList, GraduationCap, HeartPulse, RotateCcw } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CheckGroup } from '../components/CheckGroup';
import { FormBuilder, newField } from '../components/forms/FormBuilder';
import { FormRenderer } from '../components/forms/FormRenderer';
import { headerLink } from '../components/links';
import { MobileActionBar } from '../components/MobileActionBar';
import { canManageSurveys, surveyAudience, surveyResponsesFor, uid, useStore } from '../data/store';
import type { FormField, FormValues, Survey } from '../data/types';
import { cleanFields, formProblems, questionsOf, toDateInput } from '../lib/forms';
import { DEPARTMENTS } from '../lib/org';
import { useLocale } from '../i18n/LocaleProvider';


const f = (label: string, kind: FormField['kind'], extra: Partial<FormField> = {}): FormField => ({ ...newField(kind), label, ...extra });

const TEMPLATES: { id: string; name: string; hint: string; icon: ReactNode; make: () => Pick<Survey, 'title' | 'description' | 'fields' | 'anonymous'> }[] = [
  {
    id: 'pulse',
    name: 'Team pulse',
    hint: 'Mood, workload and one change, anonymous',
    icon: <HeartPulse />,
    make: () => ({
      title: 'Team pulse',
      description: 'A few quick questions about how work is going. Answers are anonymous.',
      anonymous: true,
      fields: [
        f('How are you feeling about work this week?', 'rating', { required: true }),
        f('How manageable is your workload?', 'radio', { required: true, options: ['Too light', 'About right', 'Too heavy'] }),
        f('What would help you most right now?', 'longtext'),
      ],
    }),
  },
  {
    id: 'event',
    name: 'Event sign-up',
    hint: 'Who’s coming, with follow-ups only for yes',
    icon: <CalendarCheck />,
    make: () => {
      const join = f('Will you come?', 'yesno', { required: true });
      return {
        title: 'Team event sign-up',
        description: 'Let us know if you can make it, so we can plan food and seats.',
        anonymous: false,
        fields: [
          join,
          f('Any food needs?', 'checkboxes', { options: ['Vegetarian', 'Halal', 'No nuts', 'None'], showIf: { fieldId: join.id, equals: 'Yes' } }),
          f('Are you bringing a guest?', 'yesno', { showIf: { fieldId: join.id, equals: 'Yes' } }),
        ],
      };
    },
  },
  {
    id: 'training',
    name: 'Training feedback',
    hint: 'Rating, usefulness and comments',
    icon: <GraduationCap />,
    make: () => ({
      title: 'Training feedback',
      description: 'Tell us how the session went, so the next one is better.',
      anonymous: false,
      fields: [
        f('Overall, how was the session?', 'rating', { required: true }),
        f('How likely are you to recommend it to a colleague?', 'scale', { required: true }),
        f('What should we change next time?', 'longtext'),
      ],
    }),
  },
];

const blank = (me: string): Survey => ({
  id: uid('survey'),
  title: '',
  description: '',
  fields: [],
  audience: [],
  anonymous: false,
  status: 'draft',
  createdBy: me,
  createdAt: new Date().toISOString(),
});

export function SurveyEditor() {
  const { t: tr } = useLocale();
  const { id } = useParams();
  const { state, me, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const original = id ? state.surveys.find((s) => s.id === id) : undefined;
  const [draft, setDraft] = useState<Survey>(() => original ?? blank(me.id));
  const [preview, setPreview] = useState<FormValues>({});
  const [errors, setErrors] = useState<{ title?: string; questions?: string[]; closesAt?: string }>({});
  const [confirm, setConfirm] = useState(false);
  const [view, setView] = useState<'build' | 'preview'>('build');

  if (!canManageSurveys(state)) {
    return (
      <EmptyState heading={tr("Only admins can create surveys")} action={<Button onClick={() => navigate('/surveys')}>{tr("Back to surveys")}</Button>}>
        {tr("Ask an admin if you’d like to ask the team something.")}</EmptyState>
    );
  }
  if (id && !original) {
    return (
      <EmptyState heading={tr("This survey doesn’t exist")} action={<Button onClick={() => navigate('/surveys')}>{tr("Back to surveys")}</Button>}>
        {tr("It may have been deleted.")}</EmptyState>
    );
  }

  const answered = original ? surveyResponsesFor(state, original.id).length : 0;
  const locked = answered > 0;
  const published = draft.status !== 'draft';
  const audience = surveyAudience(state, draft);
  const set = (patch: Partial<Survey>) => setDraft({ ...draft, ...patch });

  const check = () => {
    const e: typeof errors = {};
    if (!draft.title.trim()) e.title = 'Give the survey a title people will recognise, like “Team pulse · October”.';
    const problems = [...(questionsOf(draft.fields).length ? [] : ['Add at least one question.']), ...formProblems(cleanFields(draft.fields))];
    if (problems.length) e.questions = problems;
    if (draft.closesAt && new Date(draft.closesAt).getTime() < Date.now() && draft.status !== 'closed') e.closesAt = 'Choose today or a later day.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const clean = (): Survey => ({ ...draft, title: draft.title.trim(), description: draft.description.trim(), fields: cleanFields(draft.fields) });

  const saveDraft = () => {
    if (!draft.title.trim()) {
      setErrors({ title: tr("A draft needs at least a title.") });
      return;
    }
    dispatch({ type: 'saveSurvey', survey: clean() });
    toast({ tone: 'success', title: tr("Draft saved"), description: tr("Nobody sees it until you send it.") });
    navigate('/surveys');
  };
  const saveChanges = () => {
    if (!check()) return;
    dispatch({ type: 'saveSurvey', survey: clean() });
    toast({ tone: 'success', title: tr("Survey updated") });
    navigate(`/surveys/${draft.id}`);
  };
  const publish = () => {
    dispatch({ type: 'saveSurvey', survey: clean() });
    dispatch({ type: 'publishSurvey', surveyId: draft.id });
    setConfirm(false);
    toast({ tone: 'success', title: `Sent to ${audience.length} people`, description: tr("They see it on Home, in Surveys and in their notifications.") });
    navigate(`/surveys/${draft.id}`);
  };

  const questionCount = errors.questions?.length ?? 0;

  return (
    <>
      <PageHeader
        title={original ? (published ? tr("Edit survey") : tr("Edit draft")) : tr("New survey")}
        subtitle={published ? undefined : tr("Nobody sees it until you send it.")}
        backAction={{ content: tr("Surveys"), href: '/surveys' }}
        renderLink={headerLink}
        primaryAction={
          published
            ? { content: tr("Save changes"), onAction: saveChanges }
            : { content: tr("Review and send"), onAction: () => check() && setConfirm(true) }
        }
        secondaryActions={published ? undefined : [{ content: tr("Save draft"), onAction: saveDraft }]}
      />

      {errors.title || questionCount || errors.closesAt ? (
        <Banner tone="critical" title={tr("Fix these to continue")}>
          <ul className="list-disc ps-5">
            {errors.title ? <li>{tr("Add a title.")}</li> : null}
            {errors.questions?.map((p) => <li key={p}>{p}</li>)}
            {errors.closesAt ? <li>{errors.closesAt}</li> : null}
          </ul>
        </Banner>
      ) : null}

      {/* Phones and tablets: switch between building and previewing instead of scrolling past the whole form. */}
      <div role="tablist" aria-label={tr("Editor view")} className="grid grid-cols-2 gap-1 rounded-lg bg-surface-sunken p-1 lg:hidden">
        {(['build', 'preview'] as const).map((v) => (
          <ButtonBase
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={cn(
              'rounded-md py-2 text-md font-medium focus-visible:outline-2 focus-visible:outline-ring',
              view === v ? 'bg-surface text-fg shadow-xs' : 'text-fg-muted',
            )}
          >
            {v === 'build' ? tr("Build") : tr("Preview{value0}", { value0: questionsOf(draft.fields).length ? ` (${questionsOf(draft.fields).length})` : '' })}
          </ButtonBase>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className={cn('min-w-0 flex-col gap-6 lg:flex', view === 'build' ? 'flex' : 'hidden')}>
          {!original && draft.fields.length === 0 ? (
            <Card className="flex flex-col gap-3">
              <CardHeader title={tr("Start from a template")} description={tr("Or add your own questions below.")} />
              <div className="grid gap-2 sm:grid-cols-3">
                {TEMPLATES.map((t) => (
                  <ButtonBase
                    key={t.id}
                    type="button"
                    onClick={() => {
                      const made = t.make();
                      // Keep a title the admin already typed.
                      setDraft({ ...draft, ...made, title: draft.title.trim() ? draft.title : made.title });
                      setPreview({});
                      setErrors({});
                    }}
                    className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3 text-start hover:border-primary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex-col sm:gap-1"
                  >
                    <span aria-hidden className="mt-0.5 text-primary sm:mt-0 [&_svg]:size-5">
                      {t.icon}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium text-fg">{tr(t.name)}</span>
                      <span className="text-sm text-fg-muted">{tr(t.hint)}</span>
                    </span>
                  </ButtonBase>
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="flex flex-col gap-4">
            <CardHeader title={tr("About this survey")} />
            <Field label={tr("Title")} required error={errors.title}>
              <Input value={tr(draft.title)} maxLength={80} onChange={(e) => (set({ title: e.target.value }), setErrors({ ...errors, title: undefined }))} />
            </Field>
            <Field label={tr("Introduction")} optional helpText={tr('Shown at the top: why you’re asking and what you’ll do with the answers.')}>
              <Textarea rows={2} autoGrow value={tr(draft.description)} onChange={(e) => set({ description: e.target.value })} />
            </Field>
          </Card>

          <Card className="flex flex-col gap-4">
            <CardHeader
              title={tr("Questions")}
              description={tr("Pick an answer type for each question. Use “Only ask when” to skip questions that don’t apply.")}
            />
            {locked ? (
              <Banner tone="info" inline>
                {answered} {answered === 1 ? tr("person has") : tr("people have")} {tr("answered, so the questions can’t change. Duplicate the survey to ask something new.")}</Banner>
            ) : null}
            <fieldset disabled={locked} className="contents">
              <FormBuilder fields={draft.fields} onChange={(fields) => (set({ fields }), setErrors({ ...errors, questions: undefined }))} />
            </fieldset>
          </Card>

          <Card className="flex flex-col gap-4">
            <CardHeader title={tr("Who and when")} />
            <Switch
              label={tr("Everyone in the workspace")}
              helpText={`${state.people.length} people`}
              checked={draft.audience.length === 0}
              disabled={locked}
              onCheckedChange={(on) => set({ audience: on ? [] : [state.people.find((p) => p.id === me.id)?.department ?? 'Operations'] })}
            />
            {draft.audience.length ? (
              <fieldset disabled={locked} className="flex flex-col gap-2">
                <Text as="span" variant="label" aria-hidden>
                  {tr("Departments to ask")}</Text>
                <CheckGroup
                  legend={tr("Departments to ask")}
                  options={DEPARTMENTS.map((d) => ({ value: d, label: `${d} (${state.people.filter((p) => p.department === d).length})` }))}
                  value={draft.audience}
                  onChange={(v) => set({ audience: v.length ? v : draft.audience })}
                />
              </fieldset>
            ) : null}
            <Switch
              label={tr("Anonymous answers")}
              helpText="Names are never shown with answers, and results appear only once 3 people have answered."
              checked={draft.anonymous}
              disabled={locked}
              onCheckedChange={(on) => set({ anonymous: on })}
            />
            <Field
              label={tr("Last day to answer")}
              optional
              helpText={draft.status === 'closed' ? 'This survey is closed. Reopen it from its page to take answers again.' : 'The survey closes at the end of this day.'}
              error={errors.closesAt}
            >
              <Input
                type="date"
                className="max-w-xs"
                value={draft.closesAt ? toDateInput(draft.closesAt) : ''}
                min={toDateInput(new Date().toISOString())}
                onChange={(e) => set({ closesAt: e.target.value ? new Date(`${e.target.value}T23:59:00`).toISOString() : undefined })}
              />
            </Field>
          </Card>
        </div>

        <Card className={cn('min-w-0 flex-col gap-4 self-start lg:sticky lg:top-20 lg:flex', view === 'preview' ? 'flex' : 'hidden')}>
          <CardHeader
            title={tr("Preview")}
            description={tr("What people see. Try answering: follow-up questions appear as you go.")}
            actions={
              Object.keys(preview).length ? (
                <Button size="sm" variant="tertiary" icon={<RotateCcw />} onClick={() => setPreview({})}>
                  {tr("Reset")}</Button>
              ) : null
            }
          />
          <div className="flex flex-col gap-1 border-b border-border pb-3">
            <Text variant="subtitle">{tr(draft.title || 'Untitled survey')}</Text>
            {draft.description ? <Text variant="bodySm" tone="muted">{tr(draft.description)}</Text> : null}
          </div>
          {draft.fields.length ? (
            <FormRenderer fields={draft.fields} values={preview} onChange={setPreview} idPrefix="preview" numbered />
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-fg-muted">
              <ClipboardList aria-hidden className="size-6" />
              <Text variant="bodySm" tone="muted">
                {tr("Questions you add appear here.")}</Text>
            </div>
          )}
        </Card>
      </div>

      <MobileActionBar label={tr("Survey actions")}>
        {published ? (
          <Button variant="primary" onClick={saveChanges}>
            {tr("Save changes")}</Button>
        ) : (
          <>
            <Button onClick={saveDraft}>{tr("Save draft")}</Button>
            <Button variant="primary" onClick={() => check() && setConfirm(true)}>
              {tr("Review and send")}</Button>
          </>
        )}
      </MobileActionBar>

      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title={tr("Send this survey?")}
        primaryAction={{ content: tr("Send to {value0} people", { value0: audience.length }), onAction: publish }}
        secondaryActions={[{ content: tr("Keep editing"), onAction: () => setConfirm(false) }]}
      >
        <ul className="flex list-disc flex-col gap-1.5 ps-5 text-md">
          <li>
            <strong>{tr(draft.title)}</strong>: {questionsOf(draft.fields).length} {tr("questions")}</li>
          <li>{tr("Goes to")}{' '}{draft.audience.length ? draft.audience.join(', ') : tr("everyone")} ({audience.length} {tr("people), on Home and in their notifications.")}</li>
          <li>{draft.anonymous ? tr("Anonymous: names are never shown with answers.") : tr("Answers show who gave them.")}</li>
          <li>
            {draft.closesAt ? tr("Closes at the end of {value0}.", { value0: new Date(draft.closesAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) }) : tr("Stays open until you close it.")}
          </li>
        </ul>
      </Modal>
    </>
  );
}
