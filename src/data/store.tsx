import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { seed } from './seed';
import type { Activity, ApprovalStep, DataState, Meeting, Process, Request, RequestType, Task, TaskStatus, TaskStatusDef } from './types';

const STORAGE_KEY = 'anumat-prototype-v4';

type Action =
  | { type: 'decide'; requestId: string; decision: 'approve' | 'changes' | 'decline'; comment?: string }
  | { type: 'comment'; requestId: string; text: string }
  | { type: 'create'; request: Request }
  | { type: 'submit'; requestId: string }
  | { type: 'update'; requestId: string; patch: Partial<Request>; submit?: boolean }
  | { type: 'withdraw'; requestId: string }
  | { type: 'createMeeting'; meeting: Meeting }
  | { type: 'switchUser'; personId: string }
  | { type: 'markSeen' }
  | { type: 'setupOrg'; name: string; size: string; activeProcessIds: string[] }
  | { type: 'taskStatus'; taskId: string; status: TaskStatus }
  | { type: 'addTask'; task: Task }
  | { type: 'updateTask'; taskId: string; patch: Partial<Task> }
  | { type: 'deleteTask'; taskId: string }
  | { type: 'saveStatuses'; statuses: TaskStatusDef[] }
  | { type: 'addDecision'; meetingId: string; text: string }
  | { type: 'saveProcess'; process: Process }
  | { type: 'reset' };

const now = () => new Date().toISOString();
let counter = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Build the approval route for a request from its process and amount. */
export function routeFor(processes: Process[], type: RequestType, amount?: number): ApprovalStep[] {
  const process = processes.find((p) => p.requestType === type && p.active);
  if (!process) return [];
  return process.steps
    .filter((s) => s.minAmount === undefined || (amount ?? 0) > s.minAmount)
    .map((s, i) => ({ id: s.id, name: s.name, approverId: s.approverId, status: i === 0 ? 'current' : 'waiting' }));
}

/** Put a request (back) into approval with a fresh route from its process. */
function submitted(state: DataState, r: Request, verb: string): Request {
  const time = now();
  return {
    ...r,
    status: 'pending',
    createdAt: r.status === 'draft' ? time : r.createdAt,
    updatedAt: time,
    steps: routeFor(state.processes, r.type, r.amount),
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
        const time = now();
        const stepStatus = action.decision === 'approve' ? 'done' : action.decision === 'changes' ? 'returned' : 'declined';
        const steps = r.steps.map((s, j) => {
          if (j === i) return { ...s, status: stepStatus, at: time, comment: action.comment || undefined } as ApprovalStep;
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
          }
          return next;
        }),
      };
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
    case 'saveProcess':
      return { ...state, processes: state.processes.map((p) => (p.id === action.process.id ? action.process : p)) };
    case 'reset':
      return seed;
  }
}

function load(): DataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...seed, ...(JSON.parse(raw) as Partial<DataState>) };
  } catch {
    // Storage blocked or corrupt: start from the demo data.
  }
  return seed;
}

interface Store {
  state: DataState;
  dispatch: (action: Action) => void;
  person: (id: string) => DataState['people'][number];
  me: DataState['people'][number];
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Not saved; the demo still works for this visit.
    }
  }, [state]);

  const person = useCallback(
    (id: string) => state.people.find((p) => p.id === id) ?? { id, name: 'Unknown', role: '', department: '' },
    [state.people],
  );
  const value = useMemo(() => ({ state, dispatch, person, me: person(state.meId) }), [state, person]);
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
  return [...fromRequests, ...fromMeetings].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
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
