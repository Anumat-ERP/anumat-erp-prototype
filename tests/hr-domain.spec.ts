import { expect, test } from '@playwright/test';
import { seed } from '../src/data/seed';
import { initialAppMembers } from '../src/lib/appAccess';
import {
  applyHR,
  hrProblem,
  hrState,
  leaveBalance,
  reportRows,
  visibleRecords,
  hours,
} from '../src/hr/engine';
import {
  emptyHR,
  type Employee,
  type HRCollection,
  type HRCollections,
  type HRCommand,
} from '../src/hr/types';
import { parseCSV, previewEmployees } from '../src/hr/import';
import type { DataState } from '../src/data/types';
function fixture() {
  const state = structuredClone(seed);
  state.meId = 'dara';
  state.hr = emptyHR();
  state.appMembers = initialAppMembers(state);
  return applyHR(state, { kind: 'loadExamples' });
}
function save<K extends HRCollection>(
  state: DataState,
  collection: K,
  record: Partial<HRCollections[K]> & { id: string },
  reason?: string,
) {
  const old = (
    hrState(state)[collection] as { id: string; version: number }[]
  ).find((r) => r.id === record.id);
  const command = {
    kind: 'save',
    collection,
    record: { version: 0, status: '', createdAt: '', updatedAt: '', ...record },
    expectedVersion: old?.version,
    reason,
  } as HRCommand;
  expect(hrProblem(state, command)).toBeUndefined();
  return applyHR(state, command);
}
function move(
  state: DataState,
  collection: HRCollection,
  id: string,
  operation: string,
  reason = 'Test reason',
) {
  if (collection === 'applications' && operation === 'offer') {
    const a = hrState(state).applications.find(a=>a.id===id)!;
    state = applyHR(state, {kind:'recruitment',command:{action:'offer',applicationId:id,expectedVersion:a.version,reviewerId:'alex',terms:'Demo terms'}});
    const o = state.hr!.recruitment!.offers.find(o=>o.applicationId===id && o.status==='pending')!;
    state = {...applyHR({...state,meId:'alex'}, {kind:'recruitment',command:{action:'offerDecision',id:o.id,expectedVersion:o.version,operation:'approve',reason:'Independent review'}}),meId:'dara'};
  }
  const row = hrState(state)[collection].find((r) => r.id === id)!;
  const command: HRCommand = {
    kind: 'transition',
    collection,
    id,
    operation,
    reason,
    expectedVersion: row.version,
  };
  expect(hrProblem(state, command)).toBeUndefined();
  return applyHR(state, command);
}
function nextMonday() {
  const date = new Date();
  while (date.getUTCDay() !== 1) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
const baseEmployee = (state: DataState, id: string) => ({
  ...hrState(state).employees[0]!,
  id,
  code: id,
  accountId: '',
  email: `${id}@example.test`,
  managerId: '',
});

test('recruitment creates exactly one employee, one episode, and linked onboarding without granting access', () => {
  let s = fixture();
  const previous = s.tasks.length;
  for (const op of ['shortlist', 'interview', 'offer', 'accept', 'hire'])
    s = move(s, 'applications', 'hr-application', op);
  const a = hrState(s).applications[0]!;
  const employee = hrState(s).employees.find((e) => e.id === a.employeeId)!;
  expect(employee.accountId).toBe('');
  expect(employee.status).toBe('probation');
  expect(s.people.some((p) => p.email === employee.email)).toBe(false);
  expect(s.tasks).toHaveLength(previous + 3);
  expect(
    s.tasks.slice(-3).every((t) => t.source?.href.includes(employee.id)),
  ).toBe(true);
  expect(
    hrState(s).episodes.filter((e) => e.employeeId === employee.id),
  ).toHaveLength(1);
  const command: HRCommand = {
    kind: 'transition',
    collection: 'applications',
    id: a.id,
    operation: 'hire',
    expectedVersion: a.version,
  };
  expect(hrProblem(s, command)).toContain('current stage');
  expect(applyHR(s, command)).toBe(s);
});

test('accepted offer is immutable and offer revisions retain before/after amounts', () => {
  let s = fixture();
  for (const op of ['shortlist', 'interview', 'offer'])
    s = move(s, 'applications', 'hr-application', op);
  const offered = hrState(s).applications[0]!;
  expect(
    hrProblem(s, {
      kind: 'save',
      collection: 'applications',
      record: { ...offered, salary: 999 },
      expectedVersion: offered.version,
    }),
  ).toContain('editable stage');
  s = move(s, 'applications', offered.id, 'revise');
  s = save(s, 'applications', { ...hrState(s).applications[0]!, salary: 800 });
  expect(hrState(s).history.at(-1)?.before).toMatchObject({ salary: 650 });
  expect(hrState(s).history.at(-1)?.after).toMatchObject({ salary: 800 });
});

test('leave requires independent approval, debits once, reverses once, and blocks overlapping requests', () => {
  let s = fixture(),
    startDate = nextMonday();
  s = save(s, 'leaves', {
    id: 'lv-1',
    employeeId: 'hr-alex',
    startDate,
    endDate: startDate,
    days: 999,
    reason: 'Family',
  });
  s = move(s, 'leaves', 'lv-1', 'submit');
  const cmd: HRCommand = {
    kind: 'transition',
    collection: 'leaves',
    id: 'lv-1',
    operation: 'approve',
    expectedVersion: 2,
  };
  expect(hrProblem({ ...s, meId: 'alex' }, cmd)).toContain(
    'Another Employee admin',
  );
  const overlap = { ...hrState(s).leaves[0]!, id: 'lv-2' };
  expect(
    hrProblem(s, { kind: 'save', collection: 'leaves', record: overlap }),
  ).toContain('overlapping');
  s = move(s, 'leaves', 'lv-1', 'approve');
  expect(leaveBalance(s, 'hr-alex')).toBe(17);
  s = move(s, 'leaves', 'lv-1', 'cancel');
  expect(leaveBalance(s, 'hr-alex')).toBe(18);
  expect(hrState(s).leaveLedger).toHaveLength(2);
  expect(
    hrProblem(s, { ...cmd, expectedVersion: 4, operation: 'cancel' }),
  ).toContain('current stage');
});

test('attendance handles overnight shifts, duplicates, correction review, and period snapshots', () => {
  let s = fixture();
  const date = new Date().toISOString().slice(0, 10);
  s = save(s, 'attendance', {
    id: 'att-1',
    employeeId: 'hr-alex',
    date,
    checkIn: '22:00',
    checkOut: '06:00',
    overtimeHours: 1,
    reason: '',
  });
  expect(hours(hrState(s).attendance[0]!)).toBe(8);
  expect(
    hrProblem(s, {
      kind: 'save',
      collection: 'attendance',
      record: { ...hrState(s).attendance[0]!, id: 'duplicate' },
    }),
  ).toContain('already exists');
  s = move(s, 'attendance', 'att-1', 'submit');
  s = save(s, 'attendancePeriods', {
    id: 'period',
    title: 'Period',
    startDate: date,
    endDate: date,
    reason: '',
  });
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'attendancePeriods',
      id: 'period',
      expectedVersion: 1,
      operation: 'close',
    }),
  ).toContain('exceptions');
  s = move(s, 'attendance', 'att-1', 'approve');
  s = move(s, 'attendancePeriods', 'period', 'close');
  expect(hrState(s).attendancePeriods[0]!.snapshot).toHaveLength(1);
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'attendance',
      id: 'att-1',
      expectedVersion: 3,
      operation: 'correct',
      reason: 'Fix',
    }),
  ).toContain('Reopen');
  s = move(s, 'attendancePeriods', 'period', 'reopen');
  s = move(s, 'attendance', 'att-1', 'correct');
  s = save(s, 'attendance', {
    ...hrState(s).attendance[0]!,
    checkOut: '07:00',
    reason: 'Corrected shift',
  });
  expect(hrState(s).attendance[0]!.status).toBe('draft');
});

test('payroll requires closed attendance and independent review, freezes snapshots and protects inputs', () => {
  let s = fixture();
  const date = new Date().toISOString().slice(0, 10);
  s = save(s, 'payroll', {
    id: 'pay',
    title: 'Demo',
    startDate: date,
    endDate: date,
    currency: 'USD',
    adjustment: 5,
    reason: 'Illustrative full base plus adjustment',
  });
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'payroll',
      id: 'pay',
      expectedVersion: 1,
      operation: 'prepare',
    }),
  ).toContain('Close an attendance');
  s = save(s, 'attendancePeriods', {
    id: 'period',
    title: 'Period',
    startDate: date,
    endDate: date,
    reason: '',
  });
  s = move(s, 'attendancePeriods', 'period', 'close');
  s = move(s, 'payroll', 'pay', 'prepare');
  expect(hrState(s).payroll[0]!.lines![0]).toMatchObject({
    base: 650,
    total: 655,
    currency: 'USD',
  });
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'payroll',
      id: 'pay',
      operation: 'review',
      expectedVersion: 2,
    }),
  ).toContain('Another Payroll admin');
  const reviewer = Object.keys(s.appMembers!.payroll!)[0]!;
  s = move({ ...s, meId: reviewer }, 'payroll', 'pay', 'review');
  s = move(s, 'payroll', 'pay', 'freeze');
  const frozen = structuredClone(hrState(s).payroll[0]!.lines);
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'attendancePeriods',
      id: 'period',
      operation: 'reopen',
      expectedVersion: 2,
      reason: 'Correction',
    }),
  ).toContain('payroll period first');
  expect(hrState(s).payroll[0]!.lines).toEqual(frozen);
  s = move(s, 'payroll', 'pay', 'reopen');
  expect(hrState(s).payroll[0]!.lines).toBeUndefined();
});

test('member scope is own by default, supports same branch and department, and never grants another app', () => {
  let s = fixture();
  s.appMembers!.employees!.lina = 'member';
  s.meId = 'lina';
  expect(visibleRecords(s, 'employees').map((e) => e.id)).toEqual(['hr-lina']);
  expect(visibleRecords(s, 'applications')).toHaveLength(0);
  s = { ...s, meId: 'dara' };
  s = applyHR(s, {
    kind: 'scope',
    app: 'employees',
    personId: 'lina',
    scope: 'department',
  });
  s.hr!.employees = [
    ...s.hr!.employees,
    {
      ...s.hr!.employees.find((e) => e.id === 'hr-lina')!,
      id: 'same-team',
      code: 'NEW',
      email: 'team@example.test',
      accountId: '',
    },
  ];
  expect(
    visibleRecords({ ...s, meId: 'lina' }, 'employees').map((e) => e.id),
  ).toEqual(['hr-lina', 'same-team']);
  expect(
    hrProblem(
      { ...s, meId: 'lina' },
      { kind: 'scope', app: 'employees', personId: 'lina', scope: 'all' },
    ),
  ).toContain('Only app admins');
});

test('imports reconcile duplicates, support quoted commas, preserve existing records and are atomic', () => {
  const s = fixture();
  const headers =
    'code,name,email,department,branch,position,startDate,salary,currency,leaveAllowance';
  const input = `${headers}\nEMP-2001,"Sok, Sophea",sok@example.test,Operations,Phnom Penh,Coordinator,2026-01-05,600,USD,18\nEMP-2001,Duplicate,other@example.test,Operations,Phnom Penh,Coordinator,2026-01-05,600,USD,18`;
  const preview = previewEmployees(s, input);
  expect(preview[0]!.record.name).toBe('Sok, Sophea');
  expect(preview[1]!.problem).toContain('unique');
  const all: HRCommand = {
    kind: 'import',
    records: preview.map((p) => p.record),
  };
  expect(applyHR(s, all)).toBe(s);
  const next = applyHR(s, { kind: 'import', records: [preview[0]!.record] });
  expect(hrState(next).employees).toHaveLength(5);
  expect(hrState(s).employees).toHaveLength(4);
  expect(() => parseCSV('"unclosed')).toThrow('Close');
});

test('scheduled employee changes preserve current pay until effective and reject stale revisions', () => {
  let s = fixture();
  const e = hrState(s).employees[1]!;
  const future = new Date();
  future.setUTCDate(future.getUTCDate() + 7);
  const command: HRCommand = {
    kind: 'schedule',
    change: {
      id: 'change',
      employeeId: e.id,
      expectedVersion: e.version,
      effectiveDate: future.toISOString().slice(0, 10),
      patch: {
        position: 'Senior coordinator',
        department: e.department,
        branch: e.branch,
        salary: 900,
        currency: 'USD',
        managerId: e.managerId,
      },
      reason: 'Promotion',
      status: 'pending',
      createdById: '',
      createdAt: '',
    },
  };
  s = applyHR(s, command);
  expect(hrState(s).employees[1]!.salary).toBe(e.salary);
  expect(hrProblem(s, { kind: 'applyChange', id: 'change' })).toContain(
    'not effective',
  );
  s.hr!.changes![0]!.effectiveDate = new Date().toISOString().slice(0, 10);
  s = applyHR(s, { kind: 'applyChange', id: 'change' });
  expect(hrState(s).employees[1]!.salary).toBe(900);
  expect(hrState(s).changes![0]!.status).toBe('applied');
  expect(applyHR(s, { kind: 'applyChange', id: 'change' })).toBe(s);
});

test('offboarding blocks custody and unfinished tasks, revokes access, and rehire retains episodes', () => {
  let s = fixture();
  const e: Employee = {
    ...baseEmployee(s, 'departing'),
    accountId: 'lina',
    endDate: new Date().toISOString().slice(0, 10),
  };
  s.hr!.employees = s.hr!.employees.filter((e) => e.accountId !== 'lina');
  s = save(s, 'employees', e);
  s = save(s, 'assets', { ...s.hr!.assets[0]!, employeeId: e.id });
  s = move(s, 'assets', 'hr-laptop', 'assign');
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'employees',
      id: e.id,
      operation: 'offboard',
      expectedVersion: 1,
      reason: 'Resignation',
    }),
  ).toContain('Return assigned');
  s = move(s, 'assets', 'hr-laptop', 'return');
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'employees',
      id: e.id,
      operation: 'offboard',
      expectedVersion: 1,
      reason: 'Resignation',
    }),
  ).toContain('Reassign');
  s.tasks = s.tasks.map((t) =>
    [t.ownerId, t.assignedById].includes('lina')
      ? { ...t, ownerId: 'dara', assignedById: 'dara' }
      : t,
  );
  s = move(s, 'employees', e.id, 'offboard');
  expect(s.appMembers!.tasks!.lina).toBeUndefined();
  const future = new Date();
  future.setUTCDate(future.getUTCDate() + 1);
  s = move(
    s,
    'employees',
    e.id,
    'rehire',
    `${future.toISOString().slice(0, 10)} Returning team member`,
  );
  expect(hrState(s).episodes.filter((x) => x.employeeId === e.id)).toHaveLength(
    2,
  );
  expect(s.appMembers!.tasks!.lina).toBeUndefined();
});

test('training snapshots passing criteria, records failed attempts, retries, and creates one draft evaluation', () => {
  let s = fixture();
  s = save(s, 'enrollments', {
    id: 'enroll',
    employeeId: 'hr-alex',
    courseId: 'hr-course',
    score: 60,
    evidence: 'First exercise',
    attended: false,
    attempts: [],
  });
  s = move(s, 'enrollments', 'enroll', 'attend');
  s = move(s, 'enrollments', 'enroll', 'assess');
  expect(hrState(s).enrollments[0]!.status).toBe('failed');
  s = move(s, 'enrollments', 'enroll', 'retry');
  s = save(s, 'enrollments', {
    ...hrState(s).enrollments[0]!,
    score: 80,
    evidence: 'Second exercise',
  });
  s.hr!.courses[0]!.passScore = 95;
  s = move(s, 'enrollments', 'enroll', 'assess');
  expect(hrState(s).enrollments[0]!.status).toBe('completed');
  expect(hrState(s).enrollments[0]!.attempts).toHaveLength(2);
  s = applyHR(s, { kind: 'evaluation', enrollmentId: 'enroll' });
  expect(s.surveys.at(-1)!.status).toBe('draft');
  expect(hrState(s).enrollments[0]!.surveyId).toBe(s.surveys.at(-1)!.id);
  expect(applyHR(s, { kind: 'evaluation', enrollmentId: 'enroll' })).toBe(s);
});

test('room reservations reject overlapping times and allow adjacent bookings', () => {
  let s = fixture();
  const row = {
    id: 'room-1',
    assetId: 'hr-room',
    employeeId: 'hr-alex',
    date: nextMonday(),
    startTime: '09:00',
    endTime: '10:00',
    purpose: 'Planning',
  };
  s = save(s, 'reservations', row);
  const original = hrState(s).reservations[0]!;
  expect(
    hrProblem(s, {
      kind: 'save',
      collection: 'reservations',
      record: { ...original, id: 'room-2', startTime: '09:30' },
    }),
  ).toContain('already reserved');
  s = save(s, 'reservations', {
    ...original,
    id: 'room-2',
    startTime: '10:00',
    endTime: '11:00',
  });
  expect(hrState(s).reservations).toHaveLength(2);
});

test('reports reconcile with source records, preserve snapshots and require source permissions', () => {
  let s = fixture();
  const row = {
    id: 'rpt',
    title: 'Headcount',
    source: 'headcount' as const,
    department: '',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  };
  s = save(s, 'reports', row);
  expect(
    reportRows(s, hrState(s).reports[0]!).reduce((n, r) => n + r.value, 0),
  ).toBe(4);
  s = move(s, 'reports', 'rpt', 'snapshot');
  const snapshot = structuredClone(hrState(s).reports[0]!.snapshot);
  s = save(s, 'employees', baseEmployee(s, 'new-employee'));
  expect(hrState(s).reports[0]!.snapshot).toEqual(snapshot);
  const viewer = {
    ...s,
    meId: 'lina',
    appMembers: { ...s.appMembers, reports: { lina: 'admin' } },
  };
  expect(reportRows(viewer, hrState(s).reports[0]!)).toEqual([]);
});

test('unauthorized and stale commands preserve state, and manager cycles are rejected', () => {
  const s = fixture(),
    e = hrState(s).employees[0]!;
  expect(
    applyHR(
      { ...s, meId: 'lina' },
      {
        kind: 'save',
        collection: 'employees',
        record: { ...e, salary: 1 },
        expectedVersion: e.version,
        reason: 'Edit',
      },
    ).hr,
  ).toEqual(s.hr);
  expect(
    hrProblem(s, {
      kind: 'save',
      collection: 'employees',
      record: e,
      expectedVersion: 999,
      reason: 'Edit',
    }),
  ).toContain('changed');
  expect(
    hrProblem(s, {
      kind: 'save',
      collection: 'employees',
      record: { ...e, managerId: 'hr-alex' },
      expectedVersion: e.version,
      reason: 'Edit',
    }),
  ).toContain('cycle');
});

test('Employee admin role alone does not grant compensation read or write access', () => {
  let s = fixture();
  const e = hrState(s).employees.find((e) => e.id === 'hr-alex')!;
  expect(
    hrProblem(
      { ...s, meId: 'alex' },
      {
        kind: 'save',
        collection: 'employees',
        record: { ...e, salary: 900 },
        expectedVersion: e.version,
        reason: 'Raise',
      },
    ),
  ).toContain('explicit write access');
  s = applyHR(s, {
    kind: 'compensationAccess',
    personId: 'alex',
    access: 'write',
  });
  expect(
    hrProblem(
      { ...s, meId: 'alex' },
      {
        kind: 'save',
        collection: 'employees',
        record: { ...e, salary: 900 },
        expectedVersion: e.version,
        reason: 'Raise',
      },
    ),
  ).toBeUndefined();
  expect(
    hrProblem(
      { ...s, meId: 'alex' },
      { kind: 'compensationAccess', personId: 'alex', access: 'write' },
    ),
  ).toContain('workspace owner');
});

test('hiring finds an unused employee code and requires a usable onboarding task status', () => {
  let s = fixture();
  s = save(s, 'employees', { ...baseEmployee(s, 'manual'), code: 'EMP-1006' });
  for (const op of ['shortlist', 'interview', 'offer', 'accept'])
    s = move(s, 'applications', 'hr-application', op);
  const a = hrState(s).applications[0]!;
  const command: HRCommand = {
    kind: 'transition',
    collection: 'applications',
    id: a.id,
    operation: 'hire',
    expectedVersion: a.version,
  };
  expect(
    hrProblem(
      {
        ...s,
        taskStatuses: s.taskStatuses.map((status) => ({
          ...status,
          requireReady: true,
        })),
      },
      command,
    ),
  ).toContain('ungated');
  s = applyHR(s, command);
  expect(new Set(hrState(s).employees.map((e) => e.code)).size).toBe(
    hrState(s).employees.length,
  );
});

test('performance review requires evidence, independent publication and employee acknowledgment', () => {
  let s = fixture();
  s = save(s, 'reviews', {
    id: 'review',
    employeeId: 'hr-alex',
    title: 'Quarterly outcomes',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    goal: 'Reduce request turnaround to two working days',
    selfEvidence: '',
    managerEvidence: '',
    rating: 0,
    development: '',
  });
  s = move(s, 'reviews', 'review', 'launch');
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'reviews',
      id: 'review',
      operation: 'submit',
      expectedVersion: 2,
    }),
  ).toContain('self-review evidence');
  s = save(s, 'reviews', {
    ...hrState(s).reviews[0]!,
    selfEvidence: 'Reduced median turnaround from five days to two',
  });
  s = move(s, 'reviews', 'review', 'submit');
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'reviews',
      id: 'review',
      operation: 'publish',
      expectedVersion: 4,
    }),
  ).toContain('manager evidence');
  s = save(s, 'reviews', {
    ...hrState(s).reviews[0]!,
    managerEvidence: 'Verified request history over the review period',
    rating: 4,
    development: 'Complete the process improvement course',
  });
  expect(
    hrProblem(
      { ...s, meId: 'alex' },
      {
        kind: 'transition',
        collection: 'reviews',
        id: 'review',
        operation: 'publish',
        expectedVersion: 5,
      },
    ),
  ).toContain('Another Performance admin');
  s = move(s, 'reviews', 'review', 'publish');
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'reviews',
      id: 'review',
      operation: 'acknowledge',
      expectedVersion: 6,
    }),
  ).toContain('Only the reviewed employee');
  s = move({ ...s, meId: 'alex' }, 'reviews', 'review', 'acknowledge');
  expect(hrState(s).reviews[0]!.status).toBe('acknowledged');
});

test('offboarding blocks orphaned approval steps and removes old scope, compensation and pending invitations', () => {
  let s = fixture();
  s.tasks = [];
  const employee = hrState(s).employees.find((e) => e.id === 'hr-lina')!;
  s = save(
    s,
    'employees',
    { ...employee, endDate: new Date().toISOString().slice(0, 10) },
    'Prepare departure',
  );
  s.hr!.compensationAccess = { lina: 'write' };
  s.hr!.scopes.employees = { lina: 'all' };
  s.appInvitations = [
    {
      id: 'old-invite',
      app: 'employees',
      email: employee.email,
      role: 'admin',
      status: 'pending',
      invitedById: 'dara',
      createdAt: new Date().toISOString(),
      expiresAt: '2099-01-01T00:00:00Z',
    },
  ];
  s.requests = [
    {
      id: 'pending-review',
      type: 'purchase',
      title: 'Pending review',
      description: 'Evidence',
      status: 'pending',
      requesterId: 'dara',
      department: 'Operations',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: [
        {
          id: 'review',
          name: 'Reviewer',
          approverId: 'lina',
          status: 'current',
        },
      ],
      activity: [],
      attachments: [],
    },
  ];
  const command: HRCommand = {
    kind: 'transition',
    collection: 'employees',
    id: employee.id,
    operation: 'offboard',
    expectedVersion: 2,
    reason: 'Resignation',
  };
  expect(hrProblem(s, command)).toContain('pending approval steps');
  s.requests[0]!.status = 'withdrawn';
  s = applyHR(s, command);
  expect(hrState(s).employees.find((e) => e.id === employee.id)!.status).toBe(
    'exited',
  );
  expect(hrState(s).compensationAccess!.lina).toBeUndefined();
  expect(hrState(s).scopes.employees!.lina).toBeUndefined();
  expect(s.appInvitations![0]!.status).toBe('revoked');
});
