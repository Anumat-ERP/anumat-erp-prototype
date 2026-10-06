import type { DataState } from '../data/types';
import { appRole, isAppAdmin } from '../lib/appAccess';
import { hrState, reportAllowed, visibleRecords } from './engine';
import { NEW_NAMES } from './catalog';
import type { HRApp, HRCollection, HRRecord } from './types';

export type DashboardMetric = { label: string; count: number; href: string };
export type DashboardItem = { id: string; title: string; detail: string; status: string; href: string };
export type DashboardAction = { label: string; href: string };
export type HRDashboardModel = { metrics: DashboardMetric[]; queue: DashboardItem[]; recent: DashboardItem[]; actions: DashboardAction[]; guidance: string; dependencies: DashboardAction[] };
export const collectionHref = (app: HRApp, collection: HRCollection, status?: string) => `/${app}?tab=${collection}${status ? `&status=${status}` : ''}`;
export function hrDashboard(state: DataState, app: HRApp): HRDashboardModel {
  const hr = hrState(state);
  const admin = isAppAdmin(state, app);
  const employees = visibleRecords(state, 'employees');
  const leaves = visibleRecords(state, 'leaves');
  const attendance = visibleRecords(state, 'attendance');
  const periods = visibleRecords(state, 'attendancePeriods');
  const payroll = visibleRecords(state, 'payroll');
  const reviews = visibleRecords(state, 'reviews');
  const courses = visibleRecords(state, 'courses');
  const enrollments = visibleRecords(state, 'enrollments');
  const assets = visibleRecords(state, 'assets');
  const reservations = visibleRecords(state, 'reservations');
  const reports = visibleRecords(state, 'reports');
  const employeeName = (id: string) => hr.employees.find(employee => employee.id === id)?.name ?? '';
  const metric = (label: string, count: number, collection: HRCollection, status?: string): DashboardMetric => ({ label, count, href: collectionHref(app, collection, status) });
  const item = (collection: HRCollection, record: HRRecord, title: string, detail: string): DashboardItem => ({ id: `${collection}-${record.id}`, title, detail, status: record.status, href: `${collectionHref(app, collection)}&record=${record.id}` });
  const action = (collection: HRCollection): DashboardAction => ({ label: NEW_NAMES[collection], href: `${collectionHref(app, collection)}&create=1` });
  let model: HRDashboardModel;
  switch (app) {
    case 'employees': {
      const pending = hr.changes?.filter(change => change.status === 'pending' && employees.some(employee => employee.id === change.employeeId)) ?? [];
      model = {
        metrics: [metric('Active employees', employees.filter(employee => employee.status === 'active').length, 'employees', 'active'), metric('On probation', employees.filter(employee => employee.status === 'probation').length, 'employees', 'probation'), metric('Pending leave', leaves.filter(leave => leave.status === 'pending').length, 'leaves', 'pending')],
        queue: [...pending.map(change => ({ id: change.id, title: employeeName(change.employeeId), detail: [change.effectiveDate, change.patch.position].filter(Boolean).join(' · '), status: change.status, href: `/employees?tab=employees&record=${change.employeeId}` })), ...leaves.filter(leave => leave.status === 'pending').map(leave => item('leaves', leave, employeeName(leave.employeeId), `${leave.startDate} – ${leave.endDate}`)), ...employees.filter(employee => ['prestart', 'probation'].includes(employee.status)).map(employee => item('employees', employee, employee.name, `${employee.position} · ${employee.startDate}`))],
        recent: [...employees].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5).map(employee => item('employees', employee, employee.name, `${employee.position} · ${employee.department}`)),
        actions: admin ? [action('employees'), action('leaves')] : [],
        guidance: 'Add employee records, review employment changes and resolve leave requests. Employee records are separate from login access.', dependencies: [],
      }; break;
    }
    case 'attendance': {
      model = {
        metrics: [metric('Pending shifts', attendance.filter(shift => shift.status === 'pending').length, 'attendance', 'pending'), metric('Draft shifts', attendance.filter(shift => shift.status === 'draft').length, 'attendance', 'draft'), metric('Closed periods', periods.filter(period => period.status === 'closed').length, 'attendancePeriods', 'closed')],
        queue: attendance.filter(shift => ['draft', 'pending'].includes(shift.status)).map(shift => item('attendance', shift, employeeName(shift.employeeId), `${shift.date} · ${shift.checkIn} – ${shift.checkOut}`)),
        recent: [...periods].sort((a, b) => b.endDate.localeCompare(a.endDate)).slice(0, 5).map(period => item('attendancePeriods', period, period.title, `${period.startDate} – ${period.endDate}`)),
        actions: admin ? [action('attendance'), action('attendancePeriods')] : [],
        guidance: 'Record and submit shifts, resolve review exceptions, then close the attendance period before preparing payroll.',
        dependencies: appRole(state, 'payroll') ? [{ label: 'Open pay periods', href: '/payroll' }] : [],
      }; break;
    }
    case 'payroll': {
      model = {
        metrics: [metric('Draft pay periods', payroll.filter(period => period.status === 'draft').length, 'payroll', 'draft'), metric('Awaiting payroll review', payroll.filter(period => period.status === 'prepared').length, 'payroll', 'prepared'), metric('Frozen pay periods', payroll.filter(period => period.status === 'frozen').length, 'payroll', 'frozen')],
        queue: payroll.filter(period => period.status !== 'frozen').map(period => item('payroll', period, period.title, `${period.startDate} – ${period.endDate} · ${period.currency}`)),
        recent: [...payroll].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5).map(period => item('payroll', period, period.title, `${period.startDate} – ${period.endDate} · ${period.currency}`)),
        actions: admin ? [action('payroll')] : [],
        guidance: 'Close attendance first, prepare the preview, ask another Payroll admin to review it, then freeze and export.',
        dependencies: appRole(state, 'attendance') ? [{ label: 'Review attendance periods', href: '/attendance?tab=attendancePeriods' }] : [],
      }; break;
    }
    case 'performance': {
      model = {
        metrics: [metric('Self reviews', reviews.filter(review => review.status === 'self-review').length, 'reviews', 'self-review'), metric('Manager reviews', reviews.filter(review => review.status === 'manager-review').length, 'reviews', 'manager-review'), metric('Published reviews', reviews.filter(review => review.status === 'published').length, 'reviews', 'published')],
        queue: reviews.filter(review => admin ? ['draft', 'manager-review'].includes(review.status) || (review.status === 'self-review' && hr.employees.find(employee => employee.id === review.employeeId)?.accountId === state.meId) : ['self-review', 'published'].includes(review.status)).map(review => item('reviews', review, `${employeeName(review.employeeId)} · ${review.title}`, `${review.startDate} – ${review.endDate}`)),
        recent: [...reviews].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5).map(review => item('reviews', review, `${employeeName(review.employeeId)} · ${review.title}`, `${review.startDate} – ${review.endDate}`)),
        actions: admin ? [action('reviews')] : [],
        guidance: 'Set a measurable goal, collect self-review evidence, record the manager assessment, then publish for employee acknowledgment.', dependencies: [],
      }; break;
    }
    case 'training': {
      model = {
        metrics: [metric('Open courses', courses.filter(course => course.status === 'open').length, 'courses', 'open'), metric('Awaiting assessment', enrollments.filter(enrollment => enrollment.status === 'attended').length, 'enrollments', 'attended'), metric('Completed enrollments', enrollments.filter(enrollment => enrollment.status === 'completed').length, 'enrollments', 'completed')],
        queue: enrollments.filter(enrollment => ['enrolled', 'attended', 'failed'].includes(enrollment.status)).map(enrollment => item('enrollments', enrollment, employeeName(enrollment.employeeId), hr.courses.find(course => course.id === enrollment.courseId)?.title ?? '')),
        recent: [...courses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(course => item('courses', course, course.title, course.date)),
        actions: admin ? [action('courses'), action('enrollments')] : [],
        guidance: 'Publish a course, enroll employees, record attendance and assessment evidence, then create a linked evaluation after completion.',
        dependencies: appRole(state, 'surveys') ? [{ label: 'View training evaluations', href: '/surveys' }] : [],
      }; break;
    }
    case 'assets': {
      model = {
        metrics: [metric('Available assets', assets.filter(asset => asset.status === 'available').length, 'assets', 'available'), metric('Assigned assets', assets.filter(asset => asset.status === 'assigned').length, 'assets', 'assigned'), metric('Assets in maintenance', assets.filter(asset => asset.status === 'maintenance').length, 'assets', 'maintenance')],
        queue: assets.filter(asset => asset.status === 'maintenance').map(asset => item('assets', asset, asset.name, `${asset.code} · ${asset.condition}`)),
        recent: [...reservations].filter(reservation => reservation.status === 'reserved').sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).slice(0, 5).map(reservation => item('reservations', reservation, hr.assets.find(asset => asset.id === reservation.assetId)?.name ?? reservation.purpose, `${reservation.date} · ${reservation.startTime} – ${reservation.endTime}`)),
        actions: admin ? [action('assets'), action('reservations')] : [],
        guidance: 'Register equipment and rooms, record equipment custody and condition, and check room availability before reserving.', dependencies: [],
      }; break;
    }
    case 'reports': {
      const allowed = reports.filter(report => reportAllowed(state, report.source));
      model = {
        metrics: [metric('Draft reports', allowed.filter(report => report.status === 'draft').length, 'reports', 'draft'), metric('Saved snapshots', allowed.filter(report => report.status === 'saved').length, 'reports', 'saved'), metric('Accessible reports', allowed.length, 'reports')],
        queue: allowed.filter(report => report.status === 'draft').map(report => item('reports', report, report.title, `${report.startDate} – ${report.endDate}`)),
        recent: [...allowed].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5).map(report => item('reports', report, report.title, `${report.startDate} – ${report.endDate}`)),
        actions: admin ? [action('reports')] : [],
        guidance: 'Choose a source and period, inspect the live results, then save a snapshot or export. Source-app admin access is required.', dependencies: [],
      }; break;
    }
    default: return { metrics: [], queue: [], recent: [], actions: [], guidance: '', dependencies: [] };
  }
  if (!admin && appRole(state, app) === 'member') {
    const selfService: Partial<Record<HRApp, HRCollection>> = { employees: 'leaves', attendance: 'attendance', training: 'enrollments', assets: 'reservations' };
    const collection = selfService[app];
    if (collection) model.actions = [action(collection)];
  }
  return model;
}
