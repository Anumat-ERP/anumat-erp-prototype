import type { DataState, Decision, Request, Task } from "../data/types";
import { appRole, canContributeToApp, isAppAdmin } from "./appAccess";
import { ANONYMOUS_SURVEY_MIN_RESPONSES } from "./surveys";
export const visibleDecision = (state: DataState, decision: Decision) =>
  Boolean(
    appRole(state, "meetings") &&
      (!decision.audienceIds?.length ||
        decision.audienceIds.includes(state.meId)),
  );
export function decisionProblem(
  state: DataState,
  meetingId: string,
  text: string,
  audienceIds?: string[],
) {
  const meeting = state.meetings.find((m) => m.id === meetingId);
  if (
    !canContributeToApp(state, "meetings") ||
    !meeting ||
    meeting.status === "cancelled"
  )
    return "This meeting cannot accept new notes.";
  if (!text.trim() || text.trim().length > 4000)
    return "Add a note of up to 4,000 characters.";
  if (
    audienceIds?.length &&
    (new Set(audienceIds).size !== audienceIds.length ||
      !audienceIds.includes(state.meId) ||
      audienceIds.some(
        (id) =>
          !appRole(state, "meetings", id) ||
          (![meeting.organizerId, ...meeting.attendeeIds].includes(id) && !(id === state.meId && isAppAdmin(state, 'meetings'))),
      ))
  )
    return "Choose permitted meeting participants and include yourself.";
}
export function executionProblem(
  state: DataState,
  requestId: string,
  expectedUpdatedAt: string,
  effectiveDate: string,
  outcome?: "failed" | "applied" | "cancelled",
  reason?: string,
) {
  const request = state.requests.find((r) => r.id === requestId);
  if (!isAppAdmin(state, "approvals") || request?.status !== "approved")
    return "Only an Approvals admin can simulate execution of an approved request.";
  if (request.updatedAt !== expectedUpdatedAt)
    return "The request changed. Reopen it before continuing.";
  if (
    state.hr?.recruitment?.requisitions.some((q) => q.requestId === requestId)
  )
    return "Use the hiring workflow for this request.";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate) ||
    !Number.isFinite(Date.parse(effectiveDate)) ||
    new Date(effectiveDate).toISOString().slice(0, 10) !== effectiveDate
  )
    return "Choose a valid execution date.";
  if (["applied", "cancelled"].includes(request.execution?.status ?? ""))
    return "Execution is already final for this revision.";
  if (!outcome && request.execution) return 'Execution is already scheduled for this revision.';
  if (reason && reason.length > 1000) return 'Keep the execution reason within 1,000 characters.';
  if (outcome && (!request.execution || !reason?.trim()))
    return "Schedule execution and add an outcome reason first.";
  if (
    outcome === "applied" &&
    (request.execution?.effectiveDate ?? effectiveDate) >
      new Date().toISOString().slice(0, 10)
  )
    return "The effective date has not arrived. Keep execution pending.";
}
export function followUpProblem(
  state: DataState,
  surveyId: string,
  interpretation: string,
  task: Task,
) {
  const survey = state.surveys.find((s) => s.id === surveyId);
  const count = state.surveyResponses.filter(
    (r) => r.surveyId === surveyId,
  ).length;
  if (
    !isAppAdmin(state, "surveys") ||
    !canContributeToApp(state, "tasks") ||
    survey?.status !== "closed"
  )
    return "Close the survey and use a Surveys admin with Tasks access.";
  if (!count || (survey.anonymous && count < ANONYMOUS_SURVEY_MIN_RESPONSES))
    return "Results are not available for follow-up yet.";
  if (
    !interpretation.trim() ||
    interpretation.length > 2000 ||
    !task.title.trim() || task.title.trim().length > 120
  )
    return "Describe the aggregate finding and the next action.";
  if (
    task.assignedById !== state.meId ||
    !canContributeToApp(state, "tasks", task.ownerId) ||
    !canContributeToApp(state, "tasks", task.assignedById ?? state.meId)
  )
    return "Choose a responsible teammate with Tasks access.";
  if (!state.taskStatuses.some(s => s.id === task.status && s.category === 'todo' && !s.requireReady && !s.requireDone && !s.signOff)) return 'Configure an ungated starting task status first.';
  if (task.due && (!Number.isFinite(Date.parse(task.due)) || !/^\d{4}-\d{2}-\d{2}/.test(task.due) || new Date(task.due.slice(0,10)).toISOString().slice(0,10) !== task.due.slice(0,10))) return 'Choose a valid follow-up due date.';
  if (
    state.tasks.some((t) => t.id === task.id) ||
    survey.followUps?.some((f) => f.taskId === task.id)
  )
    return "This follow-up already exists.";
}
