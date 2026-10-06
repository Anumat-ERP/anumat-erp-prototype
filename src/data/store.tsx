import {applyCommercial, type CommercialCommand} from '../lib/commercial';
import {decisionProblem,executionProblem,followUpProblem} from '../lib/workflowCompletion';
import { NOTIFICATION_APPS } from '../lib/notificationApps';
import { reviewerChangeProblem } from '../lib/approvalDelegation';
import { companyConfiguration, configurationProblem } from '../lib/companyConfiguration';
import { isBackupState } from '../lib/workspaceBackup';
import type { CompanyConfiguration, WorkCalendar } from './types';
import type { BusinessStarter } from '../lib/businessStarter';
import { meetingProblem } from '../lib/meetings';
import { COLLECTION_APP } from '../hr/types';
import { visibleRecords } from '../hr/engine';
import { applyHR } from '../hr/engine';
import { emptyHR, type HRCommand } from '../hr/types';
import { appRole, appPeople, canContributeToApp, initialAppMembers, isAppAdmin, memberChangeProblem, taskTeamProblem, APP_ROLES } from '../lib/appAccess';
import { appFromRoute } from '../lib/moduleEntry';
import type { WorkspaceApp } from '../lib/moduleEntry';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { seed } from './seed';
import { mekongSeed } from './seedMekong';
import { taskStructureProblem, requirementProblem, TASK_DEFAULTS } from '../lib/taskRequirements';
import { sprintProblem } from '../lib/sprints';
import { cleanValues, formProblems, matches, validateForm } from '../lib/forms';
import type { AppInvitation, AppRole, Access, Activity, Channel, FormField, FormValues, Lead, NotificationEvent, NotificationPrefs, ApprovalStep, DataState, Meeting, Process, Request, RequestType, Survey, Sprint, Task, TaskStatus, TaskStatusDef, TaskDefaults } from './types';

// Its own key: this site shares the anumat-erp.github.io origin with the main prototype.
const STORAGE_KEY = 'anumat-hackathon-v1';

// Remove the shipped request/approval examples from workspaces saved by older versions.
// New work created by a person has generated IDs and remains untouched.
const STARTER_REQUEST_IDS = new Set([
  'PR-1042', 'LV-2031', 'EX-3317', 'PR-1044', 'CT-0412', 'PR-1036',
  'PR-1039', 'EX-3309', 'EX-3320', 'LV-2027', 'CT-0409', 'PR-1045',
  'PR-0007', 'CT-0003',
]);
const STARTER_PROCESS_IDS = new Set(['proc-purchase', 'proc-expense', 'proc-leave', 'proc-contract']);
const starterRequestLink = (href?: string) =>
  Boolean(href?.startsWith('/requests/') && STARTER_REQUEST_IDS.has(href.slice('/requests/'.length)));

function withoutStarterWorkflow(state: DataState): DataState {
  return {
    ...state,
    hr: state.hr ?? emptyHR(),
    appMembers: state.appMembers ?? initialAppMembers(state),
    appInvitations: state.appInvitations ?? [],
    taskDefaults: state.taskDefaults ?? TASK_DEFAULTS,
    sprints: Array.isArray(state.sprints) ? state.sprints : [],
    requests: state.requests.filter((request) => !STARTER_REQUEST_IDS.has(request.id)),
    processes: state.processes.filter((process) => !STARTER_PROCESS_IDS.has(process.id)),
    tasks: state.tasks.filter((task) => !starterRequestLink(task.source?.href)),
    documents: state.documents.filter((document) => !starterRequestLink(document.linkedTo?.href)),
    meetings: state.meetings.map((meeting) => ({
      ...meeting,
      requestIds: meeting.requestIds.filter((id) => !STARTER_REQUEST_IDS.has(id)),
      decisions: meeting.decisions.map((decision) => STARTER_REQUEST_IDS.has(decision.requestId ?? '')
        ? { ...decision, requestId: undefined }
        : decision),
    })),
  };
}

type Action =
  | {type:'commercial';command:CommercialCommand}
  | {type:'requestExecution';requestId:string;expectedUpdatedAt:string;effectiveDate:string;outcome?:'failed'|'applied'|'cancelled';reason?:string}
  | {type:'surveyFollowUp';surveyId:string;interpretation:string;task:Task}
  | { type: 'changeReviewer'; requestId: string; personId: string; reason: string; expectedUpdatedAt: string }
  | { type: 'configureCompany'; name: string; configuration: CompanyConfiguration; calendar: WorkCalendar }
  | { type: 'previewDelivery'; event: NotificationEvent; channel: Channel; result: 'failed' | 'previewed'; previewId?: string }
  | { type: 'hr'; command: HRCommand }
  | { type: 'setAppMember'; app: WorkspaceApp; personId: string; role: AppRole | null }
  | { type: 'inviteAppMember'; invitation: AppInvitation }
  | { type: 'revokeAppInvitation'; invitationId: string }
  | { type: 'acceptAppInvitation'; invitationId: string; name: string }
  | { type: 'decide'; requestId: string; decision: 'approve' | 'changes' | 'decline'; comment?: string; answers?: FormValues }
  | { type: 'comment'; requestId: string; text: string }
  | { type: 'create'; request: Request }
  | { type: 'submit'; requestId: string }
  | { type: 'update'; requestId: string; patch: Partial<Request>; submit?: boolean }
  | { type: 'withdraw'; requestId: string }
  | { type: 'createMeeting'; meeting: Meeting }
  | { type: 'changeMeeting'; meetingId: string; start?: string; durationMin?: number; cancel?: boolean; reason: string }
  | { type: 'switchUser'; personId: string }
  | { type: 'markSeen' }
  | { type: 'setupOrg'; name: string; size: string; starter?: BusinessStarter; activeProcessIds: string[]; access?: Record<string, Access> }
  | { type: 'setAccess'; personId: string; access: Access }
  | { type: 'moveTask'; taskId: string; status: TaskStatus; note?: string; signOff?: boolean }
  | { type: 'taskStatus'; taskId: string; status: TaskStatus }
  | { type: 'saveSprint'; sprint: Sprint }
  | { type: 'startSprint'; sprintId: string }
  | { type: 'completeSprint'; sprintId: string; moveTo?: string }
  | { type: 'addTask'; task: Task }
  | { type: 'saveTask'; taskId: string; patch: Partial<Task>; status: TaskStatus; note?: string }
  | { type: 'updateTask'; taskId: string; patch: Partial<Task> }
  | { type: 'deleteTask'; taskId: string }
  | { type: 'commentTask'; taskId: string; text: string }
  | { type: 'addFeedback'; kind: 'survey' | 'feedback' | 'problem'; score?: number; text: string }
  | { type: 'dismissSurvey' }
  | { type: 'addLead'; lead: Omit<Lead, 'id' | 'at'> }
  | { type: 'setNotificationEmail'; email: string }
  | { type: 'setInAppNotification'; event: NotificationEvent; on: boolean }
  | { type: 'setChannel'; event: NotificationEvent; channel: Channel; on: boolean }
  | { type: 'connectTelegram'; username: string }
  | { type: 'disconnectTelegram' }
  | { type: 'saveTaskDefaults'; defaults: TaskDefaults }
  | { type: 'saveStatuses'; statuses: TaskStatusDef[] }
  | { type: 'addDecision'; meetingId: string; text: string; audienceIds?: string[]; kind?: 'decision'|'minutes' }
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
    .map((s, i) => ({ id: s.id, name: s.name, approverId: s.approverId, status: i === 0 ? 'current' : 'waiting', fields: structuredClone(s.fields ?? []) }));
}

/** What the approver of a request's current step has to fill in, from its process. */
export function stepForm(state: DataState, r: Request): FormField[] {
  const current = r.steps.find((s) => s.status === 'current');
  if (!current) return [];
  return current.fields ?? state.processes.find((p) => p.requestType === r.type)?.steps.find((s) => s.id === current.id)?.fields ?? [];
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
    execution: undefined,
    submittedAt: time,
    revision: (r.revision ?? 0) + 1,
    form: structuredClone(r.form ?? []),
    createdAt: r.status === 'draft' ? time : r.createdAt,
    updatedAt: time,
    steps: routeFor(state.processes, r.type, r.amount, r.fields),
    activity: [...r.activity, { id: uid('a'), at: time, personId: state.meId, kind: 'event', text: verb }],
  };
}

function updateRequest(state: DataState, id: string, fn: (r: Request) => Request): DataState {
  return { ...state, requests: state.requests.map((r) => (r.id === id ? fn(r) : r)) };
}

export function reducer(state: DataState, action: Action): DataState {
  const appActions: Partial<Record<Action['type'], WorkspaceApp>> = {
    decide: 'approvals', comment: 'approvals', create: 'approvals', submit: 'approvals', update: 'approvals', withdraw: 'approvals', saveProcess: 'approvals', createProcess: 'approvals', setBuilder: 'approvals',
    createMeeting: 'meetings', changeMeeting: 'meetings', addDecision: 'meetings', answerSurvey: 'surveys',
  };
  const actionApp = appActions[action.type];
  if (['submit','update'].includes(action.type) && 'requestId' in action && state.hr?.recruitment?.requisitions.some(q => q.requestId === action.requestId)) return state;
  if (actionApp && !canContributeToApp(state, actionApp)) return state;
  if (['saveSurvey', 'publishSurvey', 'closeSurvey', 'reopenSurvey', 'deleteSurvey'].includes(action.type) && !isAppAdmin(state, 'surveys')) return state;
  switch (action.type) {
    case 'commercial': return applyCommercial(state,action.command);
    case 'requestExecution': {
      if(executionProblem(state,action.requestId,action.expectedUpdatedAt,action.effectiveDate,action.outcome,action.reason))return state;
      return updateRequest(state,action.requestId,r=>({...r,updatedAt:now(),execution:{revision:r.revision??1,effectiveDate:r.execution?.effectiveDate??action.effectiveDate,status:action.outcome??r.execution?.status??'pending',attempts:action.outcome?[...(r.execution?.attempts??[]),{at:now(),actorId:state.meId,outcome:action.outcome,reason:action.reason!.trim()}]:r.execution?.attempts??[]},activity:[...r.activity,{id:uid('activity'),at:now(),personId:state.meId,kind:'event',text:action.outcome?`Simulated execution ${action.outcome}: ${action.reason!.trim()}`:`Scheduled execution preview for ${action.effectiveDate}`}]}));
    }
    case 'surveyFollowUp': {
      if(followUpProblem(state,action.surveyId,action.interpretation,action.task))return state;
      const added=reducer(state,{type:'addTask',task:{...action.task,source:{label:'Survey follow-up',href:`/surveys/${action.surveyId}`}}});if(added===state)return state;
      return {...added,surveys:added.surveys.map(s=>s.id===action.surveyId?{...s,followUps:[...(s.followUps??[]),{taskId:action.task.id,interpretation:action.interpretation.trim(),actorId:state.meId,at:now(),responseCount:state.surveyResponses.filter(r=>r.surveyId===s.id).length}]}:s)};
    }
    case 'changeReviewer': {
      if (reviewerChangeProblem(state, action.requestId, action.personId, action.reason, action.expectedUpdatedAt)) return state;
      return { ...state, requests: state.requests.map(request => {
        if (request.id !== action.requestId) return request;
        const current = request.steps.find(step => step.status === 'current')!;
        const oldName = state.people.find(p => p.id === current.approverId)?.name ?? current.approverId;
        const newName = state.people.find(p => p.id === action.personId)!.name;
        return { ...request, updatedAt: now(), steps: request.steps.map(step => step.id === current.id ? { ...step, delegatedFromId: current.approverId, approverId: action.personId } : step), activity: [...request.activity, { id: uid('activity'), at: now(), personId: state.meId, kind: 'event' as const, text: `Changed reviewer from ${oldName} to ${newName}: ${action.reason.trim()}` }] };
      }) };
    }
    case 'configureCompany': {
      if (configurationProblem(state, action.name, action.configuration, action.calendar)) return state;
      return { ...state, org: { ...state.org, name: action.name.trim(), configuration: { ...action.configuration, revision: companyConfiguration(state).revision + 1 }, workCalendar: structuredClone(action.calendar) }, workspaceHistory: [...(state.workspaceHistory ?? []), { at: now(), actorId: state.meId, text: 'Updated company settings' }] };
    }
    case 'previewDelivery': {
      const prefs = prefsFor(state, state.meId);
      const destination = action.channel === 'email' ? prefs.email : prefs.telegram?.username;
      if (!NOTIFICATION_APPS[action.event] || !['email','telegram'].includes(action.channel) || !['failed','previewed'].includes(action.result) || !appRole(state, NOTIFICATION_APPS[action.event]) || !destination || !prefs.events[action.event]?.includes(action.channel)) return state;
      const previews = state.deliveryPreviews ?? [];
      const old = action.previewId ? previews.find(p => p.id === action.previewId) : previews.find(p => p.personId === state.meId && p.event === action.event && p.channel === action.channel && p.destination === destination);
      if (action.previewId && (!old || old.personId !== state.meId || old.destination !== destination || old.event !== action.event || old.channel !== action.channel || old.attempts.at(-1)?.result !== 'failed')) return state;
      const next = { id: old?.id ?? uid('delivery'), personId: state.meId, event: action.event, channel: action.channel, destination, attempts: [...(old?.attempts ?? []), { at: now(), result: action.result }] };
      return { ...state, deliveryPreviews: [...previews.filter(p => p.id !== next.id), next] };
    }
    case 'hr': return applyHR(state, action.command);
    case 'decide': {
      const q = state.hr?.recruitment?.requisitions.find(q => q.requestId === action.requestId && q.status === 'pending');
      if (q) return applyHR(state, {kind:'recruitment', command:{action:'requisitionDecision', id:q.id, expectedVersion:q.version, operation: action.decision, reason:action.comment?.trim() || (action.decision === 'approve' ? 'Approved headcount' : '')}});
      return updateRequest(state, action.requestId, (r) => {
        const i = r.steps.findIndex((s) => s.status === 'current');
        const step = r.steps[i];
        if (!step || r.status !== 'pending' || step.approverId !== state.meId || (action.decision !== 'approve' && !action.comment?.trim())) return r;
        const form = stepForm(state, r);
        // Approving must include the step's required details; anything else (a stray bulk approve) is ignored.
        if (action.decision === 'approve' && Object.keys(validateForm(form, action.answers ?? {})).length) return r;
        const answers = action.decision === 'approve' && form.length ? cleanValues(form, action.answers ?? {}) : undefined;
        const time = now();
        const stepStatus = action.decision === 'approve' ? 'done' : action.decision === 'changes' ? 'returned' : 'declined';
        const steps = r.steps.map((s, j) => {
          if (j === i) return { ...s, status: stepStatus, at: time, comment: action.comment || undefined, answers, fields: structuredClone(form) } as ApprovalStep;
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
    }
    case 'comment':
      return updateRequest(state, action.requestId, (r) => ({
        ...r,
        updatedAt: now(),
        activity: [...r.activity, { id: uid('a'), at: now(), personId: state.meId, kind: 'comment', text: action.text }],
      }));
    case 'create': {
      const r = action.request;
      if (r.requesterId !== state.meId || state.requests.some(x => x.id === r.id) || !['draft', 'pending'].includes(r.status)) return state;
      const process = state.processes.find(p => p.active && p.requestType === r.type);
      if (r.status === 'pending' && (!process || !canSubmit(state, process) || !routeFor(state.processes, r.type, r.amount, r.fields).length)) return state;
      const request = r.status === 'pending' ? { ...r, submittedAt: r.createdAt, revision: 1, form: structuredClone(r.form ?? []), steps: routeFor(state.processes, r.type, r.amount, r.fields), revisions: [] } : r;
      return { ...state, requests: [request, ...state.requests] };
    }
    case 'submit':
      return updateRequest(state, action.requestId, (r) => r.requesterId === state.meId && r.status === 'draft' && routeFor(state.processes, r.type, r.amount, r.fields).length ? submitted(state, r, 'submitted the request') : r);
    case 'update':
      return updateRequest(state, action.requestId, (r) => {
        if (r.requesterId !== state.meId || !['draft', 'changes'].includes(r.status)) return r;
        const { type, title, department, amount, startDate, endDate, description, attachments, fields, form } = { ...r, ...action.patch };
        const next = { ...r, type, title, department, amount, startDate, endDate, description, attachments, fields, form, updatedAt: now() };
        if (action.submit && r.status === 'changes') next.revisions = [...(r.revisions ?? []), structuredClone({ revision: r.revision ?? 1, submittedAt: r.submittedAt ?? r.createdAt, title: r.title, description: r.description, amount: r.amount, form: r.form ?? [], fields: r.fields ?? {}, steps: r.steps, status: r.status, attachments: r.attachments })];
        if (!action.submit) return next;
        const process = state.processes.find(p => p.active && p.requestType === next.type);
        if (!process || !canSubmit(state, process) || !routeFor(state.processes, next.type, next.amount, next.fields).length) return r;
        return submitted(state, next, r.status === 'changes' ? 'made changes and resubmitted' : 'submitted the request');
      });
    case 'withdraw': {
      const q=state.hr?.recruitment?.requisitions.find(q=>q.requestId===action.requestId);
      if(q) return applyHR(state,{kind:'recruitment',command:{action:'requisitionDecision',id:q.id,expectedVersion:q.version,operation:'withdraw',reason:'Withdrawn by requester.'}});
      return updateRequest(state, action.requestId, (r) => r.requesterId !== state.meId || !['pending', 'changes', 'draft'].includes(r.status) ? r : ({
        ...r,
        status: 'withdrawn',
        updatedAt: now(),
        steps: r.steps.map((s) => (s.status === 'current' ? { ...s, status: 'waiting' as const } : s)),
        activity: [...r.activity, { id: uid('a'), at: now(), personId: state.meId, kind: 'event', text: 'withdrew the request' }],
      }));
    }
    case 'createMeeting':
      if (action.meeting.organizerId !== state.meId || meetingProblem(state, action.meeting) || state.meetings.some(m => m.id === action.meeting.id)) return state;
      return { ...state, meetings: [...state.meetings, { ...action.meeting, status: 'scheduled' }], requests: appRole(state, 'approvals') ? state.requests.map(r => action.meeting.requestIds.includes(r.id) ? { ...r, meetingId: action.meeting.id } : r) : state.requests };
    case 'changeMeeting': {
      const meeting = state.meetings.find(m => m.id === action.meetingId);
      if (!meeting || meeting.status === 'cancelled' || !action.reason.trim() || !(isAppAdmin(state, 'meetings') || meeting.organizerId === state.meId)) return state;
      const next = { ...meeting, start: action.start ?? meeting.start, durationMin: action.durationMin ?? meeting.durationMin, status: action.cancel ? 'cancelled' as const : 'scheduled' as const };
      if (!action.cancel && meetingProblem(state, next)) return state;
      next.history = [...(meeting.history ?? []), { at: now(), personId: state.meId, action: action.cancel ? 'cancelled' : 'rescheduled', reason: action.reason.trim(), previousStart: meeting.start }];
      return { ...state, meetings: state.meetings.map(m => m.id === meeting.id ? next : m) };
    }
    case 'switchUser':
      return { ...state, meId: action.personId };
    case 'setupOrg':
      // The demo workspace keeps its people and history; sign-up names it and picks processes.
      return {
        ...state,
        org: { ...state.org, name: action.name, size: action.size, starter: action.starter ?? state.org.starter },
        people: action.access ? state.people.map((p) => (action.access?.[p.id] && p.access !== 'owner' ? { ...p, access: action.access[p.id] as Access } : p)) : state.people,
        processes: state.processes.map((p) => ({ ...p, active: action.activeProcessIds.includes(p.id) })),
      };
    case 'markSeen':
      return { ...state, lastSeen: { ...state.lastSeen, [state.meId]: now() } };
    case 'taskStatus':
      return reducer(state, { type: 'updateTask', taskId: action.taskId, patch: { status: action.status } });
    case 'saveSprint': {
      if (!isAppAdmin(state, 'tasks') || sprintProblem(action.sprint, state.sprints)) return state;
      const existing = state.sprints.find((sprint) => sprint.id === action.sprint.id);
      if (existing?.status === 'completed') return state;
      const sprint = existing
        ? { ...existing, name: action.sprint.name.trim(), goal: action.sprint.goal?.trim(), startDate: action.sprint.startDate, endDate: action.sprint.endDate }
        : { ...action.sprint, name: action.sprint.name.trim(), goal: action.sprint.goal?.trim(), status: 'planned' as const, createdAt: now(), startedAt: undefined, completedAt: undefined };
      return { ...state, sprints: existing ? state.sprints.map((item) => item.id === sprint.id ? sprint : item) : [...state.sprints, sprint] };
    }
    case 'startSprint': {
      const sprint = state.sprints.find((item) => item.id === action.sprintId);
      if (!isAppAdmin(state, 'tasks') || !sprint || sprint.status !== 'planned' || state.sprints.some((item) => item.status === 'active')) return state;
      return { ...state, sprints: state.sprints.map((item) => item.id === sprint.id ? { ...item, status: 'active', startedAt: now() } : item) };
    }
    case 'completeSprint': {
      const sprint = state.sprints.find((item) => item.id === action.sprintId);
      const destination = state.sprints.find((item) => item.id === action.moveTo);
      if (!isAppAdmin(state, 'tasks') || !sprint || sprint.status !== 'active') return state;
      if (action.moveTo && (!destination || destination.status === 'completed' || destination.id === sprint.id)) return state;
      return {
        ...state,
        sprints: state.sprints.map((item) => item.id === sprint.id ? { ...item, status: 'completed', completedAt: now(), carriedTasks: state.tasks.filter((task) => task.sprintId === sprint.id && !isDone(state, task)).length } : item),
        tasks: state.tasks.map((task) => task.sprintId === sprint.id && !isDone(state, task) ? { ...task, sprintId: action.moveTo } : task),
      };
    }
    case 'saveTask': {
      const task = state.tasks.find((item) => item.id === action.taskId);
      if (!task || !canEditTask(state, task)) return state;
      const next = { ...task, ...action.patch, id: task.id, status: task.status };
      if ((next.ownerId !== task.ownerId || next.assignedById !== task.assignedById) && !canManageTaskResponsibilities(state, task)) return state;
      if (next.sprintId !== task.sprintId) {
        if (state.sprints.some((sprint) => sprint.id === task.sprintId && sprint.status === 'completed')) return state;
        if (next.sprintId && !state.sprints.some((sprint) => sprint.id === next.sprintId && sprint.status !== 'completed')) return state;
      }
      if (taskTeamProblem(state, next)) return state;
      const plan = planMove(state, next, action.status);
      if (plan.kind === 'denied' || (action.status !== task.status && plan.kind === 'note' && !action.note?.trim())) return state;
      const destination = action.status === task.status ? task.status : plan.kind === 'signoff' ? plan.via : action.status;
      const changed = destination !== task.status;
      const target = statusDef(state, destination);
      const saved: Task = {
        ...next,
        status: destination,
        doneAt: target.category === 'done' ? task.doneAt ?? now() : undefined,
        statusChangedAt: changed ? now() : task.statusChangedAt,
        statusNote: changed ? target.requireNote ? action.note : undefined : task.statusNote,
        signOffRequestedAt: action.status === task.status ? task.signOffRequestedAt : plan.kind === 'signoff' ? now() : undefined,
      };
      return { ...state, tasks: state.tasks.map((item) => item.id === task.id ? saved : item) };
    }
    case 'updateTask':
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== action.taskId) return t;
          if (!canEditTask(state, t)) return t;
          if ((action.patch.ownerId && action.patch.ownerId !== t.ownerId || Object.hasOwn(action.patch, 'assignedById') && action.patch.assignedById !== t.assignedById) && !canManageTaskResponsibilities(state, t)) return t;
          if (taskTeamProblem(state, { ...t, ...action.patch }) || taskStructureProblem(state, { ...t, ...action.patch })) return t;
          if (action.patch.status && action.patch.status !== t.status) {
            const plan = planMove(state, { ...t, ...action.patch, status: t.status }, action.patch.status);
            if (plan.kind === 'denied' || plan.kind === 'signoff' || (plan.kind === 'note' && !action.patch.statusNote?.trim())) return t;
          }
          if (Object.hasOwn(action.patch, 'sprintId') && action.patch.sprintId !== t.sprintId) {
            if (!canEditTask(state, t)) return t;
            if (state.sprints.some((sprint) => sprint.id === t.sprintId && sprint.status === 'completed')) return t;
            if (action.patch.sprintId && !state.sprints.some((sprint) => sprint.id === action.patch.sprintId && sprint.status !== 'completed')) return t;
          }
          const next = { ...t, ...action.patch };
          const target = statusDef(state, next.status);
          if ((target.requireDone && requirementProblem(next, 'done')) || (target.requireReady && requirementProblem(next, 'ready'))) return t;
          if (action.patch.status !== undefined && action.patch.status !== t.status) {
            const done = statusDef(state, next.status).category === 'done';
            next.doneAt = done ? (t.doneAt ?? now()) : undefined;
            next.statusChangedAt = now();
          }
          return next;
        }),
      };
    case 'moveTask': {
      const task = state.tasks.find((item) => item.id === action.taskId);
      if (!task) return state;
      const plan = planMove(state, task, action.status);
      if (plan.kind === 'denied' || (plan.kind === 'note' && !action.note?.trim()) || plan.kind === 'signoff') return state;
      if (action.signOff && (task.ownerId !== state.meId || !state.taskStatuses.some((item) => item.signOff && planMove(state, task, item.id).kind === 'signoff'))) return state;
      const target = statusDef(state, action.status);
      const moved = reducer(state, { type: 'updateTask', taskId: action.taskId, patch: { status: action.status, statusNote: action.note } });
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
    case 'setAppMember': {
      if ((action.role !== null && !APP_ROLES.includes(action.role)) || memberChangeProblem(state, action.app, action.personId, action.role)) return state;
      const members = { ...(state.appMembers?.[action.app] ?? {}) };
      if (action.role) members[action.personId] = action.role; else delete members[action.personId];
      return { ...state, appMembers: { ...state.appMembers, [action.app]: members } };
    }
    case 'inviteAppMember': {
      const invitation = action.invitation;
      if (!isAppAdmin(state, invitation.app) || !APP_ROLES.includes(invitation.role) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitation.email)) return state;
      const email = invitation.email.trim().toLowerCase();
      if (state.people.some((person) => person.email?.toLowerCase() === email && appRole(state, invitation.app, person.id))) return state;
      if (state.appInvitations?.some((item) => item.app === invitation.app && item.email === email && item.status === 'pending' && item.expiresAt > now())) return state;
      return { ...state, appInvitations: [...(state.appInvitations ?? []), { ...invitation, email, invitedById: state.meId, status: 'pending', createdAt: now(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() }] };
    }
    case 'revokeAppInvitation':
      return { ...state, appInvitations: (state.appInvitations ?? []).map((item) => item.id === action.invitationId && item.status === 'pending' && isAppAdmin(state, item.app) ? { ...item, status: 'revoked' } : item) };
    case 'acceptAppInvitation': {
      const invitation = state.appInvitations?.find((item) => item.id === action.invitationId);
      if (!invitation || invitation.status !== 'pending' || invitation.expiresAt <= now() || !action.name.trim()) return state;
      const existing = state.people.find((person) => person.email?.toLowerCase() === invitation.email);
      const person = existing ?? { id: uid('person'), name: action.name.trim(), email: invitation.email, access: 'member' as const, department: 'Operations', role: 'Team member' };
      return { ...state, meId: person.id, people: existing ? state.people : [...state.people, person], appMembers: { ...state.appMembers, [invitation.app]: { ...state.appMembers?.[invitation.app], [person.id]: appRole(state, invitation.app, person.id) ?? invitation.role } }, appInvitations: state.appInvitations?.map((item) => item.id === invitation.id ? { ...item, status: 'accepted', acceptedById: person.id } : item) };
    }
    case 'setAccess':
      if (!isAdmin(state) || action.personId === state.meId || state.people.find((person) => person.id === action.personId)?.access === 'owner') return state;
      return { ...state, people: state.people.map((p) => (p.id === action.personId ? { ...p, access: action.access } : p)) };
    case 'commentTask':
      if (!state.tasks.some((task) => task.id === action.taskId && canCommentOnTask(state, task))) return state;
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
    case 'setNotificationEmail': {
      const email = action.email.trim().toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return state;
      const prefs = prefsFor(state, state.meId);
      return { ...state, notificationPrefs: { ...state.notificationPrefs, [state.meId]: { ...prefs, email } } };
    }
    case 'setInAppNotification': {
      if (!appRole(state, NOTIFICATION_APPS[action.event])) return state;
      const prefs = prefsFor(state, state.meId);
      return { ...state, notificationPrefs: { ...state.notificationPrefs, [state.meId]: { ...prefs, inApp: { ...prefs.inApp, [action.event]: action.on } } } };
    }
    case 'setChannel': {
      const prefs = prefsFor(state, state.meId);
      if (!appRole(state, NOTIFICATION_APPS[action.event]) || (action.on && action.channel === 'telegram' && !prefs.telegram) || (action.on && action.channel === 'email' && !prefs.email)) return state;
      const list = (prefs.events[action.event] ?? []).filter((c) => c !== action.channel);
      const events = { ...prefs.events, [action.event]: action.on ? [...list, action.channel] : list };
      return { ...state, notificationPrefs: { ...state.notificationPrefs, [state.meId]: { ...prefs, events } } };
    }
    case 'connectTelegram': {
      const prefs = prefsFor(state, state.meId);
      if (!/^[A-Za-z0-9_]{3,32}$/.test(action.username)) return state;
      return {
        ...state,
        notificationPrefs: {
          ...state.notificationPrefs,
          [state.meId]: {
            ...prefs,
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
      return { ...state, notificationPrefs: { ...state.notificationPrefs, [state.meId]: { ...prefs, telegram: undefined, events } } };
    }
    case 'deleteTask': {
      const task = state.tasks.find((item) => item.id === action.taskId);
      if (!task || !canContributeToApp(state, 'tasks') || !(isAppAdmin(state, 'tasks') || (task.assignedById ?? task.ownerId) === state.meId) || state.tasks.some((item) => item.parentId === task.id)) return state;
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.taskId) };
    }
    case 'saveTaskDefaults':
      return isAppAdmin(state, 'tasks') ? { ...state, taskDefaults: action.defaults } : state;
    case 'saveStatuses': {
      if (!isAppAdmin(state, 'tasks') || !action.statuses.some((item) => item.category === 'todo') || !action.statuses.some((item) => item.category === 'done')) return state;
      if (action.statuses.some((item) => !item.name.trim() || item.moveRoles?.length === 0)) return state;
      if (new Set(action.statuses.map((item) => item.id)).size !== action.statuses.length || new Set(action.statuses.map((item) => item.name.trim().toLowerCase())).size !== action.statuses.length) return state;
      if (state.taskStatuses.some((item) => item.locked && !action.statuses.some((next) => next.id === item.id && next.category === item.category))) return state;
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
      if (!canContributeToApp(state, 'tasks') || taskTeamProblem(state, action.task) || taskStructureProblem(state, action.task) || !state.taskStatuses.some((item) => item.id === action.task.status && item.category === 'todo' && !item.requireReady && !item.requireDone && !item.signOff)) return state;
      if (action.task.sprintId && !state.sprints.some((sprint) => sprint.id === action.task.sprintId && sprint.status !== 'completed')) return state;
      return { ...state, tasks: [action.task, ...state.tasks] };
    case 'addDecision':
      if (decisionProblem(state,action.meetingId,action.text,action.audienceIds)) return state;
      return {
        ...state,
        meetings: state.meetings.map((m) =>
          m.id === action.meetingId ? { ...m, decisions: [...m.decisions, { id: uid('d'), text: action.text.trim(),audienceIds:action.audienceIds?.length?[...action.audienceIds]:undefined,kind:action.kind??'decision',createdById:state.meId,at:now() }] } : m,
        ),
      };
    case 'createProcess':
      if (!canBuildProcesses(state)) return state;
      return { ...state, processes: [...state.processes, action.process] };
    case 'setBuilder':
      return { ...state, people: state.people.map((p) => (p.id === action.personId ? { ...p, canBuildProcesses: action.on } : p)) };
    case 'saveProcess':
      if (!canBuildProcesses(state)) return state;
      return { ...state, processes: state.processes.map((p) => (p.id === action.process.id ? action.process : p)) };
    case 'saveSurvey': {
      const old = state.surveys.find(x => x.id === action.survey.id);
      if (!action.survey.title.trim()) return state;
      const survey = old && old.status !== 'draft' ? { ...action.survey, fields: old.fields, publishedForm: old.publishedForm ?? old.fields, anonymous: old.anonymous, audience: old.audience, status: old.status, revision: old.revision ?? 1 } : { ...action.survey, status: 'draft' as const, revision: (old?.revision ?? 0) + 1, publishedForm: undefined };
      return old ? { ...state, surveys: state.surveys.map(x => x.id === survey.id ? survey : x) } : { ...state, surveys: [survey, ...state.surveys] };
    }
    case 'publishSurvey': {
      const survey = state.surveys.find(x => x.id === action.surveyId);
      if (!survey || survey.status !== 'draft' || !survey.title.trim() || !survey.fields.some(f => f.kind !== 'section') || formProblems(survey.fields).length) return state;
      return { ...state, surveys: state.surveys.map((x) => (x.id === action.surveyId ? { ...x, status: 'open', publishedForm: structuredClone(x.fields), publishedAt: now() } : x)) };
    }
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
      if (!sv || !isOpen(sv) || Object.keys(validateForm(sv.publishedForm ?? sv.fields, action.answers)).length || !surveyAudience(state, sv).some((p) => p.id === state.meId)) return state;
      if (state.surveyResponses.some((x) => x.surveyId === action.surveyId && x.personId === state.meId)) return state;
      return {
        ...state,
        surveyResponses: [
          ...state.surveyResponses,
          { id: uid('resp'), surveyId: action.surveyId, personId: state.meId, at: now(), answers: cleanValues(sv.publishedForm ?? sv.fields, action.answers) },
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
  | { type: 'restoreWorkspace'; snapshot: DataState }
  | { type: 'removeWorkspace'; id: string; name: string }
  | { type: 'switchWorkspace'; id: string }
  | { type: 'createWorkspace'; name: string; size: string; starter?: BusinessStarter; activeProcessIds: string[]; access?: Record<string, Access> };

export type StoreAction = Action | WorkspaceAction;

const initialRoot = (): Root => ({ active: 'lotus', spaces: { lotus: withoutStarterWorkflow(seed), mekong: withoutStarterWorkflow(mekongSeed) } });

function rootReducer(root: Root, action: StoreAction | { type: 'syncSavedRoot'; root: Root }): Root {
  switch (action.type) {
    case 'syncSavedRoot':
      return action.root;
    case 'switchWorkspace':
      return root.spaces[action.id] ? { ...root, active: action.id } : root;
    case 'restoreWorkspace': {
      const current = root.spaces[root.active];
      if (!current?.people.some(p => p.id === current.meId && p.access === 'owner') || !isBackupState(action.snapshot)) return root;
      const id = uid('ws');
      const snapshot = structuredClone(action.snapshot);
      snapshot.workspaceHistory = [...(snapshot.workspaceHistory ?? []), { at: now(), actorId: snapshot.meId, text: 'Restored a local workspace copy' }];
      return { active: id, spaces: { ...root.spaces, [id]: snapshot } };
    }
    case 'removeWorkspace': {
      const current = root.spaces[root.active];
      if (action.id !== root.active || current?.org.name !== action.name || !current.people.some(p => p.id === current.meId && p.access === 'owner') || Object.keys(root.spaces).length < 2) return root;
      const spaces = { ...root.spaces }; delete spaces[action.id];
      return { active: Object.keys(spaces)[0]!, spaces };
    }
    case 'createWorkspace': {
      // New companies start with their owner and empty records; existing demo workspaces remain intact.
      const id = uid('ws');
      const me = root.spaces[root.active]?.meId ?? 'dara';
      const owner = root.spaces[root.active]?.people.find(person => person.id === me) ?? seed.people[0]!;
      const base: DataState = withoutStarterWorkflow({ ...seed, meId: owner.id, people: [{ ...owner, access: 'owner' }], appMembers: undefined, appInvitations: [], hr: emptyHR(), requests: [], processes: [], tasks: [], meetings: [], documents: [], surveys: [], surveyResponses: [], feedback: [], leads: [], sprints: [], lastSeen: {}, surveyAt: {}, notificationPrefs: {} });
      const space = reducer(base, { type: 'setupOrg', name: action.name, size: action.size, starter: action.starter, activeProcessIds: action.activeProcessIds, access: action.access });
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
      if (saved.spaces?.[saved.active]) {
        return {
          ...saved,
          spaces: Object.fromEntries(Object.entries(saved.spaces).map(([id, space]) => [id, withoutStarterWorkflow(space)])),
        };
      }
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

export function StoreProvider({ children, initialState, persist = true }: { children: ReactNode; initialState?: DataState; persist?: boolean }) {
  const [root, dispatch] = useReducer(rootReducer, undefined, () => initialState ? { active: 'storybook', spaces: { storybook: structuredClone(initialState) } } : load());
  const state = root.spaces[root.active] as DataState;
  const currentRoot = useRef(root);
  currentRoot.current = root;
  const receivedRoot = useRef<Root | null>(null);

  useEffect(() => {
    try {
      // Receiving another tab's save must not echo it back as a new save.
      if (persist && receivedRoot.current !== root) localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
    } catch {
      // Not saved; the demo still works for this visit.
    }
  }, [root, persist]);

  useEffect(() => {
    if (!persist) return;
    const receive = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        // An older queued event must not replace a more recent saved revision.
        if (event.newValue !== localStorage.getItem(STORAGE_KEY)) return;
        const saved = JSON.parse(event.newValue) as Root;
        if (!saved.spaces?.[saved.active]) return;
        const current = currentRoot.current;
        const next: Root = {
          active: saved.spaces[current.active] ? current.active : saved.active,
          spaces: Object.fromEntries(Object.entries(saved.spaces).map(([id, space]) => [id, {
            ...withoutStarterWorkflow(space),
            // Sync business data without switching this tab's company or demo persona.
            meId: current.spaces[id]?.meId ?? space.meId,
          }])),
        };
        receivedRoot.current = next;
        dispatch({ type: 'syncSavedRoot', root: next });
      } catch {
        // Ignore invalid external snapshots; retain the current view and drafts.
      }
    };
    window.addEventListener('storage', receive);
    return () => window.removeEventListener('storage', receive);
  }, [persist]);

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
  event: NotificationEvent;
}

/** What the signed-in person should hear about: others acting on requests they are part of, and meeting invites. */
export function notificationsFor(state: DataState, channel: Channel | 'inApp' = 'inApp'): Notification[] {
  const me = state.meId;
  const fromRequests = state.requests
    .filter((r) => r.requesterId === me || r.steps.some((s) => s.approverId === me))
    .flatMap((r) =>
      r.activity
        .filter((a) => a.personId !== me)
        .map((a) => ({
          event: 'requestUpdates' as const,
          id: `${r.id}-${a.id}`,
          at: a.at,
          personId: a.personId,
          text: a.kind === 'comment' ? `commented on ${r.title}: “${a.text}”` : `${a.text} · ${r.title}`,
          href: `/requests/${r.id}`,
        })),
    );
  const fromMeetings = state.meetings
    .filter((m) => m.status !== 'cancelled' && m.createdAt && m.attendeeIds.includes(me) && m.organizerId !== me)
    .map((m) => ({
      event: 'meetings' as const,
      id: `m-${m.id}`,
      at: m.createdAt ?? '',
      personId: m.organizerId,
      text: `invited you to ${m.title}`,
      href: `/meetings/${m.id}`,
    }));
  const fromTasks = state.tasks
    .filter((t) => t.assignedById === me && t.ownerId !== me && t.signOffRequestedAt)
    .map((t) => ({
      event: 'tasks' as const,
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
      out.push({ event: 'tasks', id: `c-${t.id}`, at: t.signOffRequestedAt, personId: t.ownerId, text: `asked for your input on “${t.title}” before sign-off`, href: '/tasks' });
    }
    if (t.informedIds?.includes(me) && t.statusChangedAt && (status.category === 'done' || status.requireNote)) {
      out.push({
        event: 'tasks',
        id: `i-${t.id}-${t.statusChangedAt}`,
        at: t.statusChangedAt,
        personId: t.ownerId,
        text: status.category === 'done' ? `finished “${t.title}”` : `marked “${t.title}” ${status.name.toLowerCase()}${t.statusNote ? `: ${t.statusNote}` : ''}`,
        href: '/tasks',
      });
    }
    return out;
  });
  const meetingChanges = state.meetings.filter(m => m.attendeeIds.includes(me)).flatMap(m => (m.history ?? []).filter(h => h.personId !== me).map((h, i) => ({ id: `meeting-history-${m.id}-${i}`, event: 'meetings' as const, at: h.at, personId: h.personId, text: h.action === 'cancelled' ? 'cancelled a meeting' : 'rescheduled a meeting', href: `/meetings/${m.id}` })));
  const fromSurveys = surveysToAnswer(state)
    .filter((sv) => sv.createdBy !== me && sv.publishedAt)
    .map((sv) => ({ event: 'surveys' as const, id: `s-${sv.id}`, at: sv.publishedAt ?? '', personId: sv.createdBy, text: `asked you to answer “${sv.title}”`, href: `/surveys/${sv.id}` }));
  const fromApprovals = waitingOnMe(state).map((request) => ({
    id: `approval-${request.id}-${request.steps.find((step) => step.status === 'current')?.id}`,
    event: 'approvals' as const, at: request.updatedAt, personId: request.requesterId,
    text: `asked you to approve “${request.title}”`, href: `/requests/${request.id}`,
  }));
  const fromHR = (state.hr?.history ?? []).filter(event => event.actorId !== me && visibleRecords(state, event.collection).some(record => record.id === event.recordId)).map(event => ({ id: event.id, event: COLLECTION_APP[event.collection], at: event.at, personId: event.actorId, text: 'updated an HR record', href: `/${COLLECTION_APP[event.collection]}?tab=${event.collection}&record=${event.recordId}` }));
  const recruitmentEvents = (state.hr?.recruitment?.history ?? []).filter(e => e.actorId !== me && appRole(state,'recruitment') && (isAppAdmin(state,'recruitment') || (e.kind === 'interview' && state.hr?.recruitment?.interviews.some(i=>i.id===e.recordId && i.interviewerId===me)))).map(e=>({id:e.id,event:'recruitment' as const,at:e.at,personId:e.actorId,text:'updated an HR record',href:`/recruitment?tab=${e.kind==='stages'?'pipeline':e.kind==='position'?'positions':e.kind==='requisition'?'requisitions':e.kind==='interview'?'interviews':'offers'}&record=${e.recordId}`}));
  const prefs = prefsFor(state, me);
  return [...recruitmentEvents, ...meetingChanges, ...fromHR, ...fromApprovals, ...fromRequests, ...fromMeetings, ...fromTasks, ...fromRaci, ...fromSurveys]
    .filter((item) => Boolean(appRole(state, NOTIFICATION_APPS[item.event])) &&
      (channel === 'inApp' ? prefs.inApp?.[item.event] !== false : (prefs.events[item.event] ?? []).includes(channel) && (channel === 'telegram' ? Boolean(prefs.telegram) : Boolean(prefs.email))))
    .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
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
export const canManageSurveys = (state: DataState) => isAppAdmin(state, 'surveys');

/** Match the survey list's role and audience visibility on every entry surface. */
export function visibleSurveys(state: DataState) {
  if (!appRole(state, 'surveys')) return [];
  const manage = canManageSurveys(state);
  const me = state.people.find((p) => p.id === state.meId);
  return state.surveys.filter((survey) => manage || (survey.status !== 'draft' && (survey.audience.length === 0 || Boolean(me && survey.audience.includes(me.department)))));
}

/** People a survey asks: everyone, or the chosen departments. */
export function surveyAudience(state: DataState, survey: Survey) {
  return appPeople(state, 'surveys').filter((p) => canContributeToApp(state, 'surveys', p.id)).filter((p) => survey.audience.length === 0 || survey.audience.includes(p.department));
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
  if (!canContributeToApp(state, 'surveys')) return [];
  const me = state.people.find((p) => p.id === state.meId);
  if (!me) return [];
  return state.surveys.filter(
    (sv) => isOpen(sv) && (sv.audience.length === 0 || sv.audience.includes(me.department)) && !hasAnswered(state, sv.id),
  );
}

/** Workspace administration; each app has its own role checked by isAppAdmin. */
export function isAdmin(state: DataState, personId = state.meId) {
  const access = state.people.find((p) => p.id === personId)?.access;
  return access === 'owner' || access === 'admin';
}

/** The owner, whoever assigned it, and admins can change a task; everyone else can view it. */
export function canEditTask(state: DataState, task: Task) {
  const me = state.meId;
  return canContributeToApp(state, 'tasks') && (task.ownerId === me || task.assignedById === me || isAppAdmin(state, 'tasks'));
}

export function canManageTaskResponsibilities(state: DataState, task: Task) {
  return canContributeToApp(state, 'tasks') && (isAppAdmin(state, 'tasks') || (task.assignedById ?? task.ownerId) === state.meId);
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
  if (target.id === 'unknown') return { kind: 'denied', reason: 'Choose a valid status.' };
  const structureProblem = taskStructureProblem(state, { ...task, status: statusId });
  if (structureProblem) return { kind: 'denied', reason: structureProblem };
  if (statusId !== task.status) {
    if (target.allowedFrom && !target.allowedFrom.includes(task.status)) return { kind: 'denied', reason: 'This transition is not allowed. Follow the configured workflow.' };
    const roles = target.moveRoles;
    if (roles && !((roles.includes('admin') && isAppAdmin(state, 'tasks')) || (roles.includes('responsible') && task.ownerId === me) || (roles.includes('accountable') && (task.assignedById ?? task.ownerId) === me))) return { kind: 'denied', reason: 'Your responsibility does not allow this status change.' };

    if (target.category === 'done' && state.tasks.some((child) => child.parentId === task.id && !isDone(state, child))) return { kind: 'denied', reason: 'Complete child items before marking their parent done.' };
  }
  const problem = target.requireDone ? requirementProblem(task, 'done') : target.requireReady ? requirementProblem(task, 'ready') : undefined;
  if (problem) return { kind: 'denied', reason: problem };
  const assigner = task.assignedById ?? task.ownerId;
  if (target.signOff && assigner !== me && !isAppAdmin(state, 'tasks')) {
    // The owner finishes it; the assigner signs off. It waits in the nearest earlier in-progress status.
    const index = state.taskStatuses.findIndex((s) => s.id === statusId);
    const via = state.taskStatuses
      .slice(0, index)
      .reverse()
      .find((s) => s.category === 'active' && !s.requireNote && !s.signOff);
    if (task.ownerId === me && via) {
      const viaPlan = planMove(state, task, via.id);
      if (viaPlan.kind === 'move') return { kind: 'signoff', via: via.id, assignerId: assigner };
      return { kind: 'denied', reason: 'The review status must allow the responsible person to request sign-off.' };
    }
    return { kind: 'denied', reason: `${target.name} needs sign-off from ${name(assigner)} or an admin.` };
  }
  if (target.requireNote) return { kind: 'note' };
  return { kind: 'move' };
}

/** Consulted people may comment on a task they can't edit; informed people only read. */
export function canCommentOnTask(state: DataState, task: Task) {
  if (!canContributeToApp(state, 'tasks')) return false;
  return canEditTask(state, task) || Boolean(task.consultedIds?.includes(state.meId));
}

export { NOTIFICATION_APPS } from '../lib/notificationApps';
const NO_EXTRA_CHANNELS: NotificationPrefs = { events: { approvals: [], requestUpdates: [], tasks: [], meetings: [], surveys: [] } };

export function prefsFor(state: DataState, personId: string): NotificationPrefs {
  const prefs = state.notificationPrefs[personId];
  return { ...prefs, email: prefs?.email ?? state.people.find((person) => person.id === personId)?.email,
    events: { ...NO_EXTRA_CHANNELS.events, ...prefs?.events } };

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
  return canContributeToApp(state, 'approvals', personId) && (isAppAdmin(state, 'approvals', personId) || Boolean(state.people.find((p) => p.id === personId)?.canBuildProcesses));
}

/** Can the signed-in person raise requests of this process's type? */
export function canSubmit(state: DataState, process: Process) {
  const dept = state.people.find((p) => p.id === state.meId)?.department;
  return !process.submitters?.length || (dept !== undefined && process.submitters.includes(dept));
}
