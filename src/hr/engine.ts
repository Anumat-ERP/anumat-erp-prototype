import {advancedProblem,applyAdvanced} from './advanced';
import { candidateStageConfig } from './candidateStages';
import { candidateProfileProblem } from './candidateProfileValidation';
import { applyRecruitment, recruitmentProblem, recruitmentState, approvedOffer } from './recruitment';
import type { DataState, Task } from '../data/types';
import { DEFAULT_WORK_CALENDAR } from '../lib/companyConfiguration';
import type { WorkCalendar } from '../data/types';
import { appRole, canContributeToApp, isAppAdmin } from '../lib/appAccess';
import {
  COLLECTION_APP,
  emptyHR,
  type HRCollection,
  type HRCollections,
  type HRCommand,
  type HRRecord,
  type HRState,
  type Employee,
  type PayrollLine,
  type SavedReport,
  type ReportRow,
  type Application,
} from './types';

export const hrState = (state: DataState) => state.hr ?? emptyHR();
export const canLoadExamples = (state: DataState) => {
  const hr = hrState(state);
  return (
    !hr.employees.length &&
    !hr.vacancies.length &&
    !hr.assets.length &&
    state.people.find((p) => p.id === state.meId)?.access === 'owner'
  );
};
export const canReadCompensation = (state: DataState) =>
  state.people.find((p) => p.id === state.meId)?.access === 'owner' ||
  (isAppAdmin(state, 'employees') &&
    ['read', 'write'].includes(
      hrState(state).compensationAccess?.[state.meId] ?? '',
    ));
export const canWriteCompensation = (state: DataState) =>
  state.people.find((p) => p.id === state.meId)?.access === 'owner' ||
  (isAppAdmin(state, 'employees') &&
    hrState(state).compensationAccess?.[state.meId] === 'write');
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function workDays(start: string, end: string, calendar: WorkCalendar = DEFAULT_WORK_CALENDAR) {
  if (!validDate(start) || !validDate(end) || start > end) return 0;
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  if (days > 366) return 0;
  let count = 0;
  for (let n = 0; n < days; n++) {
    const day = new Date(Date.parse(start) + n * 86400000).getUTCDay();
    const date = new Date(Date.parse(start) + n * 86400000).toISOString().slice(0, 10);
    if (calendar.workWeek.includes(day) && !calendar.holidays.some(h => h.date === date)) count++;
  }
  return count;
}
export const overlaps = (a: string, b: string, c: string, d: string) =>
  a <= d && c <= b;
export function hours(row: HRCollections['attendance']) {
  const start =
    Number(row.checkIn.slice(0, 2)) * 60 + Number(row.checkIn.slice(3));
  let end =
    Number(row.checkOut.slice(0, 2)) * 60 + Number(row.checkOut.slice(3));
  if (end < start) end += 1440;
  return (end - start) / 60;
}
export function leaveBalance(state: DataState, employeeId: string) {
  const hr = hrState(state);
  return (
    (hr.employees.find((e) => e.id === employeeId)?.leaveAllowance ?? 0) -
    hr.leaveLedger
      .filter((e) => e.employeeId === employeeId)
      .reduce((n, e) => n + e.days, 0)
  );
}
export function canSeeEmployee(
  state: DataState,
  app: keyof HRState['scopes'],
  employee: Employee,
) {
  if (!appRole(state, app)) return false;
  if (isAppAdmin(state, app)) return true;
  const own = hrState(state).employees.find((e) => e.accountId === state.meId);
  const scope = hrState(state).scopes[app]?.[state.meId] ?? 'own';
  return (
    scope === 'all' ||
    employee.accountId === state.meId ||
    (scope === 'department' &&
      !!own &&
      own.department === employee.department &&
      own.branch === employee.branch)
  );
}
export function visibleRecords<K extends HRCollection>(
  state: DataState,
  collection: K,
): HRCollections[K][] {
  const hr = hrState(state),
    app = COLLECTION_APP[collection];
  if (!appRole(state, app)) return [];
  if (isAppAdmin(state, app)) return hr[collection] as HRCollections[K][];
  if (
    [
      'vacancies',
      'applications',
      'payroll',
      'reports',
      'attendancePeriods',
    ].includes(collection)
  )
    return [];
  if (collection === 'courses') return hr[collection] as HRCollections[K][];
  return (hr[collection] as HRRecord[]).filter((row) => {
    const id =
      collection === 'employees'
        ? row.id
        : (row as HRRecord & { employeeId?: string }).employeeId;
    const employee = hr.employees.find((e) => e.id === id);
    return employee && canSeeEmployee(state, app, employee);
  }) as HRCollections[K][];
}
export const STATUSES: Record<HRCollection, string> = {
  employees: 'probation',
  vacancies: 'draft',
  applications: 'applied',
  leaves: 'draft',
  attendance: 'draft',
  attendancePeriods: 'open',
  payroll: 'draft',
  reviews: 'draft',
  courses: 'draft',
  enrollments: 'enrolled',
  assets: 'available',
  reservations: 'reserved',
  reports: 'draft',
};
export const TRANSITIONS: Record<
  HRCollection,
  Record<string, Record<string, string>>
> = {
  employees: {
    prestart: { start: 'probation', offboard: 'exited' },
    probation: { confirm: 'active', offboard: 'exited' },
    active: { offboard: 'exited' },
    exited: { rehire: 'probation' },
  },
  vacancies: {
    draft: { publish: 'open' },
    open: { pause: 'paused', close: 'closed' },
    paused: { resume: 'open', close: 'closed' },
    closed: { reopen: 'open' },
  },
  applications: {
    applied: { shortlist: 'shortlisted', reject: 'rejected', withdraw: 'withdrawn' },
    shortlisted: { interview: 'interviewed', reject: 'rejected', withdraw: 'withdrawn' },
    interviewed: { offer: 'offered', reject: 'rejected', withdraw: 'withdrawn' },
    offered: { accept: 'accepted', decline: 'declined', withdraw: 'withdrawn', revise: 'interviewed' },
    accepted: { hire: 'hired', withdraw: 'withdrawn', revise: 'interviewed' },
  },
  leaves: {
    draft: { submit: 'pending' },
    pending: {
      approve: 'approved',
      decline: 'declined',
      withdraw: 'withdrawn',
    },
    approved: { cancel: 'cancelled' },
  },
  attendance: {
    draft: { submit: 'pending' },
    pending: { approve: 'approved', return: 'draft' },
    approved: { correct: 'draft' },
  },
  attendancePeriods: { open: { close: 'closed' }, closed: { reopen: 'open' } },
  payroll: {
    draft: { prepare: 'prepared' },
    prepared: { review: 'reviewed', return: 'draft' },
    reviewed: { freeze: 'frozen', return: 'draft' },
    frozen: { reopen: 'draft' },
  },
  reviews: {
    draft: { launch: 'self-review' },
    'self-review': { submit: 'manager-review' },
    'manager-review': { publish: 'published', return: 'self-review' },
    published: { acknowledge: 'acknowledged' },
  },
  courses: {
    draft: { publish: 'open' },
    open: { close: 'closed' },
    closed: { reopen: 'open' },
  },
  enrollments: {
    enrolled: { attend: 'attended' },
    attended: { assess: 'completed' },
    failed: { retry: 'attended' },
  },
  assets: {
    available: { assign: 'assigned', maintain: 'maintenance' },
    assigned: { return: 'available' },
    maintenance: { release: 'available' },
  },
  reservations: { reserved: { cancel: 'cancelled' } },
  reports: { draft: { snapshot: 'saved' }, saved: { revise: 'draft' } },
};
export function canPerformHRTransition(state: DataState, collection: HRCollection, record: HRRecord, operation: string): boolean {
  const app = COLLECTION_APP[collection];
  if (!canContributeToApp(state, app)) return false;
  if (isAppAdmin(state, app)) return true;
  const employeeId = (record as HRRecord & { employeeId?: string }).employeeId;
  const own = hrState(state).employees.find(employee => employee.id === employeeId)?.accountId === state.meId;
  return Boolean(own && (
    (collection === 'leaves' && ['submit', 'withdraw'].includes(operation)) ||
    (collection === 'attendance' && operation === 'submit') ||
    (collection === 'reviews' && ['submit', 'acknowledge'].includes(operation)) ||
    (collection === 'reservations' && operation === 'cancel')
  ));
}

export const OP_NAMES: Record<string, string> = {
  candidateStage: 'Changed candidate stage',
  confirm: 'Confirm probation',
  offboard: 'Complete offboarding',
  rehire: 'Rehire employee',
  publish: 'Publish',
  close: 'Close',
  reopen: 'Reopen',
  shortlist: 'Shortlist',
  reject: 'Reject',
  start: 'Start employment',
  pause: 'Pause vacancy',
  resume: 'Resume vacancy',
  interview: 'Record interview',
  offer: 'Issue offer',
  accept: 'Accept offer',
  hire: 'Hire & create onboarding',
  submit: 'Submit for review',
  approve: 'Approve',
  decline: 'Decline',
  withdraw: 'Withdraw',
  cancel: 'Cancel',
  return: 'Return for correction',
  correct: 'Request correction',
  prepare: 'Prepare preview',
  review: 'Independent review',
  freeze: 'Freeze period',
  launch: 'Start review',
  acknowledge: 'Acknowledge',
  attend: 'Record attendance',
  assess: 'Assess learning',
  retry: 'Retry assessment',
  assign: 'Assign asset',
  maintain: 'Send to maintenance',
  release: 'Return to service',
  snapshot: 'Save report snapshot',
  revise: 'Create new revision',
  evaluation: 'Create evaluation',
};
const time = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const email = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const round = (n: number) => Math.round(n * 100) / 100;
const activeEmployee = (hr: HRState, id: string) =>
  hr.employees.find((e) => e.id === id && e.status !== 'exited');
const bounds = (start: string, end: string) =>
  validDate(start) &&
  validDate(end) &&
  start <= end &&
  Date.parse(end) - Date.parse(start) <= 366 * 86400000;
function periodLocked(hr: HRState, start: string, end = start) {
  return (
    hr.attendancePeriods.some(
      (p) =>
        p.status === 'closed' && overlaps(start, end, p.startDate, p.endDate),
    ) ||
    hr.payroll.some(
      (p) =>
        p.status === 'frozen' && overlaps(start, end, p.startDate, p.endDate),
    )
  );
}

/** All prototype commands use the same validation in the UI and reducer. No external systems are called. */
export function hrProblem(
  state: DataState,
  command: HRCommand,
): string | undefined {
  const hr = hrState(state);
  if (command.kind === 'advanced') return advancedProblem(state,command.command);
  if (command.kind === 'recruitment') return recruitmentProblem(state, command.command);
  if (command.kind === 'loadExamples')
    return state.people.find((p) => p.id === state.meId)?.access === 'owner'
      ? undefined
      : 'Only the workspace owner can load examples.';
  if (command.kind === 'compensationAccess')
    return state.people.find((p) => p.id === state.meId)?.access === 'owner' &&
      isAppAdmin(state, 'employees', command.personId) &&
      ['none', 'read', 'write'].includes(command.access)
      ? undefined
      : 'Only the workspace owner can grant compensation access to Employee admins.';
  if (command.kind === 'scope')
    return isAppAdmin(state, command.app) &&
      !!appRole(state, command.app, command.personId) &&
      ['own', 'department', 'all'].includes(command.scope)
      ? undefined
      : 'Only app admins can configure member scope.';
  if (command.kind === 'import') {
    if (!isAppAdmin(state, 'employees'))
      return 'Only app admins can edit these records.';
    if (!command.records.length || command.records.length > 500)
      return 'Import between 1 and 500 employees.';
    let preview = state;
    for (const record of command.records) {
      if (hrState(preview).employees.some((e) => e.id === record.id))
        return 'Imports create new employees only.';
      const save: HRCommand = { kind: 'save', collection: 'employees', record };
      const problem = hrProblem(preview, save);
      if (problem) return problem;
      preview = applyHR(preview, save);
    }
    return;
  }
  if (command.kind === 'reviewChange') {
    const c = hr.changes?.find(c => c.id === command.id);
    if (!c || c.status !== 'pending' || c.approvalStatus !== 'pending' || c.reviewerId !== state.meId || c.createdById === state.meId || !isAppAdmin(state, 'employees')) return 'Only the assigned independent HR reviewer can decide this change.';
    if (!command.reason.trim()) return 'Record the review decision reason.';
    return;
  }
  if (command.kind === 'schedule') {
    const c = command.change,
      e = hr.employees.find((e) => e.id === c.employeeId);
    if (!e || !isAppAdmin(state, 'employees'))
      return 'Only app admins can edit these records.';
    if (c.reviewerId && (!isAppAdmin(state, 'employees', c.reviewerId) || c.reviewerId === state.meId || c.reviewerId === e.accountId)) return 'Choose an independent Employee admin to review this change.';
    if (e.version !== c.expectedVersion)
      return 'This record changed. Close and reopen it before trying again.';
    if (
      !validDate(c.effectiveDate) ||
      c.effectiveDate < new Date().toISOString().slice(0, 10) ||
      !c.reason.trim()
    )
      return 'Choose an effective date on or after today and add a reason.';
    if (
      hr.changes?.some((x) => x.employeeId === e.id && x.status === 'pending')
    )
      return 'Resolve the pending employee change before scheduling another.';
    return hrProblem(state, {
      kind: 'save',
      collection: 'employees',
      record: { ...e, ...c.patch },
      expectedVersion: e.version,
      reason: c.reason,
    });
  }
  if (command.kind === 'applyChange' || command.kind === 'cancelChange') {
    const c = hr.changes?.find((c) => c.id === command.id),
      e = hr.employees.find((e) => e.id === c?.employeeId);
    if (!c || !e || c.status !== 'pending' || !isAppAdmin(state, 'employees'))
      return 'This change is missing or unavailable.';
    if (command.kind === 'cancelChange') return;
    if (c.approvalStatus && c.approvalStatus !== 'approved') return 'Approve the employee change before applying it.';
    if (c.effectiveDate > new Date().toISOString().slice(0, 10))
      return 'This change is not effective yet.';
    return hrProblem(state, {
      kind: 'save',
      collection: 'employees',
      record: { ...e, ...c.patch },
      expectedVersion: c.expectedVersion,
      reason: c.reason,
    });
  }
  if (command.kind === 'evaluation') {
    const e = hr.enrollments.find((e) => e.id === command.enrollmentId);
    if (!isAppAdmin(state, 'training') || !isAppAdmin(state, 'surveys'))
      return 'Creating an evaluation needs Training and Survey admin access.';
    if (!e || e.status !== 'completed' || e.surveyId)
      return 'Complete training before creating one linked evaluation.';
    return;
  }
  const { collection } = command,
    app = COLLECTION_APP[collection];
  if (!canContributeToApp(state, app))
    return 'You need Member or Admin access to make changes.';
  const id = command.kind === 'save' ? command.record.id : command.id;
  const old = (hr[collection] as HRRecord[]).find((r) => r.id === id);
  if (
    (old && command.expectedVersion !== old.version) ||
    (command.kind === 'transition' && !old)
  )
    return 'This record changed. Close and reopen it before trying again.';
  if (old && !visibleRecords(state, collection).some((r) => r.id === id))
    return 'This record is outside your access scope.';
  const admin = isAppAdmin(state, app);
  if (command.kind === 'save') {
    if (
      !admin &&
      ![
        'leaves',
        'attendance',
        'reviews',
        'enrollments',
        'reservations',
      ].includes(collection)
    )
      return 'Only app admins can edit these records.';
    if (
      old &&
      [
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
      ].includes(old.status)
    )
      return 'Return this record to an editable stage before changing it.';
    const record = command.record;
    if ('employeeId' in record && record.employeeId) {
      const employee = activeEmployee(hr, record.employeeId);
      if (!employee) return 'Choose an active employee.';
      if (!canSeeEmployee(state, app, employee))
        return 'This record is outside your access scope.';
    }
    switch (collection) {
      case 'employees': {
        const e = record as Employee;
        if (
          !canWriteCompensation(state) &&
          (e.salary !== ((old as Employee | undefined)?.salary ?? 0) ||
            e.currency !== ((old as Employee | undefined)?.currency ?? 'USD'))
        )
          return 'Compensation changes require explicit write access.';
        if (
          !e.code.trim() ||
          !e.name.trim() ||
          !e.position.trim() ||
          !e.department.trim() ||
          !e.branch.trim() ||
          !email(e.email) ||
          !validDate(e.startDate) ||
          e.salary < 0 ||
          !Number.isFinite(e.salary) ||
          e.leaveAllowance < 0 ||
          !Number.isFinite(e.leaveAllowance) ||
          !['USD', 'KHR'].includes(e.currency)
        )
          return 'Complete the required employee fields with valid dates and amounts.';
        if (e.accountId && !state.people.some((p) => p.id === e.accountId))
          return 'Choose an existing workspace account.';
        let manager = e.managerId;
        const visited = new Set([e.id]);
        while (manager) {
          if (visited.has(manager))
            return 'Manager relationships cannot form a cycle.';
          visited.add(manager);
          manager = hr.employees.find((x) => x.id === manager)?.managerId ?? '';
        }
        if (
          e.managerId &&
          (e.managerId === e.id || !activeEmployee(hr, e.managerId))
        )
          return 'Choose a different active manager.';
        if (
          hr.employees.some(
            (x) =>
              x.id !== e.id &&
              (x.code.toLowerCase() === e.code.trim().toLowerCase() ||
                x.email.toLowerCase() === e.email.trim().toLowerCase() ||
                (e.accountId && x.accountId === e.accountId)),
          )
        )
          return 'Employee code, email, and linked account must be unique.';
        if (old && e.startDate !== (old as Employee).startDate)
          return 'Use Rehire to create another employment episode.';
        if (old && !command.reason?.trim())
          return 'Add a reason for the employee change.';
        if (
          old &&
          (e.salary !== (old as Employee).salary ||
            e.currency !== (old as Employee).currency) &&
          hr.payroll.some(
            (p) =>
              p.status === 'frozen' &&
              p.lines?.some((l) => l.employeeId === e.id) &&
              p.endDate >= new Date().toISOString().slice(0, 10),
          )
        )
          return 'Reopen the affected payroll period before changing employee pay.';
        break;
      }
      case 'vacancies': {
        const r = record as HRCollections['vacancies'];
        const q = recruitmentState(state).requisitions.find(q => q.id === r.requisitionId);
        if ((old as HRCollections['vacancies'] | undefined)?.requisitionId !== r.requisitionId && old) return 'The approved requisition link cannot be changed.';
        if (q && (r.title !== q.position.title || r.department !== q.position.department || r.branch !== q.position.branch || r.description !== q.position.description || r.openings !== q.openings || r.closingDate !== q.closingDate || r.managerId !== q.managerId || r.requirements !== q.position.requirements || r.employmentType !== q.position.employmentType || JSON.stringify(r.jobDetails) !== JSON.stringify(q.position.details))) return 'Approved headcount and job description are locked. Create a new requisition for changed requirements.';
        if (
          !r.title.trim() ||
          !r.description.trim() ||
          !r.department.trim() ||
          !r.branch.trim() ||
          !Number.isInteger(r.openings) ||
          r.openings < 1
        )
          return 'Add the job description, department, branch, and at least one opening.';
        break;
      }
      case 'applications': {
        const r = record as Application;
        const profileProblem = candidateProfileProblem(r.profile);
        if (profileProblem) return profileProblem;
        if (!old && (!r.source?.trim() || !r.consent?.trim())) return 'Record the candidate source and consent evidence.';
        if (old && r.vacancyId !== (old as Application).vacancyId) return 'Create a separate application for another vacancy.';
        if (
          !r.name.trim() ||
          !email(r.email) ||
          !hr.vacancies.some(
            (v) => v.id === r.vacancyId && (v.status === 'open' || !!old) && (!!old || !v.closingDate || v.closingDate >= new Date().toISOString().slice(0,10)),
          ) ||
          !Number.isFinite(r.salary) ||
          r.salary < 0 ||
          !['USD', 'KHR'].includes(r.currency)
        )
          return 'Choose an open vacancy and add a valid candidate name, email, and offer amount.';
        if (
          hr.applications.some(
            (a) =>
              a.id !== r.id &&
              a.vacancyId === r.vacancyId &&
              a.email.toLowerCase() === r.email.toLowerCase(),
          )
        )
          return 'This candidate already has an application for this vacancy.';
        break;
      }
      case 'leaves': {
        const r = record as HRCollections['leaves'];
        if (
          !bounds(r.startDate, r.endDate) ||
          !workDays(r.startDate, r.endDate, r.calendar ?? state.org.workCalendar) ||
          !r.reason.trim()
        )
          return 'Choose a valid leave range within one year and add a reason.';
        if (
          hr.leaves.some(
            (l) =>
              l.id !== r.id &&
              l.employeeId === r.employeeId &&
              ['pending', 'approved'].includes(l.status) &&
              overlaps(r.startDate, r.endDate, l.startDate, l.endDate),
          )
        )
          return 'This employee already has overlapping leave.';
        if (periodLocked(hr, r.startDate, r.endDate))
          return 'Reopen the affected period before changing its inputs.';
        break;
      }
      case 'attendance': {
        const r = record as HRCollections['attendance'];
        if (
          !validDate(r.date) ||
          !time(r.checkIn) ||
          !time(r.checkOut) ||
          hours(r) <= 0 ||
          hours(r) > 16 ||
          !Number.isFinite(r.overtimeHours) ||
          r.overtimeHours < 0 ||
          r.overtimeHours > hours(r)
        )
          return 'Enter a valid shift of up to 16 hours. Overtime cannot exceed shift hours.';
        if (
          hr.attendance.some(
            (a) =>
              a.id !== r.id &&
              a.employeeId === r.employeeId &&
              a.date === r.date,
          )
        )
          return 'An attendance record already exists for this employee and date.';
        if (periodLocked(hr, r.date))
          return 'Reopen the affected period before changing its inputs.';
        if (old && !r.reason.trim()) return 'Add a correction reason.';
        break;
      }
      case 'attendancePeriods': {
        const r = record as HRCollections['attendancePeriods'];
        if (!r.title.trim() || !bounds(r.startDate, r.endDate))
          return 'Add a title and a valid period within one year.';
        if (
          hr.attendancePeriods.some(
            (p) =>
              p.id !== r.id &&
              overlaps(r.startDate, r.endDate, p.startDate, p.endDate),
          )
        )
          return 'Attendance periods cannot overlap.';
        break;
      }
      case 'payroll': {
        const r = record as HRCollections['payroll'];
        if (
          !r.title.trim() ||
          !bounds(r.startDate, r.endDate) ||
          !['USD', 'KHR'].includes(r.currency) ||
          !Number.isFinite(r.adjustment) ||
          !r.reason.trim()
        )
          return 'Add a valid pay period, currency, adjustment, and calculation note.';
        if (
          hr.payroll.some(
            (p) =>
              p.id !== r.id &&
              p.currency === r.currency &&
              overlaps(r.startDate, r.endDate, p.startDate, p.endDate),
          )
        )
          return 'Pay periods in the same currency cannot overlap.';
        break;
      }
      case 'reviews': {
        const r = record as HRCollections['reviews'];
        if (
          !r.title.trim() ||
          !r.goal.trim() ||
          !bounds(r.startDate, r.endDate) ||
          !Number.isInteger(r.rating) ||
          r.rating < 0 ||
          r.rating > 5
        )
          return 'Add the review period, measurable goal, and a rating from 0 to 5.';
        if (!admin && old && old.status !== 'self-review')
          return 'Only the employee can edit their self-review stage.';
        if (
          !admin &&
          (r.managerEvidence ||
            r.development ||
            r.rating ||
            r.selfEvidence === undefined ||
            hr.employees.find((e) => e.id === r.employeeId)?.accountId !==
              state.meId)
        )
          return 'Manager assessment fields require app admin access.';
        if (
          old &&
          (r.employeeId !== (old as HRCollections['reviews']).employeeId ||
            r.goal !== (old as HRCollections['reviews']).goal) &&
          old.status !== 'draft'
        )
          return 'The review employee and goal are fixed after launch.';
        break;
      }
      case 'courses': {
        const r = record as HRCollections['courses'];
        if (
          !r.title.trim() ||
          !r.description.trim() ||
          !validDate(r.date) ||
          !Number.isFinite(r.passScore) ||
          r.passScore < 0 ||
          r.passScore > 100 ||
          !Number.isInteger(r.validMonths) ||
          r.validMonths < 0 ||
          r.validMonths > 120
        )
          return 'Add a course date, description, passing score, and validity in months.';
        break;
      }
      case 'enrollments': {
        const r = record as HRCollections['enrollments'];
        if (
          !hr.courses.some((c) => c.id === r.courseId && c.status === 'open') ||
          !Number.isFinite(r.score) ||
          r.score < 0 ||
          r.score > 100
        )
          return 'Choose an open course and enter a score from 0 to 100.';
        if (
          hr.enrollments.some(
            (e) =>
              e.id !== r.id &&
              e.employeeId === r.employeeId &&
              e.courseId === r.courseId,
          )
        )
          return 'This employee is already enrolled in this course.';
        const course = hr.courses.find(c => c.id === r.courseId)!;
        if (!old && hr.enrollments.filter(e => e.courseId === r.courseId && !['cancelled', 'waitlisted'].includes(e.status)).length >= (course.capacity ?? 1000)) return 'This course is full. Ask a training admin to add a waitlist entry.';
        if (!old && course.prerequisiteId && !hr.enrollments.some(e => e.employeeId === r.employeeId && e.courseId === course.prerequisiteId && e.status === 'completed' && (!e.expiresAt || e.expiresAt >= new Date().toISOString().slice(0,10)))) return 'Complete the current prerequisite before admission.';
        if (!admin && (r.score || r.evidence || r.attended || old))
          return 'Only training admins can record attendance and assessment.';
        break;
      }
      case 'assets': {
        const r = record as HRCollections['assets'];
        if (
          !r.code.trim() ||
          !r.name.trim() ||
          !r.condition.trim() ||
          !['room', 'equipment'].includes(r.kind)
        )
          return 'Add an asset code, name, type, and condition.';
        if (
          hr.assets.some(
            (a) =>
              a.id !== r.id && a.code.toLowerCase() === r.code.toLowerCase(),
          )
        )
          return 'Asset codes must be unique.';
        break;
      }
      case 'reservations': {
        const r = record as HRCollections['reservations'];
        if (
          !hr.assets.some(
            (a) =>
              a.id === r.assetId &&
              a.kind === 'room' &&
              a.status === 'available',
          ) ||
          !validDate(r.date) ||
          !time(r.startTime) ||
          !time(r.endTime) ||
          r.startTime >= r.endTime ||
          !r.purpose.trim()
        )
          return 'Choose an available room and a valid reservation time.';
        if (
          hr.reservations.some(
            (x) =>
              x.id !== r.id &&
              x.assetId === r.assetId &&
              x.date === r.date &&
              x.status === 'reserved' &&
              r.startTime < x.endTime &&
              x.startTime < r.endTime,
          )
        )
          return 'This room is already reserved during that time.';
        break;
      }
      case 'reports': {
        const r = record as SavedReport;
        if (
          !r.title.trim() ||
          !bounds(r.startDate, r.endDate) ||
          ![
            'headcount',
            'leave',
            'attendance',
            'payroll',
            'assets',
            'training',
          ].includes(r.source)
        )
          return 'Add a report title, source, and valid period.';
        if (!reportAllowed(state, r.source))
          return 'You need Admin access to the report’s source app.';
        break;
      }
    }
    return;
  }
  const r = old! as HRRecord & Record<string, unknown>;
  if (!TRANSITIONS[collection][r.status]?.[command.operation])
    return 'This action is not available at the current stage.';
  const op = command.operation;
  const employee = hr.employees.find((e) => e.id === r.employeeId);
  const own = employee?.accountId === state.meId;
  if (!canPerformHRTransition(state, collection, old!, op))
    return 'Only app admins can perform this action.';
  if (
    [
      'offboard',
      'revise',
      'withdraw',
      'pause',
      'rehire',
      'reject',
      'decline',
      'cancel',
      'return',
      'correct',
      'reopen',
      'maintain',
      'release',
    ].includes(op) &&
    !command.reason?.trim()
  )
    return 'Add a reason for this action.';
  if (collection === 'employees') {
    const e = r as unknown as Employee;
    if (op === 'start' && e.startDate > new Date().toISOString().slice(0,10)) return 'Employment cannot start before the agreed start date.';
    if (op === 'offboard') {
      if (e.accountId && (hr.recruitment?.offers.some(o => o.status === 'pending' && o.reviewerId === e.accountId) || hr.recruitment?.requisitions.some(q => q.status === 'pending' && q.reviewerId === e.accountId) || hr.recruitment?.interviews.some(i => i.status === 'scheduled' && i.interviewerId === e.accountId))) return 'Resolve recruitment reviews and interviews before offboarding this person.';
      if (
        hr.employees.some(
          (person) => person.managerId === e.id && person.status !== 'exited',
        )
      )
        return 'Reassign this manager’s direct reports before offboarding.';
      if (
        hr.changes?.some(
          (change) => change.employeeId === e.id && change.status === 'pending',
        )
      )
        return 'Resolve scheduled employee changes before offboarding.';
      if (
        !validDate(e.endDate) ||
        e.endDate < e.startDate ||
        e.endDate > new Date().toISOString().slice(0, 10)
      )
        return 'Set a valid last working day on or before today before offboarding.';
      if (state.people.find((p) => p.id === e.accountId)?.access === 'owner')
        return 'Transfer workspace ownership before offboarding the owner.';
      if (
        hr.assets.some((a) => a.employeeId === e.id && a.status === 'assigned')
      )
        return 'Return assigned assets before completing offboarding.';
      if (
        e.accountId &&
        state.tasks.some(
          (t) =>
            [t.ownerId, t.assignedById].includes(e.accountId) &&
            !state.taskStatuses.some(
              (s) => s.id === t.status && s.category === 'done',
            ),
        )
      )
        return 'Reassign unfinished work before completing offboarding.';
      if (
        e.accountId &&
        state.requests.some(
          (request) =>
            request.status === 'pending' &&
            request.steps.some(
              (step) =>
                step.approverId === e.accountId &&
                ['current', 'waiting'].includes(step.status),
            ),
        )
      )
        return 'Resolve this employee’s pending approval steps before offboarding.';
      if (
        hr.leaves.some((l) => l.employeeId === e.id && l.status === 'pending')
      )
        return 'Resolve pending leave before completing offboarding.';
    }
    if (op === 'rehire' && !command.reason?.match(/^\d{4}-\d{2}-\d{2}\s+.+/))
      return 'For rehire, enter the new start date followed by a reason.';
    if (
      op === 'rehire' &&
      (!validDate(command.reason!.slice(0, 10)) ||
        command.reason!.slice(0, 10) <= e.endDate)
    )
      return 'Rehire must start after the previous last working day.';
  }
  if (collection === 'vacancies') {
    const v = r as unknown as HRCollections['vacancies'];
    if (['publish','reopen','resume'].includes(op)) {
      const q = recruitmentState(state).requisitions.find(q => q.id === v.requisitionId);
      if (op === 'publish' && (!q || q.status !== 'approved' || q.vacancyId !== v.id)) return 'Approve a headcount requisition before publishing this vacancy.';
      if (v.closingDate && v.closingDate < new Date().toISOString().slice(0,10)) return 'The vacancy closing date has passed.';
    }
    if (op === 'close' && hr.applications.some(a => a.vacancyId === v.id && !['hired','rejected','withdrawn','declined'].includes(a.status))) return 'Resolve active applications or pause the vacancy before closing it.';
  }
  if (collection === 'applications') {
    const a = r as unknown as Application;
    if (
      ['interview', 'offer'].includes(op) &&
      (!validDate(a.interviewDate) || !a.evidence.trim())
    )
      return 'Add the interview date and evidence before continuing.';
    if (
      ['offer', 'hire'].includes(op) &&
      (!validDate(a.startDate) || a.salary <= 0)
    )
      return 'Add the proposed start date and a positive offer amount.';
    if (op === 'offer') { const v=hr.vacancies.find(v=>v.id===a.vacancyId); if (!v || v.status !== 'open' || (v.closingDate && v.closingDate < new Date().toISOString().slice(0,10))) return 'Publish an active vacancy before issuing an offer.'; if (hr.applications.filter(x=>x.id!==a.id && x.vacancyId===a.vacancyId && ['offered','accepted','hired'].includes(x.status)).length >= v.openings) return 'There are no remaining openings in this vacancy.'; }
    if (['offer','accept','hire'].includes(op) && !approvedOffer(state,a)) return 'Request independent approval for the current offer revision before continuing.';
    if (op === 'interview' && recruitmentState(state).interviews.some(i => i.applicationId === a.id) && !recruitmentState(state).interviews.some(i => i.applicationId === a.id && i.status === 'completed' && i.recommendation === 'advance')) return 'Complete an interview assessment with an advance recommendation first.';
    if (op === 'hire') {
      if (!a.hiringChecks?.trim()) return 'Record identity, consent and employment checks before hiring.';
      if (!canWriteCompensation(state))
        return 'Compensation changes require explicit write access.';
      if (
        !state.taskStatuses.some(
          (status) =>
            status.category === 'todo' &&
            !status.requireReady &&
            !status.requireDone &&
            !status.signOff,
        )
      )
        return 'Configure an ungated To do status for onboarding tasks before hiring.';
      if (
        !isAppAdmin(state, 'employees') ||
        !canContributeToApp(state, 'tasks')
      )
        return 'Hiring needs Employee admin and Task contributor access.';
      if (
        hr.employees.some(
          (e) => e.email.toLowerCase() === a.email.toLowerCase(),
        )
      )
        return 'An employee with this email already exists. Use the employee rehire flow.';
      const vacancy = hr.vacancies.find((v) => v.id === a.vacancyId);
      if (
        !vacancy ||
        vacancy.status !== 'open' ||
        hr.applications.filter(
          (x) => x.vacancyId === a.vacancyId && x.status === 'hired',
        ).length >= vacancy.openings
      )
        return 'There are no remaining openings in this vacancy.';
    }
  }
  if (collection === 'leaves') {
    const l = r as unknown as HRCollections['leaves'];
    if (periodLocked(hr, l.startDate, l.endDate))
      return 'Reopen the affected period before changing its inputs.';
    if (
      ['submit', 'approve'].includes(op) &&
      hr.leaves.some(
        (x) =>
          x.id !== l.id &&
          x.employeeId === l.employeeId &&
          ['pending', 'approved'].includes(x.status) &&
          overlaps(l.startDate, l.endDate, x.startDate, x.endDate),
      )
    )
      return 'This employee already has overlapping leave.';
    if (op === 'approve' && employee?.accountId === state.meId)
      return 'Another Employee admin must approve your leave.';
    if (
      op === 'approve' &&
      l.days > leaveBalance(state, l.employeeId)
    )
      return 'There is not enough leave balance for this request.';
  }
  if (collection === 'attendance') {
    const a = r as unknown as HRCollections['attendance'];
    if (periodLocked(hr, a.date))
      return 'Reopen the affected period before changing its inputs.';
    if (op === 'approve' && own)
      return 'Another Attendance admin must review your attendance.';
  }
  if (collection === 'attendancePeriods') {
    const p = r as unknown as HRCollections['attendancePeriods'];
    if (
      op === 'close' &&
      hr.attendance.some(
        (a) =>
          a.date >= p.startDate &&
          a.date <= p.endDate &&
          a.status !== 'approved',
      )
    )
      return 'Resolve attendance exceptions before closing this period.';
    if (
      op === 'reopen' &&
      hr.payroll.some(
        (x) =>
          x.status === 'frozen' &&
          overlaps(p.startDate, p.endDate, x.startDate, x.endDate),
      )
    )
      return 'Reopen the affected payroll period first.';
  }
  if (collection === 'payroll') {
    const p = r as unknown as HRCollections['payroll'];
    if (op === 'prepare' && !canReadCompensation(state))
      return 'Preparing payroll needs explicit compensation read access.';
    if (
      op === 'prepare' &&
      (!isAppAdmin(state, 'employees') || !isAppAdmin(state, 'attendance'))
    )
      return 'Preparing payroll needs Employee and Attendance admin access.';
    if (
      op === 'prepare' &&
      !hr.attendancePeriods.some(
        (x) =>
          x.status === 'closed' &&
          x.startDate <= p.startDate &&
          x.endDate >= p.endDate,
      )
    )
      return 'Close an attendance period covering this pay period first.';
    if (
      op === 'prepare' &&
      hr.leaves.some(
        (l) =>
          l.status === 'pending' &&
          overlaps(l.startDate, l.endDate, p.startDate, p.endDate),
      )
    )
      return 'Resolve pending leave before preparing payroll.';
    if (
      op === 'prepare' &&
      hr.employees.some(
        (e) => e.currency === p.currency && e.salary + p.adjustment < 0,
      )
    )
      return 'A payroll adjustment cannot produce a negative preview total.';
    if (
      op === 'prepare' &&
      !hr.employees.some(
        (e) =>
          e.currency === p.currency &&
          e.startDate <= p.endDate &&
          (!e.endDate || e.endDate >= p.startDate),
      )
    )
      return 'No employees match this pay period and currency.';
    if (op === 'review' && p.preparedById === state.meId)
      return 'Another Payroll admin must review the prepared preview.';
  }
  if (collection === 'reviews') {
    const p = r as unknown as HRCollections['reviews'];
    if (op === 'submit' && !p.selfEvidence.trim())
      return 'Add self-review evidence before submitting.';
    if (
      op === 'publish' &&
      (!p.managerEvidence.trim() || !p.development.trim() || p.rating < 1)
    )
      return 'Add manager evidence, a rating, and the development plan.';
    if (op === 'publish' && own)
      return 'Another Performance admin must publish your review.';
    if (op === 'acknowledge' && !own)
      return 'Only the reviewed employee can acknowledge this review.';
  }
  if (
    collection === 'enrollments' &&
    op === 'assess' &&
    !String(r.evidence).trim()
  )
    return 'Add assessment evidence before recording the result.';
  if (
    collection === 'assets' &&
    op === 'assign' &&
    (r.kind === 'room' || !activeEmployee(hr, String(r.employeeId)))
  )
    return 'Choose an active employee for an equipment assignment.';
  if (
    collection === 'reports' &&
    op === 'snapshot' &&
    !reportAllowed(state, (r as unknown as SavedReport).source)
  )
    return 'You need Admin access to the report’s source app.';
  return;
}
const REPORT_APPS = {
  headcount: 'employees',
  leave: 'employees',
  attendance: 'attendance',
  payroll: 'payroll',
  assets: 'assets',
  training: 'training',
} as const;
export const reportAllowed = (
  state: DataState,
  source: SavedReport['source'],
) => isAppAdmin(state, 'reports') && isAppAdmin(state, REPORT_APPS[source]);
export function reportRows(state: DataState, report: SavedReport): ReportRow[] {
  if (!reportAllowed(state, report.source)) return [];
  const hr = hrState(state);
  const employees = hr.employees.filter(
    (e) => !report.department || e.department === report.department,
  );
  const output: ReportRow[] = [];
  for (const e of employees) {
    const base = {
      id: e.id,
      name: e.name,
      department: e.department,
      status: e.status,
    };
    if (
      report.source === 'headcount' &&
      hr.episodes.some(
        (episode) =>
          episode.employeeId === e.id &&
          episode.startDate <= report.endDate &&
          (!episode.endDate || episode.endDate >= report.endDate),
      )
    )
      output.push({ ...base, value: 1, unit: 'employees' });
    if (report.source === 'leave')
      output.push({
        ...base,
        value: hr.leaves
          .filter(
            (l) =>
              l.employeeId === e.id &&
              l.status === 'approved' &&
              overlaps(
                l.startDate,
                l.endDate,
                report.startDate,
                report.endDate,
              ),
          )
          .reduce(
            (n, l) =>
              n +
              workDays(
                l.startDate < report.startDate ? report.startDate : l.startDate,
                l.endDate > report.endDate ? report.endDate : l.endDate,
                l.calendar ?? DEFAULT_WORK_CALENDAR,
              ),
            0,
          ),
        unit: 'days',
      });
    if (report.source === 'attendance')
      output.push({
        ...base,
        value: round(
          hr.attendance
            .filter(
              (a) =>
                a.employeeId === e.id &&
                a.status === 'approved' &&
                a.date >= report.startDate &&
                a.date <= report.endDate,
            )
            .reduce((n, a) => n + hours(a), 0),
        ),
        unit: 'hours',
      });
    if (report.source === 'assets')
      output.push({
        ...base,
        value: hr.assets.filter(
          (a) => a.employeeId === e.id && a.status === 'assigned',
        ).length,
        unit: 'current assets',
      });
    if (report.source === 'training')
      output.push({
        ...base,
        value: hr.enrollments.filter(
          (a) =>
            a.employeeId === e.id &&
            a.status === 'completed' &&
            (a.attempts.at(-1)?.at ?? a.updatedAt).slice(0, 10) >=
              report.startDate &&
            (a.attempts.at(-1)?.at ?? a.updatedAt).slice(0, 10) <=
              report.endDate,
        ).length,
        unit: 'completions',
      });
    if (report.source === 'payroll')
      for (const p of hr.payroll.filter(
        (p) =>
          p.status === 'frozen' &&
          overlaps(p.startDate, p.endDate, report.startDate, report.endDate),
      )) {
        const line = p.lines?.find((l) => l.employeeId === e.id);
        if (line)
          output.push({
            ...base,
            id: `${e.id}-${p.id}`,
            value: line.total,
            unit: line.currency,
          });
      }
  }
  return output;
}
function payrollLines(hr: HRState, p: HRCollections['payroll']): PayrollLine[] {
  return hr.employees
    .filter(
      (e) =>
        e.currency === p.currency &&
        e.startDate <= p.endDate &&
        (!e.endDate || e.endDate >= p.startDate),
    )
    .map((e) => ({
      employeeId: e.id,
      name: e.name,
      currency: e.currency,
      base: e.salary,
      adjustment: p.adjustment,
      total: round(e.salary + p.adjustment),
      employeeVersion: e.version,
      attendanceHours: round(
        hr.attendance
          .filter(
            (a) =>
              a.employeeId === e.id &&
              a.status === 'approved' &&
              a.date >= p.startDate &&
              a.date <= p.endDate,
          )
          .reduce((n, a) => n + hours(a), 0),
      ),
      leaveDays: hr.leaves
        .filter(
          (l) =>
            l.employeeId === e.id &&
            l.status === 'approved' &&
            overlaps(l.startDate, l.endDate, p.startDate, p.endDate),
        )
        .reduce(
          (n, l) =>
            n +
            workDays(
              l.startDate < p.startDate ? p.startDate : l.startDate,
              l.endDate > p.endDate ? p.endDate : l.endDate,
              l.calendar ?? DEFAULT_WORK_CALENDAR,
            ),
          0,
        ),
    }));
}
function onboardingTasks(state: DataState, e: Employee, at: string): Task[] {
  const status = state.taskStatuses.find(
    (s) =>
      s.category === 'todo' && !s.requireReady && !s.requireDone && !s.signOff,
  )?.id;
  if (!status) return [];
  return [
    'Verify employment documents',
    'Prepare equipment and access',
    'Complete first-week orientation',
  ].map((title, i) => ({
    id: `onboard-${e.id}-${i}`,
    title: `${title} · ${e.name}`,
    ownerId: state.meId,
    assignedById: state.meId,
    due: `${e.startDate}T09:00:00`,
    status,
    priority: 'medium',
    workType: 'task',
    expectedOutcome: title,
    source: { label: e.name, href: `/employees?record=${e.id}` },
    notes: `Created from recruitment on ${at.slice(0, 10)}`,
  }));
}
export function applyHR(state: DataState, command: HRCommand): DataState {
  if (hrProblem(state, command)) return state;
  if(command.kind==='advanced')return applyAdvanced(state,command.command);
  if (command.kind === 'recruitment') return applyRecruitment(state, command.command);
  if (command.kind === 'loadExamples') return loadExamples(state);
  if (command.kind === 'compensationAccess') {
    const hr = structuredClone(hrState(state));
    hr.compensationAccess = { ...hr.compensationAccess };
    if (command.access === 'none')
      delete hr.compensationAccess[command.personId];
    else hr.compensationAccess[command.personId] = command.access;
    return { ...state, hr };
  }
  if (command.kind === 'scope') {
    const hr = structuredClone(hrState(state));
    hr.scopes[command.app] = {
      ...hr.scopes[command.app],
      [command.personId]: command.scope,
    };
    return { ...state, hr };
  }
  if (command.kind === 'import')
    return command.records.reduce(
      (next, record) =>
        applyHR(next, { kind: 'save', collection: 'employees', record }),
      state,
    );
  if (command.kind === 'reviewChange') {
    const hr = structuredClone(hrState(state));
    hr.changes = hr.changes?.map(c => c.id === command.id ? {...c, approvalStatus: command.outcome, decision: { actorId: state.meId, at: new Date().toISOString(), reason: command.reason.trim() }} : c);
    return { ...state, hr };
  }
  if (command.kind === 'schedule') {
    const hr = structuredClone(hrState(state));
    hr.changes = [
      ...(hr.changes ?? []),
      {
        ...command.change,
        approvalStatus: command.change.reviewerId ? 'pending' : undefined,
        decision: undefined,
        status: 'pending',
        createdById: state.meId,
        createdAt: new Date().toISOString(),
      },
    ];
    return { ...state, hr };
  }
  if (command.kind === 'applyChange' || command.kind === 'cancelChange') {
    const c = hrState(state).changes!.find((c) => c.id === command.id)!;
    const e = hrState(state).employees.find((e) => e.id === c.employeeId)!;
    const next =
      command.kind === 'applyChange'
        ? applyHR(state, {
            kind: 'save',
            collection: 'employees',
            record: { ...e, ...c.patch },
            expectedVersion: c.expectedVersion,
            reason: `${c.effectiveDate}: ${c.reason}`,
          })
        : { ...state, hr: structuredClone(hrState(state)) };
    next.hr!.changes = next.hr!.changes!.map((change) =>
      change.id === c.id
        ? {
            ...change,
            status: command.kind === 'applyChange' ? 'applied' : 'cancelled',
          }
        : change,
    );
    return next;
  }
  if (command.kind === 'evaluation') {
    const at = new Date().toISOString(),
      hr = structuredClone(hrState(state));
    const e = hr.enrollments.find((e) => e.id === command.enrollmentId)!;
    const course = hr.courses.find((c) => c.id === e.courseId)!;
    const id = `training-evaluation-${e.id}`;
    e.surveyId = id;
    e.version++;
    e.updatedAt = at;
    hr.history.push({
      id: `${id}-${at}`,
      collection: 'enrollments',
      recordId: e.id,
      actorId: state.meId,
      at,
      action: 'evaluation',
      reason: '',
      after: structuredClone(e),
    });
    return {
      ...state,
      hr,
      surveys: [
        ...state.surveys,
        {
          id,
          title: `Training evaluation · ${course.title}`,
          description:
            'Share feedback about the training and how you will apply what you learned.',
          status: 'draft',
          createdBy: state.meId,
          createdAt: at,
          audience: [],
          anonymous: false,
          fields: [
            {
              id: 'usefulness',
              label: 'How useful was this training?',
              kind: 'rating',
              required: true,
            },
            {
              id: 'application',
              label: 'How will you apply what you learned?',
              kind: 'longtext',
              required: true,
            },
          ],
        },
      ],
    };
  }
  const at = new Date().toISOString(),
    hr = structuredClone(hrState(state)),
    collection = command.collection;
  const rows = hr[collection] as HRRecord[],
    id = command.kind === 'save' ? command.record.id : command.id;
  const index = rows.findIndex((x) => x.id === id),
    old = index < 0 ? undefined : structuredClone(rows[index]!);
  let next: HRRecord & Record<string, unknown>;
  let tasks = state.tasks,
    members = state.appMembers,
    invitations = state.appInvitations;
  if (command.kind === 'save') {
    next = {
      ...structuredClone(command.record),
      status: old?.status ?? STATUSES[collection],
      createdAt: old?.createdAt ?? at,
      updatedAt: at,
      version: (old?.version ?? 0) + 1,
    };
    if (collection === 'employees') {
      next.verifications = (old as Employee | undefined)?.verifications;
      next.probationEndDate = (old as Employee | undefined)?.probationEndDate;
      const e = next as unknown as Employee;
      e.code = e.code.trim();
      e.name = e.name.trim();
      e.email = e.email.trim().toLowerCase();
      if (!old)
        hr.episodes.push({
          id: `${id}-episode-1`,
          employeeId: id,
          startDate: e.startDate,
          position: e.position,
          department: e.department,
          salary: e.salary,
          currency: e.currency,
        });
    }
    if (collection === 'reviews') next.employeeResponse = (old as HRCollections['reviews'] | undefined)?.employeeResponse;
    if (collection === 'courses') { next.capacity = (old as HRCollections['courses'] | undefined)?.capacity; next.prerequisiteId = (old as HRCollections['courses'] | undefined)?.prerequisiteId; }
    if (collection === 'payroll') {
      next.deliveries = undefined;
      next.lines = undefined;
      next.preparedById = undefined;
      next.reviewedById = undefined;
    }
    if (collection === 'reports' || collection === 'attendancePeriods')
      next.snapshot = undefined;
    if (collection === 'applications') {
      next.stageId = (old as Application | undefined)?.stageId;
      next.offerRevision = ((old as Application | undefined)?.offerRevision ?? 0) + 1;
      hr.recruitment?.offers.filter(o => o.applicationId === id && ['pending','approved'].includes(o.status)).forEach(o => {o.status = 'superseded'; o.version++;});
    }
    if (collection === 'enrollments') {
      const course = hr.courses.find((c) => c.id === next.courseId)!;
      next.attempts =
        (old as HRCollections['enrollments'] | undefined)?.attempts ?? [];
      next.passScoreSnapshot =
        (old as HRCollections['enrollments'] | undefined)?.passScoreSnapshot ??
        course.passScore;
      next.validMonthsSnapshot =
        (old as HRCollections['enrollments'] | undefined)
          ?.validMonthsSnapshot ?? course.validMonths;
      next.surveyId = (
        old as HRCollections['enrollments'] | undefined
      )?.surveyId;
    }
    if (collection === 'leaves') {
      next.calendar = structuredClone((old as HRCollections['leaves'] | undefined)?.calendar ?? state.org.workCalendar ?? DEFAULT_WORK_CALENDAR);
      next.days = workDays(String(next.startDate), String(next.endDate), next.calendar as WorkCalendar);
    }
  } else {
    const op = command.operation;
    next = {
      ...old!,
      version: old!.version + 1,
      updatedAt: at,
      status: TRANSITIONS[collection][old!.status]![op]!,
      ...(collection === 'applications' ? { stageId: candidateStageConfig(state).stages.find(stage => stage.phase === TRANSITIONS[collection][old!.status]![op])?.id } : {}),
    };
    if (collection === 'employees') {
      next.verifications = (old as Employee | undefined)?.verifications;
      next.probationEndDate = (old as Employee | undefined)?.probationEndDate;
      const e = next as unknown as Employee;
      if (op === 'offboard') {
        if (e.accountId) {
          if (hr.compensationAccess) delete hr.compensationAccess[e.accountId];
          for (const scope of Object.values(hr.scopes))
            if (scope) delete scope[e.accountId];
        }
        const accountEmail = state.people
          .find((person) => person.id === e.accountId)
          ?.email?.toLowerCase();
        invitations = (invitations ?? []).map((invitation) =>
          invitation.status === 'pending' &&
          [e.email.toLowerCase(), accountEmail].includes(
            invitation.email.toLowerCase(),
          )
            ? { ...invitation, status: 'revoked' as const }
            : invitation,
        );
        const episode = [...hr.episodes]
          .reverse()
          .find((x) => x.employeeId === id && !x.endDate);
        if (episode) episode.endDate = e.endDate;
        if (e.accountId && members)
          members = Object.fromEntries(
            Object.entries(members).map(([app, people]) => [
              app,
              Object.fromEntries(
                Object.entries(people ?? {}).filter(
                  ([account]) => account !== e.accountId,
                ),
              ),
            ]),
          );
      }
      if (op === 'rehire') {
        e.startDate = command.reason!.slice(0, 10);
        e.endDate = '';
        hr.episodes.push({
          id: `${id}-episode-${next.version}`,
          employeeId: id,
          startDate: e.startDate,
          position: e.position,
          department: e.department,
          salary: e.salary,
          currency: e.currency,
        });
      }
    }
    if (collection === 'applications' && ['hired','rejected','withdrawn','declined'].includes(next.status)) {
      hr.recruitment?.interviews.filter(i=>i.applicationId===id && i.status==='scheduled').forEach(i=>{const previous=structuredClone(i);i.status='cancelled';i.version++;hr.recruitment!.history.push({id:`terminal-${i.id}-${i.version}`,kind:'interview',recordId:i.id,actorId:state.meId,at,action:'cancelInterview',reason:command.reason || 'Application completed',before:previous,after:structuredClone(i)});});
      if(next.status !== 'hired') hr.recruitment?.offers.filter(o=>o.applicationId===id && ['pending','approved'].includes(o.status)).forEach(o=>{o.status='superseded';o.version++;});
    }
    if (collection === 'applications' && op === 'revise') { next.offerRevision = Number(next.offerRevision) + 1; hr.recruitment?.offers.filter(o => o.applicationId === id && ['pending','approved'].includes(o.status)).forEach(o => {o.status='superseded';o.version++;}); }
    if (collection === 'applications' && op === 'hire') {
      const a = next as unknown as Application,
        v = hr.vacancies.find((v) => v.id === a.vacancyId)!;
      let employeeNumber = 1001;
      while (
        hr.employees.some(
          (employee) => employee.code.toUpperCase() === `EMP-${employeeNumber}`,
        )
      )
        employeeNumber++;
      const e: Employee = {
        id: `employee-${id}`,
        version: 1,
        status: a.startDate > at.slice(0,10) ? 'prestart' : 'probation',
        createdAt: at,
        updatedAt: at,
        code: `EMP-${employeeNumber}`,
        name: a.name,
        email: a.email,
        accountId: '',
        managerId: hr.employees.find(e => e.accountId === v.managerId && e.status !== 'exited')?.id ?? '',
        department: v.department,
        branch: v.branch,
        position: v.title,
        startDate: a.startDate,
        endDate: '',
        salary: a.salary,
        currency: a.currency,
        leaveAllowance: 18,
      };
      a.employeeId = e.id;
      hr.employees.push(e);
      hr.episodes.push({
        id: `${e.id}-episode-1`,
        employeeId: e.id,
        startDate: e.startDate,
        position: e.position,
        department: e.department,
        salary: e.salary,
        currency: e.currency,
      });
      tasks = [...tasks, ...onboardingTasks(state, e, at)];
      hr.history.push({
        id: `${at}-${e.id}`,
        collection: 'employees',
        recordId: e.id,
        actorId: state.meId,
        at,
        action: 'hire',
        reason: command.reason ?? '',
        after: structuredClone(e),
      });
    }
    if (collection === 'leaves' && ['approve', 'cancel'].includes(op)) {
      hr.leaveLedger.push({
        id: `${id}-${next.version}`,
        employeeId: String(next.employeeId),
        leaveId: id,
        days: Number(next.days) * (op === 'cancel' ? -1 : 1),
        kind: op === 'cancel' ? 'reversal' : 'used',
        at,
      });
      if (op === 'approve') next.reviewerId = state.meId;
    }
    if (collection === 'attendance' && op === 'approve')
      next.reviewerId = state.meId;
    if (collection === 'attendancePeriods' && op === 'close')
      next.snapshot = structuredClone(
        hr.attendance.filter(
          (a) =>
            a.date >= String(next.startDate) && a.date <= String(next.endDate),
        ),
      );
    if (collection === 'payroll') {
      if (op === 'prepare') {
        next.lines = payrollLines(
          hr,
          next as unknown as HRCollections['payroll'],
        );
        next.preparedById = state.meId;
        next.reviewedById = undefined;
      }
      if (op === 'review') next.reviewedById = state.meId;
      if (['return', 'reopen'].includes(op)) {
        next.lines = undefined;
        next.preparedById = undefined;
        next.reviewedById = undefined;
      }
    }
    if (collection === 'enrollments') {
      if (op === 'attend') next.attended = true;
      if (op === 'assess') {
        const course = hr.courses.find((c) => c.id === next.courseId)!;
        next.status =
          Number(next.score) >=
          Number(next.passScoreSnapshot ?? course.passScore)
            ? 'completed'
            : 'failed';
        next.attempts = [
          ...((next.attempts as HRCollections['enrollments']['attempts']) ??
            []),
          { score: Number(next.score), evidence: String(next.evidence), at },
        ];
        if (
          next.status === 'completed' &&
          Number(next.validMonthsSnapshot ?? course.validMonths)
        ) {
          const expiry = new Date(at);
          expiry.setUTCMonth(
            expiry.getUTCMonth() +
              Number(next.validMonthsSnapshot ?? course.validMonths),
          );
          next.expiresAt = expiry.toISOString().slice(0, 10);
        }
      }
    }
    if (collection === 'assets' && op === 'return') next.employeeId = '';
    if (collection === 'reports' && op === 'snapshot')
      next.snapshot = structuredClone(
        reportRows({ ...state, hr }, next as unknown as SavedReport),
      );
    if (collection === 'reports' && op === 'revise') next.snapshot = undefined;
  }
  if (index < 0) rows.push(next);
  else rows[index] = next;
  hr.history.push({
    id: `${at}-${id}-${next.version}`,
    collection,
    recordId: id,
    actorId: state.meId,
    at,
    action:
      command.kind === 'save'
        ? old
          ? 'updated'
          : 'created'
        : command.operation,
    reason: command.reason ?? '',
    before: old,
    after: structuredClone(next),
  });
  return {
    ...state,
    hr,
    tasks,
    appMembers: members,
    appInvitations: invitations,
  };
}
function loadExamples(state: DataState): DataState {
  const hr = structuredClone(hrState(state));
  if (hr.employees.length || hr.vacancies.length || hr.assets.length)
    return state;
  const at = new Date().toISOString(),
    date = at.slice(0, 10);
  const base = { version: 1, createdAt: at, updatedAt: at };
  const demoPeople = state.people
    .filter((p) => ['dara', 'alex', 'priya', 'lina'].includes(p.id))
    .slice(0, 4);
  const people = demoPeople.length ? demoPeople : state.people.slice(0, 4);
  hr.employees = people.map((p, i) => ({
    ...base,
    id: `hr-${p.id}`,
    status: i === 3 ? 'probation' : 'active',
    code: `EMP-${1001 + i}`,
    name: p.name,
    email: p.email ?? `${p.id}@example.test`,
    accountId: p.id,
    managerId: i ? `hr-${people[0]!.id}` : '',
    department: p.department,
    branch: i === 3 ? 'Siem Reap' : 'Phnom Penh',
    position: p.role,
    startDate: '2026-01-05',
    endDate: '',
    salary: 650 + i * 100,
    currency: 'USD',
    leaveAllowance: 18,
  }));
  hr.episodes = hr.employees.map((e) => ({
    id: `${e.id}-episode-1`,
    employeeId: e.id,
    startDate: e.startDate,
    position: e.position,
    department: e.department,
    salary: e.salary,
    currency: e.currency,
  }));
  hr.vacancies = [
    {
      ...base,
      id: 'hr-vacancy',
      status: 'open',
      title: 'Operations coordinator',
      department: 'Operations',
      branch: 'Phnom Penh',
      description:
        'Coordinate daily team operations and document measurable process improvements.',
      openings: 2,
    },
  ];
  hr.applications = [
    {
      ...base,
      id: 'hr-application',
      status: 'applied',
      vacancyId: 'hr-vacancy',
      name: 'សុភា សុខ · Sophea Sok',
      email: 'sophea@example.test',
      interviewDate: date,
      evidence: 'Scenario exercise and interview notes are ready for review.',
      salary: 650,
      currency: 'USD',
      startDate: date,
      offerRevision: 1,
      profile: {
        education: [{ institution: 'Example Phnom Penh University', qualification: 'Bachelor of Business Administration', field: 'Operations management', startYear: '2018', endYear: '2022', ongoing: false }],
        experience: [{ company: 'Example Logistics Co.', role: 'Operations assistant', startDate: '2022-07-01', endDate: '2025-06-30', current: false, achievements: 'Maintained dispatch records and improved weekly reporting.' }],
        skills: [{ name: 'Spreadsheet reporting', level: 'Advanced' }, { name: 'Team coordination', level: 'Intermediate' }],
        projects: [{ name: 'Dispatch reporting improvement', type: 'Professional', role: 'Prepared the reporting template and coordinated feedback.', url: '', outcomes: 'Documented a clearer handoff process using spreadsheet reports.' }],
        notes: 'Fictional example profile for the recruitment demo.',
      },
      source: 'Referral',
      consent: 'Candidate agreed to this fictional recruitment assessment.',
      hiringChecks: 'Identity, consent and employment terms reviewed for the demo.',
    },
  ];
  hr.courses = [
    {
      ...base,
      id: 'hr-course',
      status: 'open',
      title: 'Safety and data confidentiality',
      description:
        'Practice safe handling of workplace equipment and private employee information.',
      date,
      passScore: 70,
      validMonths: 12,
    },
  ];
  hr.assets = [
    {
      ...base,
      id: 'hr-laptop',
      status: 'available',
      code: 'IT-001',
      name: 'Team laptop',
      kind: 'equipment',
      employeeId: '',
      condition: 'Good',
      reason: '',
    },
    {
      ...base,
      id: 'hr-room',
      status: 'available',
      code: 'RM-001',
      name: 'Angkor meeting room',
      kind: 'room',
      employeeId: '',
      condition: 'Available for team meetings',
      reason: '',
    },
  ];
  const reviewer = people.find((p) => p.id !== state.meId);
  const position: import('./recruitmentTypes').Position = {id:'hr-position',version:1,title:hr.vacancies[0]!.title,department:'Operations',branch:'Phnom Penh',description:hr.vacancies[0]!.description,requirements:'Clear communication, practical coordination and documented outcomes.',employmentType:'Full time',code:'OPS-COORD',status:'active',details:{level:'Coordinator',reportsTo:'Operations Lead',responsibilities:'Coordinate daily handoffs, maintain dispatch records and report exceptions.',education:'Relevant qualification or equivalent practical experience.',experienceYears:1,successCriteria:'Clear handoffs and timely, accurate weekly reports.',workMode:'On site',workingHours:'Example weekday schedule; confirm during the offer review.',benefits:'Example coaching and team training opportunities.',salaryMin:600,salaryMax:800,currency:'USD',publicSalary:false}};
  hr.recruitment = {candidateStages:state.hr?.recruitment?.candidateStages,positions:[position],requisitions:[{id:'hr-requisition',version:1,positionId:position.id,positionVersion:1,position,openings:2,budget:800,currency:'USD',reason:'Fictional expansion of the operations team.',managerId:state.meId,reviewerId:reviewer?.id ?? state.meId,closingDate:new Date(Date.now()+30*86400000).toISOString().slice(0,10),status:'approved',createdById:state.meId,vacancyId:'hr-vacancy'}], interviews:[],offers:[],history:[]};
  hr.vacancies[0] = {...hr.vacancies[0]!,requisitionId:'hr-requisition',managerId:state.meId,closingDate:hr.recruitment.requisitions[0]!.closingDate,requirements:position.requirements,employmentType:position.employmentType,jobDetails:structuredClone(position.details)};
  const members = { ...state.appMembers };
  if (reviewer)
    for (const app of [
      'employees',
      'recruitment',
      'attendance',
      'payroll',
      'performance',
    ] as const)
      members[app] = { ...members[app], [reviewer.id]: 'admin' };
  return { ...state, hr, appMembers: members };
}
