import { expect, test } from '@playwright/test';

test('task filters separate common scope from optional filters and clear the empty result', async ({ page }, info) => {
  await page.goto('/tasks');
  await expect(page.getByRole('combobox', { name: 'Priority filter', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'More filters' }).click();
  await page.getByRole('combobox', { name: 'Priority filter', exact: true }).click();
  await page.getByRole('option', { name: 'Highest', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No tasks match' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Whose tasks' })).toContainText('Everyone');
  await expect(page.getByRole('combobox', { name: 'Priority filter', exact: true })).toContainText('All priorities');
  await page.getByRole('button', { name: 'More filters' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/task-filters-${info.project.name}.png`, fullPage: true });
});

test('process forms have working conditional preview and preserve dependent rules', async ({ page }, info) => {
  await page.goto('/processes');
  await page.getByRole('button', { name: 'New process' }).first().click();
  const editorUrl = page.url();
  await page.evaluate(() => {
    const key = 'anumat-hackathon-v1';
    const root = JSON.parse(localStorage.getItem(key)!);
    const process = root.spaces[root.active].processes.at(-1);
    process.fields = [
      { id: 'travel', kind: 'yesno', label: 'Travel required?', required: true },
      { id: 'destination', kind: 'text', label: 'Destination', required: true, showIf: { fieldId: 'travel', equals: 'Yes', op: 'is' } },
    ];
    process.steps.push({ id: 'travel-review', name: 'Travel review', role: 'Manager', approverId: process.steps[0].approverId, slaHours: 24, when: { fieldId: 'travel', equals: 'Yes', op: 'is' } });
    localStorage.setItem(key, JSON.stringify(root));
  });
  await page.goto(editorUrl);
  await page.getByRole('tab', { name: 'Request form', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Move “Travel required?” down', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Move “Destination” up', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Delete “Travel required?”', exact: true }).click();
  const warning = page.getByRole('dialog', { name: 'Remove dependent display rules?' });
  await expect(warning).toBeVisible();
  await warning.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Question', exact: true })).toHaveCount(2);
  await page.getByRole('tab', { name: 'Preview & check' }).click();
  await expect(page.getByText('Configuration checks passed')).toBeVisible();
  await expect(page.getByRole('textbox', { name: /Destination/ })).toHaveCount(0);
  await expect(page.getByText('1 of 2 steps run', { exact: false })).toBeVisible();
  await page.getByRole('radio', { name: 'Yes', exact: true }).click();
  await expect(page.getByRole('textbox', { name: /Destination/ })).toBeVisible();
  await expect(page.getByText('2 of 2 steps run', { exact: false })).toBeVisible();
  await page.getByRole('textbox', { name: /Destination/ }).fill('Siem Reap');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `test-results/process-preview-${info.project.name}.png`, fullPage: true });
  await page.getByRole('tab', { name: /Approval steps/ }).click();
  await page.getByRole('textbox', { name: 'Respond within' }).first().fill('0');
  await page.getByRole('tab', { name: 'Preview & check' }).click();
  await expect(page.getByText('Step 1: enter a response time greater than zero.')).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Preview & check' }).click();
  await expect(page.getByRole('textbox', { name: /Destination/ })).toHaveCount(0);
});

test('survey search and status filters show recoverable empty results', async ({ page }, info) => {
  await page.goto('/surveys/new');
  await page.getByRole('button', { name: /Training feedback/ }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Quarterly training review');
  await page.getByRole('button', { name: 'Save draft', exact: true }).first().click();
  await expect(page).toHaveURL(/\/surveys$/);
  await page.getByRole('searchbox', { name: 'Search surveys', exact: true }).fill('Quarterly');
  await expect(page.getByRole('link', { name: 'Quarterly training review', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Survey status' }).click();
  await page.getByRole('option', { name: 'Open', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No surveys match' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Quarterly training review', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/survey-filters-${info.project.name}.png`, fullPage: true });
});

test('discover opens four collaboration apps and eight HR prototypes', async ({ page }) => {
  await page.goto('/discover');
  for (const name of ['Assets management', 'Report management', 'Attendance management', 'Employee management', 'Payroll management', 'Performance management', 'Training management', 'Recruitment management']) {
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
  await expect(page.getByText('Open prototype', { exact: true })).toHaveCount(8);
  await expect(page.locator('.an-catalog-app').filter({ hasText: 'Open prototype' })).toHaveCount(8);
});


test('preview date validation does not block saving the process definition', async ({ page }) => {
  await page.goto('/processes');
  await page.getByRole('button', { name: 'New process' }).first().click();
  await page.getByRole('tab', { name: 'Request form', exact: true }).click();
  await page.getByRole('button', { name: 'Add field', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Date', exact: true }).click();
  await page.getByRole('textbox', { name: 'Question', exact: true }).fill('Travel date');
  await page.getByRole('tab', { name: 'Preview & check' }).click();
  await page.getByRole('textbox', { name: 'Travel date', exact: true }).fill('2026-02-30');
  await page.getByRole('button', { name: 'Save process', exact: true }).first().click();
  await page.reload();
  await page.getByRole('tab', { name: 'Request form', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Question', exact: true })).toHaveValue('Travel date');
});
