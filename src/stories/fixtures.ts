import { applyHR } from '../hr/engine';
import { HR_APPS, emptyHR } from '../hr/types';
import { seed } from '../data/seed';
import type { AppRole, DataState, Process } from '../data/types';
import { initialAppMembers } from '../lib/appAccess';
export const demoProcess: Process = {
  id: 'storybook-purchase', name: 'Purchase approval', requestType: 'purchase', prefix: 'PR', active: true, trigger: 'Purchase request', avgHours: 0, runs30d: 0,
  fields: [
    { id: 'purpose', kind: 'longtext', label: 'Why is this purchase needed?', required: true },
    { id: 'urgent', kind: 'select', label: 'Urgency', options: ['Normal', 'Urgent'], required: true },
    { id: 'reason', kind: 'text', label: 'Urgency reason', required: false, showIf: { fieldId: 'urgent', op: 'is', equals: 'Urgent' } },
  ],
  steps: [
    { id: 'manager', name: 'Manager review', approverId: 'dara', role: 'Manager', slaHours: 24 },
    { id: 'finance', name: 'Finance review', approverId: 'priya', role: 'Finance', minAmount: 1000, slaHours: 48 },
  ],
};
export function storyState(role: AppRole = 'admin', empty = false, hr = false, recruitmentDemo?: string): DataState {
  let state = structuredClone(seed);
  state.appMembers = initialAppMembers(state);
  state.meId = 'dara';
  state.hr = emptyHR();
  if (hr && !empty) state = applyHR(state, { kind: 'loadExamples' });
  state.meId = role === 'admin' ? 'dara' : 'alex';
  if (hr && role !== 'admin') for (const app of HR_APPS) state.appMembers![app] = { ...state.appMembers![app], alex: role };
  if (role !== 'admin') {
    state.people = state.people.map(p => p.id === 'alex' ? { ...p, access: 'member' } : p);
    for (const app of ['tasks', 'approvals', 'meetings', 'surveys'] as const) state.appMembers![app]![state.meId] = role;
  }
  if (recruitmentDemo && state.hr?.applications.length) {
    const actor=state.meId;state.meId='dara';state.appMembers={...state.appMembers,recruitment:{...state.appMembers?.recruitment,alex:'admin'}};
    const move=(operation:string)=>{const a=state.hr!.applications[0]!;state=applyHR(state,{kind:'transition',collection:'applications',id:a.id,expectedVersion:a.version,operation,reason:'Fictional demo evidence'});};
    move('shortlist');
    const a=state.hr!.applications[0]!;
    state=applyHR(state,{kind:'recruitment',command:{action:'interview',record:{id:'storybook-interview',version:0,applicationId:a.id,interviewerId:'alex',startsAt:`${new Date().toISOString().slice(0,10)}T14:00`,duration:60,location:'Angkor meeting room',criteria:'Coordination, communication and documented outcomes',status:'scheduled',score:0,evidence:'',recommendation:'advance'}}});
    state.meId='alex';state=applyHR(state,{kind:'recruitment',command:{action:'assessment',id:'storybook-interview',expectedVersion:1,score:85,evidence:'Clear practical coordination example.',recommendation:'advance'}});state.meId='dara';
    move('interview');
    state=applyHR(state,{kind:'recruitment',command:{action:'interview',record:{id:'storybook-next-interview',version:0,applicationId:a.id,interviewerId:'alex',startsAt:`${new Date().toISOString().slice(0,10)}T16:00`,duration:30,location:'Angkor meeting room',criteria:'Final role discussion',status:'scheduled',score:0,evidence:'',recommendation:'advance'}}});
    const candidate=state.hr!.applications[0]!;
    state=applyHR(state,{kind:'recruitment',command:{action:'offer',applicationId:candidate.id,expectedVersion:candidate.version,reviewerId:'alex',terms:'Monthly base pay, agreed start date and probation review.'}});
    if(recruitmentDemo==='onboarding'){
      const o=state.hr!.recruitment!.offers[0]!;state.meId='alex';state=applyHR(state,{kind:'recruitment',command:{action:'offerDecision',id:o.id,expectedVersion:o.version,operation:'approve',reason:'Within approved headcount and budget'}});state.meId='dara';move('offer');move('accept');move('hire');
    }
    const q=state.hr!.recruitment!.requisitions[0]!;
    state=applyHR(state,{kind:'recruitment',command:{action:'requisition',record:{...q,id:'storybook-requisition',version:0,status:'draft',vacancyId:undefined,requestId:undefined}}});
    const draft=state.hr!.recruitment!.requisitions.find(q=>q.id==='storybook-requisition')!;
    state=applyHR(state,{kind:'recruitment',command:{action:'requisitionDecision',id:draft.id,expectedVersion:draft.version,operation:'submit',reason:'Fictional department expansion'}});
    state.meId=recruitmentDemo==='reviewer'?'alex':actor;
    if(role !== 'admin') state.appMembers={...state.appMembers,recruitment:{...state.appMembers?.recruitment,alex:role}};
  }
  state.processes = [structuredClone(demoProcess)];
  if (empty) { state.tasks = []; state.sprints = []; state.meetings = []; state.surveys = []; state.surveyResponses = []; state.requests = []; }
  return state;
}
