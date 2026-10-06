import { Link } from "react-router";
import { Badge, Button, Card, EmptyState, PageHeader } from "@app/ui";
import { isDone, surveysToAnswer, useStore, waitingOnMe } from "../data/store";
import { appRole, canContributeToApp, APP_NAMES } from "../lib/appAccess";
import { hrDashboard } from "../hr/dashboard";
import { HR_APPS } from "../hr/types";
import { visibleRecords } from "../hr/engine";
import { useLocale } from "../i18n/LocaleProvider";
import { formatDate } from "../lib/format";

export function MyWork() {
  const { state, me } = useStore();
  const { t: tr } = useLocale();
  const tasks = appRole(state, "tasks")
    ? state.tasks
        .filter((task) => task.ownerId === me.id && !isDone(state, task))
        .sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"))
    : [];
  const approvals = canContributeToApp(state, "approvals")
    ? waitingOnMe(state)
    : [];
  const requests = appRole(state, "approvals")
    ? state.requests.filter(
        (r) =>
          r.requesterId === me.id &&
          ["draft", "pending", "changes"].includes(r.status),
      )
    : [];
  const surveys = appRole(state, "surveys") ? surveysToAnswer(state) : [];
  const employee = appRole(state, "employees")
    ? visibleRecords(state, "employees").find((e) => e.accountId === me.id)
    : undefined;
  const hr = HR_APPS.filter((app) => appRole(state, app))
    .map((app) => ({ app, items: hrDashboard(state, app).queue }))
    .filter((section) => section.items.length);
  const empty =
    !tasks.length &&
    !approvals.length &&
    !requests.length &&
    !surveys.length &&
    !hr.length;
  return (
    <>
      <PageHeader
        title={tr("My work")}
        subtitle={tr("Your next actions across the apps you can access.")}
      />
      {employee && (
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{employee.name}</h2>
            <p className="text-sm text-muted-foreground">
              {employee.position} · {employee.department} · {employee.branch}
            </p>
          </div>
          <Button asChild className="min-h-11">
            <Link to={`/employees?record=${employee.id}`}>
              {tr("My employee record")}
            </Link>
          </Button>
          {canContributeToApp(state, "employees") && (
            <Button asChild className="min-h-11">
              <Link to={`/employees?tab=leaves&create=1`}>
                {tr("Request leave")}
              </Link>
            </Button>
          )}
        </Card>
      )}
      {empty && (
        <EmptyState
          heading={tr("All caught up")}
          action={
            <Button asChild className="min-h-11">
              <Link to="/discover">{tr("Explore modules")}</Link>
            </Button>
          }
        >
          {tr("No work needs your attention right now.")}
        </EmptyState>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {approvals.length > 0 && (
          <Card>
            <h2 className="mb-4 text-lg font-semibold">
              {tr("Waiting on your decision")}
            </h2>
            <ul className="divide-y divide-border">
              {approvals.map((r) => (
                <li key={r.id}>
                  <Link className="an-work-item" to={`/requests/${r.id}`}>
                    <strong>{r.title}</strong>
                    <Badge tone="warning">{tr("Review")}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {tasks.length > 0 && (
          <Card>
            <h2 className="mb-4 text-lg font-semibold">
              {tr("My open tasks")}
            </h2>
            <ul className="divide-y divide-border">
              {tasks.slice(0, 10).map((task) => (
                <li key={task.id}>
                  <Link className="an-work-item" to={`/tasks?task=${task.id}`}>
                    <strong>{task.title}</strong>
                    <span className="text-sm text-muted-foreground">
                      {task.due ? formatDate(task.due) : tr("No due date")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              className="mt-4 inline-block text-fg-link underline"
              to="/tasks"
            >
              {tr("View all tasks")}
            </Link>
          </Card>
        )}
        {requests.length > 0 && (
          <Card>
            <h2 className="mb-4 text-lg font-semibold">
              {tr("My open requests")}
            </h2>
            <ul className="divide-y divide-border">
              {requests.map((r) => (
                <li key={r.id}>
                  <Link className="an-work-item" to={`/requests/${r.id}`}>
                    <strong>{r.title}</strong>
                    <Badge>
                      {tr(
                        r.status === "changes"
                          ? "Changes requested"
                          : r.status === "draft"
                          ? "Draft"
                          : "In review",
                      )}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {surveys.length > 0 && (
          <Card>
            <h2 className="mb-4 text-lg font-semibold">
              {tr("Waiting for your answer")}
            </h2>
            <ul className="divide-y divide-border">
              {surveys.map((s) => (
                <li key={s.id}>
                  <Link className="an-work-item" to={`/surveys/${s.id}`}>
                    <strong>{s.title}</strong>
                    <span>{tr("Answer")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {hr.map(({ app, items }) => (
          <Card key={app}>
            <h2 className="mb-4 text-lg font-semibold">{tr(APP_NAMES[app])}</h2>
            <ul className="divide-y divide-border">
              {items.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <Link className="an-work-item" to={item.href}>
                    <strong>{item.title}</strong>
                    <span className="text-sm text-muted-foreground">
                      {item.detail}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              className="mt-4 inline-block text-fg-link underline"
              to={`/home?app=${app}`}
            >
              {tr("Open workspace")}
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
