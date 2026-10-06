import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Banner, Badge, Button, Card, Field, Input, PageHeader, Select, Textarea } from '@app/ui';
import { uid, useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { APP_NAMES } from '../lib/appAccess';
import { commercialState, commercialProblem, approvedSupportScope, type CommercialCommand, type CommercialState } from '../lib/commercial';
import type { WorkspaceApp } from '../lib/moduleEntry';
function SupportRequests({ operator = false }: { operator?: boolean }) {
 const {state,dispatch,me}=useStore(),{t:tr}=useLocale(),commerce=commercialState(state);
 const [subject,setSubject]=useState(''),[message,setMessage]=useState(''),[app,setApp]=useState<WorkspaceApp>('tasks'),[reason,setReason]=useState(''),[error,setError]=useState('');
 const [scopeTime,setScopeTime]=useState(Date.now());
 useEffect(()=>{
   const expires=commerce.support.filter(r=>r.status==='approved'&&r.expiresAt).map(r=>Date.parse(r.expiresAt!)).filter(time=>time>Date.now());
   if(!expires.length)return;
   const timeout=window.setTimeout(()=>setScopeTime(Date.now()),Math.min(Math.min(...expires)-Date.now()+1,2147483647));
   return()=>window.clearTimeout(timeout);
 },[commerce.revision,scopeTime]);
 const own=me.access==='owner';
 const run=(command:CommercialCommand)=>{const p=commercialProblem(state,command);if(p){setError(p);return;}dispatch({type:'commercial',command});setError('');if(command.kind==='support'){setSubject('');setMessage('');}setReason('');};
 const requests=commerce.support.filter(r=>own||r.createdById===me.id);
 return <section className="space-y-5">
  <h2 className="text-xl font-semibold">{tr('Support requests')}</h2>
  <Banner>{tr('These requests stay in this browser. No support agent is contacted. Approved support previews expose only the selected app’s record count for one hour, never employee details or compensation.')}</Banner>
  {!operator&&<Card className="space-y-5"><Field label={tr('Support subject')} required><Input value={subject} maxLength={120} onChange={e=>setSubject(e.target.value)}/></Field><Field label={tr('Affected app')}><Select value={app} onChange={e=>setApp(e.target.value as WorkspaceApp)} options={Object.entries(APP_NAMES).map(([value,label])=>({value,label:tr(label)}))}/></Field><Field label={tr('Describe the problem')} required><Textarea maxLength={2000} value={message} onChange={e=>setMessage(e.target.value)}/></Field><Button variant="primary" onClick={()=>run({kind:'support',id:uid('support'),subject,message,app})}>{tr('Save support request preview')}</Button></Card>}
  {error&&<Banner tone="critical">{tr(error)}</Banner>}
  {requests.length===0?<p className="text-muted-foreground">{tr('No support requests yet.')}</p>:requests.map(r=>{
   const scope=own&&operator?approvedSupportScope(state,r.id):undefined;
   const counts:Record<WorkspaceApp,number>={approvals:state.requests.length,tasks:state.tasks.length,meetings:state.meetings.length,surveys:state.surveys.length,employees:state.hr?.employees.length??0,recruitment:state.hr?.applications.length??0,attendance:state.hr?.attendance.length??0,payroll:state.hr?.payroll.length??0,performance:state.hr?.reviews.length??0,training:state.hr?.enrollments.length??0,assets:state.hr?.assets.length??0,reports:state.hr?.reports.length??0};
   return <Card key={r.id} className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">{r.subject}</h3><Badge>{tr(r.status)}</Badge></div><p>{r.message}</p><p className="text-muted-foreground">{tr(APP_NAMES[r.app])} · {r.createdAt}</p>{r.resolution&&<p>{r.resolution}</p>}{scope&&<Banner>{tr('Approved support scope')}: {tr(APP_NAMES[scope])} · {tr('Records')}: {counts[scope]} · {tr('Expires')}: {r.expiresAt}</Banner>}{own&&operator&&r.status==='approved'&&!scope&&<Banner>{tr('Support access expired. The request remains in history without record access.')}</Banner>}
   {!['resolved','cancelled'].includes(r.status)&&<><Field label={tr('Support decision reason')}><Textarea value={reason} onChange={e=>setReason(e.target.value)}/></Field><div className="flex flex-wrap gap-3">{own&&r.status==='requested'&&<Button variant="secondary" onClick={()=>run({kind:'supportDecision',id:r.id,outcome:'approved',reason})}>{tr('Approve scoped support preview')}</Button>}{own&&<Button variant="secondary" onClick={()=>run({kind:'supportDecision',id:r.id,outcome:'resolved',reason})}>{tr('Resolve support request preview')}</Button>}{(own||r.createdById===me.id)&&<Button variant="tertiary" onClick={()=>run({kind:'supportDecision',id:r.id,outcome:'cancelled',reason})}>{tr('Cancel support request')}</Button>}</div></>}
   </Card>;
  })}
 </section>;
}
export function CommercialPreview(){const {activeWorkspace,me}=useStore();return <CommercialForm key={`${activeWorkspace}-${me.id}`}/>;}
function CommercialForm(){
 const {state,dispatch,me}=useStore(),{t:tr}=useLocale(),commerce=commercialState(state);
 const [plan,setPlan]=useState(commerce.package),[reason,setReason]=useState(''),[error,setError]=useState('');
 const run=(status:CommercialState['status'])=>{const command:CommercialCommand={kind:'package',package:plan,status,expectedRevision:commerce.revision,reason};const p=commercialProblem(state,command);if(p){setError(p);return;}dispatch({type:'commercial',command});setReason('');setError('');};
 return <div className="mx-auto w-full max-w-5xl space-y-8"><PageHeader title={tr('Package & support')} subtitle={tr('Preview the commercial journey for this company.')} />
  <Banner>{tr('Packages, trials and cancellations are local simulations. No payment, subscription or app permission changes occur.')}</Banner>
  <section className="space-y-5"><h2 className="text-xl font-semibold">{tr('Current package preview')}</h2><p>{tr(commerce.package)} · {tr(commerce.status)}{commerce.trialEndsAt?` · ${tr('Trial ends')}: ${commerce.trialEndsAt}`:''}</p>
   <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-border"><th className="p-3">{tr('Package')}</th><th className="p-3">{tr('Example buyer need')}</th></tr></thead><tbody>{[['starter','Daily approvals and team tasks'],['team','People operations and training'],['business','Cross-team operations and reporting']].map(([key,label])=><tr key={key} className="border-b border-border"><td className="p-3 font-medium">{tr(key!)}</td><td className="p-3">{tr(label!)}</td></tr>)}</tbody></table></div>
   {me.access==='owner'?<Card className="space-y-5"><Field label={tr('Choose package preview')}><Select value={plan} onChange={e=>setPlan(e.target.value as typeof plan)} options={['starter','team','business'].map(value=>({value,label:tr(value)}))}/></Field><Field label={tr('Package decision reason')} required><Textarea value={reason} onChange={e=>setReason(e.target.value)}/></Field>{error&&<Banner tone="critical">{tr(error)}</Banner>}<div className="flex flex-wrap gap-3"><Button variant="primary" onClick={()=>run('trial')}>{tr('Start 14-day trial preview')}</Button><Button variant="secondary" onClick={()=>run('enabled')}>{tr('Confirm package preview')}</Button><Button variant="tertiary" onClick={()=>run('cancelled')}>{tr('Cancel package preview')}</Button></div></Card>:<Banner>{tr('Only the company owner can change package previews.')}</Banner>}
   {commerce.history.length>0&&<details className="border-t border-border pt-4"><summary className="min-h-11 cursor-pointer font-semibold">{tr('Package history')}</summary><ul className="space-y-3">{commerce.history.map((h,i)=><li key={`${h.at}-${i}`}>{h.at} · {tr(h.action)} · {h.reason}</li>)}</ul></details>}
  </section><SupportRequests/><div className="flex flex-wrap gap-5"><Link className="text-fg-link underline" to="/settings/data">{tr('Workspace data')}</Link>{me.access==='owner'&&<Link className="text-fg-link underline" to="/operator">{tr('Operator preview')}</Link>}</div>
 </div>;
}
export function OperatorPreview(){
 const {state,me,workspaces}=useStore(),{t:tr}=useLocale(),commerce=commercialState(state);
 if(me.access!=='owner')return <Banner tone="warning">{tr('Only a workspace owner can open the local operator preview.')}</Banner>;
 return <div className="mx-auto w-full max-w-5xl space-y-8"><PageHeader title={tr('Operator preview')} subtitle={tr('Local company metadata and explicitly approved support scope.')} />
 <Banner>{tr('This is an owner-operated demo of SaaS support. It has no external operator account and gives no access to another company’s records.')}</Banner>
 <section className="space-y-4"><h2 className="text-xl font-semibold">{tr('Local companies')}</h2><ul className="divide-y divide-border">{workspaces.map(w=><li key={w.id} className="py-4">{w.name}{w.name===state.org.name?` · ${tr(commerce.package)} · ${tr(commerce.status)}`:''}</li>)}</ul></section><SupportRequests key={state.org.name} operator/><Link className="text-fg-link underline" to="/settings/package">{tr('Package & support')}</Link></div>;
}
