import { expect, test } from '@playwright/test';
import { seed } from '../src/data/seed';
import { reducer } from '../src/data/store';
import { commercialState, approvedSupportScope, commercialProblem } from '../src/lib/commercial';
const fixture=()=>structuredClone(seed);
test('package preview records owner decisions without granting app access, rejects stale and duplicate trials',()=>{
 const s=fixture(),members=structuredClone(s.appMembers),command={type:'commercial' as const,command:{kind:'package' as const,package:'team' as const,status:'trial' as const,expectedRevision:0,reason:'Evaluate people workflows'}};
 const trial=reducer(s,command);expect(trial.commercial?.status).toBe('trial');expect(trial.commercial?.trialEndsAt).toBeTruthy();expect(trial.appMembers).toEqual(members);
 expect(reducer(trial,command)).toBe(trial);
 expect(commercialProblem(trial,{...command.command,expectedRevision:1})).toContain('already used');
 const confirmed=reducer(trial,{type:'commercial',command:{...command.command,status:'enabled',expectedRevision:1}});expect(confirmed.commercial?.status).toBe('enabled');
 const cancelled=reducer(confirmed,{type:'commercial',command:{...command.command,status:'cancelled',expectedRevision:2}});expect(cancelled.commercial?.history.map(h=>h.action)).toEqual(['trial','enabled','cancelled']);
 const member={...s,meId:'alex'};expect(reducer(member,command)).toBe(member);expect(commercialState(s).status).toBe('demo');
});
test('support scope requires owner approval, expires, and preserves terminal resolution history',()=>{
 const s=fixture(),member={...s,meId:'alex'};
 const requested=reducer(member,{type:'commercial',command:{kind:'support',id:'support-1',subject:'Task workflow question',message:'Fictional example question.',app:'tasks'}});
 expect(approvedSupportScope(requested,'support-1')).toBeUndefined();
 const decision={type:'commercial' as const,command:{kind:'supportDecision' as const,id:'support-1',outcome:'approved' as const,reason:'Permit one-hour count preview'}};
 expect(reducer(requested,decision)).toBe(requested);
 const approved=reducer({...requested,meId:s.meId},decision);expect(approvedSupportScope(approved,'support-1')).toBe('tasks');
 const expired=structuredClone(approved);expired.commercial!.support[0]!.expiresAt='2000-01-01T00:00:00Z';expect(approvedSupportScope(expired,'support-1')).toBeUndefined();
 const resolved=reducer(approved,{type:'commercial',command:{...decision.command,outcome:'resolved',reason:'Demo question answered'}});expect(approvedSupportScope(resolved,'support-1')).toBeUndefined();expect(reducer(resolved,decision)).toBe(resolved);
 expect(commercialState(s).support).toEqual([]);
});
