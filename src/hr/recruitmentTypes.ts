import type { CandidateStage, CandidateStageConfig } from './candidateStages';
import type { JSONContent } from '@tiptap/react';
export interface JobDescriptionDetails {
  level?: string;
  reportsTo?: string;
  responsibilities?: string;
  education?: string;
  experienceYears?: number;
  preferredQualifications?: string;
  successCriteria?: string;
  workMode?: 'On site' | 'Hybrid' | 'Remote';
  workingHours?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: 'USD' | 'KHR';
  publicSalary?: boolean;
}
export interface Position {
  code?: string;
  status?: 'active' | 'archived';
  revisionNote?: string;
  details?: JobDescriptionDetails;
  id: string;
  version: number;
  title: string;
  department: string;
  branch: string;
  description: string;
  document?: JSONContent;
  requirements: string;
  employmentType: string;
}
export interface Requisition {
  id: string;
  version: number;
  positionId: string;
  positionVersion: number;
  position: Position;
  openings: number;
  budget: number;
  currency: 'USD' | 'KHR';
  reason: string;
  managerId: string;
  reviewerId: string;
  closingDate: string;
  status:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'declined'
    | 'changes'
    | 'withdrawn';
  createdById: string;
  vacancyId?: string;
  requestId?: string;
}
export interface Interview {
  id: string;
  version: number;
  applicationId: string;
  interviewerId: string;
  startsAt: string;
  duration: number;
  location: string;
  criteria: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  score: number;
  evidence: string;
  recommendation: 'advance' | 'hold' | 'reject';
}
export interface OfferReview {
  id: string;
  version: number;
  applicationId: string;
  applicationVersion: number;
  offerRevision: number;
  salary: number;
  currency: 'USD' | 'KHR';
  startDate: string;
  terms: string;
  reviewerId: string;
  createdById: string;
  status: 'pending' | 'approved' | 'declined' | 'superseded';
  reason: string;
}
export interface RecruitmentEvent {
  id: string;
  kind: 'position' | 'requisition' | 'interview' | 'offer' | 'stages';
  recordId: string;
  action: string;
  actorId: string;
  at: string;
  reason: string;
  before?: unknown;
  after: unknown;
}
export interface RecruitmentState {
  candidateStages?: CandidateStageConfig;
  positions: Position[];
  requisitions: Requisition[];
  interviews: Interview[];
  offers: OfferReview[];
  history: RecruitmentEvent[];
}
export type RecruitmentCommand =
  | { action: 'stages'; stages: CandidateStage[]; expectedVersion: number }
  | { action: 'candidateStage'; applicationId: string; stageId: string; expectedVersion: number }
  | { action: 'position'; record: Position; expectedVersion?: number }
  | { action: 'requisition'; record: Requisition; expectedVersion?: number }
  | {
      action: 'requisitionDecision';
      id: string;
      expectedVersion: number;
      operation:
        | 'submit'
        | 'approve'
        | 'decline'
        | 'changes'
        | 'withdraw'
        | 'revise';
      reason: string;
    }
  | { action: 'interview'; record: Interview; expectedVersion?: number }
  | {
      action: 'assessment';
      id: string;
      expectedVersion: number;
      score: number;
      evidence: string;
      recommendation: Interview['recommendation'];
    }
  | {
      action: 'cancelInterview';
      id: string;
      expectedVersion: number;
      reason: string;
    }
  | {
      action: 'offer';
      applicationId: string;
      expectedVersion: number;
      reviewerId: string;
      terms: string;
    }
  | {
      action: 'offerDecision';
      id: string;
      expectedVersion: number;
      operation: 'approve' | 'decline';
      reason: string;
    };
export const emptyRecruitment = (): RecruitmentState => ({
  positions: [],
  requisitions: [],
  interviews: [],
  offers: [],
  history: [],
});
