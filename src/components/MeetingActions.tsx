import { useState } from 'react';
import {
  Banner,
  Button,
  Card,
  DatePicker,
  Field,
  Input,
  Modal,
  Textarea,
  TimePicker,
} from '@app/ui';
import { useStore } from '../data/store';
import type { Meeting } from '../data/types';
import { isAppAdmin, canContributeToApp } from '../lib/appAccess';
import { meetingProblem } from '../lib/meetings';
import { useLocale } from '../i18n/LocaleProvider';
export function MeetingActions({ meeting }: { meeting: Meeting }) {
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const [mode, setMode] = useState<'reschedule' | 'cancel' | null>(null);
  const local = new Date(
    Date.parse(meeting.start) -
      new Date(meeting.start).getTimezoneOffset() * 60000,
  ).toISOString();
  const [date, setDate] = useState(local.slice(0, 10)),
    [time, setTime] = useState(local.slice(11, 16)),
    [duration, setDuration] = useState(meeting.durationMin),
    [reason, setReason] = useState(''),
    [problem, setProblem] = useState('');
  const allowed =
    canContributeToApp(state, 'meetings') &&
    (isAppAdmin(state, 'meetings') || meeting.organizerId === state.meId);
  const run = () => {
    if (!reason.trim()) {
      setProblem(tr('Add a reason for this action.'));
      return;
    }
    const start = new Date(`${date}T${time}`);
    if (mode === 'reschedule' && !Number.isFinite(start.getTime())) {
      setProblem(tr('Choose a valid meeting date and time.'));
      return;
    }
    const error =
      mode === 'reschedule'
        ? meetingProblem(state, {
            ...meeting,
            start: start.toISOString(),
            durationMin: duration,
          })
        : undefined;
    if (error) {
      setProblem(tr(error));
      return;
    }
    dispatch({
      type: 'changeMeeting',
      meetingId: meeting.id,
      cancel: mode === 'cancel',
      start: mode === 'reschedule' ? start.toISOString() : undefined,
      durationMin: duration,
      reason,
    });
    setMode(null);
  };
  return (
    <>
      {meeting.status === 'cancelled' ? (
        <Banner tone="warning" title={tr('Meeting cancelled')}>
          {tr('The meeting history and existing follow-up tasks are retained.')}
        </Banner>
      ) : (
        allowed && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setMode('reschedule');
                setProblem('');
                setReason('');
              }}
            >
              {tr('Reschedule meeting')}
            </Button>
            <Button
              variant="tertiary"
              onClick={() => {
                setMode('cancel');
                setProblem('');
                setReason('');
              }}
            >
              {tr('Cancel meeting')}
            </Button>
          </div>
        )
      )}
      {!!meeting.history?.length && (
        <Card>
          <details>
            <summary className="cursor-pointer font-medium text-sm">
              {tr('Meeting history')}
            </summary>
            <ul className="mt-3 space-y-3 text-sm">
              {meeting.history.map((entry, i) => (
                <li key={`${entry.at}-${i}`}>
                  <strong>
                    {tr(
                      entry.action === 'rescheduled'
                        ? 'Rescheduled'
                        : 'Cancelled',
                    )}
                  </strong>{' '}
                  · {state.people.find((p) => p.id === entry.personId)?.name} ·{' '}
                  {new Date(entry.at).toLocaleString()}
                  <p className="text-muted-foreground">{entry.reason}</p>
                </li>
              ))}
            </ul>
          </details>
        </Card>
      )}
      <Modal
        open={!!mode}
        onOpenChange={(open) => !open && setMode(null)}
        title={tr(mode === 'cancel' ? 'Cancel meeting' : 'Reschedule meeting')}
        primaryAction={{
          content: tr('Confirm action'),
          onAction: run,
          destructive: mode === 'cancel',
        }}
        secondaryActions={[
          { content: tr('Cancel'), onAction: () => setMode(null) },
        ]}
      >
        <div className="space-y-4">
          {problem && <Banner tone="critical">{problem}</Banner>}
          {mode === 'reschedule' && (
            <>
              <DatePicker
                label={tr('Meeting date')}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <TimePicker
                label={tr('Start time')}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
              <Field label={tr('Duration in minutes')}>
                <Input
                  type="number"
                  min={5}
                  max={480}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </Field>
            </>
          )}
          <Field label={tr('Action reason')}>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
