import { isDone, waitingOnMe } from '../../data/store';
import type { DataState, Request } from '../../data/types';

const DAY = 86_400_000;

/** When a request was decided: the last answered step, or its last update. */
export function decidedAt(r: Request) {
  const answered = r.steps.filter((s) => s.at).map((s) => s.at!);
  return answered.length ? answered.sort().at(-1)! : r.updatedAt;
}

/** The four numbers on Home's Ask → Approve → Execute → Track strip. */
export function homeCounts(state: DataState, now = Date.now()) {
  const me = state.meId;
  return {
    ask: state.requests.filter((r) => r.requesterId === me && r.status === 'draft').length,
    approve: waitingOnMe(state).length,
    execute: state.tasks.filter((t) => t.ownerId === me && !isDone(state, t)).length,
    track: state.requests.filter(
      (r) => r.status === 'approved' && now - Date.parse(decidedAt(r)) <= 30 * DAY,
    ).length,
  };
}

/** Submitted and approved requests per day for the last `days` days, oldest first. */
export function requestsByDay(state: DataState, days = 30, now = Date.now()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const first = start.getTime() - (days - 1) * DAY;
  const buckets = Array.from({ length: days }, (_, i) => ({
    date: new Date(first + i * DAY).toISOString().slice(0, 10),
    submitted: 0,
    approved: 0,
  }));
  const index = (iso: string) => Math.floor((Date.parse(iso) - first) / DAY);
  for (const r of state.requests) {
    if (r.status !== 'draft') {
      const i = index(r.createdAt);
      const b = buckets[i];
      if (b) b.submitted++;
    }
    if (r.status === 'approved') {
      const i = index(decidedAt(r));
      const b = buckets[i];
      if (b) b.approved++;
    }
  }
  return buckets;
}

/** Average days from submission to the final decision, over decided requests; null when none. */
export function averageDecisionDays(state: DataState) {
  const decided = state.requests.filter((r) => r.status === 'approved' || r.status === 'declined');
  if (!decided.length) return null;
  const total = decided.reduce(
    (sum, r) => sum + Math.max(0, Date.parse(decidedAt(r)) - Date.parse(r.createdAt)),
    0,
  );
  return total / decided.length / DAY;
}
