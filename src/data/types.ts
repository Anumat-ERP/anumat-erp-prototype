export type PersonId = string;

/** What someone may do in the workspace. Approving comes from approval processes, not from this. */
export type Access = 'owner' | 'admin' | 'member';

export interface Person {
  id: PersonId;
  name: string;
  /** Job title, e.g. "Finance Manager". */
  role: string;
  department: string;
  access: Access;
  /** Members allowed to create and edit approval processes (admins always can). */
  canBuildProcesses?: boolean;
}

/** Built-in request types have special fields (amount, leave dates). Admins can add more. */
export type BuiltInType = 'purchase' | 'leave' | 'expense' | 'contract';
/** A request type: a built-in one, or the id of a process an admin created. */
export type RequestType = string;
export type RequestStatus = 'draft' | 'pending' | 'changes' | 'approved' | 'declined' | 'withdrawn';
export type StepStatus = 'done' | 'current' | 'waiting' | 'returned' | 'declined';

export interface ApprovalStep {
  id: string;
  name: string;
  approverId: PersonId;
  status: StepStatus;
  at?: string;
  comment?: string;
  /** What the approver filled in at this step. */
  answers?: FormValues;
  /** The step's form as it was when answered, so later edits to the process don't change history. */
  fields?: FormField[];
}

export interface Attachment {
  name: string;
  size: number;
}

export interface Activity {
  id: string;
  at: string;
  personId: PersonId;
  text: string;
  kind: 'comment' | 'event';
}

export interface Request {
  id: string;
  type: RequestType;
  title: string;
  requesterId: PersonId;
  department: string;
  amount?: number;
  startDate?: string;
  endDate?: string;
  description: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  steps: ApprovalStep[];
  attachments: Attachment[];
  activity: Activity[];
  meetingId?: string;
  /** Answers to a process's custom form fields, by field id. */
  fields?: FormValues;
  /** The form as it was when submitted, so renaming or removing a field later doesn't change what was asked. */
  form?: FormField[];
}

export interface Decision {
  id: string;
  text: string;
  requestId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  start: string;
  durationMin: number;
  location: string;
  organizerId: PersonId;
  attendeeIds: PersonId[];
  agenda: string[];
  decisions: Decision[];
  requestIds: string[];
  /** When the invite went out. Seeded meetings omit it. */
  createdAt?: string;
}

export type DocumentStatus = 'draft' | 'review' | 'approved' | 'archived';

export interface DocVersion {
  version: string;
  at: string;
  authorId: PersonId;
  note: string;
}

export interface Doc {
  id: string;
  name: string;
  kind: 'pdf' | 'sheet' | 'doc';
  status: DocumentStatus;
  ownerId: PersonId;
  size: number;
  linkedTo?: { label: string; href: string };
  versions: DocVersion[];
}

/** Every status belongs to one fixed category; logic (done, overdue) looks at the category. */
export type StatusCategory = 'todo' | 'active' | 'done';
export type StatusTone = 'neutral' | 'info' | 'warning' | 'critical' | 'success' | 'primary';

/** A task status the workspace defines, e.g. "Blocked" in the "active" category. */
export interface TaskStatusDef {
  id: string;
  name: string;
  category: StatusCategory;
  tone: StatusTone;
  /** "To do" and "Done" can be renamed but not removed. */
  locked?: boolean;
  /** Only the person who assigned the task, or an admin, can move tasks into this status. */
  signOff?: boolean;
  /** Moving a task here asks for a reason, e.g. what is blocking it. */
  requireNote?: boolean;
}

/** The id of a TaskStatusDef. */
export type TaskStatus = string;

export interface Task {
  id: string;
  title: string;
  ownerId: PersonId;
  due: string;
  status: TaskStatus;
  source?: { label: string; href: string };
  notes?: string;
  /** When it moved into a done-category status. */
  doneAt?: string;
  /** Who assigned it (the owner, for self-assigned tasks). */
  assignedById?: PersonId;
  /** The reason given when entering a status that asks for one. */
  statusNote?: string;
  /** Set when the owner finished it and it waits for the assigner's sign-off. */
  signOffRequestedAt?: string;
  /** RACI: R is the owner and A the assigner; these are C and I. */
  consultedIds?: PersonId[];
  informedIds?: PersonId[];
  comments?: TaskComment[];
  /** When the status last changed; used to tell informed people. */
  statusChangedAt?: string;
}

export interface TaskComment {
  id: string;
  at: string;
  personId: PersonId;
  text: string;
}

export interface ProcessStep {
  id: string;
  /** Step name shown on the request timeline, e.g. "Finance review". */
  name: string;
  /** Who approves, as a role, e.g. "Finance manager". */
  role: string;
  approverId: PersonId;
  /** Only runs when the amount is above this. Undefined: always runs. */
  minAmount?: number;
  /** Only runs when a request form answer matches. */
  when?: Condition;
  /** What the approver fills in at this step, e.g. a budget code. Required ones must be answered to approve. */
  fields?: FormField[];
  slaHours: number;
}

export type FieldKind =
  | 'text'
  | 'longtext'
  | 'number'
  | 'money'
  | 'date'
  | 'email'
  | 'phone'
  | 'url'
  | 'select'
  | 'radio'
  | 'checkboxes'
  | 'yesno'
  | 'rating'
  | 'scale'
  | 'person'
  | 'department'
  /** Not a question: a heading and optional text that splits a long form. */
  | 'section';

/** "When question X is (or isn't) this answer". For checkboxes, "is" means "includes". */
export interface Condition {
  fieldId: string;
  equals: string;
  op?: 'is' | 'isNot';
}

/** One question in a dynamic form (request forms and surveys). */
export interface FormField {
  id: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  /** Shown under the question. */
  help?: string;
  /** Hint inside empty text boxes. */
  placeholder?: string;
  /** Choices for select, radio and checkboxes. */
  options?: string[];
  /** Only ask this when an earlier question has (or hasn't) this answer. */
  showIf?: Condition;
}

/** Answers by field id. Checkboxes store a list; everything else a string. */
export type FormValues = Record<string, string | string[]>;

export interface Process {
  id: string;
  name: string;
  requestType: RequestType;
  /** ID prefix for new requests, e.g. "TR" → TR-0001. Built-in types have their own. */
  prefix?: string;
  /** For custom types: does the request have an amount (used by amount rules)? */
  hasAmount?: boolean;
  /** Extra questions on the request form. */
  fields?: FormField[];
  /** Departments allowed to submit. Empty or missing: everyone. */
  submitters?: string[];
  trigger: string;
  active: boolean;
  steps: ProcessStep[];
  avgHours: number;
  runs30d: number;
}

export interface Organization {
  name: string;
  /** Head-count band chosen at sign-up, e.g. "50–199". */
  size: string;
}

export interface Feedback {
  id: string;
  at: string;
  personId: PersonId;
  kind: 'survey' | 'feedback' | 'problem';
  /** 0–10 "how likely to recommend", for surveys. */
  score?: number;
  text: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  /** Departments asked to answer. Empty: everyone. */
  audience: string[];
  /** Answers are stored without names, and results wait for enough answers. */
  anonymous: boolean;
  status: 'draft' | 'open' | 'closed';
  createdBy: PersonId;
  createdAt: string;
  publishedAt?: string;
  /** Last day to answer (ISO date). */
  closesAt?: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  /** Who answered. Kept even for anonymous surveys so nobody answers twice, but never shown. */
  personId: PersonId;
  at: string;
  answers: FormValues;
}

export interface Lead {
  id: string;
  at: string;
  name: string;
  email: string;
  company: string;
  size: string;
  deployment: 'cloud' | 'private-cloud' | 'on-premise' | 'not-sure';
  message: string;
}

export type NotificationEvent = 'approvals' | 'requestUpdates' | 'tasks' | 'meetings';
export type Channel = 'email' | 'telegram';

export interface NotificationPrefs {
  /** Which extra channels each event goes to; in-app is always on. */
  events: Record<NotificationEvent, Channel[]>;
  telegram?: { username: string; connectedAt: string };
}

export interface DataState {
  org: Organization;
  meId: PersonId;
  people: Person[];
  requests: Request[];
  meetings: Meeting[];
  documents: Doc[];
  tasks: Task[];
  taskStatuses: TaskStatusDef[];
  processes: Process[];
  /** When each person last opened their notifications. */
  lastSeen: Record<PersonId, string>;
  feedback: Feedback[];
  leads: Lead[];
  /** When each person last answered or dismissed the survey. */
  surveyAt: Record<PersonId, string>;
  notificationPrefs: Record<PersonId, NotificationPrefs>;
  surveys: Survey[];
  surveyResponses: SurveyResponse[];
}
