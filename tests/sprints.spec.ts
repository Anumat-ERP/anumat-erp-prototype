import { expect, test, type Locator, type Page } from '@playwright/test';

async function choose(page: Page, trigger: Locator, label: string) {
  await trigger.click();
  await page.getByRole('option', { name: label, exact: true }).click();
}

async function createSprint(page: Page, name: string, duration: string, start: string) {
  await page.getByRole('button', { name: 'Task options' }).click();
  await page.getByRole('menuitem', { name: 'Create sprint', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Create sprint' });
  await editor.getByRole('textbox', { name: 'Sprint name' }).fill(name);
  await editor.getByRole('textbox', { name: 'Sprint goal' }).fill('Deliver the next set of improvements.');
  await choose(page, editor.getByRole('combobox', { name: 'Duration' }), ({ '7': '1 week', '14': '2 weeks', custom: 'Custom dates' } as Record<string, string>)[duration]!);
  await editor.getByRole('textbox', { name: 'Start date', exact: true }).fill(start);
  return editor;
}

async function addTask(page: Page, title: string) {
  await page.getByRole('button', { name: 'New task', exact: true }).first().click();
  const drawer = page.getByRole('dialog', { name: 'New task' });
  await drawer.getByRole('textbox', { name: 'Task', exact: true }).fill(title);
  await drawer.getByRole('button', { name: 'Add task', exact: true }).click();
}

async function savedState(page: Page) {
  return page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    return root.spaces[root.active];
  });
}

test('plan week durations, start one sprint, and carry unfinished work to the next', async ({ page }, info) => {
  await page.goto('/tasks');
  let editor = await createSprint(page, 'Sprint 1', '7', '2026-10-05');
  await expect(editor.getByRole('textbox', { name: 'End date', exact: true })).toHaveValue('2026-10-11');
  await editor.getByRole('button', { name: 'Save sprint', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sprint 1', exact: true })).toBeVisible();
  await addTask(page, 'Finished sprint task');
  await addTask(page, 'Carry sprint task');
  await page.getByRole('checkbox', { name: 'Mark “Finished sprint task” done' }).press('Space');
  await expect.poll(async () => (await savedState(page)).tasks.find((task: { title: string }) => task.title === 'Finished sprint task').status).toBe('done');
  await page.getByRole('button', { name: 'Start sprint', exact: true }).click();
  await expect(page.getByText('Active', { exact: true })).toBeVisible();

  editor = await createSprint(page, 'Sprint 2', '14', '2026-12-28');
  await expect(editor.getByRole('textbox', { name: 'End date', exact: true })).toHaveValue('2027-01-10');
  await editor.getByRole('button', { name: 'Save sprint', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start sprint', exact: true })).toBeDisabled();
  await page.getByRole('tab', { name: 'Sprints', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sprint planning', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Sprint 1', exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/sprints-${info.project.name}.png`, fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Open Sprint 1', exact: true }).click();
  await page.getByRole('button', { name: 'Complete sprint', exact: true }).click();
  const completion = page.getByRole('dialog', { name: 'Complete Sprint 1?' });
  await expect(completion.getByText('1 unfinished task will move.')).toBeVisible();
  const state = await savedState(page);
  const secondId = state.sprints.find((sprint: { name: string }) => sprint.name === 'Sprint 2').id;
  await choose(page, completion.getByRole('combobox', { name: 'Move unfinished tasks to' }), 'Sprint 2');
  await completion.getByRole('button', { name: 'Complete sprint', exact: true }).click();
  await expect(page.getByText('Completed', { exact: true })).toBeVisible();
  await page.reload();
  const persisted = await savedState(page);
  const first = persisted.sprints.find((sprint: { name: string }) => sprint.name === 'Sprint 1');
  expect(first.status).toBe('completed');
  expect(first.carriedTasks).toBe(1);
  expect(persisted.tasks.find((task: { title: string }) => task.title === 'Finished sprint task').sprintId).toBe(first.id);
  expect(persisted.tasks.find((task: { title: string }) => task.title === 'Carry sprint task').sprintId).toBe(secondId);
  await page.getByRole('button', { name: /More filters/ }).click();
  await choose(page, page.getByRole('combobox', { name: 'Sprint filter' }), 'Sprint 2 · Planned');
  await choose(page, page.getByRole('combobox', { name: 'Whose tasks' }), 'Everyone');
  await expect(page.getByRole('button', { name: 'Carry sprint task', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Board', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Carry sprint task', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Finished sprint task', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Start sprint', exact: true }).click();
  await expect(page.getByText('Active', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('custom dates, validation and edits persist; members cannot manage sprints', async ({ page }, info) => {
  await page.goto('/tasks');
  let editor = await createSprint(page, 'Custom delivery', 'custom', '2026-10-05');
  await editor.getByRole('textbox', { name: 'End date', exact: true }).fill('2026-10-04');
  await editor.getByRole('button', { name: 'Save sprint', exact: true }).click();
  await expect(editor.getByText('Choose a date on or after 2026-10-05.')).toBeVisible();
  await editor.getByRole('textbox', { name: 'End date', exact: true }).fill('2026-10-15');
  await editor.screenshot({ animations: 'disabled', path: `test-results/sprint-editor-${info.project.name}.png` });
  await editor.getByRole('button', { name: 'Save sprint', exact: true }).click();
  await expect(page.getByText('· 11 days')).toBeVisible();
  await page.getByRole('button', { name: 'Edit sprint', exact: true }).click();
  editor = page.getByRole('dialog', { name: 'Edit sprint' });
  await choose(page, editor.getByRole('combobox', { name: 'Duration' }), '3 weeks');
  await expect(editor.getByRole('textbox', { name: 'End date', exact: true })).toHaveValue('2026-10-25');
  await editor.getByRole('textbox', { name: 'Sprint name' }).fill('Release sprint');
  await editor.getByRole('button', { name: 'Save sprint', exact: true }).click();
  await page.getByRole('button', { name: /More filters/ }).click();
  await choose(page, page.getByRole('combobox', { name: 'Sprint filter' }), 'Backlog');
  await addTask(page, 'Unplanned task');
  const task = (await savedState(page)).tasks.find((item: { title: string }) => item.title === 'Unplanned task');
  expect(task.sprintId).toBeUndefined();
  await page.getByRole('button', { name: 'Unplanned task', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Task', exact: true });
  await choose(page, drawer.getByRole('combobox', { name: 'Sprint', exact: true }), 'Release sprint');
  await drawer.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unplanned task', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /^Account:/ }).click();
  await page.getByRole('menuitem', { name: /Alex Tan/ }).click();
  await page.getByRole('tab', { name: 'Sprints', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Release sprint', exact: true })).toBeVisible();
  for (const name of ['Create sprint', 'Edit sprint', 'Start sprint', 'Complete sprint']) await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  await page.screenshot({ path: `test-results/sprints-member-${info.project.name}.png`, fullPage: true, animations: 'disabled' });
  await page.evaluate(() => { localStorage.setItem('anumat-locale', 'km'); localStorage.setItem('anumat-theme', 'dark'); });
  await page.reload();
  await page.getByRole('tab', { name: 'វគ្គការងារ', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Release sprint', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/sprints-km-dark-${info.project.name}.png`, fullPage: true, animations: 'disabled' });
});

test('older saved workspaces gain an empty sprint collection without losing tasks', async ({ page }) => {
  await page.goto('/tasks');
  const before = await savedState(page);
  await page.evaluate(() => {
    const key = 'anumat-hackathon-v1';
    const root = JSON.parse(localStorage.getItem(key)!);
    for (const space of Object.values(root.spaces) as Array<{ sprints?: unknown[] }>) delete space.sprints;
    localStorage.setItem(key, JSON.stringify(root));
  });
  await page.reload();
  const after = await savedState(page);
  expect(after.sprints).toEqual([]);
  expect(after.tasks.map((task: { id: string }) => task.id)).toEqual(before.tasks.map((task: { id: string }) => task.id));
});
