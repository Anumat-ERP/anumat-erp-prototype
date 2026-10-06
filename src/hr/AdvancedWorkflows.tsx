import { useState } from 'react';
import { Link } from 'react-router';
import { Banner, Button, DatePicker, Field, Input, Select, Textarea } from '@app/ui';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { appPeople, appRole, canContributeToApp, isAppAdmin } from '../lib/appAccess';
import { advancedProblem } from './advanced';
import { hrState, visibleRecords } from './engine';
import type { AdvancedHRCommand, EmployeePlanKind } from './advancedTypes';
import type { HRCollection, HRRecord, Employee, Course, Review, Payroll } from './types';

export function AdvancedWorkflows({ collection, record, disabled, onComplete }: { collection: HRCollection; record: HRRecord; disabled: boolean; onComplete: () => void }) {
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const hr = hrState(state);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState('');
  const [person, setPerson] = useState('');
  const [course, setCourse] = useState('');
  const [evidenceId, setEvidenceId] = useState('');
  const [result, setResult] = useState('verified');
  const [error, setError] = useState('');
  const employee = collection === 'employees' ? record as Employee : undefined;
  const review = collection === 'reviews' ? record as Review : undefined;
  const payroll = collection === 'payroll' ? record as Payroll : undefined;
  const options: { value: string; label: string }[] = [];
  const add = (value: string, label: string) => options.push({ value, label: tr(label) });
  if (employee && isAppAdmin(state, 'employees')) {
    if (employee.status !== 'exited') add('plan', 'Start an employee plan');
    if (employee.status === 'probation') add('extendProbation', 'Extend probation');
    add('evidence', 'Add document verification evidence');
    if (employee.verifications?.some(v => v.status === 'pending' && v.addedById !== state.meId) && employee.accountId !== state.meId) add('verifyEvidence', 'Review document evidence');
  }
  if (collection === 'assets' && isAppAdmin(state, 'assets')) {
    if (record.status === 'assigned') add('assetTransfer', 'Transfer equipment custody');
    else if (record.status !== 'retired') add('retireAsset', 'Retire asset');
  }
  if (collection === 'courses' && isAppAdmin(state, 'training')) {
    add('coursePolicy', 'Set capacity and prerequisite');
    if (record.status === 'open') add('waitlist', 'Add to course waitlist');
  }
  if (collection === 'enrollments' && isAppAdmin(state, 'training')) {
    if (record.status === 'waitlisted') add('admit', 'Admit from waitlist');
    if (['enrolled', 'waitlisted'].includes(record.status)) add('cancelEnrollment', 'Cancel enrollment');
  }
  if (review && ['published', 'acknowledged'].includes(review.status) && !review.employeeResponse && hr.employees.find(e => e.id === review.employeeId)?.accountId === state.meId) add('disagree', 'Record my response to this review');
  if (payroll && payroll.status === 'frozen' && isAppAdmin(state, 'payroll')) add('payrollDelivery', 'Preview payroll delivery');
  const plans = employee && isAppAdmin(state, 'employees') ? hr.plans?.filter(p => p.employeeId === employee.id) ?? [] : [];
  const run = (command: AdvancedHRCommand) => {
    const problem = advancedProblem(state, command);
    if (problem) { setError(problem); return; }
    dispatch({ type: 'hr', command: { kind: 'advanced', command } });
    onComplete();
  };
  const execute = () => {
    const version = { expectedVersion: record.version };
    let command: AdvancedHRCommand | undefined;
    switch (action) {
      case 'plan': command = { action, employeeId: record.id, kind: (value || 'onboarding') as EmployeePlanKind, ownerId: person || state.meId, dueDate: date, courseId: course || undefined, ...version }; break;
      case 'extendProbation': command = { action, employeeId: record.id, endDate: date, reason, ...version }; break;
      case 'evidence': command = { action, employeeId: record.id, label: value, evidence: reason, ...version }; break;
      case 'verifyEvidence': command = { action, employeeId: record.id, evidenceId, result: result as 'verified' | 'rejected', reason, ...version }; break;
      case 'assetTransfer': command = { action, assetId: record.id, employeeId: person, condition: value, reason, ...version }; break;
      case 'retireAsset': command = { action, assetId: record.id, reason, ...version }; break;
      case 'coursePolicy': command = { action, courseId: record.id, capacity: Number(value), prerequisiteId: course, ...version }; break;
      case 'waitlist': command = { action, employeeId: person, courseId: record.id }; break;
      case 'admit': command = { action, enrollmentId: record.id, ...version }; break;
      case 'cancelEnrollment': command = { action, enrollmentId: record.id, reason, ...version }; break;
      case 'disagree': command = { action, reviewId: record.id, reason, ...version }; break;
      case 'payrollDelivery': command = { action, payrollId: record.id, outcome: (result || 'success') as 'success' | 'rejected' | 'uncertain', reason, ...version }; break;
    }
    if (command) run(command);
  };
  if (!options.length && !plans.length && !review?.employeeResponse && !payroll?.deliveries?.length) return null;
  const employees = visibleRecords(state, 'employees').filter(e => e.status !== 'exited');
  const courses = appRole(state, 'training') ? visibleRecords(state, 'courses').filter(c => c.status === 'open' && c.id !== record.id) : [];
  return <details className="rounded-lg border border-border p-5">
    <summary className="min-h-11 cursor-pointer text-lg font-semibold">{tr('Additional workflows')}</summary>
    <div className="mt-5 space-y-5">
      {error && <Banner tone="critical">{tr(error)}</Banner>}
      {employee?.probationEndDate && <p>{tr('Probation end date')}: {employee.probationEndDate}</p>}
      {employee?.verifications?.map(v => <div key={v.id} className="border-b border-border pb-3"><p className="font-medium">{v.label} · {tr(v.status)}</p><p>{v.evidence}</p>{v.reason && <p>{v.reason}</p>}</div>)}
      {plans.map(plan => <section key={plan.id} className="space-y-3 border-b border-border pb-5">
        <p className="font-semibold">{tr(plan.kind)} · {plan.dueDate} · {tr(plan.closedAt ? 'Completed' : 'In progress')}</p>
        {appRole(state, 'tasks') && <ul className="space-y-2">{plan.taskIds.map(id => <li key={id}><Link className="text-fg-link underline" to={`/tasks?task=${id}`}>{state.tasks.find(t => t.id === id)?.title ?? tr('Task unavailable')}</Link></li>)}</ul>}
        {!plan.closedAt && <Button variant="secondary" disabled={disabled || !appRole(state, 'tasks')} onClick={() => run({ action: 'closePlan', planId: plan.id })}>{tr('Close completed plan')}</Button>}
      </section>)}
      {review?.employeeResponse && <p>{tr('Employee response')}: {review.employeeResponse.reason}</p>}
      {payroll?.deliveries?.map((d, i) => <p key={`${d.at}-${i}`}>{d.at} · {tr(d.outcome)} · {d.reason}</p>)}
      {options.length > 0 && <>
        <Field label={tr('Choose a workflow')}><Select value={action} options={[{ value: '', label: tr('Choose a workflow') }, ...options]} onChange={e => { setAction(e.target.value); setError(''); setValue(e.target.value === 'coursePolicy' ? String((record as Course).capacity ?? 20) : ''); setResult(e.target.value === 'payrollDelivery' ? 'success' : 'verified'); }} /></Field>
        {action && <div className="space-y-5">
          {action === 'plan' && <><Field label={tr('Plan type')}><Select value={value || 'onboarding'} onChange={e => setValue(e.target.value)} options={['onboarding', 'probation', 'development', 'offboarding'].map(value => ({ value, label: tr(value) }))}/></Field><Field label={tr('Responsible teammate')}><Select value={person || state.meId} onChange={e => setPerson(e.target.value)} options={appPeople(state, 'tasks').filter(p => canContributeToApp(state, 'tasks', p.id)).map(p => ({ value: p.id, label: p.name }))}/></Field></>}
          {['plan', 'extendProbation'].includes(action) && <DatePicker label={tr(action === 'plan' ? 'Due date' : 'Probation end date')} value={date} onChange={e => setDate(e.target.value)}/>}
          {['plan', 'coursePolicy'].includes(action) && <Field label={tr(action === 'plan' ? 'Related course (optional)' : 'Prerequisite (optional)')}><Select value={course} onChange={e => setCourse(e.target.value)} options={[{value:'',label:tr('None')}, ...courses.map(c => ({value:c.id,label:c.title}))]}/></Field>}
          {['assetTransfer', 'waitlist'].includes(action) && <Field label={tr('Employee')}><Select value={person} onChange={e => setPerson(e.target.value)} options={[{value:'',label:tr('Choose an employee')},...employees.map(e => ({value:e.id,label:e.name}))]}/></Field>}
          {['evidence','assetTransfer','coursePolicy'].includes(action) && <Field label={tr(action === 'evidence' ? 'Document name' : action === 'assetTransfer' ? 'Condition at handover' : 'Course capacity')} required><Input type={action === 'coursePolicy' ? 'number' : 'text'} min={1} max={1000} value={value} onChange={e => setValue(e.target.value)}/></Field>}
          {action === 'verifyEvidence' && <><Field label={tr('Pending evidence')}><Select value={evidenceId} onChange={e=>setEvidenceId(e.target.value)} options={[{value:'',label:tr('Choose evidence')},...(employee?.verifications?.filter(v=>v.status==='pending'&&v.addedById!==state.meId).map(v=>({value:v.id,label:v.label}))??[])]}/></Field><Field label={tr('Verification result')}><Select value={result} onChange={e=>setResult(e.target.value)} options={['verified','rejected'].map(value=>({value,label:tr(value)}))}/></Field></>}
          {action === 'payrollDelivery' && <><Banner>{tr('Delivery is simulated in this browser. No bank payment, email or accounting entry is sent.')}</Banner><Field label={tr('Delivery outcome')}><Select value={result} onChange={e=>setResult(e.target.value)} options={['success','rejected','uncertain'].map(value=>({value,label:tr(value)}))}/></Field></>}
          {!['plan','coursePolicy','waitlist','admit'].includes(action) && <Field label={tr(action === 'evidence' ? 'Verification evidence' : 'Reason and evidence')} required><Textarea maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)}/></Field>}
          <p className="text-muted-foreground">{tr('This action saves immediately and closes the record. Save any record edits first.')}</p><Button variant="primary" disabled={disabled} onClick={execute}>{options.find(o => o.value === action)?.label}</Button>
        </div>}
      </>}
    </div>
  </details>;
}
