import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { seed } from './seed';
import type { Activity, ApprovalStep, DataState, Process, Request, RequestType, Task, TaskStatus } from './types';

const STORAGE_KEY = 'anumat-prototype-v1';

type Action =
  | { type: 'decide'; requestId: string; decision: 'approve' | 'changes' | 'decline'; comment?: string }
  | { type: 'comment'; requestId: string; text: string }
  | { type: 'create'; request: Request }
  | { type: 'submit'; requestId: string }
  | { type: 'taskStatus'; taskId: string; status: TaskStatus }
  | { type: 'addTask'; task: Task }
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
      return updateRequest(state, action.requestId, (r) => ({
        ...r,
        status: 'pending',
        updatedAt: now(),
        steps: routeFor(state.processes, r.type, r.amount),
        activity: [...r.activity, { id: uid('a'), at: now(), personId: state.meId, kind: 'event', text: 'submitted the request' }],
      }));
    case 'taskStatus':
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.taskId ? { ...t, status: action.status } : t)) };
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
    if (raw) return JSON.parse(raw) as DataState;
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
