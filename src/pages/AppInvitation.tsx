import { Badge, Banner, Button, Card, Field, Input, Text } from '@app/ui';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useStore } from '../data/store';
import { APP_NAMES, APP_ROLE_NAMES } from '../lib/appAccess';
import { useLocale } from '../i18n/LocaleProvider';
export function AppInvitation() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const { state, dispatch, activeWorkspace, workspaces } = useStore();
  const { t: tr } = useLocale();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const workspace = search.get('workspace');
  const exists = workspaces.some((item) => item.id === workspace);
  useEffect(() => { if (workspace && exists && workspace !== activeWorkspace) dispatch({ type: 'switchWorkspace', id: workspace }); }, [workspace, exists, activeWorkspace, dispatch]);
  const invitation = workspace === activeWorkspace ? state.appInvitations?.find((item) => item.id === id) : undefined;
  const valid = invitation && invitation.status === 'pending' && new Date(invitation.expiresAt).getTime() > Date.now();
  return <main className="mx-auto flex min-h-screen max-w-lg items-center p-4"><Card className="flex w-full flex-col gap-5">
    <Text as="h1" variant="heading">{tr('App invitation')}</Text>
    {valid ? <>
      <Text>{tr('Join {app} in {workspace}.', { app: tr(APP_NAMES[invitation.app]), workspace: state.org.name })}</Text><Badge tone="info">{tr(APP_ROLE_NAMES[invitation.role])}</Badge><Text className="break-all" tone="muted">{invitation.email}</Text>
      <Field label={tr('Your name')} required><Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></Field>
      <Button variant="primary" disabled={!name.trim()} onClick={() => { dispatch({ type: 'acceptAppInvitation', invitationId: invitation.id, name }); navigate(`/home?app=${invitation.app}`); }}>{tr('Accept invitation')}</Button>
      <Text variant="bodySm" tone="muted">{tr('This invitation does not give access to other apps or workspace administration.')}</Text>
      <Banner tone="info">{tr('Accepting this prototype invitation switches to the invited person in this browser.')}</Banner>
    </> : <Banner tone="info">{tr('This invitation is unavailable, expired, revoked, or already accepted. Ask an app admin for a new link.')}</Banner>}
    <Button asChild variant="plain"><Link to="/discover">{tr('Explore modules')}</Link></Button>
  </Card></main>;
}
