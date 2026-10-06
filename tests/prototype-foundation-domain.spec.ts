import { expect, test } from "@playwright/test";
import { seed } from "../src/data/seed";
import { reducer } from "../src/data/store";
import {
  companyConfiguration,
  DEFAULT_WORK_CALENDAR,
} from "../src/lib/companyConfiguration";
import {
  readWorkspaceBackup,
  workspaceBackup,
  isBackupState,
} from "../src/lib/workspaceBackup";
import { applyHR, workDays } from "../src/hr/engine";
import { initialAppMembers } from "../src/lib/appAccess";
import { canChangeReviewer } from "../src/lib/approvalDelegation";
import type { DataState, Request } from "../src/data/types";
function fixture() {
  const s = structuredClone(seed);
  s.appMembers = initialAppMembers(s);
  return applyHR(s, { kind: "loadExamples" });
}
test("company settings enforce owner/admin access, stale revisions and valid calendars", () => {
  const s = fixture();
  const configuration = {
    ...companyConfiguration(s),
    legalName: "Lotus Co Ltd",
    branches: ["Phnom Penh"],
    departments: ["Operations"],
  };
  const action = {
    type: "configureCompany",
    name: "Lotus SME",
    configuration,
    calendar: {
      workWeek: [1, 2, 3, 4, 5, 6],
      holidays: [{ date: "2026-10-06", name: "Company holiday" }],
    },
  } as const;
  const next = reducer(s, {
    ...action,
    calendar: structuredClone(
      action.calendar,
    ) as unknown as typeof DEFAULT_WORK_CALENDAR,
  });
  expect(next.org.name).toBe("Lotus SME");
  expect(next.org.configuration?.revision).toBe(1);
  expect(next.workspaceHistory).toHaveLength(1);
  expect(reducer(next, { ...action, calendar: DEFAULT_WORK_CALENDAR })).toBe(
    next,
  );
  const member = { ...s, meId: "alex" };
  expect(reducer(member, { ...action, calendar: DEFAULT_WORK_CALENDAR })).toBe(
    member,
  );
  expect(
    reducer(s, { ...action, calendar: { workWeek: [], holidays: [] } }),
  ).toBe(s);
  expect(
    reducer(s, {
      ...action,
      calendar: {
        workWeek: [1],
        holidays: [{ date: "2026-02-30", name: "Invalid" }],
      },
    }),
  ).toBe(s);
  expect(workDays("2026-10-05", "2026-10-10", next.org.workCalendar)).toBe(5);
  expect(workDays("2026-10-05", "2026-10-10")).toBe(5);
});
test("saved leave snapshots its company calendar across later calendar changes", () => {
  let s = fixture();
  s.org.workCalendar = {
    workWeek: [1, 2, 3, 4, 5, 6],
    holidays: [{ date: "2026-10-06", name: "Holiday" }],
  };
  const record = {
    id: "leave-calendar",
    version: 0,
    status: "",
    createdAt: "",
    updatedAt: "",
    employeeId: s.hr!.employees[0]!.id,
    type: "annual",
    startDate: "2026-10-05",
    endDate: "2026-10-10",
    days: 0,
    reason: "Family trip",
  };
  s = applyHR(s, { kind: "save", collection: "leaves", record });
  const saved = s.hr!.leaves.find((l) => l.id === record.id)!;
  expect(saved).toBeTruthy();
  expect(saved.days).toBe(5);
  expect(saved.calendar).toEqual(s.org.workCalendar);
  s.org.workCalendar = { workWeek: [0], holidays: [] };
  const edited = applyHR(s, {
    kind: "save",
    collection: "leaves",
    record: { ...saved, reason: "Updated trip" },
    expectedVersion: saved.version,
    reason: "Corrected reason",
  });
  expect(edited.hr!.leaves.find((l) => l.id === record.id)?.calendar).toEqual(
    saved.calendar,
  );
  expect(edited.hr!.leaves.find((l) => l.id === record.id)?.days).toBe(5);
});
test("owner backups round trip HR data and reject malformed nested records", () => {
  const s = fixture();
  expect(readWorkspaceBackup(workspaceBackup(s))).toEqual(s);
  for (const mutate of [
    (x: DataState) => {
      x.hr!.recruitment = {} as never;
    },
    (x: DataState) => {
      x.org.workCalendar = { workWeek: [1], holidays: [null] } as never;
    },
    (x: DataState) => {
      x.deliveryPreviews = [
        {
          id: "bad",
          event: "tasks",
          channel: "email",
          personId: "dara",
          destination: "test@example.test",
          attempts: null,
        },
      ] as never;
    },
    (x: DataState) => {
      x.notificationPrefs = { dara: { events: { tasks: "email" } } } as never;
    },
    (x: DataState) => {
      x.meId = "alex";
    },
    (x: DataState) => {
      x.org.configuration = { revision: 1 } as never;
    },
  ]) {
    const malformed = structuredClone(s);
    mutate(malformed);
    expect(isBackupState(malformed)).toBe(false);
    expect(() => readWorkspaceBackup(workspaceBackup(malformed))).toThrow();
  }
  expect(() =>
    readWorkspaceBackup(
      '{"format":"anumat-prototype-workspace","version":1,"__proto__":{}}',
    ),
  ).toThrow();
});
test("delivery simulation is personal and retries require an unchanged enabled destination", () => {
  let s = fixture();
  s = reducer(s, { type: "setNotificationEmail", email: "owner@example.test" });
  s = reducer(s, {
    type: "setChannel",
    event: "tasks",
    channel: "email",
    on: true,
  });
  s = reducer(s, {
    type: "previewDelivery",
    event: "tasks",
    channel: "email",
    result: "failed",
  });
  const id = s.deliveryPreviews![0]!.id;
  expect(s.deliveryPreviews![0]!.attempts).toHaveLength(1);
  const other = { ...s, meId: "alex" };
  expect(
    reducer(other, {
      type: "previewDelivery",
      event: "tasks",
      channel: "email",
      result: "previewed",
      previewId: id,
    }),
  ).toBe(other);
  const muted = reducer(s, {
    type: "setChannel",
    event: "tasks",
    channel: "email",
    on: false,
  });
  expect(
    reducer(muted, {
      type: "previewDelivery",
      event: "tasks",
      channel: "email",
      result: "previewed",
      previewId: id,
    }),
  ).toBe(muted);
  const changed = reducer(s, {
    type: "setNotificationEmail",
    email: "changed@example.test",
  });
  expect(
    reducer(changed, {
      type: "previewDelivery",
      event: "tasks",
      channel: "email",
      result: "previewed",
      previewId: id,
    }),
  ).toBe(changed);
  s = reducer(s, {
    type: "previewDelivery",
    event: "tasks",
    channel: "email",
    result: "previewed",
    previewId: id,
  });
  expect(s.deliveryPreviews![0]!.attempts.map((a) => a.result)).toEqual([
    "failed",
    "previewed",
  ]);
  expect(
    reducer(s, {
      type: "previewDelivery",
      event: "tasks",
      channel: "email",
      result: "previewed",
      previewId: id,
    }),
  ).toBe(s);
});
test("reviewer changes preserve submission and history, block self-review and enforce revision", () => {
  let s = fixture();
  const r: Request = {
    id: "reviewer-test",
    type: "purchase",
    title: "Office supplies",
    requesterId: "alex",
    department: "Operations",
    description: "Original submission",
    status: "pending",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
    steps: [
      { id: "review", name: "Review", approverId: "dara", status: "current" },
    ],
    attachments: [],
    activity: [],
    fields: {},
  };
  s.requests = [r];
  const action = {
    type: "changeReviewer" as const,
    requestId: r.id,
    personId: "priya",
    reason: "Current reviewer absent",
    expectedUpdatedAt: r.updatedAt,
  };
  expect(canChangeReviewer({ ...s, meId: "alex" }, r.id)).toBe(false);
  expect(reducer(s, { ...action, personId: "alex" })).toBe(s);
  expect(reducer(s, { ...action, expectedUpdatedAt: "stale" })).toBe(s);
  const next = reducer(s, action);
  expect(next.requests[0]!.steps[0]).toMatchObject({
    approverId: "priya",
    delegatedFromId: "dara",
  });
  expect(next.requests[0]!.description).toBe(r.description);
  expect(next.requests[0]!.activity[0]!.text).toContain(action.reason);
  expect(
    reducer(next, { type: "decide", requestId: r.id, decision: "approve" })
      .requests[0]!.status,
  ).toBe("pending");
  expect(
    reducer(
      { ...next, meId: "priya" },
      { type: "decide", requestId: r.id, decision: "approve" },
    ).requests[0]!.status,
  ).toBe("approved");
});
