import type { BadgeTone } from '@repo/ui';
import type { DocumentStatus, Process, RequestStatus, RequestType, StepStatus } from '../data/types';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const formatMoney = (n?: number) => (n === undefined ? '—' : money.format(n));

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatShortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export const formatDateTime = (iso: string) => `${formatShortDate(iso)}, ${formatTime(iso)}`;

export const formatWeekday = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

/** “3 hours ago”, “in 2 days”. */
export function formatRelative(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < hour) return rtf.format(Math.round(diff / minute), 'minute');
  if (abs < day) return rtf.format(Math.round(diff / hour), 'hour');
  return rtf.format(Math.round(diff / day), 'day');
}

/** Whole days from today to the date (negative = overdue). */
export function daysUntil(iso: string) {
  const a = new Date(iso);
  const b = new Date();
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export const typeLabel: Record<string, string> = {
  purchase: 'Purchase',
  leave: 'Leave',
  expense: 'Expense',
  contract: 'Contract',
};

export const requestStatus: Record<RequestStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending: { label: 'Pending', tone: 'warning' },
  changes: { label: 'Changes requested', tone: 'critical' },
  approved: { label: 'Approved', tone: 'success' },
  declined: { label: 'Declined', tone: 'critical' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
};

export const stepStatus: Record<StepStatus, string> = {
  done: 'Approved',
  current: 'Waiting',
  waiting: 'Not started',
  returned: 'Changes requested',
  declined: 'Declined',
};


export const docStatus: Record<DocumentStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  review: { label: 'In review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export function formatBytesShort(bytes: number) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

/** A request type's name: the built-in label, or the name of the process that defines it. */
export function typeName(type: RequestType, processes: Process[]) {
  return typeLabel[type] ?? processes.find((p) => p.requestType === type)?.name ?? 'Request';
}

export const isBuiltInType = (type: RequestType) => type in typeLabel;
