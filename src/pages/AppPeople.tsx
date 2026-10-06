import { Avatar, Badge, Banner, Button, Card, CardHeader, Field, Input, Modal, PageHeader, SearchField, Select, Tabs, TabsList, TabsTrigger, Text, useToast } from '@app/ui';
import { Copy, UserPlus, Eye, PenLine, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useStore, uid } from '../data/store';
import type { AppRole, AppInvitation } from '../data/types';
import { APP_NAMES, APP_ROLES, APP_ROLE_NAMES, appPeople, appRole, isAppAdmin, memberChangeProblem } from '../lib/appAccess';
import type { WorkspaceApp } from '../lib/moduleEntry';
import { useLocale } from '../i18n/LocaleProvider';
import { headerLink } from '../components/links';

export function AppPeople({ app }: { app: WorkspaceApp }) {
  const { state, me, dispatch, activeWorkspace } = useStore();
  const { t: tr, locale } = useLocale();
  const { toast } = useToast();
  const admin = isAppAdmin(state, app);
  const members = appPeople(state, app);
  const available = state.people.filter((person) => !appRole(state, app, person.id));
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [personId, setPersonId] = useState('');
  const [role, setRole] = useState<AppRole>('member');
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [created, setCreated] = useState<AppInvitation>();
  const [removing, setRemoving] = useState<string>();
  const roleOptions = APP_ROLES.map((role) => ({ value: role, label: tr(APP_ROLE_NAMES[role]) }));
  const invitations = (state.appInvitations ?? []).filter((item) => item.app === app && item.status === 'pending');
  const inviteUrl = (item: AppInvitation) => new URL(`${import.meta.env.BASE_URL}invitations/${item.id}?workspace=${encodeURIComponent(activeWorkspace)}`, window.location.origin).href;
  const copy = async (item: AppInvitation) => {
    try { await navigator.clipboard.writeText(inviteUrl(item)); toast({ title: tr('Invitation link copied') }); }
    catch { setCreated(item); setOpen(true); toast({ title: tr('Select and copy the invitation link below.') }); }
  };
  const change = (id: string, next: AppRole | null) => {
    const problem = memberChangeProblem(state, app, id, next);
    if (problem) { setNotice(tr(problem)); return; }
    dispatch({ type: 'setAppMember', app, personId: id, role: next });
    setNotice(undefined); setRemoving(undefined);
    toast({ title: tr(next ? 'App role updated' : 'App access removed') });
  };
  const invite = () => {
    if (method === 'workspace') {
      if (!available.some((person) => person.id === personId)) { setError(tr('Choose a workspace person.')); return; }
      dispatch({ type: 'setAppMember', app, personId, role });
      setOpen(false); toast({ title: tr('Member added to this app') }); return;
    }
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) { setError(tr('Enter a valid email address.')); return; }
    if (members.some((person) => person.email?.toLowerCase() === normalized)) { setError(tr('This person already has access to this app.')); return; }
    if (invitations.some((item) => item.email === normalized && new Date(item.expiresAt).getTime() > Date.now())) { setError(tr('A pending invitation already exists for this email.')); return; }
    const invitation: AppInvitation = { id: uid('invite'), app, email: normalized, role, invitedById: me.id, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), status: 'pending' };
    dispatch({ type: 'inviteAppMember', invitation }); setCreated(invitation); setError(undefined);
  };
  return <>
    <PageHeader title={tr('People & roles')} titleMetadata={<Badge tone="info" className="max-w-32 sm:max-w-none"><span className="truncate" title={tr(APP_NAMES[app])}>{tr(APP_NAMES[app])}</span></Badge>} subtitle={tr('Manage who can use this app. Access to other apps stays separate.')} backAction={{ content: tr(APP_NAMES[app]), href: app === 'approvals' ? '/requests' : `/${app}` }} renderLink={headerLink}
      primaryAction={admin ? { content: tr('Invite member'), icon: <UserPlus />, onAction: () => { setOpen(true); setCreated(undefined); setError(undefined); setEmail(''); setPersonId(''); setRole('member'); setMethod('email'); } } : undefined} />
    {notice && <Banner tone="critical">{notice}</Banner>}
    {!admin && <Banner tone="info">{tr('Only app admins can invite members or change app roles.')}</Banner>}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card flush>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4"><CardHeader title={tr('{count} people', { count: members.length })} /><SearchField label={tr('Search members')} placeholder={tr('Search members')} value={query} onChange={setQuery} debounceMs={0} className="w-full sm:w-64" /></div>
          <ul className="divide-y divide-border">
            {members.filter((person) => `${person.name} ${person.email ?? ''} ${person.department}`.toLowerCase().includes(query.toLowerCase())).map((person) => <li key={person.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Avatar name={person.name} size="md" decorative />
              <div className="min-w-0 flex-1 basis-40"><Text as="p" variant="label" className="break-words">{person.name}{person.id === me.id ? ` ${tr('(you)')}` : ''}</Text><Text variant="bodySm" tone="muted" className="break-words">{person.email ?? `${tr(person.role)} · ${tr(person.department)}`}</Text>{person.access === 'owner' && <Text variant="caption" tone="muted">{tr('Workspace owner')}</Text>}</div>
              <Field label={tr('App role for {name}', { name: person.name })} labelHidden className="w-32"><Select size="sm" value={appRole(state, app, person.id) ?? 'member'} options={roleOptions} disabled={!admin || person.id === me.id || person.access === 'owner'} onChange={(event) => change(person.id, event.target.value as AppRole)} /></Field>
              {admin && person.id !== me.id && person.access !== 'owner' && <Button size="sm" variant="plain" onClick={() => { const problem = memberChangeProblem(state, app, person.id, null); if (problem) setNotice(tr(problem)); else setRemoving(person.id); }}>{tr('Remove access')}</Button>}
            </li>)}
          </ul>
          {!members.some((person) => `${person.name} ${person.email ?? ''} ${person.department}`.toLowerCase().includes(query.toLowerCase())) && <Text className="p-4" tone="muted">{tr('No members match your search.')}</Text>}
        </Card>
        {admin && <Card flush><div className="p-4"><CardHeader title={tr('Pending invitations')} description={tr('Invitation links expire after 7 days. People gain access when they accept.')} /></div>
          {invitations.length ? <ul className="divide-y divide-border">{invitations.map((item) => {
            const expired = new Date(item.expiresAt).getTime() <= Date.now();
            return <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3"><div className="min-w-0 flex-1 basis-48"><Text as="p" variant="label" className="break-all">{item.email}</Text><Text variant="bodySm" tone="muted">{tr(APP_ROLE_NAMES[item.role])} · {tr(expired ? 'Expired' : 'Expires {date}', { date: new Date(item.expiresAt).toLocaleDateString(locale === 'km' ? 'km-KH' : 'en-US') })}</Text></div><Button size="sm" icon={<Copy />} disabled={expired} onClick={() => copy(item)}>{tr('Copy link')}</Button><Button size="sm" variant="plain" onClick={() => dispatch({ type: 'revokeAppInvitation', invitationId: item.id })}>{tr('Revoke invitation')}</Button></li>;
          })}</ul> : <Text className="px-4 pb-4" tone="muted">{tr('No pending invitations.')}</Text>}
        </Card>}
      </div>
      <aside className="flex flex-col gap-4" aria-label={tr('App role permissions')}>
        <Text as="h2" variant="subtitle">{tr('App role permissions')}</Text>
        <dl className="flex flex-col gap-4">{APP_ROLES.map((role) => <div key={role}><dt className="flex items-center gap-2 font-medium">{role === 'admin' ? <ShieldCheck size={16} aria-hidden /> : role === 'member' ? <PenLine size={16} aria-hidden /> : <Eye size={16} aria-hidden />}{tr(APP_ROLE_NAMES[role])}</dt><dd className="mt-1 text-sm text-fg-muted">{tr(role === 'admin' ? 'Manage this app’s team, settings, and work.' : role === 'member' ? 'Create work and contribute within assigned responsibilities.' : 'View this app’s work without editing or commenting.')}</dd></div>)}</dl>
        <div className="border-t border-border pt-4"><Text as="h3" variant="label">{tr('Task responsibilities (RACI)')}</Text><dl className="mt-2 grid grid-cols-2 gap-3 text-sm">{[{ letter: 'R', name: 'Responsible', help: 'Does the work' }, { letter: 'A', name: 'Accountable', help: 'Owns the outcome' }, { letter: 'C', name: 'Consulted', help: 'Gives advice' }, { letter: 'I', name: 'Informed', help: 'Receives updates' }].map((item) => <div key={item.letter}><dt className="font-medium">{item.letter} · {tr(item.name)}</dt><dd className="text-fg-muted">{tr(item.help)}</dd></div>)}</dl></div>
        <Text variant="bodySm" tone="muted">{tr('The workspace owner retains access to every app. Other workspace roles do not grant access to additional apps.')}</Text>
      </aside>
    </div>
    <Modal open={open && admin} onOpenChange={setOpen} title={tr(created ? 'Invitation ready' : 'Invite member')} description={tr('Access is granted to {app} only.', { app: tr(APP_NAMES[app]) })} footer={created ? <Button onClick={() => setOpen(false)}>{tr('Done')}</Button> : <><Button onClick={() => setOpen(false)}>{tr('Cancel')}</Button><Button variant="primary" onClick={invite}>{tr(method === 'workspace' ? 'Add to app' : 'Create invitation')}</Button></>}>
      <div className="flex flex-col gap-4">{created ? <>
        <Text>{tr('Share this link with {email}.', { email: created.email })}</Text><Field label={tr('Invitation link')}><Input value={inviteUrl(created)} readOnly onFocus={(event) => event.target.select()} /></Field><Button icon={<Copy />} onClick={() => copy(created)}>{tr('Copy link')}</Button>
        <Banner tone="info">{tr('Prototype: invitations are saved in this browser. No email is sent; links work with this browser’s saved workspace data.')}</Banner>
      </> : <>
        <Tabs value={method} onValueChange={(value) => { setMethod(value); setError(undefined); }}><TabsList aria-label={tr('Invite method')} className="grid w-full grid-cols-2"><TabsTrigger value="email">{tr('Invite by email')}</TabsTrigger><TabsTrigger value="workspace">{tr('Workspace person')}</TabsTrigger></TabsList></Tabs>
        {method === 'email' ? <Field label={tr('Email address')} error={error} required><Input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(undefined); }} autoComplete="email" /></Field> : <Field label={tr('Workspace person')} error={error} required helpText={!available.length ? tr('Everyone in this workspace already has access to this app.') : undefined}><Select value={personId} onChange={(event) => { setPersonId(event.target.value); setError(undefined); }} options={available.map((person) => ({ value: person.id, label: person.name }))} placeholder={tr('Choose a person')} /></Field>}
        <Field label={tr('App role')}><Select value={role} onChange={(event) => setRole(event.target.value as AppRole)} options={roleOptions} /></Field>
        <Text variant="bodySm" tone="muted">{tr('This invitation does not give access to other apps or workspace administration.')}</Text>
      </>}</div>
    </Modal>
    <Modal open={Boolean(removing)} onOpenChange={(open) => { if (!open) setRemoving(undefined); }} title={tr('Remove app access?')} footer={<><Button onClick={() => setRemoving(undefined)}>{tr('Cancel')}</Button><Button variant="critical" onClick={() => removing && change(removing, null)}>{tr('Remove access')}</Button></>}><Text>{tr('This person loses access to this app. Their workspace identity and historical work stay available.')}</Text></Modal>
  </>;
}
