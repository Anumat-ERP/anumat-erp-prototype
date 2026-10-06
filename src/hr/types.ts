import type { Attachment } from '../data/types';
import type { RecruitmentState, RecruitmentCommand } from './recruitmentTypes';
import type { WorkspaceApp } from '../lib/moduleEntry';
export const HR_APPS = [
  'employees',
  'recruitment',
  'attendance',
  'payroll',
  'performance',
  'training',
  'assets',
  'reports',
] as const;
export type HRApp = (typeof HR_APPS)[number];
export const isHRApp = (app: WorkspaceApp): app is HRApp =>
  (HR_APPS as readonly string[]).includes(app);
export interface HRRecord {
  id: string;
  version: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}
export interface Employee extends HRRecord {
  probationEndDate?: string;
  verifications?: import('./advancedTypes').Verification[];
  code: string;
  name: string;
  email: string;
  accountId: string;
  department: string;
  branch: string;
  managerId: string;
  position: string;
  startDate: string;
  endDate: string;
  salary: number;
  currency: 'USD' | 'KHR';
  leaveAllowance: number;
}
export interface EmploymentEpisode {
  id: string;
  employeeId: string;
  startDate: string;
  endDate?: string;
  position: string;
  department: string;
  salary: number;
  currency: 'USD' | 'KHR';
}
export interface Vacancy extends HRRecord {
  jobDetails?: import('./recruitmentTypes').JobDescriptionDetails;
  requisitionId?: string;
  closingDate?: string;
  managerId?: string;
  requirements?: string;
  employmentType?: string;
  title: string;
  department: string;
  branch: string;
  description: string;
  openings: number;
}
export interface CandidateEducation {
  institution: string;
  qualification: string;
  field: string;
  startYear: string;
  endYear: string;
  ongoing: boolean;
}
export interface CandidateExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  achievements: string;
}
export interface CandidateSkill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  }
export interface CandidateProject {
  name: string;
  type: 'Professional' | 'Academic' | 'Personal' | 'Volunteer' | 'Other';
  role: string;
  url: string;
  outcomes: string;
}
export interface CandidateProfile {
  education: CandidateEducation[];
  experience: CandidateExperience[];
  skills: CandidateSkill[];
  projects: CandidateProject[];
  notes: string;
}
export interface Application extends HRRecord {
  stageId?: string;
  profile?: CandidateProfile;
  attachments?: Attachment[];
  phone?: string;
  source?: string;
  consent?: string;
  resume?: string;
  hiringChecks?: string;
  vacancyId: string;
  name: string;
  email: string;
  interviewDate: string;
  evidence: string;
  salary: number;
  currency: 'USD' | 'KHR';
  startDate: string;
  employeeId?: string;
  offerRevision: number;
}
export interface Leave extends HRRecord {
  calendar?: import("../data/types").WorkCalendar;
  employeeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  reviewerId?: string;
}
export interface LeaveEntry {
  id: string;
  employeeId: string;
  leaveId: string;
  days: number;
  at: string;
  kind: 'used' | 'reversal';
}
export interface Attendance extends HRRecord {
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  overtimeHours: number;
  reason: string;
  reviewerId?: string;
}
export interface AttendancePeriod extends HRRecord {
  title: string;
  startDate: string;
  endDate: string;
  reason: string;
  snapshot?: Attendance[];
}
export interface PayrollLine {
  employeeId: string;
  name: string;
  currency: 'USD' | 'KHR';
  base: number;
  adjustment: number;
  total: number;
  attendanceHours: number;
  leaveDays: number;
  employeeVersion: number;
}
export interface Payroll extends HRRecord {
  deliveries?: {at:string;actorId:string;outcome:'success'|'rejected'|'uncertain';reason:string;version:number}[];
  title: string;
  startDate: string;
  endDate: string;
  currency: 'USD' | 'KHR';
  adjustment: number;
  reason: string;
  lines?: PayrollLine[];
  preparedById?: string;
  reviewedById?: string;
}
export interface Review extends HRRecord {
  employeeResponse?: {reason:string;at:string;actorId:string};
  employeeId: string;
  title: string;
  startDate: string;
  endDate: string;
  goal: string;
  selfEvidence: string;
  managerEvidence: string;
  rating: number;
  development: string;
}
export interface Course extends HRRecord {
  capacity?: number;
  prerequisiteId?: string;
  title: string;
  date: string;
  description: string;
  passScore: number;
  validMonths: number;
}
export interface Enrollment extends HRRecord {
  employeeId: string;
  courseId: string;
  score: number;
  evidence: string;
  attended: boolean;
  passScoreSnapshot?: number;
  validMonthsSnapshot?: number;
  attempts: { score: number; evidence: string; at: string }[];
  expiresAt?: string;
  surveyId?: string;
}
export interface Asset extends HRRecord {
  code: string;
  name: string;
  kind: 'equipment' | 'room';
  employeeId: string;
  condition: string;
  reason: string;
}
export interface Reservation extends HRRecord {
  assetId: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
}
export interface SavedReport extends HRRecord {
  title: string;
  source:
    | 'headcount'
    | 'leave'
    | 'attendance'
    | 'payroll'
    | 'assets'
    | 'training';
  department: string;
  startDate: string;
  endDate: string;
  snapshot?: ReportRow[];
}
export interface ReportRow {
  id: string;
  name: string;
  department: string;
  status: string;
  value: number;
  unit: string;
}
export interface HRCollections {
  employees: Employee;
  vacancies: Vacancy;
  applications: Application;
  leaves: Leave;
  attendance: Attendance;
  attendancePeriods: AttendancePeriod;
  payroll: Payroll;
  reviews: Review;
  courses: Course;
  enrollments: Enrollment;
  assets: Asset;
  reservations: Reservation;
  reports: SavedReport;
}
export type HRCollection = keyof HRCollections;
export interface HREvent {
  id: string;
  collection: HRCollection;
  recordId: string;
  actorId: string;
  at: string;
  action: string;
  reason: string;
  before?: HRRecord;
  after: HRRecord;
}
export interface EmployeeChange {
  reviewerId?: string;
  approvalStatus?: 'pending' | 'approved' | 'declined';
  decision?: {actorId:string;at:string;reason:string};

  id: string;
  employeeId: string;
  effectiveDate: string;
  expectedVersion: number;
  patch: Pick<
    Employee,
    'position' | 'department' | 'branch' | 'salary' | 'currency' | 'managerId'
  >;
  reason: string;
  status: 'pending' | 'applied' | 'cancelled';
  createdById: string;
  createdAt: string;
}
export type HRState = { [K in HRCollection]: HRCollections[K][] } & {
  plans?: import('./advancedTypes').EmployeePlan[];
  schemaVersion: 1;
  recruitment?: RecruitmentState;
  compensationAccess?: Record<string, 'read' | 'write'>;
  changes?: EmployeeChange[];
  episodes: EmploymentEpisode[];
  leaveLedger: LeaveEntry[];
  history: HREvent[];
  scopes: Partial<Record<HRApp, Record<string, 'own' | 'department' | 'all'>>>;
};
export type HRCommand =
  | {kind:'advanced';command:import('./advancedTypes').AdvancedHRCommand}
  | { kind: 'recruitment'; command: RecruitmentCommand }
  | {
      [K in HRCollection]: {
        kind: 'save';
        collection: K;
        record: HRCollections[K];
        expectedVersion?: number;
        reason?: string;
      };
    }[HRCollection]
  | {
      kind: 'transition';
      collection: HRCollection;
      id: string;
      operation: string;
      expectedVersion: number;
      reason?: string;
    }
  | { kind: 'loadExamples' }
  | {
      kind: 'scope';
      app: HRApp;
      personId: string;
      scope: 'own' | 'department' | 'all';
    }
  | { kind: 'reviewChange'; id: string; outcome: 'approved' | 'declined'; reason: string }
  | { kind: 'schedule'; change: EmployeeChange }
  | { kind: 'applyChange'; id: string }
  | { kind: 'cancelChange'; id: string }
  | { kind: 'import'; records: Employee[] }
  | { kind: 'evaluation'; enrollmentId: string }
  | {
      kind: 'compensationAccess';
      personId: string;
      access: 'none' | 'read' | 'write';
    };
export const COLLECTION_APP: Record<HRCollection, HRApp> = {
  employees: 'employees',
  leaves: 'employees',
  vacancies: 'recruitment',
  applications: 'recruitment',
  attendance: 'attendance',
  attendancePeriods: 'attendance',
  payroll: 'payroll',
  reviews: 'performance',
  courses: 'training',
  enrollments: 'training',
  assets: 'assets',
  reservations: 'assets',
  reports: 'reports',
};
export const emptyHR = (): HRState => ({
  schemaVersion: 1,
  employees: [],
  vacancies: [],
  applications: [],
  leaves: [],
  attendance: [],
  attendancePeriods: [],
  payroll: [],
  reviews: [],
  courses: [],
  enrollments: [],
  assets: [],
  reservations: [],
  reports: [],
  episodes: [],
  leaveLedger: [],
  history: [],
  scopes: {},
});
