import type { NotificationEvent } from "../data/types";
import type { WorkspaceApp } from "./moduleEntry";
export const NOTIFICATION_APPS: Record<NotificationEvent, WorkspaceApp> = {
  approvals: "approvals",
  requestUpdates: "approvals",
  tasks: "tasks",
  meetings: "meetings",
  surveys: "surveys",
  employees: "employees",
  recruitment: "recruitment",
  attendance: "attendance",
  payroll: "payroll",
  performance: "performance",
  training: "training",
  assets: "assets",
  reports: "reports",
};
