import type { DataState } from "../data/types";
import { FIELDS } from "../hr/catalog";
import { NOTIFICATION_APPS } from "./notificationApps";
import { calendarProblem } from "./companyConfiguration";
const object = (v: unknown): v is Record<string, unknown> =>
  Boolean(v && typeof v === "object" && !Array.isArray(v));
const strings = (v: unknown) =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
function records(v: unknown, fields: string[]) {
  return (
    Array.isArray(v) &&
    v.length <= 20000 &&
    new Set(v.map((r) => (object(r) ? r.id : undefined))).size === v.length &&
    v.every(
      (r) =>
        object(r) &&
        typeof r.id === "string" &&
        Boolean(r.id) &&
        fields.every((f) => typeof r[f] === "string"),
    )
  );
}

const fieldsValid = (value: unknown) =>
  value === undefined ||
  (records(value, ["label", "kind"]) &&
    (value as Record<string, unknown>[]).every(
      (f) =>
        [
          "text",
          "longtext",
          "number",
          "money",
          "date",
          "email",
          "phone",
          "url",
          "select",
          "radio",
          "checkboxes",
          "yesno",
          "rating",
          "scale",
          "person",
          "department",
          "section",
        ].includes(String(f.kind)) &&
        typeof f.required === "boolean" &&
        (f.options === undefined || strings(f.options)),
    ));
const answersValid = (value: unknown) =>
  value === undefined ||
  (object(value) &&
    Object.values(value).every(
      (answer) => typeof answer === "string" || strings(answer),
    ));

/** Deliberately accept only versioned Anumat exports; never evaluate imported content. */
function validateBackupState(value: unknown): value is DataState {
  if (
    !object(value) ||
    !object(value.org) ||
    typeof value.org.name !== "string" ||
    !value.org.name.trim() ||
    typeof value.org.size !== "string" ||
    typeof value.meId !== "string"
  )
    return false;
  if (
    !records(value.people, ["name", "role", "department", "access"]) ||
    !(value.people as Record<string, unknown>[]).some(
      (p) => p.id === value.meId && p.access === "owner",
    )
  )
    return false;
  for (const [key, fields] of Object.entries({
    requests: ["title", "status", "requesterId", "createdAt", "updatedAt"],
    meetings: ["title", "start", "organizerId"],
    documents: ["name"],
    tasks: ["title", "ownerId", "status"],
    taskStatuses: ["name", "category"],
    sprints: ["name", "startDate", "endDate", "status"],
    processes: ["name"],
    surveys: ["title", "status"],
    surveyResponses: ["surveyId", "personId", "at"],
  }))
    if (!records(value[key], fields)) return false;
  if (
    ["lastSeen", "surveyAt", "notificationPrefs"].some(
      (key) => !object(value[key]),
    ) ||
    ["feedback", "leads"].some((key) => !Array.isArray(value[key]))
  )
    return false;
  if (
    (value.requests as Record<string, unknown>[]).some(
      (r) =>
        !Array.isArray(r.steps) ||
        !Array.isArray(r.activity) ||
        !Array.isArray(r.attachments),
    )
  )
    return false;
  if (
    (value.meetings as Record<string, unknown>[]).some(
      (r) =>
        !strings(r.attendeeIds) ||
        !strings(r.agenda) ||
        !Array.isArray(r.decisions) ||
        !strings(r.requestIds),
    )
  )
    return false;
  if (
    (value.processes as Record<string, unknown>[]).some(
      (r) =>
        !records(r.steps, ["name", "role", "approverId"]) ||
        !fieldsValid(r.fields) ||
        (r.steps as Record<string, unknown>[]).some(
          (step) => !fieldsValid(step.fields),
        ),
    )
  )
    return false;
  if (
    (value.surveys as Record<string, unknown>[]).some(
      (r) =>
        !fieldsValid(r.fields) ||
        !Array.isArray(r.fields) ||
        !fieldsValid(r.publishedForm) ||
        !strings(r.audience),
    )
  )
    return false;
  if (
    value.org.workCalendar &&
    calendarProblem(
      value.org.workCalendar as DataState["org"]["workCalendar"] & {},
    )
  )
    return false;
  if (value.org.configuration !== undefined) {
    const config = value.org.configuration;
    if (
      !object(config) ||
      !Number.isInteger(config.revision) ||
      Number(config.revision) < 0 ||
      typeof config.legalName !== "string" ||
      !strings(config.branches) ||
      !strings(config.departments)
    )
      return false;
  }
  if (
    Object.values(value.notificationPrefs as Record<string, unknown>).some(
      (p) =>
        !object(p) ||
        !object(p.events) ||
        Object.entries(p.events).some(
          ([event, channels]) =>
            !Object.hasOwn(NOTIFICATION_APPS, event) ||
            !strings(channels) ||
            (channels as string[]).some(
              (c) => !["email", "telegram"].includes(c),
            ),
        ) ||
        (p.email !== undefined && typeof p.email !== "string") ||
        (p.telegram !== undefined &&
          (!object(p.telegram) ||
            typeof p.telegram.username !== "string" ||
            typeof p.telegram.connectedAt !== "string")),
    )
  )
    return false;
  if (
    value.deliveryPreviews !== undefined &&
    (!records(value.deliveryPreviews, [
      "personId",
      "event",
      "channel",
      "destination",
    ]) ||
      (value.deliveryPreviews as Record<string, unknown>[]).some(
        (p) =>
          !Object.hasOwn(NOTIFICATION_APPS, String(p.event)) ||
          !["email", "telegram"].includes(String(p.channel)) ||
          !Array.isArray(p.attempts) ||
          !p.attempts.length ||
          p.attempts.some(
            (a) =>
              !object(a) ||
              typeof a.at !== "string" ||
              !["failed", "previewed"].includes(String(a.result)),
          ),
      ))
  )
    return false;
  if (
    value.workspaceHistory !== undefined &&
    (!Array.isArray(value.workspaceHistory) ||
      value.workspaceHistory.some(
        (e) =>
          !object(e) ||
          ["at", "actorId", "text"].some((k) => typeof e[k] !== "string"),
      ))
  )
    return false;
  if (
    value.appMembers !== undefined &&
    (!object(value.appMembers) ||
      Object.values(value.appMembers).some(
        (m) =>
          !object(m) ||
          Object.values(m).some(
            (role) => !["admin", "member", "viewer"].includes(String(role)),
          ),
      ))
  )
    return false;
  if (
    value.appInvitations !== undefined &&
    !records(value.appInvitations, [
      "app",
      "email",
      "role",
      "invitedById",
      "createdAt",
      "expiresAt",
      "status",
    ])
  )
    return false;
  if (
    (value.requests as Record<string, unknown>[]).some(
      (r) =>
        !records(r.steps, ["name", "approverId", "status"]) ||
        !records(r.activity, ["at", "personId", "kind", "text"]) ||
        (r.attachments as unknown[]).some(
          (a) =>
            !object(a) ||
            typeof a.name !== "string" ||
            typeof a.size !== "number",
        ),
    )
  )
    return false;
  if (
    (value.documents as Record<string, unknown>[]).some(
      (d) =>
        !Array.isArray(d.versions) ||
        d.versions.some(
          (v) =>
            !object(v) ||
            ["version", "at", "authorId", "note"].some(
              (k) => typeof v[k] !== "string",
            ),
        ),
    )
  )
    return false;
  if (
    (value.requests as Record<string, unknown>[]).some(
      (r) =>
        !fieldsValid(r.form) ||
        !answersValid(r.fields) ||
        (r.steps as Record<string, unknown>[]).some(
          (step) => !fieldsValid(step.fields) || !answersValid(step.answers),
        ),
    )
  )
    return false;
  if (
    (value.surveyResponses as Record<string, unknown>[]).some(
      (r) => !answersValid(r.answers),
    )
  )
    return false;
  if ((value.meetings as Record<string,unknown>[]).some(m => (m.decisions as unknown[]).some(d => !object(d) || typeof d.id !== 'string' || typeof d.text !== 'string' || (d.audienceIds !== undefined && !strings(d.audienceIds))))) return false;
  if ((value.surveys as Record<string,unknown>[]).some(s => s.followUps !== undefined && (!Array.isArray(s.followUps) || s.followUps.some(f => !object(f) || !['taskId','interpretation','actorId','at'].every(k=>typeof f[k]==='string') || !Number.isInteger(f.responseCount))))) return false;
  if ((value.requests as Record<string,unknown>[]).some(r => r.execution !== undefined && (!object(r.execution) || !Number.isInteger(r.execution.revision) || typeof r.execution.effectiveDate !== 'string' || !['pending','failed','applied','cancelled'].includes(String(r.execution.status)) || !Array.isArray(r.execution.attempts) || r.execution.attempts.some(a => !object(a) || !['at','actorId','reason'].every(k=>typeof a[k]==='string') || !['failed','applied','cancelled'].includes(String(a.outcome)))))) return false;
  if (value.commercial !== undefined) {
    const c = value.commercial;
    if (!object(c) || !Number.isInteger(c.revision) || Number(c.revision)<0 || !['starter','team','business'].includes(String(c.package)) || !['demo','trial','enabled','cancelled'].includes(String(c.status)) || !Array.isArray(c.history) || c.history.some(h=>!object(h)||!['at','actorId','action','reason'].every(k=>typeof h[k]==='string')) || !records(c.support,['subject','message','app','createdById','status','createdAt']) || (c.support as Record<string,unknown>[]).some(r=>!['requested','approved','resolved','cancelled'].includes(String(r.status)) || (r.expiresAt!==undefined && typeof r.expiresAt!=='string'))) return false;
  }
  if (value.hr !== undefined) {
    if (!object(value.hr)) return false;
    for (const [collection, fields] of Object.entries(FIELDS)) {
      if (!records(value.hr[collection], ["status", "createdAt", "updatedAt"]))
        return false;
      for (const record of value.hr[collection] as Record<string, unknown>[]) {
        if (!Number.isInteger(record.version) || Number(record.version) < 1)
          return false;
        if (
          fields.some(
            (field) =>
              record[field.key] !== undefined &&
              (field.type === "number"
                ? typeof record[field.key] !== "number"
                : ["file", "checks", "richtext"].includes(field.type ?? "")
                ? false
                : typeof record[field.key] !== "string"),
          )
        )
          return false;
      }
    }
    if (value.hr.plans !== undefined && (!records(value.hr.plans, ['employeeId', 'kind', 'ownerId', 'dueDate', 'createdAt']) || (value.hr.plans as Record<string, unknown>[]).some(p => !strings(p.taskIds) || !['onboarding','probation','development','offboarding'].includes(String(p.kind))))) return false;
    if ((value.hr.employees as Record<string,unknown>[]).some(e => e.verifications !== undefined && (!records(e.verifications, ['label','evidence','status','addedById','at']) || (e.verifications as Record<string,unknown>[]).some(v => !['pending','verified','rejected'].includes(String(v.status)))))) return false;
    if ((value.hr.payroll as Record<string,unknown>[]).some(p => p.deliveries !== undefined && (!Array.isArray(p.deliveries) || p.deliveries.some(d => !object(d) || !['at','actorId','reason'].every(k => typeof d[k] === 'string') || !['success','rejected','uncertain'].includes(String(d.outcome)) || !Number.isInteger(d.version))))) return false;
    if (value.hr.recruitment !== undefined) {
      if (!object(value.hr.recruitment)) return false;
      const recruitment = value.hr.recruitment;
      for (const [key, fields] of Object.entries({
        positions: [
          "title",
          "department",
          "branch",
          "description",
          "requirements",
          "employmentType",
        ],
        requisitions: [
          "positionId",
          "reason",
          "managerId",
          "reviewerId",
          "status",
          "createdById",
        ],
        interviews: [
          "applicationId",
          "interviewerId",
          "startsAt",
          "location",
          "criteria",
          "status",
          "evidence",
          "recommendation",
        ],
        offers: [
          "applicationId",
          "terms",
          "reviewerId",
          "createdById",
          "status",
          "reason",
        ],
      }))
        if (
          !records(recruitment[key], fields) ||
          (recruitment[key] as Record<string, unknown>[]).some(
            (r) => !Number.isInteger(r.version) || Number(r.version) < 1,
          )
        )
          return false;
      if (!Array.isArray(recruitment.history)) return false;
      if (
        recruitment.candidateStages !== undefined &&
        (!object(recruitment.candidateStages) ||
          !records(recruitment.candidateStages.stages, ["name", "phase"]) ||
          !Number.isInteger(recruitment.candidateStages.version))
      )
        return false;
    }
    if (
      (value.hr.leaves as Record<string, unknown>[]).some(
        (l) =>
          l.calendar !== undefined &&
          calendarProblem(l.calendar as DataState["org"]["workCalendar"] & {}),
      )
    )
      return false;
    if (
      !Array.isArray(value.hr.episodes) ||
      !Array.isArray(value.hr.leaveLedger) ||
      !Array.isArray(value.hr.history) ||
      !object(value.hr.scopes)
    )
      return false;
  }
  return true;
}
export function isBackupState(value: unknown): value is DataState {
  try {
    return validateBackupState(value);
  } catch {
    return false;
  }
}
export function readWorkspaceBackup(text: string): DataState {
  if (text.length > 10 * 1024 * 1024)
    throw new Error("Choose an Anumat backup smaller than 10 MB.");
  const parsed: unknown = JSON.parse(text, (key, value) => {
    if (["__proto__", "prototype", "constructor"].includes(key))
      throw new Error("Invalid backup.");
    return value;
  });
  if (
    !object(parsed) ||
    parsed.format !== "anumat-prototype-workspace" ||
    parsed.version !== 1 ||
    !isBackupState(parsed.state)
  )
    throw new Error("This is not a supported Anumat workspace backup.");
  return structuredClone(parsed.state);
}
export function workspaceBackup(state: DataState): string {
  return JSON.stringify(
    {
      format: "anumat-prototype-workspace",
      version: 1,
      exportedAt: new Date().toISOString(),
      state,
    },
    null,
    2,
  );
}
