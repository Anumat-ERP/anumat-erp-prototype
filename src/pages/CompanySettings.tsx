import { useState } from "react";
import {
  Banner,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  PageHeader,
  Textarea,
  useToast,
} from "@app/ui";
import { useStore } from "../data/store";
import { useLocale } from "../i18n/LocaleProvider";
import {
  companyConfiguration,
  configurationProblem,
  DEFAULT_WORK_CALENDAR,
} from "../lib/companyConfiguration";

export function CompanySettings() {
  const { activeWorkspace, me } = useStore();
  return <CompanySettingsForm key={`${activeWorkspace}-${me.id}`} />;
}
function CompanySettingsForm() {
  const { state, me, dispatch } = useStore();
  const { t: tr } = useLocale();
  const { toast } = useToast();
  const [saved, setSaved] = useState(() => companyConfiguration(state));
  const [name, setName] = useState(state.org.name);
  const [legalName, setLegalName] = useState(saved.legalName);
  const [branches, setBranches] = useState(saved.branches.join("\n"));
  const [departments, setDepartments] = useState(saved.departments.join("\n"));
  const calendar = state.org.workCalendar ?? DEFAULT_WORK_CALENDAR;
  const [week, setWeek] = useState(calendar.workWeek);
  const [holidays, setHolidays] = useState(
    calendar.holidays.map((h) => `${h.date} | ${h.name}`).join("\n"),
  );
  const [error, setError] = useState<string>();
  const admin = ["owner", "admin"].includes(me.access);
  const changedElsewhere =
    saved.revision !== companyConfiguration(state).revision;
  const reload = () => {
    const next = companyConfiguration(state);
    const cal = state.org.workCalendar ?? DEFAULT_WORK_CALENDAR;
    setSaved(next);
    setName(state.org.name);
    setLegalName(next.legalName);
    setBranches(next.branches.join("\n"));
    setDepartments(next.departments.join("\n"));
    setWeek(cal.workWeek);
    setHolidays(cal.holidays.map((h) => `${h.date} | ${h.name}`).join("\n"));
    setError(undefined);
  };
  const save = () => {
    const lines = (value: string) =>
      value
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
    const config = {
      revision: saved.revision,
      legalName: legalName.trim(),
      branches: lines(branches),
      departments: lines(departments),
    };
    const cal = {
      workWeek: [...week].sort(),
      holidays: lines(holidays).map((line) => {
        const [date, ...label] = line.split("|");
        return { date: date?.trim() ?? "", name: label.join("|").trim() };
      }),
    };
    const problem = configurationProblem(state, name, config, cal);
    if (problem) {
      setError(problem);
      return;
    }
    dispatch({
      type: "configureCompany",
      name,
      configuration: config,
      calendar: cal,
    });
    setSaved({ ...config, revision: config.revision + 1 });
    setError(undefined);
    toast({ title: tr("Company settings saved") });
  };
  return (
    <>
      <PageHeader
        title={tr("Company settings")}
        subtitle={tr("Your employer, teams, and working calendar.")}
        primaryAction={
          admin
            ? {
                content: tr("Save company settings"),
                onAction: save,
                disabled: changedElsewhere,
              }
            : undefined
        }
      />
      {!admin && (
        <Banner title={tr("Read only")}>
          {tr("Only workspace admins can change company settings.")}
        </Banner>
      )}
      {(error || changedElsewhere) && (
        <Banner
          tone="critical"
          title={tr("Review company settings")}
          action={
            changedElsewhere
              ? { label: tr("Reload saved settings"), onAction: reload }
              : undefined
          }
        >
          {tr(
            error ??
              "Company settings changed in another tab. Reload the saved settings before trying again.",
          )}
        </Banner>
      )}
      <Card className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold">{tr("Company details")}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={tr("Company name")} required>
            <Input
              value={name}
              disabled={!admin}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label={tr("Legal employer name")} required>
            <Input
              value={legalName}
              disabled={!admin}
              maxLength={150}
              onChange={(e) => setLegalName(e.target.value)}
            />
          </Field>
          <Field label={tr("Branches")} helpText={tr("One name per line.")}>
            <Textarea
              rows={4}
              value={branches}
              disabled={!admin}
              onChange={(e) => setBranches(e.target.value)}
            />
          </Field>
          <Field label={tr("Departments")} helpText={tr("One name per line.")}>
            <Textarea
              rows={4}
              value={departments}
              disabled={!admin}
              onChange={(e) => setDepartments(e.target.value)}
            />
          </Field>
        </div>
      </Card>
      <Card className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold">{tr("Working calendar")}</h2>
        <p className="text-sm text-muted-foreground">
          {tr(
            "New leave drafts use this calendar. Saved leave retains its recorded calendar and day count.",
          )}
        </p>
        <div
          className="flex flex-wrap gap-x-4 gap-y-2 [&_label]:min-h-11 [&_label]:inline-flex [&_label]:items-center"
          role="group"
          aria-label={tr("Working days")}
        >
          {[
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ].map((day, value) => (
            <Checkbox
              key={day}
              label={tr(day)}
              checked={week.includes(value)}
              disabled={!admin}
              onCheckedChange={(on) =>
                setWeek(on ? [...week, value] : week.filter((d) => d !== value))
              }
            />
          ))}
        </div>
        <Field
          label={tr("Company holidays")}
          helpText={tr(
            "One holiday per line: YYYY-MM-DD | name. Leave does not count these dates.",
          )}
        >
          <Textarea
            rows={5}
            value={holidays}
            disabled={!admin}
            placeholder={tr("2026-10-15 | Company holiday")}
            onChange={(e) => setHolidays(e.target.value)}
          />
        </Field>
      </Card>
      {(state.workspaceHistory ?? []).length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            {tr("Company history")}
          </h2>
          <ul className="divide-y divide-border">
            {state.workspaceHistory
              ?.slice(-5)
              .reverse()
              .map((event, i) => (
                <li className="py-3 text-sm" key={`${event.at}-${i}`}>
                  {tr(event.text)} ·{" "}
                  {state.people.find((p) => p.id === event.actorId)?.name} ·{" "}
                  {new Date(event.at).toLocaleString()}
                </li>
              ))}
          </ul>
        </section>
      )}
      {admin && (
        <Button
          variant="primary"
          className="self-start"
          disabled={changedElsewhere}
          onClick={save}
        >
          {tr("Save company settings")}
        </Button>
      )}
    </>
  );
}
