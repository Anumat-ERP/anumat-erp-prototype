import { expect, test } from '@playwright/test';
import { seed } from '../src/data/seed';
import { reducer } from '../src/data/store';
import { initialAppMembers } from '../src/lib/appAccess';
import { applyHR, hrProblem } from '../src/hr/engine';
import { advancedProblem } from '../src/hr/advanced';
import { visibleDecision, decisionProblem, executionProblem } from '../src/lib/workflowCompletion';
import type { AdvancedHRCommand } from '../src/hr/advancedTypes';
const fixture = () => { const s = structuredClone(seed); s.appMembers = initialAppMembers(s); return applyHR(s, {kind:'loadExamples'}); };
const run = (s: ReturnType<typeof fixture>, command: AdvancedHRCommand) => applyHR(s,{kind:'advanced',command});
test('restricted meeting minutes remain hidden from unselected readers, including owner', () => {
  const s=fixture(), m=s.meetings[0]!;
  m.organizerId=s.meId;
  expect(decisionProblem(s,m.id,'Private employment context',[s.meId])).toBeUndefined();
  const next=reducer(s,{type:'addDecision',meetingId:m.id,text:'Private employment context',audienceIds:[s.meId],kind:'minutes'});
  const d=next.meetings.find(x=>x.id===m.id)!.decisions.at(-1)!;
  expect(visibleDecision(next,d)).toBe(true);
  expect(visibleDecision({...next,meId:'alex'},d)).toBe(false);
  expect(decisionProblem(s,m.id,'secret',['alex'])).toBeTruthy();
  const cancelled={...s,meetings:s.meetings.map(x=>({...x,status:'cancelled' as const}))};
  expect(reducer(cancelled,{type:'addDecision',meetingId:m.id,text:'secret'})).toBe(cancelled);
});
test('approved requests schedule separately, preserve failures, reject stale and terminal retries',()=>{
  let s=fixture(); const r={id:'execution-request',type:'purchase' as const,title:'Execution example',department:'Operations',description:'Fictional execution record',requesterId:'alex',status:'approved' as const,updatedAt:'original',createdAt:'2026-10-01',fields:{},form:[],revision:1,steps:[],activity:[],attachments:[]}; s.requests=[r];
  const future='2099-01-01';
  s=reducer(s,{type:'requestExecution',requestId:r.id,expectedUpdatedAt:r.updatedAt,effectiveDate:future});
  const scheduled=s.requests.find(x=>x.id===r.id)!;
  expect(scheduled.execution?.status).toBe('pending');
  expect(executionProblem(s,r.id,scheduled.updatedAt,'2000-01-01','applied','try')).toContain('not arrived');
  expect(executionProblem(s,r.id,'original',future,'failed','network')).toContain('changed');
  s=reducer(s,{type:'requestExecution',requestId:r.id,expectedUpdatedAt:scheduled.updatedAt,effectiveDate:future,outcome:'failed',reason:'Simulated outage'});
  const failed=s.requests.find(x=>x.id===r.id)!;
  expect(failed.status).toBe('approved'); expect(failed.execution?.attempts).toHaveLength(1);
  const final=reducer(s,{type:'requestExecution',requestId:r.id,expectedUpdatedAt:failed.updatedAt,effectiveDate:future,outcome:'cancelled',reason:'No longer needed'});
  expect(final.requests.find(x=>x.id===r.id)?.execution?.attempts).toHaveLength(2);
  expect(reducer(final,{type:'requestExecution',requestId:r.id,expectedUpdatedAt:final.requests.find(x=>x.id===r.id)!.updatedAt,effectiveDate:future,outcome:'failed',reason:'Duplicate'})).toBe(final);
});
test('employee plans create owned tasks once and close only after all tasks finish',()=>{
  let s=fixture();const e=s.hr!.employees[0]!;
  const c:AdvancedHRCommand={action:'plan',employeeId:e.id,kind:'probation',ownerId:s.meId,dueDate:'2099-01-01',expectedVersion:e.version};
  s=run(s,c); const p=s.hr!.plans![0]!;
  expect(p.taskIds).toHaveLength(3); expect(s.tasks.filter(t=>p.taskIds.includes(t.id)).every(t=>t.ownerId===s.meId)).toBe(true);
  expect(run(s,c)).toBe(s); expect(run(s,{action:'closePlan',planId:p.id})).toBe(s);
  const done=s.taskStatuses.find(t=>t.category==='done')!.id;
  s={...s,tasks:s.tasks.map(t=>p.taskIds.includes(t.id)?{...t,status:done}:t)};
  s=run(s,{action:'closePlan',planId:p.id}); expect(s.hr!.plans![0]!.closedAt).toBeTruthy();
  expect(run({...s,meId:'priya'},c).hr?.plans).toEqual(s.hr!.plans);
});
test('verification needs independent HR reviewer and normal saves cannot forge verified evidence',()=>{
  let s=fixture();const e=s.hr!.employees[0]!;
  s=run(s,{action:'evidence',employeeId:e.id,label:'Identity check',evidence:'Fictional document checked in person',expectedVersion:e.version});
  let next=s.hr!.employees.find(x=>x.id===e.id)!; const v=next.verifications![0]!;
  const command:AdvancedHRCommand={action:'verifyEvidence',employeeId:e.id,evidenceId:v.id,result:'verified',reason:'Independent check',expectedVersion:next.version};
  expect(run(s,command)).toBe(s);
  s=run({...s,meId:'alex'},command);next=s.hr!.employees.find(x=>x.id===e.id)!;
  expect(next.verifications![0]!.status).toBe('verified');expect(next.verifications![0]!.reviewerId).toBe('alex');
  const forged={...next,verifications:[]};
  const saved=applyHR({...s,meId:'dara'},{kind:'save',collection:'employees',record:forged,expectedVersion:next.version});
  expect(saved.hr!.employees.find(x=>x.id===e.id)?.verifications).toEqual(next.verifications);
});
test('asset custody transfers keep history and retirement rejects assigned equipment',()=>{
  let s=fixture(); const a=s.hr!.assets.find(a=>a.kind==='equipment')!;a.status='assigned';a.employeeId=s.hr!.employees[0]!.id;
  expect(run(s,{action:'retireAsset',assetId:a.id,reason:'Dispose',expectedVersion:a.version})).toBe(s);
  s=run(s,{action:'assetTransfer',assetId:a.id,employeeId:s.hr!.employees[1]!.id,condition:'Good; photographed',reason:'Team handover',expectedVersion:a.version});
  expect(s.hr!.assets.find(x=>x.id===a.id)!.employeeId).toBe(s.hr!.employees[1]!.id);
  const event=s.hr!.history.at(-1)!; expect((event.before as typeof a).employeeId).toBe(a.employeeId);expect(event.reason).toBe('Team handover');
});
test('course waitlists enforce capacity, prerequisite and stale admission',()=>{
  let s=fixture();const c=s.hr!.courses[0]!; c.status='open';
  s=run(s,{action:'coursePolicy',courseId:c.id,capacity:1,prerequisiteId:'',expectedVersion:c.version});
  s=run(s,{action:'waitlist',courseId:c.id,employeeId:s.hr!.employees[0]!.id});
  let first=s.hr!.enrollments[0]!; s=run(s,{action:'admit',enrollmentId:first.id,expectedVersion:first.version});
  expect(s.hr!.enrollments[0]!.status).toBe('enrolled');
  s=run(s,{action:'waitlist',courseId:c.id,employeeId:s.hr!.employees[1]!.id});const second=s.hr!.enrollments[0]!;
  expect(advancedProblem(s,{action:'admit',enrollmentId:second.id,expectedVersion:second.version})).toContain('No place');
  first=s.hr!.enrollments.find(x=>x.id===first.id)!;
  s=run(s,{action:'cancelEnrollment',enrollmentId:first.id,reason:'Unable to attend',expectedVersion:first.version});
  const admitted=run(s,{action:'admit',enrollmentId:second.id,expectedVersion:second.version});expect(admitted.hr!.enrollments[0]!.status).toBe('enrolled');
  expect(run(admitted,{action:'admit',enrollmentId:second.id,expectedVersion:second.version})).toBe(admitted);
});
test('review disagreement preserves published rating and accepts only the employee once',()=>{
  let s=fixture(); const employee=s.hr!.employees.find(e=>e.accountId==='alex')!;
  const r={id:'published-review',version:1,status:'published',createdAt:'2026-01-01',updatedAt:'2026-01-01',employeeId:employee.id,title:'Review',startDate:'2026-01-01',endDate:'2026-03-31',goal:'Clear handovers',rating:4,selfEvidence:'Employee examples',managerEvidence:'Private calibration',development:'Published feedback'};
  s.hr!.reviews=[r]; const command:AdvancedHRCommand={action:'disagree',reviewId:r.id,reason:'I have additional delivery evidence.',expectedVersion:1};
  expect(run(s,command)).toBe(s);s=run({...s,meId:'alex'},command);
  expect(s.hr!.reviews[0]!.rating).toBe(4);expect(s.hr!.reviews[0]!.employeeResponse?.actorId).toBe('alex');expect(run(s,command)).toBe(s);
});
test('independent employee change decisions precede effective application and remain inspectable',()=>{
  let s=fixture();const e=s.hr!.employees[0]!; const date=new Date().toISOString().slice(0,10);
  s=applyHR(s,{kind:'schedule',change:{id:'reviewed-change',employeeId:e.id,reviewerId:'alex',effectiveDate:date,expectedVersion:e.version,patch:{position:'Branch coordinator',department:e.department,branch:e.branch,salary:e.salary,currency:e.currency,managerId:e.managerId},reason:'New responsibilities',status:'pending',createdById:s.meId,createdAt:''}});
  expect(s.hr!.changes?.[0]?.approvalStatus).toBe('pending');expect(applyHR(s,{kind:'applyChange',id:'reviewed-change'})).toBe(s);
  expect(applyHR(s,{kind:'reviewChange',id:'reviewed-change',outcome:'approved',reason:'Self review'})).toBe(s);
  s=applyHR({...s,meId:'alex'},{kind:'reviewChange',id:'reviewed-change',outcome:'approved',reason:'Responsibilities confirmed'});
  s=applyHR({...s,meId:'dara'},{kind:'applyChange',id:'reviewed-change'});
  expect(s.hr!.employees.find(x=>x.id===e.id)?.position).toBe('Branch coordinator');expect(s.hr!.changes?.[0]?.decision?.actorId).toBe('alex');
  expect(applyHR(s,{kind:'applyChange',id:'reviewed-change'})).toBe(s);
});
test('payroll delivery previews retain one frozen content revision across rejected and uncertain retries',()=>{
  let s=fixture();const e=s.hr!.employees[0]!;
  s.hr!.payroll=[{id:'frozen-preview',version:4,status:'frozen',createdAt:'2026-01-01',updatedAt:'2026-01-01',title:'Fictional pay period',startDate:'2026-01-01',endDate:'2026-01-31',currency:'USD',adjustment:0,reason:'Example',lines:[{employeeId:e.id,name:e.name,currency:'USD',base:650,adjustment:0,total:650,attendanceHours:0,leaveDays:0,employeeVersion:e.version}]}];
  const lines=structuredClone(s.hr!.payroll[0]!.lines);
  for(const outcome of ['rejected','uncertain','success'] as const){const p=s.hr!.payroll[0]!;s=run(s,{action:'payrollDelivery',payrollId:p.id,outcome,reason:`Simulated ${outcome}`,expectedVersion:p.version});}
  expect(s.hr!.payroll[0]!.deliveries?.map(d=>d.version)).toEqual([4,4,4]);expect(s.hr!.payroll[0]!.lines).toEqual(lines);
  const member={...s,meId:'priya'};expect(run(member,{action:'payrollDelivery',payrollId:'frozen-preview',outcome:'success',reason:'No access',expectedVersion:7})).toBe(member);
});
test('closed-survey follow-up preserves aggregate findings, rejects sparse anonymous results and duplicate task IDs',()=>{
  let s=fixture();const survey=s.surveys.find(x=>x.id==='party')!;const task={id:'aggregate-action',title:'Confirm venue',ownerId:s.meId,assignedById:s.meId,due:'',status:s.taskStatuses.find(t=>t.category==='todo')!.id};
  const action={type:'surveyFollowUp' as const,surveyId:survey.id,interpretation:'Confirm the group venue preference.',task};
  s=reducer(s,action);expect(s.surveys.find(x=>x.id===survey.id)?.followUps?.[0]?.taskId).toBe(task.id);expect(reducer(s,action)).toBe(s);
  const anonymous={...s,surveys:s.surveys.map(x=>x.id===survey.id?{...x,anonymous:true}:x),surveyResponses:[]};expect(reducer(anonymous,{...action,task:{...task,id:'sparse'}})).toBe(anonymous);
  const member={...s,meId:'priya'};expect(reducer(member,{...action,task:{...task,id:'not-admin'}})).toBe(member);
  const gated={...s,taskStatuses:s.taskStatuses.map(t=>t.category==='todo'?{...t,requireReady:true}:t)};expect(reducer(gated,{...action,task:{...task,id:'gated'}})).toBe(gated);
  expect(reducer(s,{...action,task:{...task,id:'bad-date',due:'2026-02-30T09:00:00'}})).toBe(s);
});
