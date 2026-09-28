import { Button, Card, CardHeader, DatePicker, Field, Input, PageHeader, Select, Text, Textarea, useToast } from '@repo/ui';
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CheckGroup } from '../components/CheckGroup';
import { headerLink } from '../components/links';
import { uid, useStore } from '../data/store';

const DURATIONS = [15, 30, 45, 60, 90].map((m) => ({ value: String(m), label: `${m} minutes` }));

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

type Errors = Partial<Record<'title' | 'date' | 'time' | 'attendees', string>>;

export function NewMeeting() {
  const { state, me, person, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const linked = state.requests.find((r) => r.id === params.get('request'));

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
    const next: Errors = {};
    if (!title.trim()) next.title = 'Give the meeting a title people will recognise in their calendar.';
    if (!date) next.date = 'Choose a date.';
    if (!/^\d{2}:\d{2}$/.test(time)) next.time = 'Enter a start time, like 10:00.';
    if (attendees.length < 2) next.attendees = 'Invite at least one other person.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const id = uid('mtg');
    const start = new Date(`${date}T${time}`).toISOString();
    dispatch({
      type: 'createMeeting',
      meeting: {
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
      },
    });
    if (requestId) dispatch({ type: 'update', requestId, patch: { meetingId: id } });
    toast({ tone: 'success', title: 'Meeting scheduled', description: `${attendees.length - 1} people invited.` });
    navigate(`/meetings/${id}`);
  };

  return (
    <>
      <PageHeader
        title="Schedule a meeting"
        backAction={linked ? { content: linked.title, href: `/requests/${linked.id}` } : { content: 'Meetings', href: '/meetings' }}
        renderLink={headerLink}
      />
      <form noValidate onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-5">
          <Field label="Title" required error={errors.title}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Operations weekly" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <DatePicker label="Date" value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} />
            <Field label="Start time" error={errors.time}>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
            <Field label="Length">
              <Select value={duration} onChange={(e) => setDuration(e.target.value)} options={DURATIONS} />
            </Field>
          </div>
          <Field label="Where">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Agenda" helpText="One item per line." optional>
            <Textarea rows={4} autoGrow value={agenda} onChange={(e) => setAgenda(e.target.value)} />
          </Field>
          <Field label="About a request" optional helpText="Decisions in the meeting link back to it.">
            <Select
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              options={[
                { value: '', label: 'No request' },
                ...state.requests
                  .filter((r) => r.status === 'pending' || r.status === 'changes')
                  .map((r) => ({ value: r.id, label: `${r.id} · ${r.title}` })),
              ]}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              Schedule and invite
            </Button>
          </div>
        </Card>
        <Card className="self-start">
          <CardHeader title="Invite" description={linked ? 'Suggested: the requester and everyone on the approval route.' : undefined} />
          <div className="mt-4">
            <CheckGroup
              legend="People to invite"
              options={state.people.map((p) => ({ value: p.id, label: p.id === me.id ? `${p.name} (you, organiser)` : `${p.name} · ${p.role}` }))}
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
              {attendees.length} {attendees.length === 1 ? 'person' : 'people'}, including you. Invitees get a notification.
            </Text>
          )}
          <Text tone="subtle" variant="caption" className="mt-1">
            {attendees.map((a) => person(a).name.split(' ')[0]).join(', ')}
          </Text>
        </Card>
      </form>
    </>
  );
}
