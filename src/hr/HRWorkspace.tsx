import { AdvancedWorkflows } from './AdvancedWorkflows';
import { groupedFields, HRWorkflowGuide, needsAttention } from './WorkspaceGuide';
import { formatDate } from '../lib/format';
import { HR_COLLECTION_HELP, hrRecordDetails, hrActionLabel } from './presentation';
import { candidateStage, candidateStageConfig, candidateStageName } from './candidateStages';
import { JobDescriptionSummary } from './JobDescription';
import { CandidateProfileFields } from './CandidateProfile';
import { DocumentViewer } from '../components/DocumentViewer';
import { saveAttachmentFile } from '../lib/attachment-files';
import type { Attachment } from '../data/types';
import type { ReactNode } from 'react';
import { RecruitmentCandidatePanel } from './RecruitmentTools';
import { downloadCSV } from './export';
import { EmployeeChangeForm, EmployeeImport } from './HRTools';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowRight, Download, History, Plus, ShieldCheck } from 'lucide-react';
import {
  Badge,
  Banner,
  Button,
  Card,
  DataTable,
  DatePicker,
  DropZone,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchField,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  TimePicker,
  useToast,
} from '@app/ui';
import { useStore, uid } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import {
  APP_NAMES,
  appRole,
  canContributeToApp,
  isAppAdmin,
} from '../lib/appAccess';
import {
  COLLECTION_NAMES,
  FIELDS,
  HR_MODULES,
  REPORT_DEFINITIONS,
  NEW_NAMES,
  STATUS_NAMES,
  type FieldSpec,
} from './catalog';
import {
  canPerformHRTransition,
  canLoadExamples,
  canReadCompensation,
  canWriteCompensation,
  canSeeEmployee,
  hrProblem,
  hrState,
  leaveBalance,
  OP_NAMES,
  reportAllowed,
  reportRows,
  STATUSES,
  TRANSITIONS,
  visibleRecords,
  workDays,
} from './engine';
import {
  COLLECTION_APP,
  type Application,
  type HRApp,
  type HRCollection,
  type HRCollections,
  type HRCommand,
  type HRRecord,
  type Payroll,
  type SavedReport,
} from './types';
import '../styles/hr-workspace.css';

type Editable = HRRecord & Record<string, string | number | boolean | unknown>;
const asEditable = (record: HRRecord) => record as unknown as Editable;
function titleOf(record: HRRecord) {
  const r = asEditable(record);
  return String(r.name || r.title || r.code || r.id);
}
function defaults(collection: HRCollection): Editable {
  const date = new Date().toISOString().slice(0, 10);
  const r: Editable = {
    id: uid(collection),
    version: 0,
    status: STATUSES[collection],
    createdAt: '',
    updatedAt: '',
  };
  for (const f of FIELDS[collection])
    r[f.key] =
      f.type === 'number'
        ? 0
        : f.type === 'date'
          ? date
          : f.type === 'time'
            ? '09:00'
            : (f.options?.[0] ?? '');
  if (collection === 'employees') {
    r.leaveAllowance = 18;
    r.endDate = '';
  }
  if (collection === 'vacancies') r.openings = 1;
  if (collection === 'attendance') r.checkOut = '17:00';
  if (collection === 'applications') r.offerRevision = 0;
  if (collection === 'courses') {
    r.passScore = 70;
    r.validMonths = 12;
  }
  if (collection === 'enrollments') {
    r.attended = false;
    r.attempts = [];
  }
  if (collection === 'reservations') r.endTime = '10:00';
  return r;
}
const LOCKED = new Set([
  'exited',
  'hired',
  'rejected',
  'offered',
  'accepted',
  'approved',
  'declined',
  'withdrawn',
  'cancelled',
  'closed',
  'prepared',
  'reviewed',
  'frozen',
  'published',
  'acknowledged',
  'completed',
  'failed',
  'saved',
  'assigned',
  'maintenance',
  'reserved',
]);
export { HRDashboard } from './HRDashboard';

export function HRWorkspace({ app, navigation, sectionIntro }: { app: HRApp; navigation?: ReactNode; sectionIntro?: ReactNode }) {
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const collections = HR_MODULES[app].collections as HRCollection[];
  const collection =
    collections.find((key) => key === params.get('tab')) ?? collections[0]!;
  const query = params.get('q') ?? '';
  const status = params.get('status') ?? 'all';
  const creating = params.get('create') === '1';
  const attentionOnly = params.get('view') === 'attention';
  const sort = params.get('sort') === 'name' ? 'name' : 'updated';
  const [importing, setImporting] = useState(false);
  const changeParams = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value); else next.delete(key);
    next.delete('record'); next.delete('create');
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  const setQuery = (value: string) => changeParams('q', value);
  const setStatus = (value: string) => changeParams('status', value);
  const clearFilters = () => {
    const next = new URLSearchParams(params); next.delete('q'); next.delete('status'); next.delete('view'); next.delete('page');
    setParams(next, { replace: true });
  };
  const setCreating = (value: boolean) => {
    const next = new URLSearchParams(params); next.delete('record');
    if (value) next.set('create', '1'); else next.delete('create');
    setParams(next);
  };
  const records = visibleRecords(state, collection);
  const record = records.find((r) => r.id === params.get('record'));
  const admin = isAppAdmin(state, app),
    contribute = canContributeToApp(state, app);
  const canCreate =
    contribute &&
    (admin ||
      ['leaves', 'attendance', 'enrollments', 'reservations'].includes(
        collection,
      ));
  const setRecord = (id?: string) => {
    const next = new URLSearchParams(params);
    next.delete('create');
    if (id) next.set('record', id);
    else next.delete('record');
    setParams(next);
  };
  const attentionCount = records.filter(r => needsAttention(state, collection, r)).length;
  const rows = records.filter((r) => {
    const employee = hrState(state).employees.find(
      (e) => e.id === asEditable(r).employeeId,
    );
    return (
      (!attentionOnly || needsAttention(state, collection, r)) &&
      (status === 'all' || (collection === 'applications' ? candidateStage(state, r as Application)?.id === status : r.status === status)) &&
      `${titleOf(r)} ${employee?.name ?? ''} ${hrRecordDetails(state, collection, r, tr)}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    );
  });
  const label = (r: HRRecord) => {
    const value = asEditable(r),
      employee = hrState(state).employees.find(
        (e) => e.id === value.employeeId,
      );
    return collection !== 'applications' && employee
      ? [
          employee.name,
          String(
            value.title ||
              value.date ||
              value.startDate ||
              hrState(state).courses.find((c) => c.id === value.courseId)
                ?.title ||
              '',
          ),
        ]
          .filter(Boolean)
          .join(' · ')
      : titleOf(r);
  };
  const sorted = [...rows].sort((a, b) => sort === 'name' ? label(a).localeCompare(label(b)) : b.updatedAt.localeCompare(a.updatedAt) || label(a).localeCompare(label(b)));
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const requestedPage = Number(params.get('page') ?? 1);
  const page = Math.min(pageCount, Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);
  const filtered = !!query || status !== 'all' || attentionOnly;
  return (
    <>
      <PageHeader
        title={tr(APP_NAMES[app])}
        subtitle={app === 'recruitment' ? undefined : tr(HR_COLLECTION_HELP[collection])}
        primaryAction={
          canCreate
            ? {
                content: tr(app === 'recruitment' && collection === 'vacancies' ? 'Create requisition' : NEW_NAMES[collection]),
                icon: <Plus />,
                ...(app === 'recruitment' && collection === 'vacancies' ? {href:'/recruitment?tab=requisitions&create=1'} : {onAction: () => setCreating(true)}),
              }
            : undefined
        }
        maxVisibleSecondaryActions={0}
        moreActionsLabel={tr("More actions")}
        secondaryActions={[
          ...(app === 'employees' && admin
            ? [
                {
                  content: tr('Import employees'),
                  onAction: () => setImporting(true),
                },
              ]
            : []),
          {
            content: tr('People & roles'),
            icon: <ShieldCheck />,
            onAction: () => navigate(`/${app}/people`),
          },
        ]}
        titleMetadata={<Badge>{tr('Prototype')}</Badge>}
      />
      {app === 'payroll' && (
        <Banner tone="warning" title={tr('Illustrative payroll only')}>
          {tr(
            'Preview = full base pay + flat adjustment. No proration, tax, NSSF, overtime pay, or legal deductions are calculated. USD and KHR are separate.',
          )}
        </Banner>
      )}
      <div className={navigation ? undefined : "an-hr-section-navigation"}>
      {navigation ?? (collections.length > 1 && <Tabs
        value={collection}
        onValueChange={(value) => {
          setParams({ tab: value });
        }}
      >
        <TabsList className="overflow-x-auto">
          {collections.map((key) => (
            <TabsTrigger key={key} value={key}>
              {tr(COLLECTION_NAMES[key])}{' '}
              <span className="ms-2 text-xs text-muted-foreground">
                {visibleRecords(state, key).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>)}
      </div>
      {sectionIntro}
      <section className="an-hr-records" aria-label={tr('Record list')}>
      <div className="an-hr-list-views" role="group" aria-label={tr('Record views')}>
        <Button variant="tertiary" aria-pressed={!attentionOnly} onClick={() => changeParams('view', '')}>{tr('All records')} <span>{records.length}</span></Button>
        <Button variant="tertiary" aria-pressed={attentionOnly} onClick={() => changeParams('view', 'attention')}>{tr('Needs attention')} <span>{attentionCount}</span></Button>
      </div>
      <div className="an-hr-filters">
        <SearchField
          label={tr(app === 'recruitment' ? collection === 'applications' ? 'Search candidates' : 'Search job openings' : 'Search records')}
          labelHidden={false}
          value={query}
          onChange={setQuery}
          // Local filtering is immediate so a delayed search cannot restore cleared URL filters.
          debounceMs={0}
        />
        <Field label={tr('Status')}>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'all', label: tr('All statuses') },
              ...(collection === 'applications' ? candidateStageConfig(state).stages.map(stage => ({ value: stage.id, label: tr(stage.name) })) : Array.from(new Set([STATUSES[collection], ...Object.keys(TRANSITIONS[collection]), ...Object.values(TRANSITIONS[collection]).flatMap(transitions => Object.values(transitions))])).map(
                (value) => ({ value, label: tr(STATUS_NAMES[value] ?? value) }),
              )),
            ]}
          />
        </Field>
        <Field label={tr('Sort records')}>
          <Select value={sort} onChange={event => changeParams('sort', event.target.value)} options={[
            { value: 'updated', label: tr('Recently updated') }, { value: 'name', label: tr('Name A–Z') },
          ]} />
        </Field>
      </div>
      <div className="an-hr-results">
        <span aria-live="polite">{tr('{count} records', { count: rows.length })}</span>
        {filtered && rows.length > 0 && <Button size="sm" variant="tertiary" onClick={clearFilters}>{tr('Clear filters')}</Button>}
      </div>
      {rows.length ? (
        <DataTable
          caption={tr(COLLECTION_NAMES[collection])}
          captionHidden
          rows={pageRows}
          bordered={false}
          columns={[
            {
              id: 'name',
              header: tr('Record'),
              width: '28%',
              cell: (r) => (
                <div>
                <Button
                  variant="tertiary"
                  className="h-auto min-h-9 max-w-full justify-start whitespace-normal px-0 text-start font-medium text-foreground"
                  onClick={() => setRecord(r.id)}
                >
                  {label(r)}
                </Button>
                <small className="block text-muted-foreground sm:hidden">{hrRecordDetails(state, collection, r, tr)}</small>
                </div>
              ),
            },
            {
              id: 'status',
              header: tr('Status'),
              width: '8rem',
              cell: (r) => (
                <Badge
                  className="whitespace-normal"
                  tone={
                    [
                      'approved',
                      'active',
                      'hired',
                      'completed',
                      'frozen',
                    ].includes(r.status)
                      ? 'success'
                      : ['pending', 'probation', 'manager-review'].includes(
                            r.status,
                          )
                        ? 'warning'
                        : 'neutral'
                  }
                >
                  {tr(collection === 'applications' ? candidateStageName(state, r as Application) : STATUS_NAMES[r.status] ?? r.status)}
                </Badge>
              ),
            },
            { id: 'details', header: tr('Details'), hideBelow: 'sm', cell: (r) => hrRecordDetails(state, collection, r, tr) },
            {
              id: 'updatedAt',
              header: tr('Updated'),
              width: '8rem',
              hideBelow: 'md',
              cell: (r) => formatDate(r.updatedAt),
            },
          ]}
        />
      ) : (
        <EmptyState
          image={null}
          heading={tr(
            filtered ? 'No matching records' : 'No records yet',
          )}
          action={
            filtered ? <Button variant="secondary" onClick={clearFilters}>{tr('Clear filters')}</Button> : app === 'recruitment' && collection === 'vacancies' && canCreate ? <Button asChild><Link to="/recruitment?tab=requisitions&create=1">{tr('Create requisition')}</Link></Button> : canCreate ? (
              <Button onClick={() => setCreating(true)}>
                {tr(NEW_NAMES[collection])}
              </Button>
            ) : undefined
          }
        >
          {tr(
            filtered
              ? 'Try another search or status.'
              : app === 'recruitment' && collection === 'vacancies' ? 'Request headcount approval before publishing a job opening.' : canCreate ? 'Add your first record to explore this workflow.' : 'Records shared with you will appear here.',
          )}
        </EmptyState>
      )}
      {pageCount > 1 && <nav className="an-hr-pagination" aria-label={tr('Record pages')}>
        <span>{tr('Page {page} of {pages}', { page, pages: pageCount })}</span>
        <div><Button size="sm" variant="secondary" disabled={page === 1} onClick={() => changeParams('page', String(page - 1))}>{tr('Previous page')}</Button>
        <Button size="sm" variant="secondary" disabled={page === pageCount} onClick={() => changeParams('page', String(page + 1))}>{tr('Next page')}</Button></div>
      </nav>}
      </section>
      <HRWorkflowGuide app={app} />
      {canLoadExamples(state) && (
        <Banner
          title={tr('Explore with fictional data')}
          action={{
            label: tr('Load HR examples'),
            onAction: () =>
              dispatch({ type: 'hr', command: { kind: 'loadExamples' } }),
          }}
        >
          {tr(
            'Loads example employees, a vacancy, a candidate, a course, and assets. A second demo persona receives review access. Existing HR records are preserved.',
          )}
        </Banner>
      )}
      {params.get('record') && !record && (
        <Banner tone="warning" title={tr('Record unavailable')}>
          {tr('This record is missing or outside your access scope.')}
        </Banner>
      )}
      {importing && <EmployeeImport close={() => setImporting(false)} />}
      {((creating && canCreate) || record) && (
        <RecordEditor
          key={`${collection}-${record?.id ?? 'new'}-${collection === 'applications' ? (record as Application | undefined)?.stageId ?? '' : ''}`}
          collection={collection}
          record={record}
          close={(created) => {
            setCreating(false);
            const next = new URLSearchParams(params);
            next.delete('record'); next.delete('create');
            if (created) { next.delete('q'); next.delete('status'); next.delete('view'); next.delete('page'); next.delete('sort'); }
            setParams(next);
          }}
        />
      )}
    </>
  );
}

function RecordEditor({
  collection,
  record: initialRecord,
  close,
}: {
  collection: HRCollection;
  record?: HRRecord;
  close: (created?: boolean) => void;
}) {
  // Keep the revision that the user opened until they explicitly reopen the record.
  const [record] = useState(initialRecord);
  const { toast } = useToast();
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const hr = hrState(state),
    app = COLLECTION_APP[collection];
  const [initialDraft] = useState<Editable>(() => {
    if (record) return structuredClone(asEditable(record));
    const initial = defaults(collection);
    if ('employeeId' in initial && !isAppAdmin(state, app)) {
      initial.employeeId = hr.employees.find(employee => employee.accountId === state.meId && employee.status !== 'exited')?.id ?? '';
    }
    return initial;
  });
  const [draft, setDraft] = useState<Editable>(() => structuredClone(initialDraft));
  const [discarding, setDiscarding] = useState(false);
  const [changing, setChanging] = useState(false);
  const [viewingFile,setViewingFile]=useState<Attachment>();
  const [uploading,setUploading]=useState(false);
  const [reason, setReason] = useState(''),
    [problem, setProblem] = useState(''),
    [operation, setOperation] = useState<string | null>(null);
  const admin = isAppAdmin(state, app),
    contribute = canContributeToApp(state, app);
  const editable =
    contribute &&
    !LOCKED.has(record?.status ?? '') &&
    !(collection === 'enrollments' && record && !admin) &&
    !(collection === 'vacancies' && record && 'requisitionId' in record && record.requisitionId) &&
    (admin ||
      [
        'leaves',
        'attendance',
        'reviews',
        'enrollments',
        'reservations',
      ].includes(collection));
  const latest = (hr[collection] as HRRecord[]).find(
    (r) => r.id === record?.id,
  );
  const stale = !!record && latest?.version !== record.version;
  const dirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);
  const requestClose = () => { if (dirty && editable) setDiscarding(true); else close(); };
  const update = (key: string, value: unknown) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setProblem('');
  };
  const execute = (command: HRCommand, finish = true) => {
    const error = hrProblem(state, command);
    if (error) {
      setProblem(tr(error));
      return;
    }
    dispatch({ type: 'hr', command });
    setOperation(null);
    toast({ tone: 'success', interactive: false, title: tr(command.kind === 'save' ? record ? 'Changes saved' : 'Record created' : 'Action completed') });
    if (finish) close(command.kind === 'save' && !record);
  };
  const save = () =>
    execute({
      kind: 'save',
      collection,
      record: draft as unknown as HRCollections[typeof collection],
      expectedVersion: record?.version,
      reason,
    } as HRCommand);
  const choices = (f: FieldSpec) => {
    if (f.options)
      return f.options.map((value) => ({
        value,
        label: ['USD', 'KHR'].includes(value) ? value : tr(value),
      }));
    const visibleEmployees = hr.employees.filter(
      (e) => e.status !== 'exited' && canSeeEmployee(state, app, e),
    );
    const options =
      f.source === 'account'
        ? state.people.map((p) => ({ value: p.id, label: p.name }))
        : f.source === 'employee' || f.source === 'manager'
          ? visibleEmployees
              .filter((e) => f.source !== 'manager' || e.id !== draft.id)
              .map((e) => ({ value: e.id, label: `${e.name} · ${e.code}` }))
          : f.source === 'vacancy'
            ? hr.vacancies
                .filter((v) => v.status === 'open' || v.id === draft.vacancyId)
                .map((v) => ({ value: v.id, label: v.title }))
            : f.source === 'course'
              ? hr.courses
                  .filter((c) => c.status === 'open' || c.id === draft.courseId)
                  .map((c) => ({ value: c.id, label: c.title }))
              : hr.assets
                  .filter((a) => a.kind === 'room' && a.status === 'available')
                  .map((a) => ({ value: a.id, label: a.name }));
    return [
      { value: '', label: tr(f.required ? 'Select a record' : 'None') },
      ...options,
    ];
  };
  const fields = FIELDS[collection].filter(
    (f) =>
      !f.private ||
      (collection === 'employees' ? canReadCompensation(state) : admin) ||
      (collection === 'reviews' &&
        ['published', 'acknowledged'].includes(record?.status ?? '')),
  );
  const transitions = record
    ? Object.keys(TRANSITIONS[collection][record.status] ?? {}).filter(operation => canPerformHRTransition(state, collection, record, operation))
    : [];
  const missingReferences = record ? [] : fields.filter(field => field.required && field.source && choices(field).length === 1);
  const history = hr.history
    .filter((e) => e.collection === collection && e.recordId === record?.id)
    .slice()
    .reverse();
  const employeeId =
    collection === 'employees' ? record?.id : String(draft.employeeId ?? '');
  const payroll = record as Payroll | undefined,
    report = record as SavedReport | undefined;
  const reportData =
    collection === 'reports' && report && reportAllowed(state, report.source)
      ? (report.snapshot ?? reportRows(state, report))
      : [];
  return (
    <Modal
      open
      onOpenChange={(open) => !open && requestClose()}
      title={record ? titleOf(record) : tr(NEW_NAMES[collection])}
      size="xl"
      className="an-hr-record-editor"
      description={tr(record ? 'Review the saved details and available workflow actions.' : 'Complete the required fields to create this record.')}
      primaryAction={
        editable
          ? {
              content: tr(record ? 'Save changes' : 'Create record'),
              onAction: save,
              disabled: stale || uploading || missingReferences.length > 0,
            }
          : undefined
      }
      secondaryActions={[{ content: tr('Close'), onAction: requestClose }]}
    >
      <div className="space-y-5">
        {collection === 'vacancies' && record && 'requisitionId' in record && !!record.requisitionId && (
          <Banner title={tr('Approved job description snapshot')}>
            {tr('Approved requisitions retain their original job description.')}
          </Banner>
        )}
        {dirty && record && <Banner title={tr('Save changes before running the next workflow action.')} />}
        {record && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge>{tr(collection === 'applications' ? candidateStageName(state, record as Application) : STATUS_NAMES[record.status] ?? record.status)}</Badge>
            <span className="text-xs text-muted-foreground">
              {tr('Revision {version}', { version: record.version })}
            </span>
          </div>
        )}
        {stale && (
          <Banner tone="warning">
            {tr(
              'This record changed. Close and reopen it before trying again.',
            )}
          </Banner>
        )}
        {problem && <Banner tone="critical">{problem}</Banner>}
        {missingReferences.length > 0 && <Banner tone="warning" title={tr('Add the required records first')}>
          {tr('No available options for: {fields}. Ask an app administrator to add or share these records.', { fields: missingReferences.map(field => tr(field.label)).join(', ') })}
        </Banner>}
        {contribute && transitions.length > 0 && (
          <section className="an-hr-next-action">
            <h2 className="text-sm font-semibold">{tr('Next action')}</h2>
            <div className="flex flex-wrap gap-2">
              {transitions.map((op) => (
                <Button
                  variant="secondary"
                  key={op}
                  disabled={stale || dirty}
                  onClick={() => {
                    setProblem('');
                    setOperation(op);
                    setReason('');
                  }}
                >
                  {tr(hrActionLabel(collection, op))}
                </Button>
              ))}
            </div>
          </section>
        )}
        <div className="an-hr-field-groups">
          {groupedFields(collection, fields).map(group => <section className="an-hr-field-group" key={group.title} aria-label={tr(group.title)}>
          <h2>{tr(group.title)}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
          {group.fields.map((f) => {
            const disabled =
              !editable ||
              (f.private &&
                (collection === 'employees'
                  ? !canWriteCompensation(state)
                  : !admin));
            const value = String(draft[f.key] ?? '');
            return (
              <div
                className={f.type === 'textarea' ? 'sm:col-span-2' : ''}
                key={f.key}
              >
                {f.type === 'date' ? (
                  <DatePicker
                    label={tr(f.label)}
                    value={value}
                    disabled={disabled}
                    required={f.required}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                ) : f.type === 'time' ? (
                  <TimePicker
                    label={tr(f.label)}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                ) : (
                  <Field label={tr(f.label)} required={f.required}>
                    {f.type === 'select' ? (
                      <Select
                        value={value}
                        disabled={disabled}
                        options={choices(f)}
                        onChange={(e) => update(f.key, e.target.value)}
                      />
                    ) : f.type === 'textarea' ? (
                      <Textarea
                        rows={3}
                        value={value}
                        disabled={disabled}
                        onChange={(e) => update(f.key, e.target.value)}
                      />
                    ) : (
                      <Input
                        list={f.key === "branch" || f.key === "department" ? `company-${f.key}` : undefined}
                        type={
                          f.type === 'number'
                            ? 'number'
                            : f.key === 'email'
                              ? 'email'
                              : 'text'
                        }
                        value={value}
                        disabled={disabled}
                        onChange={(e) =>
                          update(
                            f.key,
                            f.type === 'number'
                              ? Number(e.target.value)
                              : e.target.value,
                          )
                        }
                      />
                    )}
                  </Field>
                )}
              </div>
            );
          })}
          </div>
          </section>)}
        </div>
        <datalist id="company-branch">{state.org.configuration?.branches.map(name => <option key={name} value={name} />)}</datalist>
        <datalist id="company-department">{state.org.configuration?.departments.map(name => <option key={name} value={name} />)}</datalist>
        {collection === 'vacancies' && <JobDescriptionSummary details={draft.jobDetails as HRCollections['vacancies']['jobDetails']} />}
        {collection === 'applications' && (
          <CandidateProfileFields value={draft.profile as HRCollections['applications']['profile']} disabled={!editable} onChange={(profile) => update('profile', profile)} />
        )}
        {editable && record && (
          <Field label={tr('Change reason')}>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </Field>
        )}
        {collection === 'leaves' && employeeId && (
          <Banner title={tr('Leave balance')}>
            {tr('Company working days and holidays apply.')}{' '}
            {tr('{days} working days requested · {balance} days remaining', {
              days: workDays(String(draft.startDate), String(draft.endDate), (draft as Partial<HRCollections['leaves']>).calendar ?? state.org.workCalendar),
              balance: leaveBalance(state, employeeId),
            })}
          </Banner>
        )}
        {collection === 'employees' && record && (
          <Card>
            <h2 className="text-sm font-semibold">
              {tr('Employment episodes')}
            </h2>
            <ul className="mt-2 space-y-2 text-sm">
              {hr.episodes
                .filter((e) => e.employeeId === record.id)
                .map((e) => (
                  <li key={e.id}>
                    {e.startDate} → {e.endDate || tr('Current')} · {e.position}{' '}
                    · {e.department}
                  </li>
                ))}
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              {tr('Leave balance')}: {leaveBalance(state, record.id)}
            </p>
          </Card>
        )}
        {collection === 'employees' &&
          record &&
          hr.leaveLedger.some((entry) => entry.employeeId === record.id) && (
            <DataTable
              caption={tr('Leave ledger')}
              rows={hr.leaveLedger.filter(
                (entry) => entry.employeeId === record.id,
              )}
              columns={[
                {
                  id: 'at',
                  header: tr('Date'),
                  cell: (entry) => new Date(entry.at).toLocaleDateString(),
                },
                {
                  id: 'kind',
                  header: tr('Entry'),
                  cell: (entry) =>
                    tr(entry.kind === 'used' ? 'Leave used' : 'Leave reversed'),
                },
                { id: 'days', header: tr('Days'), numeric: true },
                {
                  id: 'source',
                  header: tr('Source'),
                  cell: (entry) => (
                    <Button asChild variant="tertiary">
                      <Link
                        to={`/employees?tab=leaves&record=${entry.leaveId}`}
                      >
                        {tr('Open leave request')}
                      </Link>
                    </Button>
                  ),
                },
              ]}
            />
          )}
        {record && <AdvancedWorkflows collection={collection} record={record} disabled={stale || dirty} onComplete={() => close()} />}
        {collection === 'employees' && record && admin && (
          <section className="space-y-3">
            <Button
              variant="secondary"
              disabled={record.status === 'exited'}
              onClick={() => setChanging(true)}
            >
              {tr('Schedule employee change')}
            </Button>
            {hr.changes
              ?.filter((c) => c.employeeId === record.id)
              .map((c) => (
                <Card key={c.id}>
                  <p className="text-sm font-medium">
                    {c.effectiveDate} · {c.patch.position} ·{' '}
                    {tr(STATUS_NAMES[c.status] ?? c.status)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.reason}
                  </p>
                  {c.approvalStatus && <p>{tr('Approval')}: {tr(STATUS_NAMES[c.approvalStatus] ?? c.approvalStatus)}</p>}
                  {c.decision && <p>{c.decision.reason}</p>}
                  {c.status === 'pending' && c.approvalStatus === 'pending' && c.reviewerId === state.meId && <div className="space-y-3">
                    <Field label={tr('Review decision reason')}><Textarea value={reason} onChange={e=>setReason(e.target.value)}/></Field>
                    <div className="flex flex-wrap gap-3"><Button variant="primary" onClick={()=>execute({kind:'reviewChange',id:c.id,outcome:'approved',reason})}>{tr('Approve employee change')}</Button><Button variant="critical" onClick={()=>execute({kind:'reviewChange',id:c.id,outcome:'declined',reason})}>{tr('Decline employee change')}</Button></div>
                  </div>}
                  {c.status === 'pending' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          execute({ kind: 'applyChange', id: c.id })
                        }
                      >
                        {tr('Apply effective change')}
                      </Button>
                      <Button
                        variant="tertiary"
                        onClick={() =>
                          execute({ kind: 'cancelChange', id: c.id })
                        }
                      >
                        {tr('Cancel scheduled change')}
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
          </section>
        )}
        {collection === 'enrollments' &&
          record?.status === 'completed' &&
          admin && (
            <Button
              variant="secondary"
              asChild={Boolean(draft.surveyId)}
              onClick={
                !draft.surveyId
                  ? () =>
                      execute({ kind: 'evaluation', enrollmentId: record.id })
                  : undefined
              }
            >
              {draft.surveyId ? (
                <Link to={`/surveys/${String(draft.surveyId)}/edit`}>
                  {tr('Open training evaluation')}
                </Link>
              ) : (
                tr('Create training evaluation')
              )}
            </Button>
          )}
        {collection === 'applications' && <div className="space-y-3">
          {editable && <DropZone label={tr('Candidate documents')} accept=".pdf,.doc,.docx,image/*" maxSize={10_000_000} maxFiles={5} multiple disabled={uploading} hint={tr('Resume, portfolio or assessment files, up to 10 MB each. Stored in this browser.')} onDrop={async(accepted,rejected)=>{
            if(rejected.length)setProblem(tr(rejected[0]!.message));
            if(!accepted.length)return;
            setUploading(true);
            try{const files=await Promise.all(accepted.map(async file=>({name:file.name,size:file.size,fileId:await saveAttachmentFile(file)})));update('attachments',[...((draft.attachments as Attachment[]|undefined)??[]),...files]);}catch{setProblem(tr('Some files could not be saved. Please add them again.'));}finally{setUploading(false);}
          }}/>}<ul className="space-y-2">{((draft.attachments as Attachment[]|undefined)??[]).map(file=><li key={file.fileId??file.name} className="flex flex-wrap items-center justify-between gap-2"><Button variant="tertiary" onClick={()=>setViewingFile(file)}>{file.name}</Button>{editable&&<Button size="sm" variant="critical" onClick={()=>update('attachments',((draft.attachments as Attachment[]|undefined)??[]).filter(f=>f!==file))}>{tr('Remove')}</Button>}</li>)}</ul>
        </div>}
        {collection === 'applications' && record && <RecruitmentCandidatePanel application={record as HRCollections['applications']} dirty={dirty} />}
        {collection === 'applications' && Boolean(draft.employeeId) && (
          <Button asChild variant="secondary">
            <Link to={`/employees?record=${String(draft.employeeId)}`}>
              {tr('Open hired employee')}
            </Link>
          </Button>
        )}
        {collection === 'enrollments' &&
          Array.isArray(draft.attempts) &&
          draft.attempts.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold">
                {tr('Assessment attempts')}
              </h2>
              {(draft.attempts as HRCollections['enrollments']['attempts']).map(
                (a, i) => (
                  <p className="mt-2 text-sm" key={`${a.at}-${i}`}>
                    {a.score}/100 · {a.evidence}
                  </p>
                ),
              )}
              {Boolean(draft.expiresAt) && (
                <p className="mt-2 text-sm">
                  {tr('Certificate expiry')}: {String(draft.expiresAt)}
                </p>
              )}
            </Card>
          )}
        {collection === 'payroll' && payroll?.lines && (
          <>
            <DataTable
              caption={tr('Illustrative pay preview')}
              rows={payroll.lines.map((l) => ({ ...l, id: l.employeeId }))}
              columns={[
                { id: 'name', header: tr('Employee') },
                { id: 'base', header: tr('Base pay'), numeric: true },
                { id: 'adjustment', header: tr('Adjustment'), numeric: true },
                { id: 'total', header: tr('Preview total'), numeric: true },
                { id: 'currency', header: tr('Currency') },
              ]}
            />
            <p className="text-sm text-muted-foreground">
              {tr('Preview total')}:{' '}
              {payroll.lines.reduce((sum, l) => sum + l.total, 0).toFixed(2)}{' '}
              {payroll.currency}
            </p>
            {payroll.status === 'frozen' && (
              <Button
                icon={<Download />}
                variant="secondary"
                onClick={() => downloadCSV(payroll.lines!, `${payroll.id}.csv`)}
              >
                {tr('Export preview CSV')}
              </Button>
            )}
          </>
        )}
        {collection === 'reports' &&
          report &&
          (reportAllowed(state, report.source) ? (
            <>
              <Banner
                title={tr(
                  report.snapshot ? 'Saved snapshot' : 'Live source preview',
                )}
              >
                {tr(REPORT_DEFINITIONS[report.source] ?? '')}
              </Banner>
              <DataTable
                caption={tr('Report results')}
                rows={reportData}
                columns={[
                  { id: 'name', header: tr('Employee') },
                  { id: 'department', header: tr('Department') },
                  { id: 'value', header: tr('Value'), numeric: true },
                  {
                    id: 'unit',
                    header: tr('Unit'),
                    cell: (r) =>
                      ['USD', 'KHR'].includes(r.unit) ? r.unit : tr(r.unit),
                  },
                ]}
              />
              <Button
                icon={<Download />}
                variant="secondary"
                onClick={() => downloadCSV(reportData, `${report.id}.csv`)}
              >
                {tr('Export report CSV')}
              </Button>
            </>
          ) : (
            <Banner tone="warning">
              {tr('You need Admin access to the report’s source app.')}
            </Banner>
          ))}
        {history.length > 0 && (
          <details className="border-t border-border pt-4">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <History size={16} aria-hidden />
              {tr('History')} ({history.length})
            </summary>
            <ol className="mt-3 space-y-3">
              {history.map((event) => (
                <li className="text-sm" key={event.id}>
                  <span className="font-medium">
                    {tr(
                      OP_NAMES[event.action] ??
                        STATUS_NAMES[event.action] ??
                        (event.action === 'created'
                          ? 'Created'
                          : event.action === 'updated'
                            ? 'Updated'
                            : event.action),
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {state.people.find((p) => p.id === event.actorId)?.name ??
                      tr('Unknown person')}{' '}
                    · {new Date(event.at).toLocaleString()}
                  </span>
                  {event.reason && <p className="mt-1">{event.reason}</p>}
                  {admin && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-link">
                        {tr('View revision fields')}
                      </summary>
                      <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        {fields.map((f) => (
                          <div key={f.key}>
                            <dt className="text-muted-foreground">
                              {tr(f.label)}
                            </dt>
                            <dd className="break-words">
                              {String(
                                asEditable(event.before ?? event.after)[
                                  f.key
                                ] ?? '—',
                              )}{' '}
                              → {String(asEditable(event.after)[f.key] ?? '—')}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  )}
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>
      {viewingFile && <DocumentViewer attachment={viewingFile} requestId={draft.id} onClose={()=>setViewingFile(undefined)}/>}
      {changing && record && (
        <EmployeeChangeForm
          employee={record as HRCollections['employees']}
          close={close}
        />
      )}
      <Modal open={discarding} onOpenChange={setDiscarding} title={tr('Discard unsaved changes?')}
        description={tr('Your edits have not been saved. Keep editing to finish this record.')}
        primaryAction={{ content: tr('Discard changes'), destructive: true, onAction: () => close() }}
        secondaryActions={[{ content: tr('Keep editing'), onAction: () => setDiscarding(false) }]} />
      <Modal
        open={!!operation}
        onOpenChange={(open) => !open && setOperation(null)}
        title={tr(hrActionLabel(collection, operation ?? ''))}
        description={tr(
          'This action uses the saved revision and is recorded in history.',
        )}
        primaryAction={{
          content: tr('Confirm action'),
          onAction: () =>
            execute({
              kind: 'transition',
              collection,
              id: record!.id,
              operation: operation!,
              expectedVersion: record!.version,
              reason,
            }),
        }}
        secondaryActions={[
          { content: tr('Cancel'), onAction: () => setOperation(null) },
        ]}
      >
        <div className="space-y-3">
          {problem && <Banner tone="critical">{problem}</Banner>}
          <Field
            label={tr(
              operation === 'rehire'
                ? 'New start date and reason'
                : 'Action reason',
            )}
            helpText={
              operation === 'rehire'
                ? tr('Use YYYY-MM-DD followed by the reason.')
                : undefined
            }
          >
            <Textarea
              value={reason}
              rows={3}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          {collection === 'applications' && operation === 'hire' && (
            <Banner>
              {tr(
                'Creates one employee without login access and three onboarding tasks assigned to you.',
              )}
            </Banner>
          )}
        </div>
      </Modal>
    </Modal>
  );
}
