import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { seed } from './seed';
import { mekongSeed } from './seedMekong';
import { cleanValues, matches, validateForm } from '../lib/forms';
import type { Access, Activity, Channel, FormField, FormValues, Lead, NotificationEvent, NotificationPrefs, ApprovalStep, DataState, Meeting, Process, Request, RequestType, Survey, Task, TaskStatus, TaskStatusDef } from './types';

// Its own key: this site shares the anumat-erp.github.io origin with the main prototype.
const STORAGE_KEY = 'anumat-hackathon-v1';

type Action =
  | { type: 'decide'; requestId: string; decision: 'approve' | 'changes' | 'decline'; comment?: string; answers?: FormValues }
  | { type: 'comment'; requestId: string; text: string }
  | { type: 'create'; request: Request }
  | { type: 'submit'; requestId: string }
  | { type: 'update'; requestId: string; patch: Partial<Request>; submit?: boolean }
  | { type: 'withdraw'; requestId: string }
  | { type: 'createMeeting'; meeting: Meeting }
  | { type: 'switchUser'; personId: string }
  | { type: 'markSeen' }
  | { type: 'setupOrg'; name: string; size: string; activeProcessIds: string[]; access?: Record<string, Access> }
  | { type: 'setAccess'; personId: string; access: Access }
  | { type: 'moveTask'; taskId: string; status: TaskStatus; note?: string; signOff?: boolean }
  | { type: 'taskStatus'; taskId: string; status: TaskStatus }
  | { type: 'addTask'; task: Task }
  | { type: 'updateTask'; taskId: string; patch: Partial<Task> }
  | { type: 'deleteTask'; taskId: string }
  | { type: 'commentTask'; taskId: string; text: string }
  | { type: 'addFeedback'; kind: 'survey' | 'feedback' | 'problem'; score?: number; text: string }
  | { type: 'dismissSurvey' }
  | { type: 'addLead'; lead: Omit<Lead, 'id' | 'at'> }
  | { type: 'setChannel'; event: NotificationEvent; channel: Channel; on: boolean }
  | { type: 'connectTelegram'; username: string }
  | { type: 'disconnectTelegram' }
  | { type: 'saveStatuses'; statuses: TaskStatusDef[] }
  | { type: 'addDecision'; meetingId: string; text: string }
  | { type: 'saveProcess'; process: Process }
  | { type: 'createProcess'; process: Process }
  | { type: 'setBuilder'; personId: string; on: boolean }
  | { type: 'saveSurvey'; survey: Survey }
  | { type: 'publishSurvey'; surveyId: string }
  | { type: 'closeSurvey'; surveyId: string }
  | { type: 'reopenSurvey'; surveyId: string; closesAt?: string }
  | { type: 'deleteSurvey'; surveyId: string }
  | { type: 'answerSurvey'; surveyId: string; answers: FormValues }
  | { type: 'reset' };

const now = () => new Date().toISOString();
let counter = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Build the approval route for a request from its process, amount and form answers. */
export function routeFor(processes: Process[], type: RequestType, amount?: number, answers: FormValues = {}): ApprovalStep[] {
  const process = processes.find((p) => p.requestType === type && p.active);
  if (!process) return [];
  return process.steps
    .filter((s) => (s.minAmount === undefined || (amount ?? 0) > s.minAmount) && (!s.when || matches(s.when, answers)))
    .map((s, i) => ({ id: s.id, name: s.name, approverId: s.approverId, status: i === 0 ? 'current' : 'waiting' }));
}

/** What the approver of a request's current step has to fill in, from its process. */
export function stepForm(state: DataState, r: Request): FormField[] {
  const current = r.steps.find((s) => s.status === 'current');
  if (!current) return [];
  return state.processes.find((p) => p.requestType === r.type)?.steps.find((s) => s.id === current.id)?.fields ?? [];
}

/** Approving needs details first (a required step field), so it can't happen in one tap or in bulk. */
export function needsDetails(state: DataState, r: Request) {
  return stepForm(state, r).some((f) => f.required && f.kind !== 'section');
}

/** Put a request (back) into approval with a fresh route from its process. */
function submitted(state: DataState, r: Request, verb: string): Request {
  const time = now();
  return {
    ...r,
    status: 'pending',
    createdAt: r.status === 'draft' ? time : r.createdAt,
    updatedAt: time,
    steps: routeFor(state.processes, r.type, r.amount, r.fields),
    activity: [...r.activity, { id: uid('a'), at: time, personId: state.meId, kind: 'event', text: verb }],
  };
}

function updateRequest(state: DataState, id: string, fn: (r: Request) => Request): DataState {
  return { ...state, requests: state.requests.map((r) => (r.id === id ? fn(r) : r)) };
}

function reducer(state: DataState, action: Action): DataState {
  switch (action.type) {
    case 'decide':
      return updateRequest(state, action.requestId, (r) => {
        const i = r.steps.findIndex((s) => s.status === 'current');
        const step = r.steps[i];
        if (!step) return r;
        const form = stepForm(state, r);
        // Approving must include the step's required details; anything else (a stray bulk approve) is ignored.
        if (action.decision === 'approve' && Object.keys(validateForm(form, action.answers ?? {})).length) return r;
        const answers = action.decision === 'approve' && form.length ? cleanValues(form, action.answers ?? {}) : undefined;
        const time = now();
        const stepStatus = action.decision === 'approve' ? 'done' : action.decision === 'changes' ? 'returned' : 'declined';
        const steps = r.steps.map((s, j) => {
          if (j === i) return { ...s, status: stepStatus, at: time, comment: action.comment || undefined, answers, fields: answers ? form : undefined } as ApprovalStep;
          if (j === i + 1 && action.decision === 'approve') return { ...s, status: 'current' } as ApprovalStep;
          return s;
        });
        const last = i === r.steps.length - 1;
        const status =
          action.decision === 'approve' ? (last ? 'approved' : 'pending') : action.decision === 'changes' ? 'changes' : 'declined';
        const verb = action.decision === 'approve' ? `approved ${step.name}` : action.decision === 'changes' ? 'requested changes' : 'declined the request';
        const activity: Activity[] = [
          ...r.activity,
          { id: uid('a'), at: time, personId: state.meId, kind: 'event', text: verb },
          ...(action.comment ? [{ id: uid('a'), at: time, personId: state.meId, kind: 'comment' as const, text: action.comment }] : []),
        ];
        return { ...r, steps, status, updatedAt: time, activity };
      });
    case 'comment':
      return updateRequest(state, action.requestId, (r) => ({
        ...r,
        updatedAt: now(),
        activity: [...r.activity, { id: uid('a'), at: now(), personId: state.meId, kind: 'comment', text: action.text }],
      }));
    case 'create':
      return { ...state, requests: [action.request, ...state.requests] };
    case 'submit':
      return updateRequest(state, action.requestId, (r) => submitted(state, r, 'submitted the request'));
    case 'update':
      return updateRequest(state, action.requestId, (r) => {
        const next = { ...r, ...action.patch, updatedAt: now() };
        if (!action.submit) return next;
        return submitted(state, next, r.status === 'changes' ? 'made changes and resubmitted' : 'submitted the request');
      });
    case 'withdraw':
      return updateRequest(state, action.requestId, (r) => ({
        ...r,
        status: 'withdrawn',
        updatedAt: now(),
        steps: r.steps.map((s) => (s.status === 'current' ? { ...s, status: 'waiting' as const } : s)),
        activity: [...r.activity, { id: uid('a'), at: now(), personId: state.meId, kind: 'event', text: 'withdrew the request' }],
      }));
    case 'createMeeting':
      return { ...state, meetings: [...state.meetings, action.meeting] };
    case 'switchUser':
      return { ...state, meId: action.personId };
    case 'setupOrg':
      // The demo workspace keeps its people and history; sign-up names it and picks processes.
      return {
        ...state,
        org: { name: action.name, size: action.size },
        people: action.access ? state.people.map((p) => (action.access?.[p.id] && p.access !== 'owner' ? { ...p, access: action.access[p.id] as Access } : p)) : state.people,
        processes: state.processes.map((p) => ({ ...p, active: action.activeProcessIds.includes(p.id) })),
      };
    case 'markSeen':
      return { ...state, lastSeen: { ...state.lastSeen, [state.meId]: now() } };
    case 'taskStatus':
      return reducer(state, { type: 'updateTask', taskId: action.taskId, patch: { status: action.status } });
    case 'updateTask':
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== action.taskId) return t;
          const next = { ...t, ...action.patch };
          if (action.patch.status !== undefined && action.patch.status !== t.status) {
            const done = statusDef(state, next.status).category === 'done';
            next.doneAt = done ? (t.doneAt ?? now()) : undefined;
            next.statusChangedAt = now();
          }
          return next;
        }),
      };
    case 'moveTask': {
      const target = statusDef(state, action.status);
      const moved = reducer(state, { type: 'updateTask', taskId: action.taskId, patch: { status: action.status } });
      return {
        ...moved,
        tasks: moved.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                statusNote: target.requireNote ? action.note : undefined,
                signOffRequestedAt: action.signOff ? now() : undefined,
              }
            : t,
        ),
      };
    }
    case 'setAccess':
      return { ...state, people: state.people.map((p) => (p.id === action.personId ? { ...p, access: action.access } : p)) };
    case 'commentTask':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, comments: [...(t.comments ?? []), { id: uid('c'), at: now(), personId: state.meId, text: action.text }] }
            : t,
        ),
      };
    case 'addFeedback':
      return {
        ...state,
        feedback: [{ id: uid('f'), at: now(), personId: state.meId, kind: action.kind, score: action.score, text: action.text }, ...state.feedback],
        surveyAt: action.kind === 'survey' ? { ...state.surveyAt, [state.meId]: now() } : state.surveyAt,
      };
    case 'dismissSurvey':
      return { ...state, surveyAt: { ...state.surveyAt, [state.meId]: now() } };
    case 'addLead':
      return { ...state, leads: [{ ...action.lead, id: uid('lead'), at: now() }, ...state.leads] };
    case 'setChannel': {
      const prefs = prefsFor(state, state.meId);
      const list = prefs.events[action.event].filter((c) => c !== action.channel);
      const events = { ...prefs.events, [action.event]: action.on ? [...list, action.channel] : list };
      return { ...state, notificationPrefs: { ...state.notificationPrefs, [state.meId]: { ...prefs, events } } };
    }
    case 'connectTelegram': {
      const prefs = prefsFor(state, state.meId);
      // Connecting turns Telegram on for approvals and meetings, the two most useful in chat.
      const add = (e: NotificationEvent) => (prefs.events[e].includes('telegram') ? prefs.events[e] : [...prefs.events[e], 'telegram' as const]);
      return {
        ...state,
        notificationPrefs: {
          ...state.notificationPrefs,
          [state.meId]: {
            events: { ...prefs.events, approvals: add('approvals'), meetings: add('meetings') },
            telegram: { username: action.username, connectedAt: now() },
          },
        },
      };
    }
    case 'disconnectTelegram': {
      const prefs = prefsFor(state, state.meId);
      const events = Object.fromEntries(
        Object.entries(prefs.events).map(([k, v]) => [k, v.filter((c) => c !== 'telegram')]),
      ) as NotificationPrefs['events'];
      return { ...state, notificationPrefs: { ...state.notificationPrefs, [state.meId]: { events } } };
    }
    case 'deleteTask':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.taskId) };
    case 'saveStatuses': {
      // Tasks in a removed status go back to the first "to do" status.
      const ids = new Set(action.statuses.map((s) => s.id));
      const fallback = action.statuses.find((s) => s.category === 'todo')?.id ?? 'todo';
      return {
        ...state,
        taskStatuses: action.statuses,
        tasks: state.tasks.map((t) => (ids.has(t.status) ? t : { ...t, status: fallback, doneAt: undefined })),
      };
    }
    case 'addTask':
      return { ...state, tasks: [action.task, ...state.tasks] };
    case 'addDecision':
      return {
        ...state,
        meetings: state.meetings.map((m) =>
          m.id === action.meetingId ? { ...m, decisions: [...m.decisions, { id: uid('d'), text: action.text }] } : m,
        ),
      };
    case 'createProcess':
      return { ...state, processes: [...state.processes, action.process] };
    case 'setBuilder':
      return { ...state, people: state.people.map((p) => (p.id === action.personId ? { ...p, canBuildProcesses: action.on } : p)) };
    case 'saveProcess':
      return { ...state, processes: state.processes.map((p) => (p.id === action.process.id ? action.process : p)) };
    case 'saveSurvey':
      return state.surveys.some((x) => x.id === action.survey.id)
        ? { ...state, surveys: state.surveys.map((x) => (x.id === action.survey.id ? action.survey : x)) }
        : { ...state, surveys: [action.survey, ...state.surveys] };
    case 'publishSurvey':
      return { ...state, surveys: state.surveys.map((x) => (x.id === action.surveyId ? { ...x, status: 'open', publishedAt: x.publishedAt ?? now() } : x)) };
    case 'closeSurvey':
      return { ...state, surveys: state.surveys.map((x) => (x.id === action.surveyId ? { ...x, status: 'closed', closesAt: now() } : x)) };
    case 'reopenSurvey':
      return { ...state, surveys: state.surveys.map((x) => (x.id === action.surveyId ? { ...x, status: 'open', closesAt: action.closesAt, publishedAt: now() } : x)) };
    case 'deleteSurvey':
      return {
        ...state,
        surveys: state.surveys.filter((x) => x.id !== action.surveyId),
        surveyResponses: state.surveyResponses.filter((x) => x.surveyId !== action.surveyId),
      };
    case 'answerSurvey': {
      const sv = state.surveys.find((x) => x.id === action.surveyId);
      // Closed while they were answering, not for them, or already answered: nothing to save.
      if (!sv || !isOpen(sv) || !surveyAudience(state, sv).some((p) => p.id === state.meId)) return state;
      if (state.surveyResponses.some((x) => x.surveyId === action.surveyId && x.personId === state.meId)) return state;
      return {
        ...state,
        surveyResponses: [
          ...state.surveyResponses,
          { id: uid('resp'), surveyId: action.surveyId, personId: state.meId, at: now(), answers: action.answers },
        ],
      };
    }
    case 'reset':
      return seed;
  }
}

/** Everything, across workspaces: one person can belong to several companies. */
interface Root {
  active: string;
  spaces: Record<string, DataState>;
}

type WorkspaceAction =
  | { type: 'switchWorkspace'; id: string }
  | { type: 'createWorkspace'; name: string; size: string; activeProcessIds: string[]; access?: Record<string, Access> };

export type StoreAction = Action | WorkspaceAction;

const initialRoot = (): Root => ({ active: 'lotus', spaces: { lotus: seed, mekong: mekongSeed } });

function rootReducer(root: Root, action: StoreAction): Root {
  switch (action.type) {
    case 'switchWorkspace':
      return root.spaces[action.id] ? { ...root, active: action.id } : root;
    case 'createWorkspace': {
      // A new company starts from the demo data, renamed and set up as chosen.
      const id = uid('ws');
      const me = root.spaces[root.active]?.meId ?? 'dara';
      const base: DataState = { ...seed, meId: me, people: seed.people.map((p) => (p.id === me ? { ...p, access: 'owner' as const } : p.access === 'owner' ? { ...p, access: 'admin' as const } : p)) };
      const space = reducer(base, { type: 'setupOrg', name: action.name, size: action.size, activeProcessIds: action.activeProcessIds, access: action.access });
      return { active: id, spaces: { ...root.spaces, [id]: space } };
    }
    case 'reset':
      return initialRoot();
    default: {
      const current = root.spaces[root.active];
      if (!current) return root;
      return { ...root, spaces: { ...root.spaces, [root.active]: reducer(current, action) } };
    }
  }
}

function load(): Root {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Root;
      if (saved.spaces?.[saved.active]) return saved;
    }
  } catch {
    // Storage blocked or corrupt: start from the demo data.
  }
  return initialRoot();
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  access: Access | undefined;
}

interface Store {
  state: DataState;
  dispatch: (action: StoreAction) => void;
  person: (id: string) => DataState['people'][number];
  me: DataState['people'][number];
  workspaces: WorkspaceSummary[];
  activeWorkspace: string;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [root, dispatch] = useReducer(rootReducer, undefined, load);
  const state = root.spaces[root.active] as DataState;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
    } catch {
      // Not saved; the demo still works for this visit.
    }
  }, [root]);

  const workspaces = useMemo(
    () =>
      Object.entries(root.spaces).map(([id, s]) => ({
        id,
        name: s.org.name,
        access: s.people.find((p) => p.id === s.meId)?.access,
      })),
    [root.spaces],
  );

  const person = useCallback(
    (id: string) => state.people.find((p) => p.id === id) ?? { id, name: 'Unknown', role: '', department: '', access: 'member' as const },
    [state.people],
  );
  const value = useMemo(
    () => ({ state, dispatch, person, me: person(state.meId), workspaces, activeWorkspace: root.active }),
    [state, person, workspaces, root.active],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>.');
  return ctx;
}

/** Requests whose current step is waiting on the signed-in person. */
export function waitingOnMe(state: DataState) {
  return state.requests.filter(
    (r) => r.status === 'pending' && r.steps.some((s) => s.status === 'current' && s.approverId === state.meId),
  );
}

export interface Notification {
  id: string;
  at: string;
  personId: string;
  text: string;
  href: string;
}

/** What the signed-in person should hear about: others acting on requests they are part of, and meeting invites. */
export function notificationsFor(state: DataState): Notification[] {
  const me = state.meId;
  const fromRequests = state.requests
    .filter((r) => r.requesterId === me || r.steps.some((s) => s.approverId === me))
    .flatMap((r) =>
      r.activity
        .filter((a) => a.personId !== me)
        .map((a) => ({
          id: `${r.id}-${a.id}`,
          at: a.at,
          personId: a.personId,
          text: a.kind === 'comment' ? `commented on ${r.title}: “${a.text}”` : `${a.text} · ${r.title}`,
          href: `/requests/${r.id}`,
        })),
    );
  const fromMeetings = state.meetings
    .filter((m) => m.createdAt && m.attendeeIds.includes(me) && m.organizerId !== me)
    .map((m) => ({
      id: `m-${m.id}`,
      at: m.createdAt ?? '',
      personId: m.organizerId,
      text: `invited you to ${m.title}`,
      href: `/meetings/${m.id}`,
    }));
  const fromTasks = state.tasks
    .filter((t) => t.assignedById === me && t.ownerId !== me && t.signOffRequestedAt)
    .map((t) => ({
      id: `t-${t.id}`,
      at: t.signOffRequestedAt ?? '',
      personId: t.ownerId,
      text: `finished “${t.title}” and asked you to sign off`,
      href: '/tasks',
    }));
  // RACI: consulted people are asked for input before sign-off; informed people hear when it's done or blocked.
  const fromRaci = state.tasks.flatMap((t) => {
    const status = statusDef(state, t.status);
    const out: Notification[] = [];
    if (t.consultedIds?.includes(me) && t.signOffRequestedAt) {
      out.push({ id: `c-${t.id}`, at: t.signOffRequestedAt, personId: t.ownerId, text: `asked for your input on “${t.title}” before sign-off`, href: '/tasks' });
    }
    if (t.informedIds?.includes(me) && t.statusChangedAt && (status.category === 'done' || status.requireNote)) {
      out.push({
        id: `i-${t.id}-${t.statusChangedAt}`,
        at: t.statusChangedAt,
        personId: t.ownerId,
        text: status.category === 'done' ? `finished “${t.title}”` : `marked “${t.title}” ${status.name.toLowerCase()}${t.statusNote ? `: ${t.statusNote}` : ''}`,
        href: '/tasks',
      });
    }
    return out;
  });
  const fromSurveys = surveysToAnswer(state)
    .filter((sv) => sv.createdBy !== me && sv.publishedAt)
    .map((sv) => ({ id: `s-${sv.id}`, at: sv.publishedAt ?? '', personId: sv.createdBy, text: `asked you to answer “${sv.title}”`, href: `/surveys/${sv.id}` }));
  return [...fromRequests, ...fromMeetings, ...fromTasks, ...fromRaci, ...fromSurveys].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
}

const UNKNOWN_STATUS: TaskStatusDef = { id: 'unknown', name: 'Unknown', category: 'todo', tone: 'neutral' };

/** The definition of a task status, falling back to a neutral "to do" if it was removed. */
export function statusDef(state: DataState, id: string): TaskStatusDef {
  return state.taskStatuses.find((s) => s.id === id) ?? UNKNOWN_STATUS;
}

export function isDone(state: DataState, task: Task) {
  return statusDef(state, task.status).category === 'done';
}

/** The first status in a category: where checkboxes send a task. */
export function firstStatus(state: DataState, category: TaskStatusDef['category']) {
  return state.taskStatuses.find((s) => s.category === category)?.id ?? category;
}

/** Admins create surveys and see their results. */
export const canManageSurveys = (state: DataState) => isAdmin(state);

/** People a survey asks: everyone, or the chosen departments. */
export function surveyAudience(state: DataState, survey: Survey) {
  return state.people.filter((p) => survey.audience.length === 0 || survey.audience.includes(p.department));
}

export function surveyResponsesFor(state: DataState, surveyId: string) {
  return state.surveyResponses.filter((r) => r.surveyId === surveyId);
}

export function hasAnswered(state: DataState, surveyId: string, personId = state.meId) {
  return state.surveyResponses.some((r) => r.surveyId === surveyId && r.personId === personId);
}

/** Open, past its closing day? Treated as closed. */
export function isOpen(survey: Survey) {
  return survey.status === 'open' && (!survey.closesAt || new Date(survey.closesAt).getTime() > Date.now());
}

/** Open surveys that ask the signed-in person and that they haven't answered. */
export function surveysToAnswer(state: DataState) {
  const me = state.people.find((p) => p.id === state.meId);
  if (!me) return [];
  return state.surveys.filter(
    (sv) => isOpen(sv) && (sv.audience.length === 0 || sv.audience.includes(me.department)) && !hasAnswered(state, sv.id),
  );
}

/** Owners and admins manage the workspace and can change any task. */
export function isAdmin(state: DataState, personId = state.meId) {
  const access = state.people.find((p) => p.id === personId)?.access;
  return access === 'owner' || access === 'admin';
}

/** The owner, whoever assigned it, and admins can change a task; everyone else can view it. */
export function canEditTask(state: DataState, task: Task) {
  const me = state.meId;
  return task.ownerId === me || task.assignedById === me || isAdmin(state);
}

export type MovePlan =
  | { kind: 'move' }
  | { kind: 'note' }
  | { kind: 'signoff'; via: TaskStatus; assignerId: string }
  | { kind: 'denied'; reason: string };

/** What happens when the signed-in person tries to move a task into a status. */
export function planMove(state: DataState, task: Task, statusId: TaskStatus): MovePlan {
  const name = (id?: string) => state.people.find((p) => p.id === id)?.name ?? 'someone';
  const me = state.meId;
  if (!canEditTask(state, task)) {
    const who = [...new Set([task.ownerId, task.assignedById].filter(Boolean))].map(name).join(', ');
    return { kind: 'denied', reason: `Only ${who} or an admin can change this task.` };
  }
  const target = statusDef(state, statusId);
  const assigner = task.assignedById ?? task.ownerId;
  if (target.signOff && assigner !== me && !isAdmin(state)) {
    // The owner finishes it; the assigner signs off. It waits in the nearest earlier in-progress status.
    const index = state.taskStatuses.findIndex((s) => s.id === statusId);
    const via = state.taskStatuses
      .slice(0, index)
      .reverse()
      .find((s) => s.category === 'active' && !s.requireNote && !s.signOff);
    if (task.ownerId === me && via) return { kind: 'signoff', via: via.id, assignerId: assigner };
    return { kind: 'denied', reason: `${target.name} needs sign-off from ${name(assigner)} or an admin.` };
  }
  if (target.requireNote) return { kind: 'note' };
  return { kind: 'move' };
}

/** Consulted people may comment on a task they can't edit; informed people only read. */
export function canCommentOnTask(state: DataState, task: Task) {
  return canEditTask(state, task) || Boolean(task.consultedIds?.includes(state.meId));
}

const NO_EXTRA_CHANNELS: NotificationPrefs = { events: { approvals: [], requestUpdates: [], tasks: [], meetings: [] } };

export function prefsFor(state: DataState, personId: string): NotificationPrefs {
  return state.notificationPrefs[personId] ?? NO_EXTRA_CHANNELS;
}

/**
 * Ask for survey feedback once someone has made a decision, and at most once
 * every 30 days (answering or dismissing both count).
 */
export function surveyDue(state: DataState) {
  const me = state.meId;
  const decided = state.requests.some((r) => r.steps.some((s) => s.approverId === me && s.at && s.status !== 'current'));
  const last = state.surveyAt[me];
  return decided && (!last || Date.now() - new Date(last).getTime() > 30 * 86_400_000);
}

/** Admins, and members an admin allowed, can create and edit approval processes. */
export function canBuildProcesses(state: DataState, personId = state.meId) {
  return isAdmin(state, personId) || Boolean(state.people.find((p) => p.id === personId)?.canBuildProcesses);
}

/** Can the signed-in person raise requests of this process's type? */
export function canSubmit(state: DataState, process: Process) {
  const dept = state.people.find((p) => p.id === state.meId)?.department;
  return !process.submitters?.length || (dept !== undefined && process.submitters.includes(dept));
}
