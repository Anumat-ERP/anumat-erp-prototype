import type { Meeting } from '../data/types';

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function range(m: Meeting) {
  const start = new Date(m.start);
  const end = new Date(start.getTime() + m.durationMin * 60_000);
  return { start, end };
}

function details(m: Meeting) {
  return m.agenda.length ? `Agenda:\n${m.agenda.map((a, i) => `${i + 1}. ${a}`).join('\n')}` : '';
}

/** A pre-filled "add event" link for Google Calendar. Works without any server. */
export function googleCalendarUrl(m: Meeting) {
  const { start, end } = range(m);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: m.title,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: details(m),
    location: m.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);

/** An .ics file that Outlook, Apple Calendar and Google Calendar can all import. */
export function icsFile(m: Meeting) {
  const { start, end } = range(m);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Anumat//Prototype//EN',
    'BEGIN:VEVENT',
    `UID:${m.id}@anumat.prototype`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(m.title)}`,
    `LOCATION:${esc(m.location)}`,
    `DESCRIPTION:${esc(details(m))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(m: Meeting) {
  const blob = new Blob([icsFile(m)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${m.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'meeting'}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
