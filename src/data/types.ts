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
}

export type RequestType = 'purchase' | 'leave' | 'expense' | 'contract';
export type RequestStatus = 'draft' | 'pending' | 'changes' | 'approved' | 'declined' | 'withdrawn';
export type StepStatus = 'done' | 'current' | 'waiting' | 'returned' | 'declined';

export interface ApprovalStep {
  id: string;
  name: string;
  approverId: PersonId;
  status: StepStatus;
  at?: string;
  comment?: string;
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
  slaHours: number;
}

export interface Process {
  id: string;
  name: string;
  requestType: RequestType;
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
}
