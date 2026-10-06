import { meetingProblem } from '../lib/meetings';
import { appRole, appPeople, canContributeToApp } from '../lib/appAccess';
import { Button, Card, CardHeader, DatePicker, Field, Input, PageHeader, Select, Text, Textarea, TimePicker, useToast } from '@app/ui';
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CheckGroup } from '../components/CheckGroup';
import { headerLink } from '../components/links';
import { uid, useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';

const DURATIONS = [15, 30, 45, 60, 90].map((m) => ({ value: String(m), label: `${m} minutes` }));

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

type Errors = Partial<Record<'title' | 'date' | 'time' | 'attendees', string>>;

export function NewMeeting() {
  const { t: tr } = useLocale();
  const { state, me, person, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const accessibleRequests = appRole(state, 'approvals') ? state.requests : [];
  const linked = accessibleRequests.find((r) => r.id === params.get('request'));

  const [requestId, setRequestId] = useState(linked?.id ?? '');
  const [title, setTitle] = useState(linked ? `Decide: ${linked.title}` : '');
  const [date, setDate] = useState(tomorrow());
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('30');
  const [location, setLocation] = useState('Video call');
  const [attendees, setAttendees] = useState<string[]>(() => {
    if (!linked) return [me.id];
    return [...new Set([me.id, linked.requesterId, ...linked.steps.map((s) => s.approverId)])];
  });
  const [agenda, setAgenda] = useState(linked ? `Review ${linked.id}\nAgree on a decision\nAssign follow-ups` : '');
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canContributeToApp(state, 'meetings')) return;
    const next: Errors = {};
    if (!title.trim()) next.title = tr('Give the meeting a title people will recognise in their calendar.');
    if (!date) next.date = tr('Choose a date.');
    if (!/^\d{2}:\d{2}$/.test(time)) next.time = tr('Enter a start time, like 10:00.');
    if (attendees.length < 2) next.attendees = tr('Invite at least one other person.');
    setErrors(next);
    if (Object.keys(next).length) return;

    const id = uid('mtg');
    const start = new Date(`${date}T${time}`).toISOString();
    const meeting = {
        id,
        title: title.trim(),
        start,
        durationMin: Number(duration),
        location: location.trim() || 'To be confirmed',
        organizerId: me.id,
        attendeeIds: attendees,
        agenda: agenda.split('\n').map((l) => l.trim()).filter(Boolean),
        decisions: [],
        requestIds: requestId ? [requestId] : [],
        createdAt: new Date().toISOString(),
    };
    const problem = meetingProblem(state, meeting);
    if (problem) { setErrors({ ...next, time: tr(problem) }); return; }
    dispatch({ type: 'createMeeting', meeting });
    toast({ tone: 'success', title: tr("Meeting scheduled"), description: `${attendees.length - 1} people invited.` });
    navigate(`/meetings/${id}`);
  };

  return (
    <>
      <PageHeader
        title={tr("Schedule a meeting")}
        backAction={linked ? { content: linked.title, href: `/requests/${linked.id}` } : { content: tr("Meetings"), href: '/meetings' }}
        renderLink={headerLink}
      />
      <form noValidate onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-5">
          <Field label={tr("Title")} required error={errors.title}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tr("Operations weekly")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <DatePicker required label={tr("Date")} value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} />
            <TimePicker label={tr('Start time')} value={time} onChange={(event) => setTime(event.target.value)} error={errors.time} />
            <Field label={tr("Length")}>
              <Select value={duration} onChange={(e) => setDuration(e.target.value)} options={DURATIONS} />
            </Field>
          </div>
          <Field label={tr("Where")}>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label={tr("Agenda")} helpText={tr('One item per line.')} optional>
            <Textarea rows={4} autoGrow value={agenda} onChange={(e) => setAgenda(e.target.value)} />
          </Field>
          <Field label={tr("About a request")} optional helpText={tr('Decisions in the meeting link back to it.')}>
            <Select
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              options={[
                { value: '', label: tr("No request") },
                ...accessibleRequests
                  .filter((r) => r.status === 'pending' || r.status === 'changes')
                  .map((r) => ({ value: r.id, label: `${r.id} · ${r.title}` })),
              ]}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={!canContributeToApp(state, 'meetings')}>
              {tr("Schedule and invite")}</Button>
          </div>
        </Card>
        <Card className="self-start">
          <CardHeader title={tr("Invite")} description={linked ? tr("Suggested: the requester and everyone on the approval route.") : undefined} />
          <div className="mt-4">
            <CheckGroup
              legend={tr("People to invite")}
              options={appPeople(state, 'meetings').map((p) => ({ value: p.id, label: p.id === me.id ? `${p.name} (you, organiser)` : `${p.name} · ${p.role}` }))}
              value={attendees}
              onChange={(v) => setAttendees(v.includes(me.id) ? v : [me.id, ...v])}
            />
          </div>
          {errors.attendees ? (
            <Text tone="critical" variant="bodySm" className="mt-3" role="alert">
              {errors.attendees}
            </Text>
          ) : (
            <Text tone="muted" variant="bodySm" className="mt-3">
              {attendees.length} {attendees.length === 1 ? tr("person") : tr("people")}{tr(", including you. Invitees get a notification.")}</Text>
          )}
          <Text tone="subtle" variant="caption" className="mt-1">
            {attendees.map((a) => person(a).name.split(' ')[0]).join(', ')}
          </Text>
        </Card>
      </form>
    </>
  );
}
