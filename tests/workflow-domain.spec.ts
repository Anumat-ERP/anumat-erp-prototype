import { expect, test } from '@playwright/test';
import { seed } from '../src/data/seed';
import { initialAppMembers } from '../src/lib/appAccess';
import { reducer, stepForm } from '../src/data/store';
import type { DataState, Meeting, Process, Request } from '../src/data/types';
import { meetingProblem } from '../src/lib/meetings';
function fixture() {
  const s: DataState = structuredClone(seed);
  s.appMembers = initialAppMembers(s);
  s.requests = [];
  s.meetings = [];
  s.meId = 'alex';
  return s;
}
const process: Process = {
  id: 'review',
  name: 'Review',
  requestType: 'custom',
  active: true,
  trigger: 'Submission',
  steps: [
    {
      id: 'manager',
      name: 'Manager',
      role: 'Manager',
      approverId: 'dara',
      fields: [
        {
          id: 'checked',
          label: 'Confirm original facts',
          kind: 'text',
          required: true,
        },
      ],
    },
  ],
  avgHours: 0,
  runs30d: 0,
};
const request: Request = {
  id: 'CUS-1',
  type: 'custom',
  title: 'Original submission',
  description: 'Original evidence',
  requesterId: 'alex',
  department: 'Operations',
  status: 'pending',
  createdAt: '2026-10-02T08:00:00Z',
  updatedAt: '2026-10-02T08:00:00Z',
  steps: [],
  form: [
    { id: 'purpose', label: 'Original question', kind: 'text', required: true },
  ],
  fields: { purpose: 'Original answer' },
  activity: [],
  attachments: [],
};
test('submitted request freezes review fields even when the process is edited', () => {
  let s = fixture();
  s.processes = [process];
  s = reducer(s, { type: 'create', request });
  const submitted = s.requests[0]!;
  s.processes = [
    {
      ...process,
      steps: [
        {
          ...process.steps[0]!,
          fields: [
            {
              id: 'new',
              kind: 'text',
              label: 'New definition',
              required: true,
            },
          ],
        },
      ],
    },
  ];
  expect(stepForm(s, submitted)[0]!.id).toBe('checked');
  const wrongReviewer = reducer(s, {
    type: 'decide',
    requestId: request.id,
    decision: 'approve',
    answers: { checked: 'Confirmed' },
  });
  expect(wrongReviewer.requests[0]!.status).toBe('pending');
  s = reducer(
    { ...s, meId: 'dara' },
    {
      type: 'decide',
      requestId: request.id,
      decision: 'approve',
      answers: { checked: 'Confirmed' },
    },
  );
  expect(s.requests[0]!.status).toBe('approved');
  expect(s.requests[0]!.steps[0]!.fields![0]!.label).toBe(
    'Confirm original facts',
  );
});
test('return and resubmit archives original answers and decisions, protects requester ownership, and rejects duplicate submission', () => {
  let s = fixture();
  s.processes = [process];
  s = reducer(s, { type: 'create', request });
  s = reducer(
    { ...s, meId: 'dara' },
    {
      type: 'decide',
      requestId: request.id,
      decision: 'changes',
      comment: 'Correct the purpose',
    },
  );
  const wrongEdit = reducer(s, {
    type: 'update',
    requestId: request.id,
    patch: { title: 'Unauthorized' },
    submit: true,
  });
  expect(wrongEdit.requests[0]!.title).toBe('Original submission');
  s = reducer(
    { ...s, meId: 'alex' },
    {
      type: 'update',
      requestId: request.id,
      patch: {
        title: 'Revised submission',
        fields: { purpose: 'Revised answer' },
      },
      submit: true,
    },
  );
  expect(s.requests[0]!.revision).toBe(2);
  expect(s.requests[0]!.revisions![0]).toMatchObject({
    title: 'Original submission',
    fields: { purpose: 'Original answer' },
    status: 'changes',
  });
  expect(s.requests[0]!.revisions![0]!.steps[0]!.comment).toBe(
    'Correct the purpose',
  );
  const twice = reducer(s, { type: 'submit', requestId: request.id });
  expect(twice.requests[0]!.revision).toBe(2);
  expect(twice.requests[0]!.revisions).toHaveLength(1);
  const duplicate = reducer(s, { type: 'create', request });
  expect(duplicate.requests).toHaveLength(1);
});
const meeting: Meeting = {
  id: 'meet',
  title: 'Planning',
  start: '2026-11-02T09:00:00Z',
  durationMin: 30,
  location: 'Angkor',
  organizerId: 'alex',
  attendeeIds: ['alex', 'dara'],
  agenda: [],
  decisions: [],
  requestIds: [],
  createdAt: '2026-10-02T08:00:00Z',
};
test('meeting conflicts recover through rescheduling and cancellation preserves history', () => {
  let s = fixture();
  s = reducer(s, { type: 'createMeeting', meeting });
  expect(
    meetingProblem(s, {
      ...meeting,
      id: 'conflict',
      start: '2026-11-02T09:15:00Z',
    }),
  ).toContain('another meeting');
  expect(
    meetingProblem(s, {
      ...meeting,
      id: 'adjacent',
      start: '2026-11-02T09:30:00Z',
    }),
  ).toBeUndefined();
  const old = s.meetings[0]!.start;
  s = reducer(s, {
    type: 'changeMeeting',
    meetingId: 'meet',
    start: '2026-11-02T10:00:00Z',
    reason: 'Move team planning',
  });
  expect(s.meetings[0]!.history![0]!.previousStart).toBe(old);
  s = reducer(s, {
    type: 'changeMeeting',
    meetingId: 'meet',
    cancel: true,
    reason: 'Team unavailable',
  });
  expect(s.meetings[0]!.status).toBe('cancelled');
  expect(s.meetings[0]!.history).toHaveLength(2);
  expect(
    meetingProblem(s, {
      ...meeting,
      id: 'released',
      start: '2026-11-02T10:00:00Z',
    }),
  ).toBeUndefined();
  const closed = reducer(s, {
    type: 'addDecision',
    meetingId: 'meet',
    text: 'Unauthorized edit',
  });
  expect(closed.meetings[0]!.decisions).toHaveLength(0);
});

test('published survey schema and privacy are fixed, and invalid or duplicate responses are rejected', () => {
  let s = fixture();
  s.meId = 'dara';
  s.surveys = [];
  s.surveyResponses = [];
  s = reducer(s, {
    type: 'saveSurvey',
    survey: {
      id: 'survey',
      title: 'Training evaluation',
      description: 'Feedback',
      fields: [
        { id: 'answer', label: 'Evidence', kind: 'text', required: true },
      ],
      audience: [],
      anonymous: true,
      status: 'draft',
      createdAt: '2026-10-02T08:00:00Z',
      createdBy: 'dara',
    },
  });
  s = reducer(s, { type: 'publishSurvey', surveyId: 'survey' });
  s = reducer(s, {
    type: 'saveSurvey',
    survey: { ...s.surveys[0]!, anonymous: false, fields: [] },
  });
  expect(s.surveys[0]!.anonymous).toBe(true);
  expect(s.surveys[0]!.publishedForm).toHaveLength(1);
  s.meId = 'alex';
  const invalid = reducer(s, {
    type: 'answerSurvey',
    surveyId: 'survey',
    answers: {},
  });
  expect(invalid.surveyResponses).toHaveLength(0);
  s = reducer(s, {
    type: 'answerSurvey',
    surveyId: 'survey',
    answers: { answer: 'Useful', unknown: 'Ignored' },
  });
  expect(s.surveyResponses[0]!.answers).toEqual({ answer: 'Useful' });
  const twice = reducer(s, {
    type: 'answerSurvey',
    surveyId: 'survey',
    answers: { answer: 'Again' },
  });
  expect(twice.surveyResponses).toHaveLength(1);
});
