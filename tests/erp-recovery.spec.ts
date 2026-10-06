import { expect, type Locator, type Page } from '@playwright/test';
import { action, actor, choose, create, open, save, seed, state, test } from './helpers/erp';

// Discover controls through real Tab navigation; never move focus programmatically.
async function tabTo(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  for (let count = 0; count < 120; count++) {
    if (await target.evaluate(element => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Control is not reachable with Tab: ${target}`);
}
async function activate(page: Page, target: Locator) {
  await tabTo(page, target);
  await page.keyboard.press('Enter');
}
async function type(page: Page, label: string, value: string) {
  await tabTo(page, page.getByRole('textbox', { name: label, exact: true }));
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(value);
}
async function keyboardAction(page: Page, name: string) {
  await activate(page, page.getByRole('button', { name, exact: true }));
  const dialog = page.getByRole('dialog', { name, exact: true });
  await expect(dialog).toBeVisible();
  await type(page, 'Action reason', 'Evidence checked using the keyboard');
  await activate(page, dialog.getByRole('button', { name: 'Confirm action', exact: true }));
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test.setTimeout(90_000);
test.beforeEach(async ({ page }) => { await seed(page); });

test('ERP keyboard journey creates, submits, approves and cancels leave with retained history', async ({ page }) => {
  await page.goto('/employees?tab=leaves');
  await activate(page, page.getByRole('button', { name: 'Request leave', exact: true }).first());
  const editor = page.getByRole('dialog', { name: 'Request leave', exact: true });
  await expect(editor).toBeVisible();
  const employee = editor.getByRole('combobox', { name: 'Employee', exact: true });
  await activate(page, employee);
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('a');
  await expect(page.getByRole('option', { name: /Alex Tan/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(employee).toContainText('Alex Tan');
  await type(page, 'First day of leave', '2030-10-07');
  await type(page, 'Last day of leave', '2030-10-08');
  await type(page, 'Leave reason', 'Family appointment');
  await activate(page, editor.getByRole('button', { name: 'Create record', exact: true }));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const row = page.getByRole('button', { name: /Alex Tan · 2030-10-07/ });
  await activate(page, row); await keyboardAction(page, 'Submit for review');
  await activate(page, row); await keyboardAction(page, 'Approve');
  expect((await state(page)).hr.leaveLedger).toEqual([expect.objectContaining({ days: 2, kind: 'used' })]);
  await activate(page, row); await keyboardAction(page, 'Cancel');
  await page.reload();
  const data = await state(page);
  expect(data.hr.leaves[0]?.status).toBe('cancelled');
  expect(data.hr.leaveLedger.map(entry => entry.days)).toEqual([2, -2]);
  expect(data.hr.history.filter(event => event.collection === 'leaves').map(event => event.action)).toEqual(['created', 'submit', 'approve', 'cancel']);
});

test('ERP keyboard journey preserves a draft after an error and safely discards it with Escape', async ({ page }) => {
  await page.goto('/employees');
  await activate(page, page.getByRole('button', { name: 'Add employee', exact: true }));
  await type(page, 'Full name', 'Keyboard draft');
  await activate(page, page.getByRole('button', { name: 'Create record', exact: true }));
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Complete the required employee fields');
  await expect(page.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue('Keyboard draft');
  await page.keyboard.press('Escape');
  let discard = page.getByRole('dialog', { name: 'Discard unsaved changes?', exact: true });
  await activate(page, discard.getByRole('button', { name: 'Keep editing', exact: true }));
  await expect(page.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue('Keyboard draft');
  await page.keyboard.press('Escape');
  discard = page.getByRole('dialog', { name: 'Discard unsaved changes?', exact: true });
  await activate(page, discard.getByRole('button', { name: 'Discard changes', exact: true }));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add employee', exact: true })).toBeFocused();
  expect((await state(page)).hr.employees).toHaveLength(4);
});

test('ERP open employee draft detects another tab’s save and recovers without overwriting it', async ({ page, context }) => {
  await open(page, 'employees', 'hr-alex');
  await page.getByRole('textbox', { name: 'Position', exact: true }).fill('My unsaved promotion');
  await page.getByRole('textbox', { name: 'Change reason', exact: true }).fill('Draft for review');
  const other = await context.newPage();
  await open(other, 'employees', 'hr-alex');
  await other.getByRole('textbox', { name: 'Position', exact: true }).fill('Approved operations lead');
  await other.getByRole('textbox', { name: 'Change reason', exact: true }).fill('Approved in the other tab');
  await save(other, false);
  await expect(page.getByText('This record changed. Close and reopen it before trying again.', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Position', exact: true })).toHaveValue('My unsaved promotion');
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeDisabled();
  expect((await state(page)).hr.employees.find(employee => employee.id === 'hr-alex')).toMatchObject({ position: 'Approved operations lead', version: 2 });
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: 'Discard unsaved changes?', exact: true }).getByRole('button', { name: 'Discard changes', exact: true }).click();
  await open(page, 'employees', 'hr-alex');
  await expect(page.getByRole('textbox', { name: 'Position', exact: true })).toHaveValue('Approved operations lead');
  await page.getByRole('combobox', { name: 'Branch', exact: true }).fill('Siem Reap');
  await page.getByRole('textbox', { name: 'Change reason', exact: true }).fill('Reviewed the current revision before transferring');
  await save(page, false); await other.reload();
  expect((await state(other)).hr.employees.find(employee => employee.id === 'hr-alex')).toMatchObject({ position: 'Approved operations lead', branch: 'Siem Reap', version: 3 });
  expect((await state(other)).hr.history.filter(event => event.recordId === 'hr-alex')).toHaveLength(2);
});

test('ERP tabs editing different records preserve both saves and keep the original draft', async ({ page, context }) => {
  await open(page, 'employees', 'hr-alex');
  await page.getByRole('textbox', { name: 'Position', exact: true }).fill('Regional operations lead');
  await page.getByRole('textbox', { name: 'Change reason', exact: true }).fill('Approved promotion');
  const other = await context.newPage();
  await open(other, 'assets', 'hr-laptop'); await action(other, 'Send to maintenance');
  await expect(page.getByRole('textbox', { name: 'Position', exact: true })).toHaveValue('Regional operations lead');
  await save(page, false);
  await page.reload();
  const hr = (await state(page)).hr;
  expect(hr.assets.find(asset => asset.id === 'hr-laptop')?.status).toBe('maintenance');
  expect(hr.employees.find(employee => employee.id === 'hr-alex')?.position).toBe('Regional operations lead');
  expect(hr.history.filter(event => event.recordId === 'hr-laptop' && event.action === 'maintain')).toHaveLength(1);
});

test('ERP an open form loses write access when another tab downgrades its user', async ({ page, context }) => {
  await actor(page, 'Alex Tan');
  await open(page, 'employees', 'hr-alex');
  await page.getByRole('textbox', { name: 'Position', exact: true }).fill('Unapproved promotion');
  const other = await context.newPage();
  await actor(other, 'Dara Sok');
  await other.goto('/employees/people');
  await choose(other, 'App role for Alex Tan', 'Viewer');
  await expect(page.getByRole('dialog', { name: 'Alex Tan', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Position', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Complete offboarding', exact: true })).toHaveCount(0);
  expect((await state(page)).hr.employees.find(employee => employee.id === 'hr-alex')?.position).toBe('Operations Lead');
  expect((await state(page)).appMembers?.employees?.alex).toBe('viewer');
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).last().click();
  await expect(page.getByRole('button', { name: /^Account: Alex Tan/ })).toBeVisible();
});

test('ERP job description draft shows why an external revision prevents saving', async ({ page, context }) => {
  await page.goto('/recruitment?tab=positions&record=hr-position');
  await page.getByRole('textbox', { name: 'Job title', exact: true }).fill('My draft job title');
  const other = await context.newPage();
  await other.goto('/recruitment?tab=positions&record=hr-position');
  await other.getByRole('textbox', { name: 'Job title', exact: true }).fill('Approved coordinator title');
  await other.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(other.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('This record changed. Close and reopen it before continuing.', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Job title', exact: true })).toHaveValue('My draft job title');
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).last().click();
  await page.getByRole('button', { name: 'Approved coordinator title', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Job title', exact: true })).toHaveValue('Approved coordinator title');
  expect((await state(page)).hr.recruitment?.positions[0]?.version).toBe(2);
});

test('ERP tabs keep their selected company and preserve separate company records', async ({ page, context }) => {
  await open(page, 'employees', 'hr-alex');
  await page.getByRole('textbox', { name: 'Position', exact: true }).fill('Lotus regional lead');
  await page.getByRole('textbox', { name: 'Change reason', exact: true }).fill('Lotus promotion');
  const other = await context.newPage();
  await other.goto('/home');
  const workspace = other.getByRole('button', { name: /^Workspace:/ });
  if (!await workspace.isVisible()) await other.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await workspace.click();
  await other.getByRole('menuitem', { name: /Mekong Freight/ }).click();
  await other.goto('/home?app=employees');
  await other.getByRole('button', { name: /^Account:/ }).click();
  await other.getByRole('menuitem', { name: /Omar Haddad/ }).click();
  await other.getByRole('button', { name: 'Load HR examples', exact: true }).click();
  await open(other, 'assets', 'hr-laptop'); await action(other, 'Send to maintenance');
  await expect(page.getByRole('dialog', { name: 'Alex Tan', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Position', exact: true })).toHaveValue('Lotus regional lead');
  await save(page, false);
  await expect(other.getByRole('button', { name: /^Account: Omar Haddad/ })).toBeVisible();
  await expect(other.getByRole('button', { name: 'Team laptop', exact: true })).toBeVisible();
  const companies = await page.evaluate(() => JSON.parse(localStorage.getItem('anumat-hackathon-v1')!).spaces);
  expect(companies.lotus.hr.assets.find((asset: { id: string }) => asset.id === 'hr-laptop').status).toBe('available');
  expect(companies.mekong.hr.assets.find((asset: { id: string }) => asset.id === 'hr-laptop').status).toBe('maintenance');
  expect(companies.lotus.hr.employees.find((employee: { id: string }) => employee.id === 'hr-alex').position).toBe('Lotus regional lead');
  expect(companies.mekong.hr.employees.some((employee: { id: string }) => employee.id === 'hr-alex')).toBe(false);
});

test('ERP pending approval confirmation cannot replace a newer decision from another tab', async ({ page, context }) => {
  await create(page, 'leaves');
  await choose(page, 'Employee', /Alex Tan/);
  await page.getByRole('textbox', { name: 'First day of leave', exact: true }).fill('2030-10-07');
  await page.getByRole('textbox', { name: 'Last day of leave', exact: true }).fill('2030-10-08');
  await page.getByRole('textbox', { name: 'Leave reason', exact: true }).fill('Family appointment');
  await save(page);
  const leave = (await state(page)).hr.leaves[0]!;
  await open(page, 'leaves', leave.id); await action(page, 'Submit for review');
  await open(page, 'leaves', leave.id);
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Approve', exact: true });
  await confirmation.getByRole('textbox', { name: 'Action reason', exact: true }).fill('Ready to approve the revision I opened');
  const other = await context.newPage();
  await open(other, 'leaves', leave.id); await action(other, 'Decline');
  const newer = await state(other);
  await confirmation.getByRole('button', { name: 'Confirm action', exact: true }).click();
  await expect(confirmation.getByRole('alert')).toContainText('This record changed. Close and reopen it before trying again.');
  expect(await state(page)).toEqual(newer);
  await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).last().click();
  await open(page, 'leaves', leave.id);
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);
  await page.reload();
  const hr = (await state(page)).hr;
  expect(hr.leaves[0]?.status).toBe('declined');
  expect(hr.leaveLedger).toHaveLength(0);
  expect(hr.history.filter(event => event.recordId === leave.id).map(event => event.action)).toEqual(['created', 'submit', 'decline']);
});
