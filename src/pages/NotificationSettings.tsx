import { Badge, Banner, Button, Card, CardHeader, Checkbox, Field, Input, Modal, PageHeader, Text, useToast } from '@repo/ui';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CONFIG, isSet } from '../config';
import { prefsFor, useStore } from '../data/store';
import type { Channel, NotificationEvent } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import { formatDate } from '../lib/format';

const EVENTS: { id: NotificationEvent; name: string; help: string }[] = [
  {
    id: 'approvals',
    name: 'Waiting for my decision',
    help: 'A request reaches your approval step.',
  },
  {
    id: 'requestUpdates',
    name: 'My requests',
    help: 'Approved, sent back, declined or commented on.',
  },
];

const CHANNELS: { id: Channel; name: string }[] = [
  { id: 'email', name: 'Email' },
  { id: 'telegram', name: 'Telegram' },
];

export function NotificationSettings() {
  const { t: tr } = useLocale();
  const { state, me, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const prefs = prefsFor(state, me.id);
  const connected = prefs.telegram;
  const [connecting, setConnecting] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string>();
  // A one-time code the person sends to the bot, so it knows which account to link.
  const code = `ANU-${((me.id.charCodeAt(0) * 97 + me.id.length * 13) % 9000) + 1000}`;
  const bot = CONFIG.telegram.botUsername.replace(/^@/, '');

  const connect = () => {
    const name = username.trim().replace(/^@/, '');
    if (!/^[A-Za-z0-9_]{3,32}$/.test(name)) {
      setError('Enter your Telegram username: letters, numbers and underscores, like dara_sok.');
      return;
    }
    dispatch({ type: 'connectTelegram', username: name });
    setConnecting(false);
    toast({
      tone: 'success',
      title: 'Telegram connected',
      description: tr('Approval notifications now come to Telegram too.'),
    });
  };

  return (
    <>
      <PageHeader title={tr('Notifications')} subtitle={tr('Choose where Anumat tells you about things. In-app notifications are always on.')} />

      <Card className="flex flex-col gap-4">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Send aria-hidden className="size-5 text-info" /> {tr('Telegram')}{' '}
            </span>
          }
          description="Get approvals and reminders where you already chat, and approve with one tap."
          actions={connected ? <Badge tone="success">{tr('Connected')}</Badge> : null}
        />
        {connected ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-sunken p-3">
            <Text>
              Connected as <span className="font-mono font-medium">@{connected.username}</span> since {formatDate(connected.connectedAt)}.
            </Text>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => navigate('/telegram')}>
                {' '}
                {tr('Open Telegram preview')}{' '}
              </Button>
              <Button
                onClick={() => {
                  dispatch({ type: 'disconnectTelegram' });
                  toast({ title: 'Telegram disconnected' });
                }}
              >
                {' '}
                {tr('Disconnect')}{' '}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text tone="muted">Not connected. It takes about 20 seconds.</Text>
            <Button
              variant="primary"
              onClick={() => {
                setUsername(me.name.toLowerCase().replace(/\s+/g, '_'));
                setError(undefined);
                setConnecting(true);
              }}
            >
              {' '}
              {tr('Connect Telegram')}{' '}
            </Button>
          </div>
        )}
      </Card>

      <Card flush>
        <div className="p-4 pb-2">
          <CardHeader title={tr('What you hear about, and where')} />
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-md">
            <caption className="sr-only">{tr('Notification channels for each kind of event')}</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-4 py-2 text-start text-sm font-medium text-fg-muted">
                  {' '}
                  {tr('Event')}{' '}
                </th>
                <th scope="col" className="px-4 py-2 text-start text-sm font-medium text-fg-muted">
                  {' '}
                  {tr('In app')}{' '}
                </th>
                {CHANNELS.map((c) => (
                  <th key={c.id} scope="col" className="px-4 py-2 text-start text-sm font-medium text-fg-muted">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((e) => (
                <tr key={e.id} className="border-b border-border-subtle last:border-0">
                  <th scope="row" className="px-4 py-3 text-start font-regular">
                    <span className="block font-medium">{tr(e.name)}</span>
                    <span className="block text-sm text-fg-muted">{tr(e.help)}</span>
                  </th>
                  <td className="px-4 py-3">
                    <Checkbox label={`${tr(e.name)} in app`} labelHidden checked disabled />
                  </td>
                  {CHANNELS.map((c) => (
                    <td key={c.id} className="px-4 py-3">
                      <Checkbox
                        label={`${tr(e.name)} by ${c.name}`}
                        labelHidden
                        checked={prefs.events[e.id].includes(c.id)}
                        disabled={c.id === 'telegram' && !connected}
                        onCheckedChange={(on) =>
                          dispatch({
                            type: 'setChannel',
                            event: e.id,
                            channel: c.id,
                            on: on === true,
                          })
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!connected ? (
          <Text variant="bodySm" tone="muted" className="px-4 pb-4">
            {' '}
            {tr('Connect Telegram to choose it for any event.')}{' '}
          </Text>
        ) : null}
      </Card>

      <Modal
        open={connecting}
        onOpenChange={setConnecting}
        title={tr('Connect Telegram')}
        primaryAction={{ content: 'I’ve sent the code', onAction: connect }}
        secondaryActions={[{ content: tr('Cancel'), onAction: () => setConnecting(false) }]}
      >
        <div className="flex flex-col gap-4">
          <ol className="flex list-decimal flex-col gap-3 ps-5 text-md">
            <li>
              Open the Anumat bot in Telegram:{' '}
              {isSet(bot) ? (
                <a href={`https://t.me/${bot}?start=${code}`} target="_blank" rel="noopener noreferrer" className="font-medium text-fg-link underline">
                  @{bot}
                </a>
              ) : (
                <span className="text-fg-muted">(the bot isn’t set up yet: add its username in src/config.ts)</span>
              )}
            </li>
            <li>
              Send it this code: <span className="rounded-md bg-surface-sunken px-2 py-0.5 font-mono font-semibold tracking-wide select-all">{code}</span>
            </li>
            <li>Come back here and confirm.</li>
          </ol>
          <Banner tone="info" inline>
            Prototype: nothing is sent to Telegram. Enter your username to see how it works.
          </Banner>
          <Field label="Your Telegram username" error={error}>
            <Input prefix="@" value={username} onChange={(e) => (setUsername(e.target.value), setError(undefined))} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
