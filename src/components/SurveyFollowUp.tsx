import { useState } from "react";
import { Link } from "react-router";
import {
  Banner,
  Button,
  Card,
  DatePicker,
  Field,
  Input,
  Select,
  Textarea,
} from "@app/ui";
import { uid, useStore } from "../data/store";
import { appPeople, canContributeToApp, isAppAdmin } from "../lib/appAccess";
import { followUpProblem } from "../lib/workflowCompletion";
import type { Survey, Task } from "../data/types";
import { useLocale } from "../i18n/LocaleProvider";
export function SurveyFollowUp({ survey }: { survey: Survey }) {
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const [title, setTitle] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [owner, setOwner] = useState(state.meId);
  const [date, setDate] = useState("");
  const [error, setError] = useState<string>();
  if (survey.status !== "closed" || !isAppAdmin(state, "surveys")) return null;
  const create = () => {
    const task: Task = {
      id: uid("survey-action"),
      title: title.trim(),
      ownerId: owner,
      assignedById: state.meId,
      status: state.taskStatuses.find(s=>s.category==='todo'&&!s.requireReady&&!s.requireDone&&!s.signOff)?.id ?? '',
      notes: interpretation.trim(),
      expectedOutcome: interpretation.trim(),
      due: date ? `${date}T09:00:00` : "",
      priority: "medium",
      workType: "task",
    };
    const problem = followUpProblem(state, survey.id, interpretation, task);
    if (problem) {
      setError(problem);
      return;
    }
    dispatch({
      type: "surveyFollowUp",
      surveyId: survey.id,
      interpretation,
      task,
    });
    setTitle("");
    setInterpretation("");
    setError(undefined);
  };
  return (
    <Card className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">{tr("Survey follow-up")}</h2>
      <p>
        {tr(
          "Record an aggregate finding and an owned improvement task. Do not copy individual answers or respondent identities into the task.",
        )}
      </p>
      {error && <Banner tone="critical">{tr(error)}</Banner>}
      {canContributeToApp(state, "tasks") ? (
        <>
          <Field label={tr("Aggregate interpretation")} required>
            <Textarea
              value={interpretation}
              maxLength={2000}
              onChange={(e) => setInterpretation(e.target.value)}
            />
          </Field>
          <Field label={tr("Improvement task")} required>
            <Input
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={tr("Responsible teammate")}>
              <Select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                options={appPeople(state, "tasks")
                  .filter((p) => canContributeToApp(state, "tasks", p.id))
                  .map((p) => ({ value: p.id, label: p.name }))}
              />
            </Field>
            <DatePicker
              label={tr("Due date")}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button variant="primary" className="self-start" onClick={create}>
            {tr("Create improvement task")}
          </Button>
        </>
      ) : (
        <Banner>
          {tr(
            "Ask a Tasks admin for contributor access to create follow-up work.",
          )}
        </Banner>
      )}
      <ul className="divide-y divide-border">
        {survey.followUps?.map((f) => (
          <li key={f.taskId} className="py-3">
            {canContributeToApp(state, "tasks") &&
            state.tasks.some((t) => t.id === f.taskId) ? (
              <Link
                className="text-fg-link underline"
                to={`/tasks?task=${f.taskId}`}
              >
                {state.tasks.find((t) => t.id === f.taskId)?.title}
              </Link>
            ) : (
              <p>{tr("Follow-up task unavailable")}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {f.interpretation}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
