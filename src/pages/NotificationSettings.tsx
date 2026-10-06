import { Badge, Banner, Button, Card, CardHeader, Checkbox, Field, Input, Modal, PageHeader, Text, useToast } from '@app/ui';
import { Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { NOTIFICATION_APPS, prefsFor, useStore } from '../data/store';
import type { Channel, NotificationEvent } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import { APP_NAMES, appRole } from '../lib/appAccess';
import { WORKSPACE_APPS, type WorkspaceApp } from '../lib/moduleEntry';

const EVENTS: { id: NotificationEvent; name: string; help: string }[] = [
  { id: 'approvals', name: 'Waiting for my decision', help: 'A request reaches your approval step.' },
  { id: 'requestUpdates', name: 'My requests', help: 'Approved, sent back, declined or commented on.' },
  { id: 'tasks', name: 'Task updates', help: 'Sign-off requests, requests for your input, and completion or blocked updates for tasks you follow.' },
  { id: 'meetings', name: 'Meeting invitations', help: 'You are invited to a meeting by another organizer.' },
  ...WORKSPACE_APPS.filter(app => !['approvals', 'tasks', 'meetings', 'surveys'].includes(app)).map(app => ({ id: app as NotificationEvent, name: APP_NAMES[app], help: 'Changes to HR records within your access scope.' })),
  { id: 'surveys', name: 'Surveys to answer', help: 'A published survey asks for your response.' },
];
const APPS = WORKSPACE_APPS;
const CHANNELS: { id: Channel; name: string }[] = [{ id: 'email', name: 'Email' }, { id: 'telegram', name: 'Telegram' }];

export function NotificationSettings() {
  const { me, activeWorkspace } = useStore();
  return <PersonalNotificationSettings key={`${activeWorkspace}-${me.id}`} />;
}
function PersonalNotificationSettings() {
  const { t: tr } = useLocale();
  const { state, me, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const prefs = prefsFor(state, me.id);
  const [email, setEmail] = useState(prefs.email ?? '');
  const [emailError, setEmailError] = useState<string>();
  const [connecting, setConnecting] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string>();
  const apps = APPS.filter((app) => appRole(state, app));
  const saveEmail = () => {
    const value = email.trim().toLowerCase();
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setEmailError(tr('Enter a valid email address.')); return; }
    dispatch({ type: 'setNotificationEmail', email: value });
    setEmail(value);
    toast({ title: tr('Notification email saved') });
  };
  const connect = () => {
    const name = username.trim().replace(/^@/, '');
    if (!/^[A-Za-z0-9_]{3,32}$/.test(name)) { setError(tr('Enter your Telegram username: letters, numbers and underscores, like dara_sok.')); return; }
    dispatch({ type: 'connectTelegram', username: name });
    setConnecting(false);
    toast({ title: tr('Telegram preview saved'), description: tr('Choose which events to include below.') });
  };
  return <>
    <PageHeader secondaryActions={[{content:tr('Delivery previews'),href:'/settings/delivery'}]} title={tr('Notifications')} subtitle={tr('Personal preferences for {name} in {workspace}. Channel choices save automatically.', { name: me.name, workspace: state.org.name })} />
    <Banner tone="info" title={tr('Delivery in this prototype')}>
      {tr('In-app choices control your notification bell. Email and Telegram preferences are saved locally; no external messages are sent.')}
    </Banner>
    <div className="grid items-start gap-4 md:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <CardHeader title={<span className="flex items-center gap-2"><Mail aria-hidden className="size-4" />{tr('Email')}</span>} description={tr('Choose the email address for your notifications.')} />
        <Field label={tr('Notification email')} optional error={emailError}>
          <Input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(undefined); }} autoComplete="email" placeholder="name@example.com" />
        </Field>
        <Button className="self-start" disabled={email === (prefs.email ?? '')} onClick={saveEmail}>{tr('Save email')}</Button>
      </Card>
      <Card className="flex flex-col gap-4">
        <CardHeader title={<span className="flex items-center gap-2"><Send aria-hidden className="size-4" />{tr('Telegram')}</span>} description={tr('Save a Telegram username to try the notification preview.')} actions={<Badge>{tr('Preview')}</Badge>} />
        {prefs.telegram ? <>
          <Text>@{prefs.telegram.username}</Text>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/telegram')}>{tr('Open Telegram preview')}</Button>
            <Button onClick={() => { dispatch({ type: 'disconnectTelegram' }); toast({ title: tr('Telegram disconnected') }); }}>{tr('Disconnect')}</Button>
          </div>
        </> : <Button className="self-start" onClick={() => { setUsername(me.name.toLowerCase().replace(/\s+/g, '_')); setError(undefined); setConnecting(true); }}>{tr('Set up Telegram preview')}</Button>}
      </Card>
    </div>
    <Text variant="bodySm" tone="muted">{tr('Add an email address or set up Telegram before selecting those channels. You only see apps you can access.')}</Text>
    {apps.map((app) => <Card key={app} flush>
      <div className="border-b border-border p-4"><CardHeader title={tr(APP_NAMES[app])} /></div>
      <ul className="divide-y divide-border">
        {EVENTS.filter((event) => NOTIFICATION_APPS[event.id] === app).map((event) => <li key={event.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1"><Text as="h3" variant="label">{tr(event.name)}</Text><Text variant="bodySm" tone="muted">{tr(event.help)}</Text></div>
          <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-3" role="group" aria-label={tr(event.name)}>
            <Checkbox label={tr('In app')} aria-label={tr('{event} in app', { event: tr(event.name) })} checked={prefs.inApp?.[event.id] !== false} onCheckedChange={(on) => dispatch({ type: 'setInAppNotification', event: event.id, on: on === true })} />
            {CHANNELS.map((channel) => <Checkbox key={channel.id} label={tr(channel.name)} aria-label={tr('{event} by {channel}', { event: tr(event.name), channel: tr(channel.name) })} checked={(prefs.events[event.id] ?? []).includes(channel.id)} disabled={channel.id === 'telegram' ? !prefs.telegram : !prefs.email} onCheckedChange={(on) => dispatch({ type: 'setChannel', event: event.id, channel: channel.id, on: on === true })} />)}
          </div>
        </li>)}
      </ul>
    </Card>)}
    {!apps.length && <Text tone="muted">{tr('Join an app to choose its notification channels.')}</Text>}
    <Modal open={connecting} onOpenChange={setConnecting} title={tr('Set up Telegram preview')} primaryAction={{ content: tr('Save preview'), onAction: connect }} secondaryActions={[{ content: tr('Cancel'), onAction: () => setConnecting(false) }]}>
      <div className="flex flex-col gap-4">
        <Text tone="muted">{tr('This saves a local preview profile. It does not connect to Telegram or verify your username.')}</Text>
        <Field label={tr('Your Telegram username')} error={error}><Input prefix="@" value={username} onChange={(event) => { setUsername(event.target.value); setError(undefined); }} /></Field>
      </div>
    </Modal>
  </>;
}
