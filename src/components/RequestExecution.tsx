import { useState } from "react";
import {
  Badge,
  Banner,
  Button,
  Card,
  DatePicker,
  Field,
  Textarea,
} from "@app/ui";
import { useStore } from "../data/store";
import { isAppAdmin } from "../lib/appAccess";
import { executionProblem } from "../lib/workflowCompletion";
import type { Request } from "../data/types";
import { useLocale } from "../i18n/LocaleProvider";
export function RequestExecution({ request }: { request: Request }) {
  const { state, dispatch, person } = useStore();
  const { t: tr } = useLocale();
  const [date, setDate] = useState(
    request.execution?.effectiveDate ?? new Date().toISOString().slice(0, 10),
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  if (
    request.status !== "approved" ||
    state.hr?.recruitment?.requisitions.some((q) => q.requestId === request.id)
  )
    return null;
  const execution = request.execution;
  const final = ["applied", "cancelled"].includes(execution?.status ?? "");
  const act = (outcome?: "failed" | "applied" | "cancelled") => {
    const effectiveDate = execution?.effectiveDate ?? date;
    const problem = executionProblem(
      state,
      request.id,
      request.updatedAt,
      effectiveDate,
      outcome,
      reason,
    );
    if (problem) {
      setError(problem);
      return;
    }
    dispatch({
      type: "requestExecution",
      requestId: request.id,
      expectedUpdatedAt: request.updatedAt,
      effectiveDate,
      outcome,
      reason,
    });
    setError(undefined);
    setReason("");
  };
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{tr("Execution preview")}</h2>
        <Badge
          tone={
            execution?.status === "failed"
              ? "critical"
              : execution?.status === "applied"
              ? "success"
              : "neutral"
          }
        >
          {tr(
            execution?.status === "failed"
              ? "Failed"
              : execution?.status === "applied"
              ? "Applied"
              : execution?.status === "cancelled"
              ? "Cancelled"
              : execution
              ? "Pending execution"
              : "Not scheduled",
          )}
        </Badge>
      </div>
      <p>
        {tr(
          "Approval records a decision. This separate simulation records what happens next; it changes no employee record or external service.",
        )}
      </p>
      {error && <Banner tone="critical">{tr(error)}</Banner>}
      {execution && (
        <p className="text-sm">
          {tr("Effective date")}: {execution.effectiveDate} ·{" "}
          {tr("Revision {version}", { version: execution.revision })}
        </p>
      )}
      {isAppAdmin(state, "approvals") && !final && (
        <>
          <DatePicker
            label={tr("Execution date")}
            value={execution?.effectiveDate ?? date}
            disabled={Boolean(execution)}
            onChange={(e) => setDate(e.target.value)}
          />
          {execution ? (
            <>
              <Field label={tr("Execution outcome reason")} required>
                <Textarea
                  value={reason}
                  maxLength={1000}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={() => act("applied")}>
                  {tr(
                    execution.status === "failed"
                      ? "Retry execution preview"
                      : "Simulate successful execution",
                  )}
                </Button>
                <Button onClick={() => act("failed")}>
                  {tr("Simulate execution failure")}
                </Button>
                <Button onClick={() => act("cancelled")}>
                  {tr("Cancel execution preview")}
                </Button>
              </div>
            </>
          ) : (
            <Button className="self-start" onClick={() => act()}>
              {tr("Schedule execution preview")}
            </Button>
          )}
        </>
      )}
      {Boolean(execution?.attempts.length) && (
        <ol className="divide-y divide-border">
          {execution?.attempts.map((attempt, i) => (
            <li key={`${attempt.at}-${i}`} className="py-3">
              <p>
                {tr(
                  attempt.outcome === "applied"
                    ? "Applied"
                    : attempt.outcome === "failed"
                    ? "Failed"
                    : "Cancelled",
                )}{" "}
                · {person(attempt.actorId).name}
              </p>
              <p className="text-sm text-muted-foreground">
                {attempt.reason} · {new Date(attempt.at).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
