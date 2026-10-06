import type { DataState, Task } from './types';
import { surveyResponses, surveys } from './seedSurveys';

/** An ISO timestamp `days` from now (negative = past) at `hour`:`minute`. */
export function at(days: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const requests: DataState['requests'] = [];

const SRC = {
  pr1042: { label: 'PR-1042', href: '/requests/PR-1042' },
  ct0412: { label: 'CT-0412', href: '/requests/CT-0412' },
  ops: { label: 'Operations weekly', href: '/meetings/ops-weekly' },
  budget: { label: 'Q4 budget review', href: '/meetings/q4-budget' },
  hiring: { label: 'Hiring sync', href: '/meetings/hiring-sync' },
  vendor: { label: 'Cloud hosting vendor review', href: '/meetings/vendor-review' },
};

// [title, owner, due (days from today), status, source, notes]
const MORE: [string, string, number, string, keyof typeof SRC | null, string?][] = [
  ['Set up accounts for the five new analysts', 'omar', 3, 'todo', 'hiring'],
  ['Order access badges for new starters', 'daniel', 1, 'doing', 'hiring'],
  ['Book onboarding sessions with each team lead', 'daniel', 6, 'todo', 'hiring'],
  ['Prepare the week-one schedule for new analysts', 'alex', 8, 'todo', 'hiring'],
  ['Collect bank details for payroll', 'daniel', -1, 'blocked', 'hiring', 'Waiting on two of the five starters to reply.'],
  ['Check warranty terms on the recommended laptops', 'alex', 0, 'review', 'pr1042'],
  ['Reserve desks on the third floor for the analysts', 'lina', 4, 'todo', 'pr1042'],
  ['Confirm data-processing terms meet our customer contracts, including the EU clauses and the subprocessor list', 'maria', 2, 'doing', 'ct0412', 'Two customer contracts require 30 days’ notice of new subprocessors.'],
  ['Compare the two-year price against a one-year renewal with the current discount', 'priya', 5, 'todo', 'ct0412'],
  ['Draft the migration risk summary', 'omar', 9, 'todo', 'vendor'],
  ['Ask the vendor for their uptime history', 'omar', -3, 'blocked', 'vendor', 'Vendor contact is out until Monday.'],
  ['Map warehouse zones for the stock-count pilot', 'dara', 2, 'doing', 'ops'],
  ['Pick two shifts to trial the new count process', 'alex', 5, 'todo', 'ops'],
  ['Write the stock-count checklist', 'alex', 12, 'todo', 'ops'],
  ['Share the pilot plan with the warehouse leads', 'dara', 7, 'todo', 'ops'],
  ['Update the department budget tracker with Q4 lines', 'priya', 1, 'review', 'budget'],
  ['Tell department heads the events budget is frozen until Q1', 'priya', -2, 'done', 'budget'],
  ['Move the December offsite deposit request to Q1', 'daniel', 20, 'todo', 'budget'],
  ['Renew the design tool licences before they lapse', 'lina', 10, 'todo', null],
  ['Review the travel policy per-diem rates', 'daniel', 15, 'todo', null],
  ['Archive last year’s expense policy', 'priya', -8, 'done', null],
  ['Fix the printer on the second floor', 'omar', -5, 'done', null],
  ['Plan the quarterly operations review', 'dara', 14, 'todo', null],
  ['Send the monthly ops report to leadership', 'dara', -4, 'done', null],
  ['Clean up duplicate supplier records', 'alex', -6, 'doing', null, 'About 40 duplicates left.'],
  ['Get signatures on the Acme NDA renewal', 'maria', 25, 'todo', null],
  ['Prepare the board pack for next month', 'sokha', 18, 'todo', null],
  ['Review team goals with each department head', 'sokha', 3, 'doing', null],
  ['Approve the updated org chart', 'sokha', -1, 'review', null],
  ['Replace the meeting room screen', 'omar', 30, 'todo', null],
];

const MORE_TASKS: Task[] = MORE.map(([title, ownerId, days, status, source, notes], i) => ({
  id: `m${i + 1}`,
  title,
  ownerId,
  due: at(days),
  status,
  source: source ? SRC[source] : undefined,
  notes,
  doneAt: status === 'done' ? at(Math.min(days, -1), 15) : undefined,
}));

const ORGANIZER: Record<string, string> = {
  '/meetings/ops-weekly': 'dara',
  '/meetings/vendor-review': 'omar',
  '/meetings/q4-budget': 'priya',
  '/meetings/hiring-sync': 'daniel',
};

/**
 * Who assigned each demo task: the meeting organiser for action items, the
 * requester's manager (Dara, for Operations) for request follow-ups, else the owner.
 */
function withAssigners(tasks: Task[]): Task[] {
  return tasks.map((t) => {
    const href = t.source?.href ?? '';
    let by = t.ownerId;
    if (ORGANIZER[href]) by = ORGANIZER[href];
    else if (href.startsWith('/requests/') && ['alex', 'lina'].includes(t.ownerId)) by = 'dara';
    return {
      ...t,
      assignedById: by,
      statusNote: t.status === 'blocked' ? (t.notes ?? 'Waiting on someone outside the team.') : undefined,
    };
  });
}

/** Example consulted people, so the RACI view has something to show. */
const CONSULTED: Record<string, string[]> = { t3: ['omar', 'priya'], m8: ['priya'], m9: ['dara'], t1: ['priya'] };

/**
 * RACI defaults for demo tasks: other meeting attendees, or the request's
 * approvers, are kept informed. R (owner) and A (assigner) are already set.
 */
function withRaci(state: DataState): DataState {
  const informedFor = (t: Task) => {
    const href = t.source?.href ?? '';
    const meeting = state.meetings.find((m) => href === `/meetings/${m.id}`);
    const request = state.requests.find((r) => href === `/requests/${r.id}`);
    const ids = meeting ? meeting.attendeeIds : request ? request.steps.map((s) => s.approverId) : [];
    return [...new Set(ids)].filter((id) => id !== t.ownerId && id !== t.assignedById);
  };
  return {
    ...state,
    tasks: state.tasks.map((t) => ({
      ...t,
      consultedIds: CONSULTED[t.id] ?? [],
      informedIds: informedFor(t).filter((id) => !(CONSULTED[t.id] ?? []).includes(id)),
    })),
  };
}

export const seed: DataState = withRaci({
  org: { name: 'Lotus Logistics', size: '50–199' },
  feedback: [
    { id: 'f1', at: at(-5, 16), personId: 'alex', kind: 'survey', score: 9, text: 'Much faster than chasing approvals on Telegram. Would love reminders there too.' },
    { id: 'f2', at: at(-4, 11), personId: 'priya', kind: 'survey', score: 7, text: 'Finance review is clear. I need to see the budget line next to the amount.' },
    { id: 'f3', at: at(-2, 9), personId: 'daniel', kind: 'feedback', text: 'Leave requests should show who else is off that week.' },
  ],
  leads: [],
  surveys,
  surveyResponses,
  surveyAt: { alex: at(-5, 16), priya: at(-4, 11), daniel: at(-2, 9) },
  notificationPrefs: {
    priya: {
      events: { approvals: ['telegram'], requestUpdates: ['email'], tasks: ['telegram'], meetings: ['telegram'], surveys: [] },
      telegram: { username: 'priya_shah', connectedAt: at(-20) },
    },
  },
  meId: 'dara',
  lastSeen: { dara: at(-2, 18), alex: at(-3, 18), priya: at(-3, 18), sokha: at(-10), maria: at(-10), daniel: at(-10), lina: at(-10), omar: at(-10) },
  people: [
    { id: 'dara', name: 'Dara Sok', role: 'Operations Manager', department: 'Operations', access: 'owner' },
    { id: 'alex', name: 'Alex Tan', role: 'Operations Lead', department: 'Operations', access: 'member' },
    { id: 'priya', name: 'Priya Shah', role: 'Finance Manager', department: 'Finance', access: 'member', canBuildProcesses: true },
    { id: 'sokha', name: 'Sokha Chan', role: 'Chief Executive', department: 'Leadership', access: 'admin' },
    { id: 'maria', name: 'Maria Lopez', role: 'Legal Counsel', department: 'Legal', access: 'member' },
    { id: 'daniel', name: 'Daniel Kim', role: 'Head of People', department: 'People', access: 'member' },
    { id: 'lina', name: 'Lina Park', role: 'Product Designer', department: 'Product', access: 'member' },
    { id: 'omar', name: 'Omar Haddad', role: 'IT Lead', department: 'IT', access: 'member' },
  ],
  requests,
  meetings: [
    {
      id: 'ops-weekly',
      title: 'Operations weekly',
      start: at(1, 10, 0),
      durationMin: 45,
      location: 'Room 3 · Video link in invite',
      organizerId: 'dara',
      attendeeIds: ['dara', 'alex', 'priya', 'omar'],
      agenda: ['Onboarding equipment for new analysts', 'Stock-count process pilot', 'Open action items'],
      decisions: [],
      requestIds: ['PR-1042'],
    },
    {
      id: 'vendor-review',
      title: 'Cloud hosting vendor review',
      start: at(3, 14, 0),
      durationMin: 60,
      location: 'Video call',
      organizerId: 'omar',
      attendeeIds: ['omar', 'dara', 'maria', 'priya'],
      agenda: ['Data-processing terms', 'Two-year vs one-year pricing', 'Migration risk'],
      decisions: [],
      requestIds: ['CT-0412'],
    },
    {
      id: 'q4-budget',
      title: 'Q4 budget review',
      start: at(-4, 13, 0),
      durationMin: 90,
      location: 'Board room',
      organizerId: 'priya',
      attendeeIds: ['priya', 'sokha', 'dara', 'daniel'],
      agenda: ['Q3 actuals', 'Q4 equipment line', 'Events budget'],
      decisions: [
        { id: 'd1', text: 'Keep the Q4 equipment line at $40,000.' },
        { id: 'd2', text: 'Freeze new event spending until Q1.', requestId: 'EX-3320' },
      ],
      requestIds: ['EX-3320'],
    },
    {
      id: 'hiring-sync',
      title: 'Hiring sync',
      start: at(-1, 11, 0),
      durationMin: 30,
      location: 'Room 1',
      organizerId: 'daniel',
      attendeeIds: ['daniel', 'dara', 'alex'],
      agenda: ['Analyst start dates', 'Onboarding checklist'],
      decisions: [{ id: 'd1', text: 'All five analysts start on the 1st; equipment must arrive by the 28th.', requestId: 'PR-1042' }],
      requestIds: ['PR-1042'],
    },
  ],
  documents: [
    {
      id: 'doc-laptop',
      name: 'Laptop_Proposal.pdf',
      kind: 'pdf',
      status: 'review',
      ownerId: 'alex',
      size: 2_400_000,
      linkedTo: { label: 'PR-1042', href: '/requests/PR-1042' },
      versions: [
        { version: 'v2', at: at(-2, 9, 0), authorId: 'alex', note: 'Added second supplier quote' },
        { version: 'v1', at: at(-4, 16, 0), authorId: 'alex', note: 'First draft' },
      ],
    },
    {
      id: 'doc-cloud',
      name: 'Cloud_Hosting_Contract_v3.pdf',
      kind: 'pdf',
      status: 'review',
      ownerId: 'maria',
      size: 1_120_000,
      linkedTo: { label: 'CT-0412', href: '/requests/CT-0412' },
      versions: [
        { version: 'v3', at: at(-4, 15, 0), authorId: 'maria', note: 'Updated data-processing annex' },
        { version: 'v2', at: at(-6, 11, 0), authorId: 'omar', note: 'Vendor redlines' },
        { version: 'v1', at: at(-9, 10, 0), authorId: 'omar', note: 'Vendor draft' },
      ],
    },
    {
      id: 'doc-budget',
      name: 'Q4_Budget.xlsx',
      kind: 'sheet',
      status: 'approved',
      ownerId: 'priya',
      size: 356_000,
      linkedTo: { label: 'Q4 budget review', href: '/meetings/q4-budget' },
      versions: [
        { version: 'v4', at: at(-4, 17, 0), authorId: 'priya', note: 'Final after review meeting' },
        { version: 'v3', at: at(-6, 10, 0), authorId: 'priya', note: 'Department inputs' },
      ],
    },
    {
      id: 'doc-onboarding',
      name: 'Onboarding_Checklist.docx',
      kind: 'doc',
      status: 'draft',
      ownerId: 'daniel',
      size: 48_000,
      linkedTo: { label: 'Hiring sync', href: '/meetings/hiring-sync' },
      versions: [{ version: 'v1', at: at(-1, 12, 0), authorId: 'daniel', note: 'First draft' }],
    },
    {
      id: 'doc-travel',
      name: 'Travel_Policy.pdf',
      kind: 'pdf',
      status: 'approved',
      ownerId: 'daniel',
      size: 220_000,
      versions: [{ version: 'v5', at: at(-40, 9, 0), authorId: 'daniel', note: 'Per-diem rates for 2026' }],
    },
    {
      id: 'doc-vendors',
      name: 'Vendor_Comparison.xlsx',
      kind: 'sheet',
      status: 'draft',
      ownerId: 'omar',
      size: 128_000,
      linkedTo: { label: 'Cloud hosting vendor review', href: '/meetings/vendor-review' },
      versions: [{ version: 'v1', at: at(-3, 14, 0), authorId: 'omar', note: 'Three vendors compared' }],
    },
    {
      id: 'doc-nda',
      name: 'NDA_Acme.pdf',
      kind: 'pdf',
      status: 'approved',
      ownerId: 'maria',
      size: 150_000,
      linkedTo: { label: 'CT-0409', href: '/requests/CT-0409' },
      versions: [{ version: 'v1', at: at(-19, 9, 0), authorId: 'maria', note: 'Signed by both parties' }],
    },
    {
      id: 'doc-expense',
      name: 'Expense_Policy_2025.pdf',
      kind: 'pdf',
      status: 'archived',
      ownerId: 'priya',
      size: 190_000,
      versions: [{ version: 'v3', at: at(-280, 9, 0), authorId: 'priya', note: 'Replaced by the 2026 policy' }],
    },
  ],
  sprints: [],
  taskStatuses: [
    { id: 'todo', name: 'To do', category: 'todo', tone: 'neutral', locked: true },
    { id: 'doing', name: 'In progress', category: 'active', tone: 'info' },
    { id: 'blocked', name: 'Blocked', category: 'active', tone: 'critical', requireNote: true },
    { id: 'review', name: 'In review', category: 'active', tone: 'warning' },
    { id: 'done', name: 'Done', category: 'done', tone: 'success', locked: true, signOff: true },
  ],
  tasks: withAssigners([
    { id: 't1', title: 'Confirm laptop delivery date with supplier', ownerId: 'alex', due: at(2), status: 'doing', source: { label: 'PR-1042', href: '/requests/PR-1042' } },
    { id: 't2', title: 'Send onboarding checklist to new analysts', ownerId: 'daniel', due: at(5), status: 'todo', source: { label: 'Hiring sync', href: '/meetings/hiring-sync' } },
    { id: 't3', title: 'Review data-processing annex', ownerId: 'maria', due: at(1), status: 'doing', source: { label: 'CT-0412', href: '/requests/CT-0412' } },
    { id: 't4', title: 'Get a second quote for ergonomic chairs', ownerId: 'alex', due: at(-2), status: 'todo', source: { label: 'PR-1036', href: '/requests/PR-1036' } },
    { id: 't5', title: 'Share Q4 budget with department heads', ownerId: 'priya', due: at(-3), status: 'done', doneAt: at(-3, 16), source: { label: 'Q4 budget review', href: '/meetings/q4-budget' } },
    { id: 't6', title: 'Draft stock-count pilot plan', ownerId: 'dara', due: at(4), status: 'todo', source: { label: 'Operations weekly', href: '/meetings/ops-weekly' } },
    { id: 't7', title: 'Finish the barcode scanner request', ownerId: 'dara', due: at(-1), status: 'todo', source: { label: 'PR-1045', href: '/requests/PR-1045' } },
    { id: 't8', title: 'Update the vendor comparison with support SLAs', ownerId: 'omar', due: at(2), status: 'todo', source: { label: 'Cloud hosting vendor review', href: '/meetings/vendor-review' } },
    { id: 't9', title: 'Approve Q4 team goals', ownerId: 'dara', due: at(-6), status: 'done', doneAt: at(-6, 11) },
    ...MORE_TASKS,
  ]),
  processes: [],
});
