import type {
  CompanyConfiguration,
  DataState,
  WorkCalendar,
} from "../data/types";
export const DEFAULT_WORK_CALENDAR: WorkCalendar = {
  workWeek: [1, 2, 3, 4, 5],
  holidays: [],
};
export function companyConfiguration(state: DataState): CompanyConfiguration {
  return (
    state.org.configuration ?? {
      revision: 0,
      legalName: state.org.name,
      branches: ["Main office"],
      departments: [
        ...new Set(state.people.map((p) => p.department).filter(Boolean)),
      ],
    }
  );
}
export function calendarProblem(calendar: WorkCalendar): string | undefined {
  if (
    !calendar ||
    typeof calendar !== "object" ||
    !Array.isArray(calendar.workWeek) ||
    !calendar.workWeek.length ||
    calendar.workWeek.length > 7 ||
    new Set(calendar.workWeek).size !== calendar.workWeek.length ||
    calendar.workWeek.some(
      (day) => !Number.isInteger(day) || day < 0 || day > 6,
    )
  )
    return "Choose at least one working day.";
  if (
    !Array.isArray(calendar.holidays) ||
    calendar.holidays.length > 200 ||
    calendar.holidays.some(
      (h) =>
        !h ||
        typeof h.date !== "string" ||
        typeof h.name !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(h.date) ||
        !Number.isFinite(Date.parse(h.date)) ||
        new Date(h.date).toISOString().slice(0, 10) !== h.date ||
        !h.name.trim() ||
        h.name.length > 100,
    ) ||
    new Set(calendar.holidays.map((h) => h.date)).size !==
      calendar.holidays.length
  )
    return "Use one unique holiday per line: YYYY-MM-DD | name.";
}
export function configurationProblem(
  state: DataState,
  name: string,
  config: CompanyConfiguration,
  calendar: WorkCalendar,
): string | undefined {
  if (
    !state.people.some(
      (p) => p.id === state.meId && ["owner", "admin"].includes(p.access),
    )
  )
    return "Only workspace admins can change company settings.";
  if (config.revision !== companyConfiguration(state).revision)
    return "Company settings changed in another tab. Reload the saved settings before trying again.";
  if (
    !name.trim() ||
    name.trim().length > 100 ||
    !config.legalName.trim() ||
    config.legalName.length > 150
  )
    return "Enter a company name and legal employer name.";
  if (
    [config.branches, config.departments].some(
      (values) =>
        !Array.isArray(values) ||
        !values.length ||
        values.length > 50 ||
        values.some(
          (value) =>
            typeof value !== "string" || !value.trim() || value.length > 100,
        ) ||
        new Set(values.map((v) => v.trim().toLowerCase())).size !==
          values.length,
    )
  )
    return "Enter unique branches and departments, one per line.";
  return calendarProblem(calendar);
}
