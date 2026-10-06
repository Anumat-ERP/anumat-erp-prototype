import type { DataState } from '../data/types';
import type { createTranslator } from '../i18n/locale';
import { formatDate } from '../lib/format';
import { hrState, hours, OP_NAMES } from './engine';
import type { HRCollection, HRRecord, Attendance } from './types';
export const HR_COLLECTION_HELP: Record<HRCollection, string> = {
  employees: 'Keep employee identity, reporting lines and employment history together.',
  leaves: 'Request time off, review the decision and track the leave balance.',
  vacancies: 'Publish approved roles and track your job openings.',
  applications: 'Review candidate profiles and move each application forward.',
  attendance: 'Record a shift, submit it for review and resolve corrections before period closure.',
  attendancePeriods: 'Resolve all shift exceptions, then close the period to preserve payroll inputs.',
  payroll: 'Prepare a pay preview from closed attendance, obtain independent review, then freeze and export.',
  reviews: 'Set goals, collect self and manager evidence, and publish the review for acknowledgment.',
  courses: 'Define learning goals, publish the course and track employee participation.',
  enrollments: 'Record attendance, assess learning and keep attempts and certificate expiry together.',
  assets: 'Record equipment custody, condition, returns and maintenance.',
  reservations: 'Reserve a room for an employee and check overlapping bookings.',
  reports: 'Inspect live results, save a dated snapshot and export permitted source data.',
};
export function hrRecordDetails(state: DataState, collection: HRCollection, record: HRRecord, tr: ReturnType<typeof createTranslator>): string {
  const hr = hrState(state);
  const row = record as unknown as Record<string, unknown>;
  const date = (key: string) => row[key] ? formatDate(String(row[key])) : '';
  const range = () => `${date('startDate')} – ${date('endDate')}`;
  switch (collection) {
    case 'employees': return [row.code, row.position, row.department, row.branch].filter(Boolean).join(' · ');
    case 'leaves': return `${range()} · ${tr('{count} days', { count: Number(row.days ?? 0) })}`;
    case 'attendance': return `${date('date')} · ${row.checkIn} – ${row.checkOut} · ${tr('{count} hours', { count: hours(record as Attendance) })}`;
    case 'attendancePeriods': return range();
    case 'payroll': return `${range()} · ${row.currency}`;
    case 'reviews': return `${row.title} · ${range()}`;
    case 'courses': return `${date('date')} · ${tr('Pass score')}: ${row.passScore}/100`;
    case 'enrollments': return [hr.courses.find(course => course.id === row.courseId)?.title, row.expiresAt ? `${tr('Certificate expiry')}: ${date('expiresAt')}` : ''].filter(Boolean).join(' · ');
    case 'assets': return [row.code, tr(row.kind === 'room' ? 'Room' : 'Equipment'), row.employeeId ? hr.employees.find(employee => employee.id === row.employeeId)?.name : '', row.condition].filter(Boolean).join(' · ');
    case 'reservations': return [hr.assets.find(asset => asset.id === row.assetId)?.name, `${date('date')} · ${row.startTime} – ${row.endTime}`, row.purpose].filter(Boolean).join(' · ');
    case 'reports': return `${tr(String(row.source))} · ${range()}`;
    default: return String(row.email ?? row.department ?? '');
  }
}

export function hrActionLabel(collection: HRCollection, operation: string): string {
  if (collection === 'attendancePeriods' && operation === 'close') return 'Close attendance period';
  if (collection === 'attendancePeriods' && operation === 'reopen') return 'Reopen attendance period';
  if (collection === 'assets' && operation === 'return') return 'Return asset';
  if (collection === 'courses' && operation === 'close') return 'Close course';
  return OP_NAMES[operation] ?? 'Next action';
}
