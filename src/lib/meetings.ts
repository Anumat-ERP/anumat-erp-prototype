import type { DataState, Meeting } from '../data/types';
import { appRole } from './appAccess';
export function meetingProblem(state: DataState, meeting: Meeting): string | undefined {
  const start = Date.parse(meeting.start);
  if (!meeting.title.trim() || !Number.isFinite(start) || !Number.isInteger(meeting.durationMin) || meeting.durationMin < 5 || meeting.durationMin > 480) return 'Add a meeting title, valid start time, and duration from 5 to 480 minutes.';
  if (!appRole(state, 'meetings', meeting.organizerId) || meeting.attendeeIds.some(id => !appRole(state, 'meetings', id))) return 'Choose attendees with access to Meeting management.';
  const existing = state.meetings.find(m => m.id === meeting.id);
  if (meeting.requestIds.some(id => !existing?.requestIds.includes(id) && (!appRole(state, 'approvals') || !state.requests.some(request => request.id === id)))) return 'Choose requests you can access in Requests & approvals.';
  const end = start + meeting.durationMin * 60000;
  const people = new Set([meeting.organizerId, ...meeting.attendeeIds]);
  if (state.meetings.some(m => m.id !== meeting.id && m.status !== 'cancelled' && Date.parse(m.start) < end && start < Date.parse(m.start) + m.durationMin * 60000 && [m.organizerId, ...m.attendeeIds].some(id => people.has(id)))) return 'An attendee has another meeting during this time. Choose another time.';
}
