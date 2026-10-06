import type { DataState } from "../data/types";
import { canContributeToApp, isAppAdmin } from "./appAccess";
export function canChangeReviewer(state: DataState, requestId: string) {
  const request = state.requests.find((r) => r.id === requestId);
  const current = request?.steps.find((step) => step.status === "current");
  return Boolean(
    request?.status === "pending" &&
      current &&
      request.requesterId !== state.meId &&
      canContributeToApp(state, "approvals") &&
      (current.approverId === state.meId || isAppAdmin(state, "approvals")) &&
      !state.hr?.recruitment?.requisitions.some(
        (q) => q.requestId === requestId,
      ),
  );
}
export function reviewerChangeProblem(
  state: DataState,
  requestId: string,
  personId: string,
  reason: string,
  expectedUpdatedAt: string,
): string | undefined {
  if (!canChangeReviewer(state, requestId))
    return "Only the current reviewer or an app admin can change this reviewer. Requesters cannot reassign their own review.";
  const request = state.requests.find((r) => r.id === requestId)!;
  const current = request.steps.find((step) => step.status === "current")!;
  if (request.updatedAt !== expectedUpdatedAt)
    return "This review changed. Close and reopen the reviewer form before trying again.";
  if (
    personId === request.requesterId ||
    personId === current.approverId ||
    !canContributeToApp(state, "approvals", personId)
  )
    return "Choose a different reviewer with Member or Admin access. The requester cannot review their own request.";
  if (!reason.trim() || reason.trim().length > 1000)
    return "Add a reason for changing the reviewer.";
}
