import { appRole } from '../lib/appAccess';
import { NOTIFICATION_APPS } from '../data/store';
import { Button, EmptyState, PageHeader, Text, cn, useToast } from '@app/ui';
import { ArrowLeft, Send } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogoMark } from '../components/Logo';
import { headerLink } from '../components/links';
import { isDone, notificationsFor, prefsFor, stepForm, useStore, waitingOnMe } from '../data/store';
import type { FormValues } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import { googleCalendarUrl } from '../lib/calendar';
import { daysUntil, formatMoney, formatTime, formatWeekday, typeName } from '../lib/format';
import { choicesFor, isQuestion } from '../lib/forms';

interface Message {
  id: string;
  at: string;
  body: ReactNode;
  buttons?: ReactNode;
}

/** An inline keyboard button, styled like Telegram's. */
function InlineButton({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const cls =
    'flex-1 rounded-md bg-[#e8f1fb] px-2 py-1.5 text-center text-sm font-medium text-[#2a6ab1] hover:bg-[#d8e7f8] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring';
  if (href)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  return (
    <Button variant="tertiary" type="button" onClick={onClick} className={cn('h-auto p-0 justify-start whitespace-normal', cls)}>
      {children}
    </Button>
  );
}

/**
 * What the Anumat bot would send to the signed-in person on Telegram, based
 * on their notification settings. Approve works for real in the prototype.
 */
export function TelegramPreview() {
  const { t: tr } = useLocale();
  const { state, me, person, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const prefs = prefsFor(state, me.id);
  const [replies, setReplies] = useState<Message[]>([]);
  const on = (e: keyof typeof prefs.events) => Boolean(appRole(state, NOTIFICATION_APPS[e])) && (prefs.events[e] ?? []).includes('telegram');

  if (!prefs.telegram) {
    return (
      <>
        <PageHeader
          title={tr('Telegram preview')}
          backAction={{
            content: tr('Notifications'),
            href: '/settings/notifications',
          }}
          renderLink={headerLink}
        />
        <EmptyState
          heading={tr('Telegram isn’t connected')}
          action={<Button onClick={() => navigate('/settings/notifications')}>{tr('Connect Telegram')}</Button>}
        >
          {tr("Connect it in notification settings to see approvals and reminders arrive here.")}</EmptyState>
      </>
    );
  }

  const messages: Message[] = [];
  const recentCut = Date.now() - 2 * 86_400_000;

  if (on('approvals')) {
    for (const r of waitingOnMe(state)) {
      const step = r.steps.find((s) => s.status === 'current');
      messages.push({
        id: `ask-${r.id}`,
        at: r.updatedAt,
        body: (
          <>
            <b>{tr("Approval needed ·")}{' '}{r.id}</b>
            <br />
            {tr(r.title)}
            <br />
            {r.amount !== undefined ? `${formatMoney(r.amount)} · ` : ''}
            {typeName(r.type, state.processes)} {tr("from")}{' '}{tr(person(r.requesterId).name)}
            <br />
            <span className="text-[#6d7d8b]">
              {tr('Your step:')} {tr(step?.name ?? '')}
            </span>
          </>
        ),
        buttons: (() => {
          const approve = (answers?: FormValues, picked?: string) => {
            const i = r.steps.findIndex((st) => st.status === 'current');
            const next = r.steps[i + 1];
            dispatch({
              type: 'decide',
              requestId: r.id,
              decision: 'approve',
              comment: '',
              answers,
            });
            setReplies((list) => [
              ...list,
              {
                id: `reply-${r.id}`,
                at: new Date().toISOString(),
                body: (
                  <>
                    {' '}
                    {tr('Approved')} {r.id}
                    {picked ? tr(" on {value0}", { value0: picked }) : ''}.{' '}
                    {next ? tr("Sent to {value0} for {value1}.", { value0: person(next.approverId).name, value1: next.name.toLowerCase() }) : tr('The request is fully approved.')}
                  </>
                ),
              },
            ]);
            toast({ tone: 'success', title: `Approved ${r.id} from Telegram` });
          };
          // What this step needs from the approver decides which buttons the bot can offer.
          const required = stepForm(state, r).filter((f) => f.required && isQuestion(f));
          const pick = required.length === 1 && ['radio', 'select', 'yesno'].includes(required[0]!.kind) ? required[0] : undefined;
          return (
            <>
              {required.length === 0 ? (
                <div className="flex gap-1">
                  <InlineButton onClick={() => approve()}>{tr('Approve')}</InlineButton>
                  <InlineButton onClick={() => navigate(`/requests/${r.id}`)}>{tr('Request changes')}</InlineButton>
                </div>
              ) : pick ? (
                <>
                  <span className="px-1 text-xs text-[#6d7d8b]">{tr(pick.label)}{tr("? Tap to approve:")}</span>
                  {choicesFor(pick).map((c) => (
                    <InlineButton key={c} onClick={() => approve({ [pick.id]: c }, c)}>
                      {tr("Approve ·")}{' '}{c}
                    </InlineButton>
                  ))}
                  <InlineButton onClick={() => navigate(`/requests/${r.id}`)}>{tr('Request changes')}</InlineButton>
                </>
              ) : (
                <InlineButton onClick={() => navigate(`/requests/${r.id}`)}>{tr('Add details to approve')}</InlineButton>
              )}
              <InlineButton onClick={() => navigate(`/requests/${r.id}`)}>{tr("Open in Anumat")}</InlineButton>
            </>
          );
        })(),
      });
    }
  }

  if (on('meetings')) {
    for (const m of state.meetings.filter((m) => m.attendeeIds.includes(me.id) && daysUntil(m.start) >= 0 && daysUntil(m.start) <= 3)) {
      const start = new Date(m.start);
      messages.push({
        id: `mtg-${m.id}`,
        at: new Date(Math.min(Date.now() - 60_000, start.getTime() - 86_400_000)).toISOString(),
        body: (
          <>
            <b>{tr("Meeting")}{' '}{daysUntil(m.start) === 0 ? tr("today") : daysUntil(m.start) === 1 ? tr("tomorrow") : formatWeekday(m.start)}</b>
            <br />
            {tr(m.title)} · {formatTime(m.start)}, {m.durationMin} {tr("min")}{' '}<br />
            <span className="text-[#6d7d8b]">{tr(m.location)}</span>
          </>
        ),
        buttons: (
          <div className="flex gap-1">
            <InlineButton href={googleCalendarUrl(m)}>{tr("Add to Google Calendar")}</InlineButton>
            <InlineButton onClick={() => navigate(`/meetings/${m.id}`)}>{tr("Agenda")}</InlineButton>
          </div>
        ),
      });
    }
  }

  if (on('tasks')) {
    for (const t of state.tasks.filter((t) => t.ownerId === me.id && !isDone(state, t) && daysUntil(t.due) <= 0)) {
      messages.push({
        id: `task-${t.id}`,
        at: new Date(Date.now() - 3 * 3_600_000).toISOString(),
        body: (
          <>
            <b>{daysUntil(t.due) < 0 ? tr("Overdue task") : tr("Due today")}</b>
            <br />
            {tr(t.title)}
          </>
        ),
        buttons: <InlineButton onClick={() => navigate('/tasks')}>{tr("Open tasks")}</InlineButton>,
      });
    }
  }

  if (on('requestUpdates') || on('tasks') || on('surveys')) {
    for (const n of notificationsFor(state, 'telegram').filter((n) => new Date(n.at).getTime() > recentCut)) {
      if (n.event === 'approvals') continue;
      if (n.href.startsWith('/requests/') && !on('requestUpdates')) continue;
      if (n.href === '/tasks' && !on('tasks')) continue;
      if (n.href.startsWith('/meetings/')) continue;
      messages.push({
        id: `n-${n.id}`,
        at: n.at,
        body: (
          <>
            <b>{tr(person(n.personId).name)}</b> {n.text}
          </>
        ),
      });
    }
  }

  const all = [...messages.sort((a, b) => a.at.localeCompare(b.at)), ...replies];

  return (
    <>
      <PageHeader
        title={tr('Telegram preview')}
        subtitle={tr("What the Anumat bot sends @{value0}. Buttons work: approving here approves in Anumat.", { value0: prefs.telegram.username })}
        backAction={{
          content: tr('Notifications'),
          href: '/settings/notifications',
        }}
        renderLink={headerLink}
      />
      <div className="flex justify-center">
        <section
          aria-label={tr("Telegram chat with the Anumat bot")}
          className="flex h-[40rem] w-full max-w-[24rem] flex-col overflow-hidden rounded-[2rem] border-8 border-[#0f1a2e] bg-[#0f1a2e] shadow-lg"
        >
          <header className="flex items-center gap-3 bg-[#517da2] px-3 py-2.5 text-white">
            <ArrowLeft aria-hidden className="size-5 opacity-80" />
            <LogoMark className="size-9 rounded-full" />
            <span className="flex flex-col leading-tight">
              <span className="font-semibold">{tr("Anumat")}</span>
              <span className="text-xs opacity-80">{tr("bot")}</span>
            </span>
          </header>
          <ol
            // Like Telegram: keep the newest message in view.
            ref={(el) => {
              if (el) el.scrollTop = el.scrollHeight;
            }}
            className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#dfe6ec] p-3"
            aria-live="polite"
          >
            {all.length === 0 ? (
              <li className="self-center rounded-full bg-black/20 px-3 py-1 text-xs text-white">
                {tr('Nothing new. Turn on events in notification settings.')}
              </li>
            ) : null}
            {all.map((m) => (
              <li key={m.id} className="flex max-w-[88%] flex-col gap-1">
                <div className={cn('rounded-xl rounded-tl-sm bg-white px-3 py-2 text-[0.9rem] leading-snug text-[#0f1a2e] shadow-xs')}>
                  {m.body}
                  <span className="mt-1 block text-end text-[0.7rem] text-[#8a9aa9]">{formatTime(m.at)}</span>
                </div>
                {m.buttons ? <div className="flex flex-col gap-1">{m.buttons}</div> : null}
              </li>
            ))}
          </ol>
          <div className="flex items-center gap-2 bg-white px-3 py-2 text-sm text-[#8a9aa9]" aria-hidden>
            <span className="flex-1">{tr('Message')}</span>
            <Send className="size-4" />
          </div>
        </section>
      </div>
      <Text variant="bodySm" tone="muted" align="center">
        {tr("Prototype: a preview of the real bot.")}{' '}
        <Link to="/settings/notifications" className="text-fg-link underline">
          {tr("Change what you get")}</Link>
      </Text>
    </>
  );
}
