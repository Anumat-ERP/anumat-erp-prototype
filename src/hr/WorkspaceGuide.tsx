import { ChevronDown } from 'lucide-react';
import { useLocale } from '../i18n/LocaleProvider';
import { hrState } from './engine';
import type { DataState } from '../data/types';
import type { FieldSpec } from './catalog';
import type { HRApp, HRCollection, HRRecord } from './types';

type FieldGroup = { title: string; keys: string[] };
export const FIELD_GROUPS: Record<HRCollection, FieldGroup[]> = {
  employees: [
    { title: 'Identity & contact', keys: ['code', 'name', 'email', 'accountId'] },
    { title: 'Role & employment', keys: ['department', 'branch', 'position', 'managerId', 'startDate', 'endDate'] },
    { title: 'Pay & leave', keys: ['salary', 'currency', 'leaveAllowance'] },
  ],
  applications: [
    { title: 'Candidate details', keys: ['vacancyId', 'name', 'email', 'phone', 'source', 'consent', 'resume'] },
    { title: 'Interview & verification', keys: ['interviewDate', 'evidence', 'hiringChecks'] },
    { title: 'Proposed offer', keys: ['salary', 'currency', 'startDate'] },
  ],
  vacancies: [{ title: 'Role details', keys: ['title', 'department', 'branch', 'openings', 'description'] }],
  leaves: [{ title: 'Time off', keys: ['employeeId', 'startDate', 'endDate', 'reason'] }],
  attendance: [
    { title: 'Employee & shift', keys: ['employeeId', 'date', 'checkIn', 'checkOut'] },
    { title: 'Overtime & corrections', keys: ['overtimeHours', 'reason'] },
  ],
  attendancePeriods: [{ title: 'Attendance period', keys: ['title', 'startDate', 'endDate', 'reason'] }],
  payroll: [
    { title: 'Pay period', keys: ['title', 'startDate', 'endDate', 'currency'] },
    { title: 'Adjustments & calculation', keys: ['adjustment', 'reason'] },
  ],
  reviews: [
    { title: 'Review scope', keys: ['employeeId', 'title', 'startDate', 'endDate', 'goal'] },
    { title: 'Employee reflection', keys: ['selfEvidence'] },
    { title: 'Manager review & development', keys: ['managerEvidence', 'rating', 'development'] },
  ],
  courses: [
    { title: 'Course details', keys: ['title', 'date', 'description'] },
    { title: 'Assessment & certification', keys: ['passScore', 'validMonths'] },
  ],
  enrollments: [
    { title: 'Enrollment details', keys: ['employeeId', 'courseId'] },
    { title: 'Assessment results', keys: ['score', 'evidence'] },
  ],
  assets: [
    { title: 'Asset details', keys: ['code', 'name', 'kind'] },
    { title: 'Custody & condition', keys: ['employeeId', 'condition', 'reason'] },
  ],
  reservations: [
    { title: 'Room & organizer', keys: ['assetId', 'employeeId', 'purpose'] },
    { title: 'Booking time', keys: ['date', 'startTime', 'endTime'] },
  ],
  reports: [
    { title: 'Report details', keys: ['title', 'source'] },
    { title: 'Date range & scope', keys: ['startDate', 'endDate', 'department'] },
  ],
};
export function groupedFields(collection: HRCollection, fields: FieldSpec[]) {
  return FIELD_GROUPS[collection].map(group => ({ ...group, fields: group.keys.flatMap(key => fields.filter(field => field.key === key)) })).filter(group => group.fields.length);
}

export function needsAttention(state: DataState, collection: HRCollection, record: HRRecord): boolean {
  if (collection === 'employees') return ['prestart', 'probation'].includes(record.status) || !!hrState(state).changes?.some(change => change.employeeId === record.id && change.status === 'pending');
  const statuses: Partial<Record<HRCollection, string[]>> = {
    leaves: ['draft', 'pending'], vacancies: ['draft', 'paused'], applications: ['applied', 'shortlisted', 'interviewed', 'offered', 'accepted'],
    attendance: ['draft', 'pending'], attendancePeriods: ['open'], payroll: ['draft', 'prepared', 'reviewed'],
    reviews: ['draft', 'self-review', 'manager-review', 'published'], courses: ['draft'], enrollments: ['enrolled', 'attended', 'failed'],
    assets: ['maintenance'], reports: ['draft'],
  };
  return statuses[collection]?.includes(record.status) ?? false;
}

const WORKFLOWS: Record<HRApp, { title: string; description: string }[]> = {
  employees: [
    { title: 'Create the employee', description: 'Add identity, role and employment dates. Link a login account when needed.' },
    { title: 'Manage employment', description: 'Confirm probation, schedule effective changes and preserve employment history.' },
    { title: 'Review time off', description: 'Submit leave for approval. Approved leave updates the employee balance.' },
  ],
  recruitment: [
    { title: 'Plan the role', description: 'Define a position, approve headcount and publish the job opening.' },
    { title: 'Review candidates', description: 'Collect applications, shortlist candidates and record interview evidence.' },
    { title: 'Approve and hire', description: 'Obtain independent offer approval, record acceptance and create onboarding tasks.' },
  ],
  attendance: [
    { title: 'Record the shift', description: 'Choose the employee, date and clock-in and clock-out times.' },
    { title: 'Review exceptions', description: 'Submit shifts for approval and return corrections to the employee.' },
    { title: 'Close the period', description: 'Resolve outstanding shifts before preserving attendance for payroll.' },
  ],
  payroll: [
    { title: 'Prepare the preview', description: 'Use a closed attendance period and choose one currency for the calculation.' },
    { title: 'Independent review', description: 'A different Payroll admin reviews the prepared results.' },
    { title: 'Freeze and export', description: 'Freeze the reviewed period, then download the illustrative pay preview.' },
  ],
  performance: [
    { title: 'Set the goal', description: 'Choose an employee, review period and measurable goal.' },
    { title: 'Collect evidence', description: 'The employee submits a self-review, then the manager records their assessment.' },
    { title: 'Publish and acknowledge', description: 'Publish the assessment and development plan for employee acknowledgment.' },
  ],
  training: [
    { title: 'Publish the course', description: 'Set learning objectives, assessment criteria and certificate validity.' },
    { title: 'Enroll and assess', description: 'Record attendance and assessment evidence. Failed attempts can be retried.' },
    { title: 'Collect feedback', description: 'Create a linked training evaluation after successful completion.' },
  ],
  assets: [
    { title: 'Register the asset', description: 'Add equipment or a room with its identifying code and condition.' },
    { title: 'Assign or reserve', description: 'Assign equipment to a custodian or reserve a room for a specific time.' },
    { title: 'Return and maintain', description: 'Record equipment returns and maintenance to keep availability current.' },
  ],
  reports: [
    { title: 'Choose the source', description: 'Select a source app you administer, a period and an optional department.' },
    { title: 'Review the results', description: 'Check the live rows before saving a snapshot.' },
    { title: 'Save and export', description: 'Preserve the report revision and download the permitted results as CSV.' },
  ],
};
export function HRWorkflowGuide({ app }: { app: HRApp }) {
  const { t: tr } = useLocale();
  return <details className="an-hr-guide">
    <summary>{tr('Workflow guide')}<ChevronDown size={16} aria-hidden /></summary>
    <ol>{WORKFLOWS[app].map(step => <li key={step.title}><h3>{tr(step.title)}</h3><p>{tr(step.description)}</p></li>)}</ol>
  </details>;
}
