import { ClipboardList, FileCheck2, ListChecks, Presentation } from 'lucide-react';
import { HR_MODULES } from '../hr/catalog';
import { APP_NAMES } from './appAccess';
import type { WorkspaceApp } from './moduleEntry';

/** One information architecture for discovery, switching and user guidance. */
export const APP_GROUPS = [
  { id: 'work', title: 'Work & collaboration', description: 'Make decisions, deliver work, and keep your team aligned.', apps: ['approvals', 'tasks', 'meetings', 'surveys'] },
  { id: 'people', title: 'People & growth', description: 'Hire, support, and develop your people.', apps: ['employees', 'recruitment', 'performance', 'training'] },
  { id: 'operations', title: 'Operations & reporting', description: 'Keep time, pay, equipment, and reporting in order.', apps: ['attendance', 'payroll', 'assets', 'reports'] },
] as const satisfies readonly { id: string; title: string; description: string; apps: readonly WorkspaceApp[] }[];
export type AppGroup = typeof APP_GROUPS[number]['id'];
type Step = { title: string; text: string; href: string; admin?: boolean };
type AppGuide = { title: string; description: string; icon: typeof FileCheck2; steps: readonly Step[] };
const step = (title: string, text: string, href: string, admin = false): Step => ({ title, text, href, admin });
export const APP_CATALOG: Record<WorkspaceApp, AppGuide> = {
  approvals: { title: 'Requests & approvals', icon: FileCheck2, description: 'Review decisions and keep the full approval history together.', steps: [
    step('Approval processes', 'An app admin sets the form and reviewers before a request can be submitted.', '/processes', true),
    step('Submit a request', 'Choose an active process and include the details your reviewers need.', '/requests'),
    step('Review the details', 'Review assigned requests and keep decisions and reasons in their history.', '/approvals'),
  ] },
  tasks: { title: 'Tasks', icon: ListChecks, description: 'Plan work in sprints, assign tasks, and follow progress through completion.', steps: [
    step('Plan work', 'Define the expected outcome and acceptance criteria before starting.', '/tasks'),
    step('Team roles', 'Assign responsibility and accountability so everyone knows who acts next.', '/tasks'),
    step('Completion evidence', 'Follow the configured statuses and record evidence before completing work.', '/tasks'),
  ] },
  meetings: { title: 'Meetings', icon: Presentation, description: 'Plan a meeting, capture decisions, and keep the next steps visible.', steps: [
    step('Plan a meeting', 'Set the agenda, time, and attendees before the conversation.', '/meetings'),
    step('Record the decision', 'Keep meeting notes and decisions with the meeting record.', '/meetings'),
    step('Follow up', 'Assign follow-up tasks and track them in Tasks.', '/tasks'),
  ] },
  surveys: { title: 'Surveys & evaluations', icon: ClipboardList, description: 'Collect team feedback, evaluate training, and review survey results.', steps: [
    step('Prepare questions', 'An app admin prepares questions and chooses named or anonymous answers.', '/surveys', true),
    step('Collect responses', 'Open the survey and check its privacy setting before responding.', '/surveys'),
    step('Review results', 'Review closed survey results. Anonymous totals need at least three responses.', '/surveys'),
  ] },
  employees: { title: APP_NAMES.employees, ...HR_MODULES.employees, steps: [
    step('Employee records', 'Keep employment details, department, and manager in one record.', '/employees'),
    step('Leave requests', 'Submit leave dates and a reason, then follow the review.', '/employees?tab=leaves'),
    step('Employment history', 'Open a record to review changes and employment history.', '/employees'),
  ] },
  recruitment: { title: APP_NAMES.recruitment, ...HR_MODULES.recruitment, steps: [
    step('Job openings', 'Start with headcount approval before publishing a job opening.', '/recruitment?tab=requisitions'),
    step('Candidates', 'Record consent, interviews, and evidence as candidates move through hiring.', '/recruitment?tab=applications'),
    step('Offers', 'Complete the offer review and hiring checks before documenting a hire.', '/recruitment?tab=offers'),
  ] },
  performance: { title: APP_NAMES.performance, ...HR_MODULES.performance, steps: [
    step('Set goals', 'Agree on measurable goals and the review period.', '/performance'),
    step('Collect evidence', 'Record progress and evidence against each goal.', '/performance'),
    step('Review & develop', 'Complete the review and record the development plan.', '/performance'),
  ] },
  training: { title: APP_NAMES.training, ...HR_MODULES.training, steps: [
    step('Courses', 'Plan a course with dates and learning expectations.', '/training?tab=courses'),
    step('Enrollments', 'Enroll employees and follow their participation.', '/training?tab=enrollments'),
    step('Learning evidence', 'Record completion evidence and evaluate the learning outcome.', '/training?tab=enrollments'),
  ] },
  attendance: { title: APP_NAMES.attendance, ...HR_MODULES.attendance, steps: [
    step('Daily attendance', 'Record clock-in and clock-out times for each shift.', '/attendance?tab=attendance'),
    step('Review corrections', 'Resolve missing times and record reasons for corrections.', '/attendance?view=attention'),
    step('Attendance periods', 'Review shifts before closing the attendance period.', '/attendance?tab=attendancePeriods'),
  ] },
  payroll: { title: APP_NAMES.payroll, ...HR_MODULES.payroll, steps: [
    step('Pay periods', 'Select the period and review the illustrative calculation inputs.', '/payroll'),
    step('Independent review', 'A different reviewer checks the prepared pay preview.', '/payroll'),
    step('Freeze preview', 'Freeze the reviewed preview to preserve it. This prototype does not pay employees.', '/payroll'),
  ] },
  assets: { title: APP_NAMES.assets, ...HR_MODULES.assets, steps: [
    step('Asset register', 'Record equipment and who has custody of it.', '/assets?tab=assets'),
    step('Maintenance', 'Track equipment condition and maintenance history.', '/assets?tab=assets'),
    step('Room reservations', 'Reserve a room and check for scheduling conflicts.', '/assets?tab=reservations'),
  ] },
  reports: { title: APP_NAMES.reports, ...HR_MODULES.reports, steps: [
    step('Choose report scope', 'Choose the app and scope you are permitted to report on.', '/reports'),
    step('Review results', 'Check the results and their context before saving.', '/reports'),
    step('Saved reports', 'Save a snapshot to preserve the results at that point in time.', '/reports'),
  ] },
};
