import type { DataState, Task } from "../data/types";
import { appRole, canContributeToApp, isAppAdmin } from "../lib/appAccess";
import { hrState, visibleRecords, canReadCompensation } from "./engine";
import type { AdvancedHRCommand } from "./advancedTypes";
import type { HRCollection, HRRecord } from "./types";
const today = () => new Date().toISOString().slice(0, 10);
const validDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(s)) &&
  new Date(s).toISOString().slice(0, 10) === s;
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const PLAN_STEPS = {
  onboarding: [
    "Verify employment documents",
    "Prepare equipment and access",
    "Complete first-week orientation",
  ],
  probation: [
    "Agree probation expectations",
    "Collect probation evidence",
    "Record probation decision",
  ],
  development: [
    "Agree development outcome",
    "Complete learning activity",
    "Review development evidence",
  ],
  offboarding: [
    "Hand over open work",
    "Return equipment and remove access",
    "Reconcile final attendance inputs",
  ],
};
export function advancedProblem(
  state: DataState,
  c: AdvancedHRCommand,
): string | undefined {
  const hr = hrState(state);
  const check = (
    collection: HRCollection,
    recordId: string,
    version: number,
    app: Parameters<typeof isAppAdmin>[1],
  ) => {
    const record = (hr[collection] as HRRecord[]).find(
      (r) => r.id === recordId,
    );
    if (!isAppAdmin(state, app) || !record)
      return "Only the authorized app admin can run this workflow.";
    if (record.version !== version)
      return "This record changed. Close and reopen it before trying again.";
  };
  if (c.action === "closePlan") {
    const plan = hr.plans?.find((p) => p.id === c.planId);
    if (
      !plan ||
      !isAppAdmin(state, "employees") ||
      !appRole(state, "tasks") ||
      plan.closedAt
    )
      return "This plan is unavailable.";
    if (
      plan.taskIds.some(
        (taskId) =>
          !state.tasks.some(
            (t) =>
              t.id === taskId &&
              state.taskStatuses.find((s) => s.id === t.status)?.category ===
                "done",
          ),
      )
    )
      return "Complete every linked task before closing the plan.";
    return;
  }
  if (
    ["plan", "extendProbation", "evidence", "verifyEvidence"].includes(
      c.action,
    ) &&
    "employeeId" in c &&
    "expectedVersion" in c
  ) {
    const issue = check(
      "employees",
      c.employeeId,
      c.expectedVersion,
      "employees",
    );
    if (issue) return issue;
    const e = hr.employees.find((e) => e.id === c.employeeId)!;
    if (c.action === "plan") {
      if (
        e.status === "exited" ||
        !canContributeToApp(state, "tasks") ||
        !canContributeToApp(state, "tasks", c.ownerId) ||
        !validDate(c.dueDate)
      )
        return "Choose an active employee, eligible task owner and valid plan date.";
      const episode = hr.episodes.filter((ep) => ep.employeeId === e.id).at(-1)
        ?.id;
      if (
        hr.plans?.some(
          (p) =>
            p.employeeId === e.id &&
            p.episodeId === episode &&
            p.kind === c.kind &&
            !p.closedAt,
        )
      )
        return "This employee already has an open plan of this type.";
      if (
        c.courseId &&
        (!appRole(state, "training") ||
          !visibleRecords(state, "courses").some(
            (course) =>
              course.id === c.courseId && course.status === "open",
          ))
      )
        return "Choose an open course you can access.";
      if (
        !state.taskStatuses.some(
          (s) =>
            s.category === "todo" &&
            !s.requireReady &&
            !s.requireDone &&
            !s.signOff,
        )
      )
        return "Configure an ungated starting task status first.";
      return;
    }
    if (c.action === "extendProbation") {
      if (
        e.status !== "probation" ||
        !validDate(c.endDate) ||
        c.endDate <= today() ||
        !c.reason.trim()
      )
        return "Extend a probation employee to a future date and record the reason.";
      return;
    }
    if (c.action === "evidence") {
      if (!c.label.trim() || !c.evidence.trim() || c.evidence.length > 2000)
        return "Add the document name and verification evidence.";
      return;
    }
    if (c.action === "verifyEvidence") {
      const v = e.verifications?.find((v) => v.id === c.evidenceId);
      if (
        !v ||
        v.status !== "pending" ||
        v.addedById === state.meId ||
        e.accountId === state.meId ||
        !c.reason.trim()
      )
        return "A different HR admin must verify pending evidence with a reason.";
      return;
    }
  }
  if (c.action === "assetTransfer" || c.action === "retireAsset") {
    const issue = check("assets", c.assetId, c.expectedVersion, "assets");
    if (issue) return issue;
    const asset = hr.assets.find((a) => a.id === c.assetId)!;
    if (!c.reason.trim()) return "Record a handover or retirement reason.";
    if (c.action === "retireAsset") {
      if (
        asset.status === "assigned" ||
        asset.status === "retired" ||
        hr.reservations.some(
          (r) => r.assetId === asset.id && r.status === "reserved",
        )
      )
        return "Return custody and resolve reservations before retiring this asset.";
      return;
    }
    if (
      asset.kind !== "equipment" ||
      asset.status !== "assigned" ||
      asset.employeeId === c.employeeId ||
      !c.condition.trim() ||
      !hr.employees.some((e) => e.id === c.employeeId && e.status !== "exited")
    )
      return "Transfer assigned equipment to a different active employee with condition evidence.";
    return;
  }
  if (c.action === "coursePolicy") {
    const issue = check("courses", c.courseId, c.expectedVersion, "training");
    if (issue) return issue;
    if (
      !Number.isInteger(c.capacity) ||
      c.capacity < 1 ||
      c.capacity > 1000 ||
      hr.enrollments.filter(
        (e) =>
          e.courseId === c.courseId &&
          !["cancelled", "waitlisted"].includes(e.status),
      ).length > c.capacity
    )
      return "Capacity must fit existing enrollments and be between 1 and 1,000.";
    if (
      c.prerequisiteId &&
      (c.prerequisiteId === c.courseId ||
        !hr.courses.some(
          (course) =>
            course.id === c.prerequisiteId && course.status === "open",
        ))
    )
      return "Choose a different open prerequisite course.";
    const seen = new Set([c.courseId]);
    let cursor = c.prerequisiteId;
    while (cursor) {
      if (seen.has(cursor)) return "Course prerequisites cannot form a cycle.";
      seen.add(cursor);
      cursor =
        hr.courses.find((course) => course.id === cursor)?.prerequisiteId ?? "";
    }
    return;
  }
  if (c.action === "waitlist") {
    if (
      !isAppAdmin(state, "training") ||
      !hr.employees.some(
        (e) => e.id === c.employeeId && e.status !== "exited",
      ) ||
      !hr.courses.some(
        (course) => course.id === c.courseId && course.status === "open",
      )
    )
      return "Choose an active employee and an open course.";
    if (
      hr.enrollments.some(
        (e) =>
          e.employeeId === c.employeeId &&
          e.courseId === c.courseId &&
          !["cancelled", "failed"].includes(e.status),
      )
    )
      return "This employee already has a current enrollment.";
    return;
  }
  if (c.action === "admit" || c.action === "cancelEnrollment") {
    const issue = check(
      "enrollments",
      c.enrollmentId,
      c.expectedVersion,
      "training",
    );
    if (issue) return issue;
    const e = hr.enrollments.find((e) => e.id === c.enrollmentId)!;
    if (c.action === "cancelEnrollment") {
      if (!["enrolled", "waitlisted"].includes(e.status) || !c.reason.trim())
        return "Cancel an uncompleted enrollment with a reason.";
      return;
    }
    if (e.status !== "waitlisted") return "Choose a waitlisted enrollment.";
    const course = hr.courses.find((course) => course.id === e.courseId);
    if (
      !course ||
      course.status !== "open" ||
      hr.enrollments.filter(
        (x) =>
          x.courseId === e.courseId &&
          !["cancelled", "waitlisted"].includes(x.status),
      ).length >= (course.capacity ?? 1000)
    )
      return "No place is available in this open course.";
    if (
      course.prerequisiteId &&
      !hr.enrollments.some(
        (x) =>
          x.employeeId === e.employeeId &&
          x.courseId === course.prerequisiteId &&
          x.status === "completed" &&
          (!x.expiresAt || x.expiresAt >= today()),
      )
    )
      return "Complete the current prerequisite before admission.";
    return;
  }
  if (c.action === "disagree") {
    const review = visibleRecords(state, "reviews").find(
      (r) => r.id === c.reviewId,
    );
    const employee = hr.employees.find((e) => e.id === review?.employeeId);
    if (
      !review ||
      employee?.accountId !== state.meId ||
      review.version !== c.expectedVersion ||
      !["published", "acknowledged"].includes(review.status) ||
      review.employeeResponse ||
      !c.reason.trim()
    )
      return "Only the reviewed employee can respond once to a published review.";
    return;
  }
  if (c.action === "payrollDelivery") {
    const issue = check("payroll", c.payrollId, c.expectedVersion, "payroll");
    if (issue) return issue;
    const p = hr.payroll.find((p) => p.id === c.payrollId)!;
    if (
      !canReadCompensation(state) ||
      p.status !== "frozen" ||
      !p.lines?.length ||
      !c.reason.trim()
    )
      return "Use a frozen payroll preview with compensation access and an outcome reason.";
    return;
  }
  return "This workflow is unavailable.";
}
export function applyAdvanced(
  state: DataState,
  c: AdvancedHRCommand,
): DataState {
  if (advancedProblem(state, c)) return state;
  const at = new Date().toISOString();
  const hr = structuredClone(hrState(state));
  let tasks = state.tasks;
  const change = (
    collection: HRCollection,
    recordId: string,
    patch: Record<string, unknown>,
    reason: string,
  ) => {
    const r = (hr[collection] as HRRecord[]).find((r) => r.id === recordId)!;
    const before = structuredClone(r);
    Object.assign(r, patch, { version: r.version + 1, updatedAt: at });
    hr.history.push({
      id: id("event"),
      collection,
      recordId,
      actorId: state.meId,
      at,
      action: c.action,
      reason,
      before,
      after: structuredClone(r),
    });
  };
  if (c.action === "plan") {
    const e = hr.employees.find((e) => e.id === c.employeeId)!;
    const planId = id("plan");
    const status = state.taskStatuses.find(
      (s) =>
        s.category === "todo" &&
        !s.requireReady &&
        !s.requireDone &&
        !s.signOff,
    )!.id;
    const existing =
      c.kind === "onboarding" && hr.episodes.filter(ep => ep.employeeId === e.id).length <= 1
        ? tasks.filter((t) => t.id.startsWith(`onboard-${e.id}-`))
        : [];
    const linked: Task[] = existing.length
      ? existing
      : PLAN_STEPS[c.kind].map((title, index) => ({
          id: `${planId}-${index}`,
          title: `${title} · ${e.name}`,
          ownerId: c.ownerId,
          assignedById: state.meId,
          status,
          priority: "medium",
          workType: "task",
          due: `${c.dueDate}T09:00:00`,
          expectedOutcome: title,
          source: { label: e.name, href: `/employees?record=${e.id}` },
          notes: c.courseId ? `Learning course: ${c.courseId}` : undefined,
        }));
    if (!existing.length) tasks = [...linked, ...tasks];
    hr.plans = [
      ...(hr.plans ?? []),
      {
        id: planId,
        employeeId: e.id,
        episodeId: hr.episodes.filter((ep) => ep.employeeId === e.id).at(-1)
          ?.id,
        kind: c.kind,
        ownerId: c.ownerId,
        dueDate: c.dueDate,
        courseId: c.courseId,
        taskIds: linked.map((t) => t.id),
        createdAt: at,
      },
    ];
  }
  if (c.action === "closePlan")
    hr.plans = hr.plans!.map((p) =>
      p.id === c.planId ? { ...p, closedAt: at } : p,
    );
  if (c.action === "extendProbation")
    change(
      "employees",
      c.employeeId,
      { probationEndDate: c.endDate },
      c.reason,
    );
  if (c.action === "evidence") {
    const e = hr.employees.find((e) => e.id === c.employeeId)!;
    change(
      "employees",
      e.id,
      {
        verifications: [
          ...(e.verifications ?? []),
          {
            id: id("verification"),
            label: c.label.trim(),
            evidence: c.evidence.trim(),
            status: "pending",
            addedById: state.meId,
            at,
          },
        ],
      },
      c.label,
    );
  }
  if (c.action === "verifyEvidence") {
    const e = hr.employees.find((e) => e.id === c.employeeId)!;
    change(
      "employees",
      e.id,
      {
        verifications: e.verifications!.map((v) =>
          v.id === c.evidenceId
            ? {
                ...v,
                status: c.result,
                reviewerId: state.meId,
                reason: c.reason.trim(),
                at,
              }
            : v,
        ),
      },
      c.reason,
    );
  }
  if (c.action === "assetTransfer")
    change(
      "assets",
      c.assetId,
      {
        employeeId: c.employeeId,
        condition: c.condition.trim(),
        reason: c.reason.trim(),
      },
      c.reason,
    );
  if (c.action === "retireAsset")
    change(
      "assets",
      c.assetId,
      { status: "retired", reason: c.reason.trim() },
      c.reason,
    );
  if (c.action === "coursePolicy")
    change(
      "courses",
      c.courseId,
      { capacity: c.capacity, prerequisiteId: c.prerequisiteId || undefined },
      "Updated enrollment policy",
    );
  if (c.action === "waitlist") {
    const course = hr.courses.find((course) => course.id === c.courseId)!;
    hr.enrollments.unshift({
      id: id("enrollment"),
      version: 1,
      status: "waitlisted",
      employeeId: c.employeeId,
      courseId: c.courseId,
      score: 0,
      evidence: "",
      attended: false,
      attempts: [],
      passScoreSnapshot: course.passScore,
      validMonthsSnapshot: course.validMonths,
      createdAt: at,
      updatedAt: at,
    });
  }
  if (c.action === "admit")
    change(
      "enrollments",
      c.enrollmentId,
      { status: "enrolled" },
      "Admitted from waitlist",
    );
  if (c.action === "cancelEnrollment")
    change("enrollments", c.enrollmentId, { status: "cancelled" }, c.reason);
  if (c.action === "disagree")
    change(
      "reviews",
      c.reviewId,
      {
        employeeResponse: { reason: c.reason.trim(), actorId: state.meId, at },
      },
      c.reason,
    );
  if (c.action === "payrollDelivery") {
    const p = hr.payroll.find((p) => p.id === c.payrollId)!;
    change(
      "payroll",
      p.id,
      {
        deliveries: [
          ...(p.deliveries ?? []),
          {
            at,
            actorId: state.meId,
            outcome: c.outcome,
            reason: c.reason.trim(),
            version: p.deliveries?.[0]?.version ?? p.version,
          },
        ],
      },
      c.reason,
    );
  }
  return { ...state, hr, tasks };
}
