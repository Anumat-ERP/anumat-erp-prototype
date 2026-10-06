import {
  Users,
  BriefcaseBusiness,
  CalendarCheck,
  Wallet,
  Target,
  GraduationCap,
  Package,
  BarChart3,
} from 'lucide-react';
import type { HRApp, HRCollection } from './types';
export const HR_MODULES = {
  employees: {
    icon: Users,
    description: 'Manage employee records, employment history, and leave.',
    collections: ['employees', 'leaves'],
  },
  recruitment: {
    icon: BriefcaseBusiness,
    description: 'Move candidates from a job opening to a documented hire.',
    collections: ['vacancies', 'applications'],
  },
  attendance: {
    icon: CalendarCheck,
    description: 'Review daily shifts and close attendance periods.',
    collections: ['attendance', 'attendancePeriods'],
  },
  payroll: {
    icon: Wallet,
    description:
      'Prepare, independently review, and freeze illustrative pay previews.',
    collections: ['payroll'],
  },
  performance: {
    icon: Target,
    description:
      'Connect measurable goals, evidence, reviews, and development.',
    collections: ['reviews'],
  },
  training: {
    icon: GraduationCap,
    description: 'Plan courses and record participation and learning evidence.',
    collections: ['courses', 'enrollments'],
  },
  assets: {
    icon: Package,
    description: 'Track equipment custody, maintenance, and room reservations.',
    collections: ['assets', 'reservations'],
  },
  reports: {
    icon: BarChart3,
    description: 'Review scoped results and preserve report snapshots.',
    collections: ['reports'],
  },
} satisfies Record<
  HRApp,
  { icon: typeof Users; description: string; collections: HRCollection[] }
>;
export const COLLECTION_NAMES: Record<HRCollection, string> = {
  employees: 'Employees',
  leaves: 'Leave requests',
  vacancies: 'Job openings',
  applications: 'Candidates',
  attendance: 'Daily attendance',
  attendancePeriods: 'Attendance periods',
  payroll: 'Pay periods',
  reviews: 'Performance reviews',
  courses: 'Courses',
  enrollments: 'Enrollments',
  assets: 'Asset register',
  reservations: 'Room reservations',
  reports: 'Saved reports',
};
export const NEW_NAMES: Record<HRCollection, string> = {
  employees: 'Add employee',
  leaves: 'Request leave',
  vacancies: 'Create job opening',
  applications: 'Add candidate',
  attendance: 'Record shift',
  attendancePeriods: 'Create attendance period',
  payroll: 'Create pay period',
  reviews: 'Create performance review',
  courses: 'Create course',
  enrollments: 'Enroll employee',
  assets: 'Add asset',
  reservations: 'Reserve room',
  reports: 'Create report',
};
export type FieldSpec = {
  key: string;
  label: string;
  type?: 'date' | 'number' | 'textarea' | 'select' | 'time';
  source?: 'employee' | 'manager' | 'account' | 'vacancy' | 'course' | 'room';
  options?: string[];
  required?: boolean;
  private?: boolean;
  placeholder?: string;
};
export const FIELDS: Record<HRCollection, FieldSpec[]> = {
  employees: [
    { key: 'code', label: 'Employee code', required: true },
    { key: 'name', label: 'Full name', required: true },
    { key: 'email', label: 'Work email', required: true },
    {
      key: 'accountId',
      label: 'Linked login account',
      type: 'select',
      source: 'account',
    },
    { key: 'department', label: 'Department', required: true },
    { key: 'branch', label: 'Branch', required: true },
    { key: 'position', label: 'Position', required: true },
    { key: 'managerId', label: 'Manager', type: 'select', source: 'manager' },
    {
      key: 'startDate',
      label: 'First working day',
      type: 'date',
      required: true,
    },
    { key: 'endDate', label: 'Last working day', type: 'date' },
    {
      key: 'salary',
      label: 'Illustrative base pay',
      type: 'number',
      private: true,
    },
    {
      key: 'currency',
      label: 'Currency',
      type: 'select',
      options: ['USD', 'KHR'],
      private: true,
    },
    { key: 'leaveAllowance', label: 'Demo leave allowance', type: 'number' },
  ],
  vacancies: [
    { key: 'title', label: 'Job title', required: true },
    { key: 'department', label: 'Department', required: true },
    { key: 'branch', label: 'Branch', required: true },
    {
      key: 'openings',
      label: 'Number of openings',
      type: 'number',
      required: true,
    },
    {
      key: 'description',
      label: 'Job description',
      type: 'textarea',
      required: true,
    },
  ],
  applications: [
    {
      key: 'vacancyId',
      label: 'Job opening',
      type: 'select',
      source: 'vacancy',
      required: true,
    },
    { key: 'name', label: 'Candidate name', required: true },
    { key: 'email', label: 'Candidate email', required: true },
    { key: 'phone', label: 'Phone number' },
    { key: 'source', label: 'Candidate source', required: true },
    { key: 'consent', label: 'Consent evidence', type: 'textarea', required: true },
    { key: 'resume', label: 'Resume and portfolio notes', type: 'textarea' },
    { key: 'hiringChecks', label: 'Pre-hire verification evidence', type: 'textarea' },
    { key: 'interviewDate', label: 'Interview date', type: 'date' },
    { key: 'evidence', label: 'Interview evidence', type: 'textarea' },
    { key: 'salary', label: 'Offer base pay', type: 'number' },
    {
      key: 'currency',
      label: 'Currency',
      type: 'select',
      options: ['USD', 'KHR'],
    },
    { key: 'startDate', label: 'Proposed start date', type: 'date' },
  ],
  leaves: [
    {
      key: 'employeeId',
      label: 'Employee',
      type: 'select',
      source: 'employee',
      required: true,
    },
    {
      key: 'startDate',
      label: 'First day of leave',
      type: 'date',
      required: true,
    },
    {
      key: 'endDate',
      label: 'Last day of leave',
      type: 'date',
      required: true,
    },
    { key: 'reason', label: 'Leave reason', type: 'textarea', required: true },
  ],
  attendance: [
    {
      key: 'employeeId',
      label: 'Employee',
      type: 'select',
      source: 'employee',
      required: true,
    },
    { key: 'date', label: 'Shift date', type: 'date', required: true },
    { key: 'checkIn', label: 'Clock in', type: 'time' },
    { key: 'checkOut', label: 'Clock out', type: 'time' },
    { key: 'overtimeHours', label: 'Overtime hours', type: 'number' },
    { key: 'reason', label: 'Correction reason', type: 'textarea' },
  ],
  attendancePeriods: [
    { key: 'title', label: 'Period name', required: true },
    { key: 'startDate', label: 'Period start', type: 'date', required: true },
    { key: 'endDate', label: 'Period end', type: 'date', required: true },
    { key: 'reason', label: 'Period note', type: 'textarea' },
  ],
  payroll: [
    { key: 'title', label: 'Period name', required: true },
    { key: 'startDate', label: 'Period start', type: 'date', required: true },
    { key: 'endDate', label: 'Period end', type: 'date', required: true },
    {
      key: 'currency',
      label: 'Currency',
      type: 'select',
      options: ['USD', 'KHR'],
    },
    {
      key: 'adjustment',
      label: 'Flat adjustment per employee',
      type: 'number',
    },
    {
      key: 'reason',
      label: 'Calculation note',
      type: 'textarea',
      required: true,
    },
  ],
  reviews: [
    {
      key: 'employeeId',
      label: 'Employee',
      type: 'select',
      source: 'employee',
      required: true,
    },
    { key: 'title', label: 'Review title', required: true },
    { key: 'startDate', label: 'Period start', type: 'date', required: true },
    { key: 'endDate', label: 'Period end', type: 'date', required: true },
    { key: 'goal', label: 'Measurable goal', type: 'textarea', required: true },
    { key: 'selfEvidence', label: 'Self-review evidence', type: 'textarea' },
    {
      key: 'managerEvidence',
      label: 'Manager assessment',
      type: 'textarea',
      private: true,
    },
    {
      key: 'rating',
      label: 'Rating from 1 to 5',
      type: 'number',
      private: true,
    },
    {
      key: 'development',
      label: 'Development plan',
      type: 'textarea',
      private: true,
    },
  ],
  courses: [
    { key: 'title', label: 'Course name', required: true },
    { key: 'date', label: 'Course date', type: 'date', required: true },
    {
      key: 'description',
      label: 'Learning objectives',
      type: 'textarea',
      required: true,
    },
    { key: 'passScore', label: 'Passing score', type: 'number' },
    {
      key: 'validMonths',
      label: 'Certificate validity in months',
      type: 'number',
    },
  ],
  enrollments: [
    {
      key: 'employeeId',
      label: 'Employee',
      type: 'select',
      source: 'employee',
      required: true,
    },
    {
      key: 'courseId',
      label: 'Course',
      type: 'select',
      source: 'course',
      required: true,
    },
    { key: 'score', label: 'Assessment score', type: 'number', private: true },
    {
      key: 'evidence',
      label: 'Assessment evidence',
      type: 'textarea',
      private: true,
    },
  ],
  assets: [
    { key: 'code', label: 'Asset code', required: true },
    { key: 'name', label: 'Asset name', required: true },
    {
      key: 'kind',
      label: 'Asset type',
      type: 'select',
      options: ['equipment', 'room'],
    },
    {
      key: 'employeeId',
      label: 'Custodian',
      type: 'select',
      source: 'employee',
    },
    {
      key: 'condition',
      label: 'Asset condition',
      type: 'textarea',
      required: true,
    },
    { key: 'reason', label: 'Custody note', type: 'textarea' },
  ],
  reservations: [
    {
      key: 'assetId',
      label: 'Room',
      type: 'select',
      source: 'room',
      required: true,
    },
    {
      key: 'employeeId',
      label: 'Employee',
      type: 'select',
      source: 'employee',
      required: true,
    },
    { key: 'date', label: 'Reservation date', type: 'date', required: true },
    { key: 'startTime', label: 'Start time', type: 'time' },
    { key: 'endTime', label: 'End time', type: 'time' },
    {
      key: 'purpose',
      label: 'Meeting purpose',
      type: 'textarea',
      required: true,
    },
  ],
  reports: [
    { key: 'title', label: 'Report name', required: true },
    {
      key: 'source',
      label: 'Report source',
      type: 'select',
      options: [
        'headcount',
        'leave',
        'attendance',
        'payroll',
        'assets',
        'training',
      ],
    },
    { key: 'department', label: 'Department filter' },
    { key: 'startDate', label: 'Period start', type: 'date', required: true },
    { key: 'endDate', label: 'Period end', type: 'date', required: true },
  ],
};
export const STATUS_NAMES: Record<string, string> = {
  probation: 'Probation',
  active: 'Active',
  exited: 'Exited',
  draft: 'Draft',
  open: 'Open',
  closed: 'Closed',
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  scheduled: 'Scheduled',
  prestart: 'Pre-start',
  paused: 'Paused',
  interviewed: 'Interviewed',
  offered: 'Offered',
  accepted: 'Accepted',
  hired: 'Hired',
  rejected: 'Rejected',
  pending: 'Pending review',
  approved: 'Approved',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
  cancelled: 'Cancelled',
  prepared: 'Prepared',
  reviewed: 'Reviewed',
  frozen: 'Frozen',
  'self-review': 'Self review',
  'manager-review': 'Manager review',
  published: 'Published',
  acknowledged: 'Acknowledged',
  enrolled: 'Enrolled',
  attended: 'Attended',
  completed: 'Completed',
  failed: 'Failed',
  available: 'Available',
  assigned: 'Assigned',
  maintenance: 'Maintenance',
  reserved: 'Reserved',
  saved: 'Saved',
};

export const REPORT_DEFINITIONS: Record<string, string> = {
  headcount:
    'Employees whose employment episode includes the period end date. One employee counts once.',
  leave:
    'Working days of currently approved leave inside the selected dates. Cancelled leave is excluded.',
  attendance:
    'Hours from approved shifts starting inside the selected dates. Overnight shifts belong to their start date.',
  payroll:
    'Illustrative totals from frozen pay periods overlapping the selected dates. USD and KHR remain separate.',
  assets:
    'Current assigned equipment at generation time. This report does not reconstruct historical custody.',
  training:
    'Successful assessments completed inside the selected dates. Enrollment alone does not count.',
};
