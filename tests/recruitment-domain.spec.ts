import { expect, test } from '@playwright/test';
import { seed } from '../src/data/seed';
import { initialAppMembers, memberChangeProblem } from '../src/lib/appAccess';
import { applyHR, hrProblem, hrState } from '../src/hr/engine';
import { emptyHR, type HRCommand } from '../src/hr/types';
import { recruitmentState, recruitmentProblem } from '../src/hr/recruitment';
import type {
  RecruitmentCommand,
  Requisition,
  Interview,
} from '../src/hr/recruitmentTypes';
import type { DataState } from '../src/data/types';
import { reducer } from '../src/data/store';
const fixture = () => {
  const s = structuredClone(seed);
  s.meId = 'dara';
  s.hr = emptyHR();
  s.appMembers = initialAppMembers(s);
  return applyHR(s, { kind: 'loadExamples' });
};
function run(s: DataState, command: RecruitmentCommand) {
  expect(recruitmentProblem(s, command)).toBeUndefined();
  return applyHR(s, { kind: 'recruitment', command });
}
function move(s: DataState, operation: string) {
  const a = hrState(s).applications[0]!;
  const c: HRCommand = {
    kind: 'transition',
    collection: 'applications',
    id: a.id,
    expectedVersion: a.version,
    operation,
    reason: 'Reviewed evidence',
  };
  expect(hrProblem(s, c)).toBeUndefined();
  return applyHR(s, c);
}
const today = () => new Date().toISOString().slice(0, 10);
const req = (s: DataState): Requisition => ({
  ...recruitmentState(s).requisitions[0]!,
  id: 'new-headcount',
  version: 0,
  status: 'draft',
  vacancyId: undefined,
  requestId: undefined,
  reviewerId: 'alex',
  createdById: 'dara',
});
const interview = (s: DataState): Interview => ({
  id: 'interview-1',
  version: 0,
  applicationId: hrState(s).applications[0]!.id,
  interviewerId: 'alex',
  startsAt: `${today()}T10:00`,
  duration: 60,
  location: 'Meeting room',
  criteria: 'Coordination and clear written evidence',
  status: 'scheduled',
  score: 0,
  evidence: '',
  recommendation: 'advance',
});
function offered(s: DataState) {
  s = move(move(s, 'shortlist'), 'interview');
  const a = hrState(s).applications[0]!;
  s = run(s, {
    action: 'offer',
    applicationId: a.id,
    expectedVersion: a.version,
    reviewerId: 'alex',
    terms: 'Monthly base, probation and start date.',
  });
  const o = recruitmentState(s).offers[0]!;
  s = run(
    { ...s, meId: 'alex' },
    {
      action: 'offerDecision',
      id: o.id,
      expectedVersion: o.version,
      operation: 'approve',
      reason: 'Within budget',
    },
  );
  return move({ ...s, meId: 'dara' }, 'offer');
}
test('headcount approval creates one linked vacancy and a real approval request', () => {
  let s = run(fixture(), { action: 'requisition', record: req(fixture()) });
  let q = recruitmentState(s).requisitions.find(
    (q) => q.id === 'new-headcount',
  )!;
  s = run(s, {
    action: 'requisitionDecision',
    id: q.id,
    expectedVersion: q.version,
    operation: 'submit',
    reason: 'Expansion',
  });
  q = recruitmentState(s).requisitions.find((q) => q.id === 'new-headcount')!;
  expect(
    recruitmentProblem(s, {
      action: 'requisitionDecision',
      id: 'new-headcount',
      expectedVersion: 2,
      operation: 'approve',
      reason: 'Self',
    }),
  ).toContain('independent');
  const pending = recruitmentState(s).requisitions.find(
    (q) => q.id === 'new-headcount',
  )!;
  s = reducer(
    { ...s, meId: 'alex' },
    {
      type: 'decide',
      requestId: pending.requestId!,
      decision: 'approve',
      comment: 'Budget reviewed',
    },
  );
  const approved = recruitmentState(s).requisitions.find(
    (q) => q.id === 'new-headcount',
  )!;
  expect(approved.status).toBe('approved');
  expect(s.requests.find((q) => q.id === pending.requestId)?.status).toBe(
    'approved',
  );
  expect(
    hrState(s).vacancies.filter((v) => v.requisitionId === approved.id),
  ).toHaveLength(1);
  expect(
    applyHR(s, {
      kind: 'recruitment',
      command: {
        action: 'requisitionDecision',
        id: approved.id,
        expectedVersion: approved.version,
        operation: 'approve',
        reason: 'Retry',
      },
    }),
  ).toBe(s);
});
test('JD changes require fresh requisition snapshot and cannot change approved capacity', () => {
  let s = fixture(),
    p = recruitmentState(s).positions[0]!;
  s = run(s, { action: 'requisition', record: req(s) });
  s = run(s, {
    action: 'position',
    record: { ...p, description: 'New responsibilities' },
    expectedVersion: p.version,
  });
  const q = recruitmentState(s).requisitions.find(
    (q) => q.id === 'new-headcount',
  )!;
  expect(
    recruitmentProblem(s, {
      action: 'requisitionDecision',
      id: q.id,
      expectedVersion: q.version,
      operation: 'submit',
      reason: 'Submit',
    }),
  ).toContain('description changed');
  expect(recruitmentState(s).requisitions[0]!.position.description).not.toBe(
    'New responsibilities',
  );
  const v = hrState(s).vacancies[0]!;
  expect(
    hrProblem(s, {
      kind: 'save',
      collection: 'vacancies',
      record: { ...v, openings: 10 },
      expectedVersion: v.version,
    }),
  ).toContain('locked');
});
test('assigned assessments, interview conflicts, and withdrawn candidate cancellation', () => {
  let s = move(fixture(), 'shortlist');
  s = run(s, { action: 'interview', record: interview(s) });
  expect(
    recruitmentProblem(s, {
      action: 'interview',
      record: { ...interview(s), id: 'collision' },
    }),
  ).toContain('already has');
  const i = recruitmentState(s).interviews[0]!;
  const c: RecruitmentCommand = {
    action: 'assessment',
    id: i.id,
    expectedVersion: i.version,
    score: 85,
    evidence: 'Clear coordination example',
    recommendation: 'advance',
  };
  expect(recruitmentProblem(s, c)).toContain('assigned interviewer');
  s = run({ ...s, meId: 'alex' }, c);
  expect(hrState(s).applications[0]!.evidence).toBe(
    'Clear coordination example',
  );
  s = move({ ...s, meId: 'dara' }, 'interview');
  expect(hrState(s).applications[0]!.status).toBe('interviewed');
});
test('offer approval is independent, budget bounded and stale revisions are rejected', () => {
  let s = move(move(fixture(), 'shortlist'), 'interview'),
    a = hrState(s).applications[0]!;
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'applications',
      id: a.id,
      expectedVersion: a.version,
      operation: 'offer',
    }),
  ).toContain('independent approval');
  s = run(s, {
    action: 'offer',
    applicationId: a.id,
    expectedVersion: a.version,
    reviewerId: 'alex',
    terms: 'Terms',
  });
  const o = recruitmentState(s).offers[0]!;
  expect(
    recruitmentProblem(s, {
      action: 'offerDecision',
      id: o.id,
      expectedVersion: o.version,
      operation: 'approve',
      reason: 'Self',
    }),
  ).toContain('independent');
  s = applyHR(s, {
    kind: 'save',
    collection: 'applications',
    record: { ...a, salary: 700 },
    expectedVersion: a.version,
  });
  expect(recruitmentState(s).offers[0]!.status).toBe('superseded');
  expect(
    recruitmentProblem(
      { ...s, meId: 'alex' },
      {
        action: 'offerDecision',
        id: o.id,
        expectedVersion: o.version,
        operation: 'approve',
        reason: 'Stale',
      },
    ),
  ).toBeTruthy();
  a = hrState(s).applications[0]!;
  s = applyHR(s, {
    kind: 'save',
    collection: 'applications',
    record: { ...a, salary: 900 },
    expectedVersion: a.version,
  });
  a = hrState(s).applications[0]!;
  expect(
    recruitmentProblem(s, {
      action: 'offer',
      applicationId: a.id,
      expectedVersion: a.version,
      reviewerId: 'alex',
      terms: 'Over budget',
    }),
  ).toContain('budget');
});
test('revising an approved offer invalidates approval even before terms are saved', () => {
  let s = offered(fixture());
  s = move(s, 'revise');
  const a = hrState(s).applications[0]!;
  expect(recruitmentState(s).offers[0]!.status).toBe('superseded');
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'applications',
      id: a.id,
      expectedVersion: a.version,
      operation: 'offer',
    }),
  ).toContain('independent approval');
});
test('acceptance creates no employee; future hire creates one pre-start episode and owned tasks', () => {
  let s = fixture(),
    a = hrState(s).applications[0]!;
  const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  s = applyHR(s, {
    kind: 'save',
    collection: 'applications',
    record: { ...a, startDate: future },
    expectedVersion: a.version,
  });
  s = move(offered(s), 'accept');
  expect(hrState(s).employees).toHaveLength(4);
  s = move(s, 'hire');
  a = hrState(s).applications[0]!;
  const e = hrState(s).employees.find((e) => e.id === a.employeeId)!;
  expect(e.status).toBe('prestart');
  expect(e.accountId).toBe('');
  expect(
    s.tasks.filter((t) => t.id.startsWith(`onboard-${e.id}`)),
  ).toHaveLength(3);
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'employees',
      id: e.id,
      expectedVersion: e.version,
      operation: 'start',
    }),
  ).toContain('agreed start');
});
test('candidate matching keeps applications independent; vacancies pause and close safely', () => {
  let s = fixture(),
    v = hrState(s).vacancies[0]!,
    a = hrState(s).applications[0]!;
  s.hr!.vacancies.push({
    ...v,
    id: 'second-vacancy',
    requisitionId: undefined,
  });
  s = applyHR(s, {
    kind: 'save',
    collection: 'applications',
    record: {
      ...a,
      id: 'second-application',
      vacancyId: 'second-vacancy',
      version: 0,
    },
  });
  expect(hrState(s).applications).toHaveLength(2);
  s = move(s, 'reject');
  expect(hrState(s).applications[1]!.status).toBe('applied');
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'vacancies',
      id: 'second-vacancy',
      expectedVersion: 1,
      operation: 'close',
      reason: 'Close',
    }),
  ).toContain('active applications');
  expect(
    hrProblem(s, {
      kind: 'transition',
      collection: 'vacancies',
      id: 'second-vacancy',
      expectedVersion: 1,
      operation: 'pause',
      reason: 'Wait',
    }),
  ).toBeUndefined();
});
test('reviewer and interviewer access cannot be removed while work is assigned', () => {
  let s = move(fixture(), 'shortlist');
  s = run(s, { action: 'interview', record: interview(s) });
  expect(memberChangeProblem(s, 'recruitment', 'alex', null)).toContain(
    'interviews',
  );
  s = fixture();
  s = move(move(s, 'shortlist'), 'interview');
  const a = hrState(s).applications[0]!;
  s = run(s, {
    action: 'offer',
    applicationId: a.id,
    expectedVersion: a.version,
    reviewerId: 'alex',
    terms: 'Terms',
  });
  expect(memberChangeProblem(s, 'recruitment', 'alex', 'member')).toContain(
    'approvals',
  );
});

test('headcount changes and withdrawal stay connected to Approvals and recover through revision', () => {
  let s = fixture();
  s = run(s, { action: 'requisition', record: req(s) });
  let q = recruitmentState(s).requisitions.find(
    (q) => q.id === 'new-headcount',
  )!;
  s = run(s, {
    action: 'requisitionDecision',
    id: q.id,
    expectedVersion: q.version,
    operation: 'submit',
    reason: 'Expansion',
  });
  q = recruitmentState(s).requisitions.find((q) => q.id === 'new-headcount')!;
  s = reducer(
    { ...s, meId: 'alex' },
    {
      type: 'decide',
      requestId: q.requestId!,
      decision: 'changes',
      comment: 'Clarify team outcomes',
    },
  );
  q = recruitmentState(s).requisitions.find((q) => q.id === 'new-headcount')!;
  expect(q.status).toBe('changes');
  expect(s.requests.find((r) => r.id === q.requestId)!.status).toBe('changes');
  expect(hrState(s).vacancies).toHaveLength(1);
  s = run(
    { ...s, meId: 'dara' },
    {
      action: 'requisitionDecision',
      id: q.id,
      expectedVersion: q.version,
      operation: 'revise',
      reason: 'Update evidence',
    },
  );
  q = recruitmentState(s).requisitions.find((q) => q.id === 'new-headcount')!;
  s = run(s, {
    action: 'requisitionDecision',
    id: q.id,
    expectedVersion: q.version,
    operation: 'submit',
    reason: 'Evidence corrected',
  });
  q = recruitmentState(s).requisitions.find((q) => q.id === 'new-headcount')!;
  s = reducer(s, { type: 'withdraw', requestId: q.requestId! });
  q = recruitmentState(s).requisitions.find((q) => q.id === 'new-headcount')!;
  expect(q.status).toBe('withdrawn');
  expect(s.requests.find((r) => r.id === q.requestId)!.status).toBe(
    'withdrawn',
  );
  expect(hrState(s).vacancies).toHaveLength(1);
});
test('interview date validation rejects normalized nonexistent calendar dates', () => {
  const s = move(fixture(), 'shortlist');
  expect(
    recruitmentProblem(s, {
      action: 'interview',
      record: { ...interview(s), startsAt: '2026-02-31T09:00' },
    }),
  ).toContain('valid time');
});

test('candidate profile dates and project links validate without requiring a background', () => {
  const s = fixture();
  const record = structuredClone(hrState(s).applications[0]!);
  const command = () => ({ kind: 'save' as const, collection: 'applications' as const, record, expectedVersion: record.version });
  delete record.profile;
  expect(hrProblem(s, command())).toBeUndefined();
  record.profile = { education: [], experience: [], skills: [], projects: [], notes: '' };
  record.profile.experience.push({ company: 'Example', role: 'Developer', startDate: '2024-02-31', endDate: '', current: true, achievements: '' });
  expect(hrProblem(s, command())).toContain('Check employment dates');
  record.profile.experience[0].startDate = '2024-03-01';
  record.profile.experience[0].current = false;
  record.profile.experience[0].endDate = '2024-02-29';
  expect(hrProblem(s, command())).toContain('Check employment dates');
  record.profile.experience[0].endDate = '2024-05-01';
  record.profile.projects.push({ name: 'Portfolio', type: 'Personal', role: '', url: 'javascript:alert(1)', outcomes: '' });
  expect(hrProblem(s, command())).toContain('http or https');
  record.profile.projects[0].url = 'https://example.test';
  expect(hrProblem(s, command())).toBeUndefined();
  const next = applyHR(s, command());
  expect(hrState(next).applications[0].profile).toEqual(record.profile);
  expect(hrState(s).applications[0].profile?.experience[0].company).toBe('Example Logistics Co.');
});

test('JD management validates codes and ranges, preserves approved details and rejects archived requisitions', () => {
  let s = fixture();
  let p = recruitmentState(s).positions[0]!;
  expect(recruitmentProblem(s, { action: 'position', record: { ...p, id: 'copy', version: 0, code: p.code!.toLowerCase() } })).toContain('already in use');
  expect(recruitmentProblem(s, { action: 'position', expectedVersion: p.version, record: { ...p, details: { salaryMin: 800, salaryMax: 700 } } })).toContain('valid salary range');
  expect(recruitmentProblem(s, { action: 'position', expectedVersion: p.version, record: { ...p, details: { publicSalary: true } } })).toContain('both salary amounts');
  const vacancy = structuredClone(hrState(s).vacancies[0]!);
  s = run(s, { action: 'position', expectedVersion: p.version, record: { ...p, status: 'archived', revisionNote: 'Pause role', details: { ...p.details, responsibilities: 'Changed future responsibilities' } } });
  p = recruitmentState(s).positions[0]!;
  expect(hrState(s).vacancies[0].jobDetails).toEqual(vacancy.jobDetails);
  expect(recruitmentState(s).requisitions[0].position.details).toEqual(vacancy.jobDetails);
  expect(recruitmentState(s).history.at(-1)?.reason).toBe('Pause role');
  expect(recruitmentProblem(s, { action: 'requisition', record: { ...req(s), positionVersion: p.version } })).toContain('archived');
  expect(hrProblem(s, { kind: 'save', collection: 'vacancies', expectedVersion: vacancy.version, record: { ...vacancy, jobDetails: { ...vacancy.jobDetails, responsibilities: 'Tampered approved requirements' } } })).toContain('locked');
  s = run(s, { action: 'position', expectedVersion: p.version, record: { ...p, status: 'active', revisionNote: 'Restore role' } });
  p = recruitmentState(s).positions[0]!;
  expect(recruitmentProblem(s, { action: 'requisition', record: { ...req(s), positionVersion: p.version } })).toBeUndefined();
});
