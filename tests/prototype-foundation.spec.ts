import { expect } from "@playwright/test";
import { test, seed, state, actor, csv, choose } from "./helpers/erp";
test("company setup validates and persists calendar and organizational lists", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/settings/company");
  await page
    .getByRole("textbox", { name: "Company name", exact: true })
    .fill("Lotus SME");
  await page
    .getByRole("textbox", { name: "Legal employer name" })
    .fill("Lotus SME Co Ltd");
  await page
    .getByRole("textbox", { name: "Branches", exact: true })
    .fill("Phnom Penh\nSiem Reap");
  await page
    .getByRole("textbox", { name: "Company holidays" })
    .fill("2026-02-30 | Invalid");
  await page
    .getByRole("button", { name: "Save company settings", exact: true })
    .first()
    .click();
  await expect(page.getByRole("alert")).toContainText("unique holiday");
  expect((await state(page)).org.name).not.toBe("Lotus SME");
  await page
    .getByRole("textbox", { name: "Company holidays" })
    .fill("2026-10-06 | Company holiday");
  await page.getByRole("checkbox", { name: "Saturday", exact: true }).check();
  await page
    .getByRole("button", { name: "Save company settings", exact: true })
    .first()
    .click();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Company name", exact: true }),
  ).toHaveValue("Lotus SME");
  expect((await state(page)).org.workCalendar?.workWeek).toContain(6);
  await actor(page, "Alex Tan");
  await page.goto("/settings/company");
  await expect(
    page.getByRole("textbox", { name: "Company name", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Save company settings", exact: true }),
  ).toHaveCount(0);
});
test("my work opens a task directly and recovers from an unavailable task", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/work");
  const link = page.locator('a[href^="/tasks?task="]').first();
  const href = await link.getAttribute("href");
  await link.click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  expect(new URL(page.url()).search).toBe(new URL(href!, "http://test").search);
  await page.goto("/tasks?task=missing-record");
  await expect(
    page.getByText("This task was removed or is unavailable in this company."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "View all tasks", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tasks$/);
});
test("owner can restore a separate backup copy and remove it with exact confirmation", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/settings/data");
  const before = await state(page);
  const exported = await csv(page, "Download workspace backup");
  expect(JSON.parse(exported.content).state.hr.employees).toHaveLength(4);
  await page.getByLabel("Anumat backup file").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await expect(
    page.getByText("This is not a supported Anumat workspace backup."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Restore company copy" }),
  ).toHaveCount(0);
  const rootBefore = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("anumat-hackathon-v1")!),
  );
  await page.getByLabel("Anumat backup file").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(exported.content),
  });
  await page.getByRole("button", { name: "Restore company copy" }).click();
  await expect(page).toHaveURL(/\/work$/);
  expect((await state(page)).hr.employees).toEqual(before.hr.employees);
  const rootAfter = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("anumat-hackathon-v1")!),
  );
  expect(Object.keys(rootAfter.spaces)).toHaveLength(
    Object.keys(rootBefore.spaces).length + 1,
  );
  expect(rootAfter.spaces[rootBefore.active]).toEqual(
    rootBefore.spaces[rootBefore.active],
  );
  await page.goto("/settings/data");
  await page
    .getByRole("button", { name: "Remove local company", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("textbox", { name: "Company name" })
    .fill("Wrong company");
  await expect(
    dialog.getByRole("button", { name: "Remove company records" }),
  ).toBeDisabled();
  await dialog
    .getByRole("textbox", { name: "Company name" })
    .fill(before.org.name);
  await dialog.getByRole("button", { name: "Remove company records" }).click();
  await expect(page).toHaveURL(/\/discover$/);
  expect(
    await page.evaluate(
      () =>
        Object.keys(
          JSON.parse(localStorage.getItem("anumat-hackathon-v1")!).spaces,
        ).length,
    ),
  ).toBe(Object.keys(rootBefore.spaces).length);
  await actor(page, "Alex Tan");
  await page.goto("/settings/data");
  await expect(
    page.getByText(
      "Only the workspace owner can export, restore, or remove a company.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download workspace backup" }),
  ).toHaveCount(0);
});
test("notification failure and retry previews persist and stay personal", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/settings/notifications");
  await page
    .getByRole("textbox", { name: "Notification email" })
    .fill("owner@example.test");
  await page.getByRole("button", { name: "Save email", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Task updates by Email", exact: true })
    .check();
  await page.goto("/settings/delivery");
  await choose(page, "Notification app", "Task management");
  await page.getByRole("button", { name: "Run delivery preview" }).click();
  await expect(
    page.getByText("Simulated failure", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry preview" }).click();
  await expect(
    page.getByText("Simulated success", { exact: true }),
  ).toBeVisible();
  await page.reload();
  expect((await state(page)).deliveryPreviews![0]!.attempts).toHaveLength(2);
  await actor(page, "Alex Tan");
  await page.goto("/settings/delivery");
  await expect(
    page.getByText("No delivery previews yet", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Run delivery preview" }),
  ).toBeDisabled();
});
test("current reviewer hands off a review with reason and retained history", async ({
  page,
}) => {
  const { seed: initial } = await import("../src/data/seed");
  const data = structuredClone(initial);
  data.requests = [
    {
      id: "REVIEW-1",
      type: "purchase",
      title: "Warehouse supplies",
      requesterId: "alex",
      department: "Operations",
      description: "Original purchase evidence",
      status: "pending",
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
      steps: [
        {
          id: "review",
          name: "Independent review",
          approverId: "dara",
          status: "current",
        },
      ],
      attachments: [],
      activity: [],
    },
  ];
  await page.addInitScript((value) => {
    if (!localStorage.getItem("anumat-hackathon-v1"))
      localStorage.setItem(
        "anumat-hackathon-v1",
        JSON.stringify({
          active: "review-fixture",
          spaces: { "review-fixture": value },
        }),
      );
  }, data);
  await page.goto("/requests/REVIEW-1");
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Change reviewer", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Change reviewer",
    exact: true,
  });
  await dialog.getByRole("button", { name: "Confirm reviewer change" }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await choose(page, "New reviewer", "Priya Shah");
  await dialog
    .getByRole("textbox", { name: "Reason for reviewer change" })
    .fill("Cover during reviewer absence");
  await dialog.getByRole("button", { name: "Confirm reviewer change" }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  expect((await state(page)).requests[0]!.steps[0]!.approverId).toBe("priya");
  await expect(
    page.getByText(
      "Changed reviewer from Dara Sok to Priya Shah: Cover during reviewer absence",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Approve", exact: true }),
  ).toHaveCount(0);
  await actor(page, "Alex Tan");
  await page.goto("/requests/REVIEW-1");
  await expect(
    page.getByRole("button", { name: "Change reviewer", exact: true }),
  ).toHaveCount(0);
});

test("workspace search opens specific tasks and hides inaccessible app results", async ({
  page,
}) => {
  await seed(page);
  const task = (await state(page)).tasks.find((t) => t.ownerId === "dara")!;
  await page.goto("/work");
  await page.getByRole("button", { name: /^Search/ }).click();
  await page
    .getByRole("combobox", { name: "Search pages, requests and people" })
    .fill(task.title);
  await page
    .getByRole("option", {
      name: new RegExp(task.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(page).toHaveURL(new RegExp(`task=${task.id}`));
  await page.goto("/work");
  await page.getByRole("button", { name: /^Account:/ }).click();
  await page.getByRole("menuitem", { name: /Priya Shah/ }).click();
  expect((await state(page)).appMembers?.payroll?.priya).toBeUndefined();
  await page.goto("/work");
  await page.getByRole("button", { name: /^Search/ }).click();
  await page
    .getByRole("combobox", { name: "Search pages, requests and people" })
    .fill("Payroll management");
  await expect(page.getByRole("option")).toHaveCount(0);
});
