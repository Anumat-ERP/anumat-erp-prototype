import { CandidateStagePicker } from './RecruitmentStagesManager';
import { JobDescriptionFields, JobDescriptionSummary } from './JobDescription';
import { useState } from 'react';
import { Link } from 'react-router';
import {
  Badge,
  Banner,
  Button,
  Card,
  DatePicker,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  TimePicker,
} from '@app/ui';
import { RichTextEditor } from '../components/RichTextEditor';
import '../styles/work-item-editor.css';
import { uid, useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { appRole, canContributeToApp, isAppAdmin } from '../lib/appAccess';
import { hrProblem, hrState } from './engine';
import {
  recruitmentReviewers,
  recruitmentState,
  approvedOffer,
} from './recruitment';
import type { Application } from './types';
import type {
  Position,
  Requisition,
  Interview,
  OfferReview,
  RecruitmentCommand,
} from './recruitmentTypes';
export type RecruitmentEditorKind =
  | 'position'
  | 'requisition'
  | 'interview'
  | 'offer';
export function RecruitmentEditor({
  kind,
  record: initialRecord,
  application,
  positionId,
  template,
  close,
}: {
  kind: RecruitmentEditorKind;
  record?: Position | Requisition | Interview | OfferReview;
  application?: Application;
  positionId?: string;
  template?: Position;
  close: () => void;
}) {
  const [record] = useState(initialRecord);
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const r = recruitmentState(state),
    hr = hrState(state),
    admin = isAppAdmin(state, 'recruitment');
  const [draft, setDraft] = useState<Record<string, unknown>>(() => {
    if (record)
      return structuredClone(record) as unknown as Record<string, unknown>;
    const date = new Date().toISOString().slice(0, 10);
    const base = { id: uid(kind), version: 0 };
    if (kind === 'position')
      return {
        ...base,
        title: '',
        department: '',
        branch: '',
        description: '',
        requirements: '',
        employmentType: 'Full time',
        status: 'active',
        ...(template ? { ...structuredClone(template), ...base, status: 'active', code: '', revisionNote: '', title: tr('Copy of {title}', { title: template.title }) } : {}),
      };
    if (kind === 'requisition')
      return {
        ...base,
        positionId: r.positions.find((p) => p.id === positionId && p.status !== 'archived')?.id ?? r.positions.find((p) => p.status !== 'archived')?.id ?? '',
        openings: 1,
        budget: 650,
        currency: 'USD',
        reason: '',
        managerId: state.meId,
        reviewerId: recruitmentReviewers(state)[0]?.id ?? '',
        closingDate: date,
      };
    if (kind === 'interview')
      return {
        ...base,
        applicationId:
          application?.id ??
          hr.applications.find((a) => a.status === 'shortlisted')?.id ??
          '',
        interviewerId: state.meId,
        startsAt: `${date}T09:00`,
        duration: 60,
        location: '',
        criteria: '',
        score: 0,
        evidence: '',
        recommendation: 'advance',
      };
    return {
      ...base,
      reviewerId: recruitmentReviewers(state)[0]?.id ?? '',
      terms: '',
    };
  });
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState(''),
    [reason, setReason] = useState('');
  const set = (key: string, value: unknown) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError('');
  };
  const val = (key: string) => String(draft[key] ?? '');
  const current = record && [...r.positions, ...r.requisitions, ...r.interviews, ...r.offers].find((row) => row.id === record.id);
  const stale = !!record && current?.version !== record.version;
  const run = (command: RecruitmentCommand) => {
    if (stale) { setError(tr('This record changed. Close and reopen it before continuing.')); return; }
    const e = hrProblem(state, { kind: 'recruitment', command });
    if (e) {
      setError(tr(e));
      return;
    }
    dispatch({ type: 'hr', command: { kind: 'recruitment', command } });
    close();
  };
  const q = record as Requisition | undefined,
    i = record as Interview | undefined,
    o = record as OfferReview | undefined;
  const editable =
    admin &&
    (!record ||
      kind === 'position' ||
      (kind === 'requisition' && q?.status === 'draft') ||
      (kind === 'interview' && i?.status === 'scheduled'));
  const dirty = !!record && JSON.stringify(draft) !== JSON.stringify(record);
  const scheduleDirty = kind === 'interview' && !!record &&
    ['applicationId', 'interviewerId', 'startsAt', 'duration', 'location', 'criteria'].some(
      (key) => draft[key] !== (record as unknown as Record<string, unknown>)[key],
    );
  const optionsPeople = state.people
    .filter((p) => canContributeToApp(state, 'recruitment', p.id))
    .map((p) => ({ value: p.id, label: p.name }));
  const reviewers = recruitmentReviewers(state).map((p) => ({
    value: p.id,
    label: p.name,
  }));
  const text = (
    key: string,
    label: string,
    textarea = false,
    number = false,
  ) => (
    <Field key={key} label={tr(label)} required={kind === 'position' && ['title', 'department', 'branch', 'requirements'].includes(key)}>
      <>
        {textarea ? (
          <Textarea
            value={val(key)}
            disabled={!editable}
            onChange={(e) => set(key, e.target.value)}
          />
        ) : (
          <Input
            type={number ? 'number' : 'text'}
            value={val(key)}
            disabled={!editable}
            onChange={(e) =>
              set(key, number ? Number(e.target.value) : e.target.value)
            }
          />
        )}
      </>
    </Field>
  );
  const select = (
    key: string,
    label: string,
    options: { value: string; label: string }[],
    disabled = !editable,
  ) => (
    <Field label={tr(label)}>
      <Select
        value={val(key)}
        options={options}
        disabled={disabled}
        onChange={(e) => set(key, e.target.value)}
      />
    </Field>
  );
  const save = () => {
    if (kind === 'position')
      run({
        action: 'position',
        record: draft as unknown as Position,
        expectedVersion: record?.version,
      });
    if (kind === 'requisition') {
      const p = r.positions.find((p) => p.id === val('positionId'));
      run({
        action: 'requisition',
        record: {
          ...draft,
          positionVersion: p?.version ?? 0,
          position: p,
        } as unknown as Requisition,
        expectedVersion: record?.version,
      });
    }
    if (kind === 'interview')
      run({
        action: 'interview',
        record: draft as unknown as Interview,
        expectedVersion: record?.version,
      });
    if (kind === 'offer' && application)
      run({
        action: 'offer',
        applicationId: application.id,
        expectedVersion: application.version,
        reviewerId: val('reviewerId'),
        terms: val('terms'),
      });
  };
  const title = tr(
    kind === 'position'
      ? 'Position and job description'
      : kind === 'requisition'
        ? 'Headcount requisition'
        : kind === 'interview'
          ? 'Interview and assessment'
          : 'Offer approval',
  );
  const canAssess =
    kind === 'interview' &&
    i?.status === 'scheduled' &&
    i.interviewerId === state.meId &&
    canContributeToApp(state, 'recruitment');
  return (
    <Modal
      open
      onOpenChange={(open) => !open && close()}
      title={title}
      primaryAction={
        editable || (kind === 'offer' && !record && admin)
          ? {
              content: tr(kind === 'offer' ? 'Request offer approval' : 'Save'),
              onAction: save,
              disabled: stale,
            }
          : undefined
      }
      secondaryActions={[{ content: tr('Close'), onAction: close }]}
      size="xl"
    >
      <div className="space-y-5">
        {stale && <Banner tone="warning">{tr('This record changed. Close and reopen it before continuing.')}</Banner>}
        {error && (
          <Banner tone="critical" title={tr('Cannot continue')}>
            {error}
          </Banner>
        )}
        {(kind === 'requisition' && dirty || scheduleDirty) && (
          <Banner title={tr('Save changes before running the next workflow action.')} />
        )}
        {kind === 'position' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {text('code', 'Job code')}
              <Field label={tr('Job description status')}><Select value={val('status') || 'active'} disabled={!editable} options={[{ value: 'active', label: tr('Active') }, { value: 'archived', label: tr('Archived') }]} onChange={(e) => set('status', e.target.value)} /></Field>
              {text('title', 'Job title')}
              {text('department', 'Department')}
              {text('branch', 'Branch')}
              {select(
                'employmentType',
                'Employment type',
                ['Full time', 'Part time', 'Contract', 'Internship'].map(
                  (v) => ({ value: v, label: tr(v) }),
                ),
              )}
            </div>
            <Field label={tr('Job description')} required>
              <RichTextEditor
                documentKey={val('id')}
                legacyText={val('description')}
                document={draft.document as Position['document']}
                disabled={!editable}
                onChange={(document, text) => {
                  set('description', text);
                  set('document', document);
                }}
              />
            </Field>
            {text('requirements', 'Required skills and outcomes', true)}
            <JobDescriptionFields value={draft.details as Position['details']} disabled={!editable} onChange={(details) => set('details', details)} />
            {text('revisionNote', 'Revision note', true)}
            <p className="text-sm text-muted-foreground">{tr('Archiving removes this JD from new requisitions. Existing approved jobs keep their snapshot.')}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setPreview(!preview)}>{tr(preview ? 'Hide JD preview' : 'Preview job description')}</Button>
              {record && <Button variant="secondary" disabled={dirty || stale} asChild><Link onClick={(event) => { if (dirty || stale) event.preventDefault(); }} to={`/recruitment?tab=positions&create=1&copy=${record.id}`}>{tr('Duplicate job description')}</Link></Button>}
            </div>
            {preview && <section className="rounded-md border border-border p-4" aria-label={tr('Job description preview')}>
              <h3 className="font-semibold">{val('title')}</h3>
              <p className="mt-1 text-sm">{val('department')} · {val('branch')} · {tr(val('employmentType'))}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm">{val('description')}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm">{val('requirements')}</p>
              <JobDescriptionSummary details={draft.details as Position['details']} publicView />
            </section>}
            {record && (
              <p className="text-sm text-muted-foreground">
                {val('status') !== 'archived' && <Button variant="secondary" disabled={dirty || stale} asChild><Link onClick={(event) => { if (dirty || stale) event.preventDefault(); }} to={`/recruitment?tab=requisitions&create=1&position=${record.id}`}>{tr('Create requisition')}</Link></Button>}
                {tr('Revision')} {record.version} ·{' '}
                {tr(
                  'Approved requisitions retain their original job description.',
                )}
              </p>
            )}
          </>
        )}
        {kind === 'requisition' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {select(
                'positionId',
                'Position',
                r.positions.filter((p) => p.status !== 'archived' || p.id === val('positionId')).map((p) => ({
                  value: p.id,
                  label: `${p.title} · v${p.version}`,
                })),
              )}
              {text('openings', 'Number of openings', false, true)}
              {text('budget', 'Monthly budget per person', false, true)}
              {select(
                'currency',
                'Currency',
                ['USD', 'KHR'].map((v) => ({ value: v, label: v })),
              )}
              {select(
                'managerId',
                'Hiring manager',
                state.people
                  .filter((p) => isAppAdmin(state, 'recruitment', p.id))
                  .map((p) => ({ value: p.id, label: p.name })),
              )}
              {select(
                'reviewerId',
                'Independent reviewer',
                record && !editable
                  ? state.people.map((p) => ({ value: p.id, label: p.name }))
                  : reviewers,
              )}
              <Field label={tr('Closing date')}>
                <DatePicker
                  value={val('closingDate')}
                  disabled={!editable}
                  onChange={(v) => set('closingDate', v.target.value)}
                />
              </Field>
            </div>
            {text('reason', 'Hiring justification', true)}
            {record && (
              <Card>
                <h3 className="font-semibold">
                  {tr('Job description snapshot')}
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {q?.position.description}
                </p>
                <p className="mt-2 text-sm">{q?.position.requirements}</p>
                <JobDescriptionSummary details={q?.position.details} />
                <p className="mt-2 text-sm">
                  {tr('Revision')} {q?.positionVersion}
                </p>
                {q?.requestId && appRole(state, 'approvals') && (
                  <Link
                    className="text-link text-sm"
                    to={`/requests/${q.requestId}`}
                  >
                    {tr('Open headcount approval')}
                  </Link>
                )}
                {q?.vacancyId && (
                  <Link
                    className="block text-link text-sm"
                    to={`/recruitment?tab=vacancies&record=${q.vacancyId}`}
                  >
                    {tr('Open approved vacancy')}
                  </Link>
                )}
              </Card>
            )}
            {record && (
              <>
                <Field label={tr('Decision reason')}>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  {q?.status === 'draft' && admin && (
                    <Button disabled={dirty}
                      onClick={() =>
                        run({
                          action: 'requisitionDecision',
                          id: record.id,
                          expectedVersion: record.version,
                          operation: 'submit',
                          reason,
                        })
                      }
                    >
                      {tr('Submit headcount approval')}
                    </Button>
                  )}
                  {q &&
                    ['declined', 'changes', 'withdrawn'].includes(q.status) &&
                    admin && (
                      <Button
                        onClick={() =>
                          run({
                            action: 'requisitionDecision',
                            id: record.id,
                            expectedVersion: record.version,
                            operation: 'revise',
                            reason,
                          })
                        }
                      >
                        {tr('Revise requisition')}
                      </Button>
                    )}
                  {q?.status === 'pending' && q.createdById === state.meId && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        run({
                          action: 'requisitionDecision',
                          id: record.id,
                          expectedVersion: record.version,
                          operation: 'withdraw',
                          reason,
                        })
                      }
                    >
                      {tr('Withdraw')}
                    </Button>
                  )}
                  {q?.status === 'pending' &&
                    q.reviewerId === state.meId &&
                    ['approve', 'decline'].map((op) => (
                      <Button
                        key={op}
                        variant={op === 'decline' ? 'critical' : 'primary'}
                        onClick={() =>
                          run({
                            action: 'requisitionDecision',
                            id: record.id,
                            expectedVersion: record.version,
                            operation: op as 'approve' | 'decline',
                            reason,
                          })
                        }
                      >
                        {tr(
                          op === 'approve'
                            ? 'Approve headcount'
                            : 'Decline headcount',
                        )}
                      </Button>
                    ))}
                </div>
              </>
            )}
            {!reviewers.length && editable && (
              <Banner
                tone="warning"
                title={tr('An independent reviewer is needed')}
              >
                {tr(
                  'Grant another person Recruitment admin and Approvals member access in People & roles.',
                )}
              </Banner>
            )}
          </>
        )}
        {kind === 'interview' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {select(
                'applicationId',
                'Candidate',
                hr.applications
                  .filter((a) =>
                    admin
                      ? ['shortlisted', 'interviewed'].includes(a.status) ||
                        a.id === i?.applicationId
                      : a.id === i?.applicationId,
                  )
                  .map((a) => ({ value: a.id, label: a.name })),
              )}
              {select('interviewerId', 'Interviewer', optionsPeople)}
              <Field label={tr('Interview date')}>
                <DatePicker
                  value={val('startsAt').slice(0, 10)}
                  disabled={!editable}
                  onChange={(v) =>
                    set(
                      'startsAt',
                      `${v.target.value}T${val('startsAt').slice(11) || '09:00'}`,
                    )
                  }
                />
              </Field>
              <Field label={tr('Interview time')}>
                <TimePicker
                  label={tr('Interview time')}
                  value={val('startsAt').slice(11, 16)}
                  disabled={!editable}
                  onChange={(v) =>
                    set(
                      'startsAt',
                      `${val('startsAt').slice(0, 10)}T${v.target.value}`,
                    )
                  }
                />
              </Field>
              {text('duration', 'Duration in minutes', false, true)}
              {text('location', 'Location')}
            </div>
            {text('criteria', 'Assessment criteria', true)}
            {record && (
              <div className="space-y-4 border-t border-border pt-4">
                <Field label={tr('Assessment score')}>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={val('score')}
                    disabled={!canAssess}
                    onChange={(e) => set('score', Number(e.target.value))}
                  />
                </Field>
                <Field label={tr('Assessment evidence')}>
                  <Textarea
                    value={val('evidence')}
                    disabled={!canAssess}
                    onChange={(e) => set('evidence', e.target.value)}
                  />
                </Field>
                {select(
                  'recommendation',
                  'Recommendation',
                  ['advance', 'hold', 'reject'].map((v) => ({
                    value: v,
                    label: tr(
                      v === 'advance'
                        ? 'Advance'
                        : v === 'hold'
                          ? 'Hold'
                          : 'Reject',
                    ),
                  })),
                  !canAssess,
                )}
                {canAssess && (
                  <Button disabled={scheduleDirty}
                    onClick={() =>
                      run({
                        action: 'assessment',
                        id: record.id,
                        expectedVersion: record.version,
                        score: Number(draft.score),
                        evidence: val('evidence'),
                        recommendation: val(
                          'recommendation',
                        ) as Interview['recommendation'],
                      })
                    }
                  >
                    {tr('Submit assessment')}
                  </Button>
                )}
                {admin && i?.status === 'scheduled' && (
                  <>
                    <Field label={tr('Cancellation reason')}>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </Field>
                    <Button
                      variant="critical"
                      disabled={scheduleDirty}
                      onClick={() =>
                        run({
                          action: 'cancelInterview',
                          id: record.id,
                          expectedVersion: record.version,
                          reason,
                        })
                      }
                    >
                      {tr('Cancel interview')}
                    </Button>
                  </>
                )}
              </div>
            )}
          </>
        )}
        {kind === 'offer' && (
          <>
            {application && (
              <Card>
                <h3 className="font-semibold">{application.name}</h3>
                <p className="mt-2 text-sm">
                  {application.salary} {application.currency} ·{' '}
                  {application.startDate} · {tr('Revision')}{' '}
                  {application.offerRevision}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tr(
                    'Any saved candidate change invalidates this approval revision.',
                  )}
                </p>
              </Card>
            )}
            {record ? (
              <>
                <Badge>
                  {tr(
                    o?.status === 'approved'
                      ? 'Approved'
                      : o?.status === 'declined'
                        ? 'Declined'
                        : o?.status === 'superseded'
                          ? 'Superseded'
                          : 'Pending',
                  )}
                </Badge>
                <p className="text-sm">
                  {o?.salary} {o?.currency} · {o?.startDate} · {tr('Revision')}{' '}
                  {o?.offerRevision}
                </p>
                <p className="whitespace-pre-wrap text-sm">{o?.terms}</p>
                <p className="text-sm">{o?.reason}</p>
                {o?.status === 'pending' && o.reviewerId === state.meId && (
                  <>
                    <Field label={tr('Decision reason')}>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </Field>
                    <div className="flex gap-2">
                      {['approve', 'decline'].map((op) => (
                        <Button
                          key={op}
                          variant={op === 'decline' ? 'critical' : 'primary'}
                          onClick={() =>
                            run({
                              action: 'offerDecision',
                              id: record.id,
                              expectedVersion: record.version,
                              operation: op as 'approve' | 'decline',
                              reason,
                            })
                          }
                        >
                          {tr(
                            op === 'approve'
                              ? 'Approve offer'
                              : 'Decline offer',
                          )}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <Field label={tr('Offer terms')}>
                  <Textarea
                    value={val('terms')}
                    onChange={(e) => set('terms', e.target.value)}
                  />
                </Field>
                {select('reviewerId', 'Independent reviewer', reviewers, false)}
                {!reviewers.length && (
                  <Banner
                    tone="warning"
                    title={tr('An independent reviewer is needed')}
                  >
                    {tr(
                      'Grant another person Recruitment admin and Approvals member access in People & roles.',
                    )}
                  </Banner>
                )}
              </>
            )}
          </>
        )}
        {record && (
          <details className="border-t border-border pt-3">
            <summary className="cursor-pointer text-sm font-semibold">
              {tr('History')}
            </summary>
            <ol className="mt-3 space-y-2">
              {r.history
                .filter((e) => e.kind === kind && e.recordId === record.id)
                .reverse()
                .map((e) => (
                  <li key={e.id} className="text-sm">
                    {state.people.find((p) => p.id === e.actorId)?.name} ·{' '}
                    {new Date(e.at).toLocaleString()}
                    <p>{e.reason}</p>
                    {kind === 'position' && <details className="mt-2">
                      <summary className="cursor-pointer text-link">{tr('View revision')} {(e.after as Position).version}</summary>
                      <p className="mt-2 font-medium">{(e.after as Position).title}</p>
                      <p className="mt-2 whitespace-pre-wrap">{(e.after as Position).description}</p>
                      <p className="mt-2 whitespace-pre-wrap">{(e.after as Position).requirements}</p>
                      <JobDescriptionSummary details={(e.after as Position).details} />
                    </details>}
                  </li>
                ))}
            </ol>
          </details>
        )}
      </div>
    </Modal>
  );
}
export function RecruitmentCandidatePanel({
  application,
  dirty = false,
}: {
  application: Application;
  dirty?: boolean;
}) {
  const { state } = useStore(),
    { t: tr } = useLocale();
  const [offer, setOffer] = useState(false);
  const r = recruitmentState(state),
    approved = approvedOffer(state, application);
  const interviews = r.interviews.filter(
      (i) => i.applicationId === application.id,
    ),
    offers = r.offers.filter((o) => o.applicationId === application.id),
    same = hrState(state).applications.filter(
      (a) =>
        a.id !== application.id &&
        a.email.toLowerCase() === application.email.toLowerCase(),
    );
  return (
    <Card>
      <h2 className="font-semibold">{tr('Hiring progress')}</h2>
      <CandidateStagePicker application={application} dirty={dirty} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>
          {approved ? tr('Offer approved') : tr('Offer approval required')}
        </Badge>
        <Button variant="secondary" asChild>
          <Link to={`/recruitment?tab=interviews${interviews[0] ? `&record=${interviews[0].id}` : ''}`}>
            {tr('Interviews')} ({interviews.length})
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to={`/recruitment?tab=offers${offers[0] ? `&record=${offers[0].id}` : ''}`}>
            {tr('Offer reviews')} ({offers.length})
          </Link>
        </Button>
        {['shortlisted', 'interviewed'].includes(application.status) && isAppAdmin(state, 'recruitment') && (
          <Button variant="secondary" disabled={dirty} asChild>
            <Link onClick={(event) => { if (dirty) event.preventDefault(); }} to={`/recruitment?tab=interviews&create=1&application=${application.id}`}>{tr('Schedule interview')}</Link>
          </Button>
        )}
        {application.status === 'interviewed' &&
          isAppAdmin(state, 'recruitment') &&
          !approved && (
            <Button disabled={dirty} onClick={() => setOffer(true)}>
              {tr('Request offer approval')}
            </Button>
          )}
      </div>
      {same.length > 0 && (
        <div className="mt-3 text-sm">
          <p className="font-medium">
            {tr('Other applications for this person')}
          </p>
          {same.map((a) => (
            <Link
              key={a.id}
              className="block text-link"
              to={`/recruitment?tab=applications&record=${a.id}`}
            >
              {
                hrState(state).vacancies.find((v) => v.id === a.vacancyId)
                  ?.title
              }{' '}
              ·{' '}
              {tr(
                a.status === 'hired'
                  ? 'Hired'
                  : a.status === 'rejected'
                    ? 'Rejected'
                    : a.status === 'withdrawn'
                      ? 'Withdrawn'
                      : 'In progress',
              )}
            </Link>
          ))}
        </div>
      )}
      {offer && (
        <RecruitmentEditor
          kind="offer"
          application={application}
          close={() => setOffer(false)}
        />
      )}
    </Card>
  );
}
