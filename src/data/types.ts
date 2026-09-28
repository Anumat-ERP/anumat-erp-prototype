export type PersonId = string;

export interface Person {
  id: PersonId;
  name: string;
  role: string;
  department: string;
}

export type RequestType = 'purchase' | 'leave' | 'expense' | 'contract';
export type RequestStatus = 'draft' | 'pending' | 'changes' | 'approved' | 'declined';
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

export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  title: string;
  ownerId: PersonId;
  due: string;
  status: TaskStatus;
  source?: { label: string; href: string };
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

export interface DataState {
  meId: PersonId;
  people: Person[];
  requests: Request[];
  meetings: Meeting[];
  documents: Doc[];
  tasks: Task[];
  processes: Process[];
}
