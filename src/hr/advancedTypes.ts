export type EmployeePlanKind =
  | "onboarding"
  | "probation"
  | "development"
  | "offboarding";
export interface EmployeePlan {
  id: string;
  employeeId: string;
  episodeId?: string;
  kind: EmployeePlanKind;
  ownerId: string;
  dueDate: string;
  taskIds: string[];
  courseId?: string;
  createdAt: string;
  closedAt?: string;
}
export interface Verification {
  id: string;
  label: string;
  evidence: string;
  status: "pending" | "verified" | "rejected";
  addedById: string;
  reviewerId?: string;
  reason?: string;
  at: string;
}
export type AdvancedHRCommand =
  | {
      action: "plan";
      employeeId: string;
      kind: EmployeePlanKind;
      ownerId: string;
      dueDate: string;
      courseId?: string;
      expectedVersion: number;
    }
  | { action: "closePlan"; planId: string }
  | {
      action: "extendProbation";
      employeeId: string;
      endDate: string;
      reason: string;
      expectedVersion: number;
    }
  | {
      action: "evidence";
      employeeId: string;
      label: string;
      evidence: string;
      expectedVersion: number;
    }
  | {
      action: "verifyEvidence";
      employeeId: string;
      evidenceId: string;
      result: "verified" | "rejected";
      reason: string;
      expectedVersion: number;
    }
  | {
      action: "assetTransfer";
      assetId: string;
      employeeId: string;
      condition: string;
      reason: string;
      expectedVersion: number;
    }
  | {
      action: "retireAsset";
      assetId: string;
      reason: string;
      expectedVersion: number;
    }
  | {
      action: "coursePolicy";
      courseId: string;
      capacity: number;
      prerequisiteId: string;
      expectedVersion: number;
    }
  | { action: "waitlist"; employeeId: string; courseId: string }
  | { action: "admit"; enrollmentId: string; expectedVersion: number }
  | {
      action: "cancelEnrollment";
      enrollmentId: string;
      reason: string;
      expectedVersion: number;
    }
  | {
      action: "disagree";
      reviewId: string;
      reason: string;
      expectedVersion: number;
    }
  | {
      action: "payrollDelivery";
      payrollId: string;
      outcome: "success" | "rejected" | "uncertain";
      reason: string;
      expectedVersion: number;
    };
