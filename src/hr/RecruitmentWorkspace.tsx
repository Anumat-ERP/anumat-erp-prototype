import { HRWorkflowGuide } from './WorkspaceGuide';
import { CandidateStagesManager } from './RecruitmentStagesManager';
import { candidateStage, candidateStageConfig, isPipelineStage } from './candidateStages';
import { JobDescriptionSummary } from './JobDescription';
import { CandidateProfileFields } from './CandidateProfile';
import type { CandidateProfile } from './types';
import { TaskDrawer } from '../components/TaskDrawer';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  Users,
} from 'lucide-react';
import {
  Badge,
  Banner,
  Button,
  Card,
  Checkbox,
  DataTable,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchField,
  Select,
  Textarea,
} from '@app/ui';
import { uid, useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { appRole, isAppAdmin } from '../lib/appAccess';
import { HRWorkspace } from './HRWorkspace';
import { canLoadExamples, hrProblem, hrState, visibleRecords } from './engine';
import { recruitmentState } from './recruitment';
import {
  RecruitmentEditor,
  type RecruitmentEditorKind,
} from './RecruitmentTools';
import type {
  Position,
  Requisition,
  Interview,
  OfferReview,
} from './recruitmentTypes';
import { STATUS_NAMES } from './catalog';
import type { Application, Vacancy } from './types';
import '../styles/recruitment.css';
const tabs = [
  ['pipeline', 'Pipeline'],
  ['vacancies', 'Job openings'],
  ['applications', 'Candidates'],
  ['positions', 'Roles & job descriptions'],
  ['requisitions', 'Hiring requests'],
  ['interviews', 'Interviews'],
  ['offers', 'Offers & approvals'],
  ['onboarding', 'Onboarding'],
  ['careers', 'Preview careers page'],
] as const;
const sectionHelp: Record<string, string> = {
  vacancies: 'Publish approved roles and track your job openings.',
  applications: 'Review candidate profiles and move each application forward.',
  pipeline: 'See where candidates are in your hiring process. Open a candidate to review their next step.',
  positions: 'Define the role and requirements before requesting headcount.',
  requisitions: 'Request headcount approval before publishing a job opening.',
  interviews: 'Schedule interviews and record candidate assessments.',
  offers: 'Review proposed terms and track independent offer decisions.',
  onboarding: 'Prepare new hires and follow their onboarding tasks.',
  careers: 'Preview published roles and the candidate application experience.',
};
export function RecruitmentSectionIntro({ value }: { value: string }) {
  const { t: tr } = useLocale();
  return <div className="an-rec-section-intro">
    {['pipeline', 'applications'].includes(value) && <div className="an-rec-stage-manager"><CandidateStagesManager /></div>}
    <h2>{tr(tabs.find(([id]) => id === value)?.[1] ?? 'Job openings')}</h2>
    <p>{tr(sectionHelp[value] ?? sectionHelp.vacancies!)}</p>
  </div>;
}
export function RecruitmentNavigation({ value }: { value: string }) {
  const { t: tr } = useLocale();
  const navigate = useNavigate();
  const groups = [
    { label: 'Hiring', ids: ['vacancies', 'applications', 'pipeline', 'interviews', 'offers', 'onboarding'] },
    { label: 'Planning & publishing', ids: ['positions', 'requisitions', 'careers'] },
  ];
  return (
    <nav className="an-rec-nav" aria-label={tr('Recruitment sections')}>
      <div className="an-rec-nav-mobile">
        <Field label={tr('Recruitment sections')}>
          <Select value={value} onChange={(event) => navigate(event.target.value === 'dashboard' ? '/home?app=recruitment' : `/recruitment?tab=${event.target.value}`)}
            options={[{ value: 'dashboard', label: tr('Dashboard') }, ...tabs.map(([id, label]) => ({ value: id, label: tr(label) }))]} />
        </Field>
      </div>
      <div className="an-rec-nav-desktop">
        {groups.map((group) => <div className="an-rec-nav-group" key={group.label}>
          <span className="an-rec-nav-label">{tr(group.label)}</span>
          <div>{group.ids.map((id) => <Link key={id} to={`/recruitment?tab=${id}`}
            aria-current={value === id ? 'page' : undefined}>
            {tr(tabs.find(([key]) => key === id)![1])}
          </Link>)}</div>
        </div>)}
      </div>
    </nav>
  );
}
export function RecruitmentDashboard() {
  const { state, dispatch } = useStore(),
    { t: tr } = useLocale();
  const hr = hrState(state),
    r = recruitmentState(state),
    admin = isAppAdmin(state, 'recruitment');
  const apps = visibleRecords(state, 'applications');
  const upcoming = r.interviews
    .filter(
      (i) =>
        i.status === 'scheduled' && (admin || i.interviewerId === state.meId),
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const queue = admin
    ? [
        ...r.requisitions
          .filter((q) => q.status === 'pending' && q.reviewerId === state.meId)
          .map((q) => ({
            id: q.id,
            title: q.position.title,
            label: tr('Headcount requisition'),
            href: `/recruitment?tab=requisitions&record=${q.id}`,
          })),
        ...r.offers
          .filter((o) => o.status === 'pending' && o.reviewerId === state.meId)
          .map((o) => ({
            id: o.id,
            title:
              hr.applications.find((a) => a.id === o.applicationId)?.name ?? '',
            label: tr('Offer approval'),
            href: `/recruitment?tab=offers&record=${o.id}`,
          })),
      ]
    : [];
  return (
    <>
      <PageHeader
        title={tr('Recruitment management')}
        subtitle={tr(
          'Plan the role, meet candidates, approve the offer and prepare their first day.',
        )}
        primaryAction={{
          content: tr('Open workspace'),
          href: '/recruitment',
          icon: <ArrowRight />,
        }}
        secondaryActions={[
          { content: tr('People & roles'), href: '/recruitment/people' },
        ]}
        titleMetadata={<Badge>{tr('Prototype')}</Badge>}
      />
      <RecruitmentNavigation value="dashboard" />
      {admin && (
        <Card>
          <h2 className="text-base font-semibold">
            {tr('Recruitment funnel')}
          </h2>
          <div className="an-rec-funnel">
            {candidateStageConfig(state).stages.filter(isPipelineStage).map(stage => (
              <Link key={stage.id} to={`/recruitment?tab=pipeline&stage=${stage.id}`}>
                <span>{tr(stage.name)}</span>
                <strong>{apps.filter(a => candidateStage(state, a)?.id === stage.id).length}</strong>
              </Link>
            ))}
          </div>
        </Card>
      )}
      <div className="an-rec-dashboard-grid">
        <Card>
          <h2 className="flex items-center gap-2 font-semibold">
            <ClipboardCheck size={18} />
            {tr('Your approval queue')}
          </h2>
          {queue.length ? (
            queue.map((q) => (
              <Link key={q.id} className="an-rec-row" to={q.href}>
                <span>
                  {q.title}
                  <small>{q.label}</small>
                </span>
                <ArrowRight size={16} />
              </Link>
            ))
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {tr('No hiring approvals assigned to you.')}
            </p>
          )}
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 font-semibold">
            <CalendarDays size={18} />
            {tr('Scheduled interviews')}
          </h2>
          {upcoming.length ? (
            upcoming.slice(0, 5).map((i) => (
              <Link
                key={i.id}
                className="an-rec-row"
                to={`/recruitment?tab=interviews&record=${i.id}`}
              >
                <span>
                  {hr.applications.find((a) => a.id === i.applicationId)?.name}
                  <small>
                    {new Date(i.startsAt).toLocaleString()} · {i.location}
                  </small>
                </span>
                <ArrowRight size={16} />
              </Link>
            ))
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {tr('No scheduled interviews.')}
            </p>
          )}
        </Card>
      </div>
      {admin && (
        <Card>
          <h2 className="font-semibold">{tr('Build your hiring plan')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr(
              'Create a position and job description, request headcount approval, then publish the approved vacancy.',
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/recruitment?tab=positions">
                {tr('Roles & job descriptions')}
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/recruitment?tab=requisitions">
                {tr('Hiring requests')}
              </Link>
            </Button>
          </div>
        </Card>
      )}
      {canLoadExamples(state) && (
        <Banner title={tr('Start with your team')}>
          {tr(
            'Create records or load fictional examples to explore the prototype.',
          )}
          <Button
            className="mt-3"
            onClick={() =>
              dispatch({ type: 'hr', command: { kind: 'loadExamples' } })
            }
          >
            {tr('Load HR examples')}
          </Button>
        </Banner>
      )}
      <p className="text-sm text-muted-foreground">
        {tr(
          'Local prototype: job publishing, candidate applications and offer responses are simulated in this workspace.',
        )}
      </p>
    </>
  );
}
export function RecruitmentWorkspace() {
  const { state, dispatch } = useStore(),
    { t: tr } = useLocale();
  const [params, setParams] = useSearchParams();
  const tab = tabs.some(([id]) => id === params.get('tab'))
    ? params.get('tab')!
    : 'vacancies';
  const query = params.get('q') ?? '';
  const vacancy = params.get('vacancy') ?? 'all';
  const positionStatus = params.get('status') ?? 'all';
  const filter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value); else next.delete(key);
    next.delete('record'); next.delete('create');
    setParams(next, { replace: true });
  };
  const setQuery = (value: string) => filter('q', value);
  const setVacancy = (value: string) => filter('vacancy', value);
  const setPositionStatus = (value: string) => filter('status', value);
  const hr = hrState(state),
    r = recruitmentState(state),
    admin = isAppAdmin(state, 'recruitment');
  const nav = <RecruitmentNavigation value={tab} />;
  if (['vacancies', 'applications'].includes(tab))
    return <HRWorkspace key={tab} app="recruitment" navigation={nav} sectionIntro={<RecruitmentSectionIntro value={tab} />} />;
  const title = tr(tabs.find(([id]) => id === tab)![1]);
  const kind =
    tab === 'positions'
      ? 'position'
      : tab === 'requisitions'
        ? 'requisition'
        : tab === 'interviews'
          ? 'interview'
          : undefined;
  const canCreate = admin && !!kind;
  const candidates = visibleRecords(state, 'applications').filter(
    (a) =>
      (vacancy === 'all' || a.vacancyId === vacancy) &&
      `${a.name} ${a.email}`.toLowerCase().includes(query.toLowerCase()),
  );
  const rows =
    tab === 'positions'
      ? admin
        ? r.positions
        : []
      : tab === 'requisitions'
        ? admin
          ? r.requisitions
          : []
        : tab === 'interviews'
          ? r.interviews.filter((i) => admin || i.interviewerId === state.meId)
          : tab === 'offers'
            ? admin
              ? r.offers
              : []
            : [];
  const selected = rows.find((row) => row.id === params.get('record'));
  const editing: { kind: RecruitmentEditorKind; record?: Position | Requisition | Interview | OfferReview } | undefined = selected
    ? { kind: tab === 'offers' ? 'offer' as const : kind!, record: selected }
    : params.get('create') === '1' && canCreate ? { kind: kind!, record: undefined } : undefined;
  const openEditor = (id?: string) => {
    const next = new URLSearchParams(params); next.set('tab', tab); next.delete('record'); next.delete('create');
    next.set(id ? 'record' : 'create', id ?? '1');
    setParams(next);
  };
  const closeEditor = () => { const next = new URLSearchParams(params); next.delete('record'); next.delete('create'); setParams(next); };
  const name = (row: (typeof rows)[number]) =>
    'title' in row && !!row.title
      ? row.title
      : 'position' in row
        ? row.position.title
        : (hr.applications.find(
            (a) => a.id === ('applicationId' in row ? row.applicationId : ''),
          )?.name ?? tr('Unknown person'));
  const filtered = rows.filter((row) =>
    `${name(row)} ${'code' in row ? row.code ?? '' : ''} ${'department' in row ? row.department : ''}`.toLowerCase().includes(query.toLowerCase()) &&
    (tab !== 'positions' || positionStatus === 'all' || ('status' in row ? row.status ?? 'active' : 'active') === positionStatus),
  );
  return (
    <>
      <PageHeader
        title={tr('Recruitment management')}
        subtitle={tr(
          'Plan the role, meet candidates, approve the offer and prepare their first day.',
        )}
        primaryAction={
          canCreate
            ? {
                content: tr(
                  kind === 'position'
                    ? 'Create position'
                    : kind === 'requisition'
                      ? 'Create requisition'
                      : 'Schedule interview',
                ),
                onAction: () => openEditor(),
              }
            : undefined
        }
        secondaryActions={[
          { content: tr('People & roles'), href: '/recruitment/people' },
        ]}
      />
      {nav}
      <RecruitmentSectionIntro value={tab} />
      <HRWorkflowGuide app="recruitment" />
      {canLoadExamples(state) && (
        <Banner title={tr('Start with your team')}>
          <Button
            onClick={() =>
              dispatch({ type: 'hr', command: { kind: 'loadExamples' } })
            }
          >
            {tr('Load HR examples')}
          </Button>
        </Banner>
      )}
      {tab === 'pipeline' && (
        <>
          <div className="an-rec-filters">
            <SearchField
              label={tr('Search candidates')}
              labelHidden={false}
              value={query}
              onChange={setQuery}
              debounceMs={0}
            />
            <Field label={tr('Job opening')}>
              <Select
                value={vacancy}
                onChange={(e) => setVacancy(e.target.value)}
                options={[
                  { value: 'all', label: tr('All job openings') },
                  ...visibleRecords(state, 'vacancies').map((v) => ({
                    value: v.id,
                    label: v.title,
                  })),
                ]}
              />
            </Field>
            {admin && <Button asChild>
              <Link to="/recruitment?tab=applications&create=1">
                {tr('Add candidate')}
              </Link>
            </Button>}
          </div>
          {!admin ? (
            <EmptyState
              heading={tr('Recruiter access required')}
              children={tr(
                'Interviewers can see their assigned interviews. Ask an app admin for recruiter access.',
              )}
            />
          ) : (
            <>
              <div className="an-rec-results" aria-live="polite">
                <span>{tr('{count} candidates', { count: candidates.filter(a => !params.get('stage') || candidateStage(state, a)?.id === params.get('stage')).length })}</span>
                {(query || vacancy !== 'all' || params.get('stage')) && <Button variant="tertiary" onClick={() => {
                  setParams({ tab: 'pipeline' });
                }}>{tr('Clear filters')}</Button>}
              </div>
              <div
                className={`an-rec-board${params.get('stage') ? ' an-rec-board-filtered' : ''}`}
                aria-label={tr('Candidate pipeline')}
              >
                {candidateStageConfig(state).stages.filter(isPipelineStage)
                  .filter(
                    (stage) =>
                      !params.get('stage') || params.get('stage') === stage.id,
                  )
                  .map((stage) => (
                    <section key={stage.id}>
                      <h2>
                        {tr(stage.name)}
                        <Badge>
                          {candidates.filter((a) => candidateStage(state, a)?.id === stage.id).length}
                        </Badge>
                      </h2>
                      {candidates
                        .filter((a) => candidateStage(state, a)?.id === stage.id)
                        .map((a) => (
                          <Link
                            className="an-rec-candidate"
                            key={a.id}
                            to={`/recruitment?tab=applications&record=${a.id}`}
                          >
                            <strong>{a.name}</strong>
                            <span>
                              {
                                hr.vacancies.find((v) => v.id === a.vacancyId)
                                  ?.title
                              }
                            </span>
                            <small>{a.source || tr('Not recorded')}</small>
                          </Link>
                        ))}
                      {!candidates.some((a) => candidateStage(state, a)?.id === stage.id) && (
                        <p className="text-xs text-muted-foreground">
                          {tr('No candidates at this stage.')}
                        </p>
                      )}
                    </section>
                  ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {['rejected', 'withdrawn', 'declined'].map((stage) => (
                  <Badge key={stage}>
                    {tr(candidateStageConfig(state).stages.find(item => item.id === stage)?.name ?? STATUS_NAMES[stage] ?? stage)}:{' '}
                    {candidates.filter((a) => a.status === stage).length}
                  </Badge>
                ))}
                {params.get('stage') && (
                  <Button variant="secondary" asChild>
                    <Link to="/recruitment?tab=pipeline">
                      {tr('All stages')}
                    </Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </>
      )}
      {['positions', 'requisitions', 'interviews', 'offers'].includes(tab) && (
        <>
          <div className="an-rec-record-filters">
          <SearchField label={tr('Search records')} labelHidden={false} value={query} onChange={setQuery} debounceMs={0} />
          {tab === 'positions' && <Field label={tr('Filter job descriptions')}><Select value={positionStatus} onChange={(e) => setPositionStatus(e.target.value)} options={[{ value: 'all', label: tr('All job descriptions') }, { value: 'active', label: tr('Active') }, { value: 'archived', label: tr('Archived') }]} /></Field>}
          </div>
          <div className="an-rec-results" aria-live="polite">
            <span>{tr('{count} records', { count: filtered.length })}</span>
            {(query || (tab === 'positions' && positionStatus !== 'all')) && <Button variant="tertiary" onClick={() => { setParams({ tab }); }}>{tr('Clear filters')}</Button>}
          </div>
          {filtered.length ? (
            <DataTable
              caption={title}
              rows={filtered.map((row) => ({
                id: row.id,
                name: name(row),
                revision: row.version,
                status:
                  'status' in row && row.status
                    ? tr(
                        row.status === 'active' ? 'Active' : row.status === 'archived' ? 'Archived' : STATUS_NAMES[row.status] ??
                          (row.status === 'superseded'
                            ? 'Superseded'
                            : row.status),
                      )
                    : tr(tab === 'positions' ? 'Active' : 'Ready'),
                detail:
                  tab === 'interviews' && 'startsAt' in row
                    ? new Date(row.startsAt).toLocaleString()
                    : 'budget' in row
                      ? `${row.openings} × ${row.budget} ${row.currency}`
                      : 'salary' in row
                        ? `${row.salary} ${row.currency} · ${row.startDate}`
                        : 'department' in row
                          ? `${row.department}${'code' in row && row.code ? ` · ${row.code}` : ''}`
                          : '',
                original: row,
              }))}
              columns={[
                {
                  id: 'name',
                  header: tr('Name'),
                  cell: (row) => (
                    <Button
                      variant="tertiary"
                      onClick={() =>
                        openEditor(row.id)
                      }
                    >
                      {row.name}
                    </Button>
                  ),
                },
                { id: 'status', header: tr('Status') },
                { id: 'detail', header: tr('Details') },
                { id: 'revision', header: tr('Revision') },
              ]}
            />
          ) : (
            <EmptyState
              image={null}
              action={query || (tab === 'positions' && positionStatus !== 'all')
                ? <Button variant="secondary" onClick={() => { setParams({ tab }); }}>{tr('Clear filters')}</Button>
                : undefined}
              heading={tr(query || positionStatus !== 'all' && tab === 'positions' ? 'No matching records' : 'No records yet')}
              children={tr(
                query ? 'Try another search or clear the search field.' : tab === 'positions'
                  ? 'Start with the role, responsibilities and measurable requirements.'
                  : tab === 'requisitions'
                    ? 'Create a position first, then request an independent headcount decision.'
                    : tab === 'interviews'
                      ? 'Shortlist a candidate, then schedule an interview with an assigned assessor.'
                      : 'Save the candidate interview and terms, then request an independent offer decision.',
              )}
            />
          )}
        </>
      )}
      {tab === 'onboarding' &&
        (admin ? (
          <Onboarding />
        ) : (
          <EmptyState heading={tr('Recruiter access required')} />
        ))}
      {tab === 'careers' &&
        (admin ? (
          <CareerPreview />
        ) : (
          <EmptyState heading={tr('Recruiter access required')} />
        ))}
      {params.get('record') && !selected && ['positions', 'requisitions', 'interviews', 'offers'].includes(tab) && (
        <Banner title={tr('Record unavailable')}>
          <p>{tr('This record is unavailable or you do not have access.')}</p>
          <Button variant="secondary" onClick={closeEditor}>{tr('Close')}</Button>
        </Banner>
      )}
      {editing && (
        <RecruitmentEditor
          key={`${editing.kind}:${editing.record ? `record:${editing.record.id}` : `new:${params.get('copy') ?? ''}`}`}
          kind={editing.kind}
          record={editing.record}
          positionId={params.get('position') ?? undefined}
          template={admin ? r.positions.find((p) => p.id === params.get('copy')) : undefined}
          application={hr.applications.find((a) => a.id === params.get('application'))}
          close={closeEditor}
        />
      )}
    </>
  );
}
function Onboarding() {
  const [taskId, setTaskId] = useState<string>();
  const { state } = useStore(),
    { t: tr } = useLocale();
  const hr = hrState(state);
  const apps = visibleRecords(state, 'applications').filter(
    (a) => a.status === 'hired',
  );
  return (
    <>
      <h2 className="font-semibold">{tr('New hires and onboarding')}</h2>
      {apps.length ? (
        apps.map((a) => {
          const e = hr.employees.find((e) => e.id === a.employeeId),
            tasks = state.tasks.filter((t) =>
              t.id.startsWith(`onboard-${a.employeeId}-`),
            );
          return (
            <Card key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{a.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {e?.position} · {a.startDate} ·{' '}
                    {tr(STATUS_NAMES[e?.status ?? ''] ?? 'Pre-start')}
                  </p>
                </div>
                {appRole(state, 'employees') && (
                  <Button variant="secondary" asChild>
                    <Link to={`/employees?record=${a.employeeId}`}>
                      {tr('Open hired employee')}
                    </Link>
                  </Button>
                )}
              </div>
              {appRole(state, 'tasks') ? (
                <ul className="mt-4 space-y-3">
                  {tasks.map((t) => (
                    <li className="an-rec-row" key={t.id}>
                      <Link
                        className="text-link text-sm"
                        to="/tasks"
                        onClick={(event) => {
                          event.preventDefault();
                          setTaskId(t.id);
                        }}
                      >
                        {t.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {state.people.find((p) => p.id === t.ownerId)?.name} ·{' '}
                        {
                          state.taskStatuses.find((s) => s.id === t.status)
                            ?.name
                        }{' '}
                        · {t.due.slice(0, 10)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm">
                  {tr('Task app access is required to view onboarding work.')}
                </p>
              )}
            </Card>
          );
        })
      ) : (
        <EmptyState
          heading={tr('No hires yet')}
          children={tr(
            'An accepted offer becomes an employee and onboarding plan only after authorized hiring.',
          )}
        />
      )}
      {taskId && appRole(state, 'tasks') && (
        <TaskDrawer
          task={state.tasks.find((t) => t.id === taskId) ?? null}
          creating={false}
          onClose={() => setTaskId(undefined)}
        />
      )}
    </>
  );
}
function CareerPreview() {
  const { state, dispatch } = useStore(),
    { t: tr } = useLocale();
  const hr = hrState(state);
  const [selected, setSelected] = useState<Vacancy>(),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [resume, setResume] = useState(''),
    [profile, setProfile] = useState<CandidateProfile>(),
    [consent, setConsent] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(false);
  const jobs = hr.vacancies.filter(
    (v) =>
      v.status === 'open' &&
      (!v.closingDate ||
        v.closingDate >= new Date().toISOString().slice(0, 10)),
  );
  const apply = () => {
    if (!consent) {
      setError(tr('Confirm consent before submitting the application.'));
      return;
    }
    const a: Application = {
      id: uid('application'),
      version: 0,
      status: 'applied',
      createdAt: '',
      updatedAt: '',
      vacancyId: selected!.id,
      name,
      email,
      source: 'Career page preview',
      consent: 'Candidate consent confirmed in the local career page preview.',
      resume,
      profile,
      hiringChecks: '',
      interviewDate: '',
      evidence: '',
      salary: 0,
      currency: 'USD',
      startDate: '',
      offerRevision: 0,
    };
    const command = {
      kind: 'save' as const,
      collection: 'applications' as const,
      record: a,
    };
    const problem = hrProblem(state, command);
    if (problem) {
      setError(tr(problem));
      return;
    }
    dispatch({ type: 'hr', command });
    setSelected(undefined);
    setSuccess(true);
  };
  return (
    <>
      <Banner title={tr('Career page preview')}>
        {tr(
          'A local applicant simulation. No public vacancy is published and no email is sent.',
        )}
      </Banner>
      {success && (
        <Banner tone="success" title={tr('Application received')}>
          {tr('The application is now in the candidate pipeline.')}
        </Banner>
      )}
      <div className="space-y-4">
        {jobs.length ? (
          jobs.map((v) => (
            <Card key={v.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{v.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {v.branch} · {v.department} ·{' '}
                    {tr(v.employmentType ?? 'Full time')}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setSelected(v);
                    setName('');
                    setEmail('');
                    setResume('');
                    setProfile(undefined);
                    setConsent(false);
                    setError('');
                  }}
                >
                  {tr('Apply for this role')}
                </Button>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm">
                {v.description}
              </p>
              {v.requirements && (
                <p className="mt-3 whitespace-pre-wrap text-sm">
                  {v.requirements}
                </p>
              )}
              <JobDescriptionSummary details={v.jobDetails} publicView />
              <p className="mt-3 text-xs text-muted-foreground">
                {v.openings} {tr('openings')}
                {v.closingDate && ` · ${tr('Closing date')}: ${v.closingDate}`}
              </p>
            </Card>
          ))
        ) : (
          <EmptyState
            heading={tr('No published vacancies')}
            children={tr(
              'Approve headcount and publish a job opening to preview the application flow.',
            )}
          />
        )}
      </div>
      <Modal
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(undefined)}
        title={tr('Apply for this role')}
        primaryAction={{
          content: tr('Submit application preview'),
          onAction: apply,
        }}
        secondaryActions={[
          { content: tr('Cancel'), onAction: () => setSelected(undefined) },
        ]}
      >
        <div className="space-y-4">
          <p className="font-semibold">{selected?.title}</p>
          {error && (
            <Banner tone="critical" title={tr('Cannot continue')}>
              {error}
            </Banner>
          )}
          <Field label={tr('Candidate name')}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={tr('Candidate email')}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label={tr('Resume and portfolio notes')}>
            <Textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
          </Field>
          <details className="border-t border-border pt-4">
            <summary className="cursor-pointer font-medium">{tr('Add optional candidate background')}</summary>
            <div className="mt-4"><CandidateProfileFields value={profile} onChange={setProfile} applicant /></div>
          </details>
          <Checkbox
            label={tr(
              'I agree to use these details for this recruitment assessment.',
            )}
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
          />
        </div>
      </Modal>
    </>
  );
}
