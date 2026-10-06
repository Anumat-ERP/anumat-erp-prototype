import type { DataState } from '../data/types';
import type { WorkspaceApp } from './moduleEntry';
export type CommercialState = {
  revision: number;
  package: 'starter' | 'team' | 'business';
  status: 'demo' | 'trial' | 'enabled' | 'cancelled';
  trialEndsAt?: string;
  history: {at:string;actorId:string;action:string;reason:string}[];
  support: {id:string;subject:string;message:string;app:WorkspaceApp;createdById:string;status:'requested'|'approved'|'resolved'|'cancelled';createdAt:string;expiresAt?:string;resolution?:string}[];
};
export type CommercialCommand =
 | {kind:'package';package:CommercialState['package'];status:CommercialState['status'];expectedRevision:number;reason:string}
 | {kind:'support';id:string;subject:string;message:string;app:WorkspaceApp}
 | {kind:'supportDecision';id:string;outcome:'approved'|'resolved'|'cancelled';reason:string};
export const commercialState = (s:DataState):CommercialState => s.commercial ?? {revision:0,package:'starter',status:'demo',history:[],support:[]};
export function commercialProblem(s:DataState,c:CommercialCommand):string|undefined {
 const own=s.people.find(p=>p.id===s.meId)?.access==='owner',current=commercialState(s);
 if(c.kind==='package'){
  if(!own)return 'Only the workspace owner can change the package preview.';
  if(c.expectedRevision!==current.revision)return 'The package changed. Reload before continuing.';
  if(!['starter','team','business'].includes(c.package)||!['demo','trial','enabled','cancelled'].includes(c.status)||!c.reason.trim())return 'Choose a package, an outcome and a reason.';
  if(c.status==='trial'&&current.history.some(h=>h.action==='trial'))return 'This company has already used its trial preview.';
  if(c.status==='cancelled'&&['demo','cancelled'].includes(current.status))return 'There is no active trial or package preview to cancel.';
  return;
 }
 if(c.kind==='support'){
  if(!s.people.some(p=>p.id===s.meId)||!c.id||current.support.some(r=>r.id===c.id)||!c.subject.trim()||!c.message.trim()||c.subject.length>120||c.message.length>2000||!['approvals','tasks','meetings','surveys','employees','recruitment','attendance','payroll','performance','training','assets','reports'].includes(c.app))return 'Choose an app and describe the support request.';
  return;
 }
 const request=current.support.find(r=>r.id===c.id);
 if(!request||['resolved','cancelled'].includes(request.status)||!c.reason.trim())return 'This support request is unavailable or needs a resolution reason.';
 if(c.outcome==='cancelled'&&request.createdById===s.meId)return;
 if(!own)return 'Only the workspace owner can approve or resolve support access.';
 if(c.outcome==='approved'&&request.status!=='requested')return 'Support access is already approved for this request.';
}
export function applyCommercial(s:DataState,c:CommercialCommand):DataState {
 if(commercialProblem(s,c))return s;
 const commerce=structuredClone(commercialState(s)),at=new Date().toISOString();
 if(c.kind==='package'){
  commerce.package=c.package;commerce.status=c.status;commerce.trialEndsAt=c.status==='trial'?new Date(Date.now()+14*86400000).toISOString():undefined;
  commerce.history.push({at,actorId:s.meId,action:c.status,reason:c.reason.trim()});
 }else if(c.kind==='support')commerce.support.unshift({id:c.id,subject:c.subject.trim(),message:c.message.trim(),app:c.app,createdById:s.meId,status:'requested',createdAt:at});
 else commerce.support=commerce.support.map(r=>r.id===c.id?{...r,status:c.outcome,resolution:c.reason.trim(),expiresAt:c.outcome==='approved'?new Date(Date.now()+60*60*1000).toISOString():r.expiresAt}:r);
 commerce.revision++;
 return {...s,commercial:commerce};
}
export const approvedSupportScope=(s:DataState,id:string)=>{const r=commercialState(s).support.find(r=>r.id===id);return r?.status==='approved'&&r.expiresAt&&r.expiresAt>new Date().toISOString()?r.app:undefined;};
