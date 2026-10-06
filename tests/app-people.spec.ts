import { expect, test, type Page } from '@playwright/test';
async function choose(page: Page, name: string, option: string) { await page.getByRole('combobox', { name, exact: true }).click(); await page.getByRole('option', { name: option, exact: true }).click(); }
async function invite(page: Page, email: string, role = 'Viewer') {
  await page.getByRole('button', { name: 'Invite member', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Invite member' });
  await dialog.getByRole('textbox', { name: 'Email address', exact: true }).fill(email);
  await choose(page, 'App role', role);
  await dialog.getByRole('button', { name: 'Create invitation', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Invitation ready' })).toBeVisible();
  return page.getByRole('textbox', { name: 'Invitation link', exact: true }).inputValue();
}
async function stored(page: Page) { return page.evaluate(() => { const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!); return root.spaces[root.active]; }); }

test('Tasks exposes its team; app admin permissions are independent and persistent', async ({ page }, info) => {
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'Task options', exact: true }).click();
  await page.getByRole('menuitem', { name: 'People & roles', exact: true }).click();
  await expect(page).toHaveURL(/\/tasks\/people$/);
  await choose(page, 'App role for Alex Tan', 'Admin');
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'App role for Alex Tan', exact: true })).toContainText('Admin');
  const state = await stored(page);
  expect(state.appMembers.tasks.alex).toBe('admin');
  expect(state.appMembers.approvals.alex).toBe('member');
  expect(state.people.find((person: { id: string }) => person.id === 'alex').access).toBe('member');
  await page.screenshot({ path: `test-results/app-people-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: /^Account:/ }).click();
  await page.getByRole('menuitem', { name: /Alex Tan/ }).click();
  await expect(page.getByRole('button', { name: 'Invite member', exact: true })).toBeVisible();
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'Task options' }).click();
  await expect(page.getByRole('menuitem', { name: 'Manage statuses', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.goto('/approvals/people');
  await expect(page.getByRole('button', { name: 'Invite member', exact: true })).toHaveCount(0);
  await expect(page.getByText('Only app admins can invite members or change app roles.')).toBeVisible();
});

test('invitation grants only the chosen app and Viewer cannot write work', async ({ page }, info) => {
  await page.goto('/tasks/people');
  const url = await invite(page, '  Observer@Example.com  ');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  const state = await stored(page);
  expect(state.appInvitations[0].email).toBe('observer@example.com');
  expect(state.people.some((person: { email?: string }) => person.email === 'observer@example.com')).toBe(false);
  await page.screenshot({ path: `test-results/app-invitations-${info.project.name}.png`, fullPage: true });
  await page.goto(url);
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Task Observer');
  await page.getByRole('button', { name: 'Accept invitation', exact: true }).click();
  await expect(page).toHaveURL(/\/home\?app=tasks$/);
  await page.goto('/tasks');
  await expect(page.getByRole('button', { name: 'New task', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Manage statuses', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Task options', exact: true }).click();
  await page.getByRole('menuitem', { name: 'People & roles', exact: true }).click();
  await expect(page.getByRole('main').getByText('Task Observer (you)', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Invite member', exact: true })).toHaveCount(0);
  await page.goto('/meetings');
  await expect(page.getByRole('heading', { name: 'You do not have access to this app' })).toBeVisible();
  await page.goto('/home?app=surveys');
  await expect(page.getByRole('heading', { name: 'You do not have access to this app' })).toBeVisible();
  await page.goto('/requests');
  await expect(page.getByRole('heading', { name: 'You do not have access to this app' })).toBeVisible();
  const accepted = await stored(page);
  expect(accepted.appMembers.tasks[accepted.meId]).toBe('viewer');
  expect(accepted.appMembers.meetings[accepted.meId]).toBeUndefined();
  expect(accepted.appInvitations[0].status).toBe('accepted');
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Accept invitation', exact: true })).toHaveCount(0);
});

test('duplicate invitations, revocation and unfinished responsibilities are protected', async ({ page }) => {
  await page.goto('/tasks/people');
  const state = await stored(page);
  const task = state.tasks.find((task: { ownerId: string }) => task.ownerId !== state.meId);
  const person = state.people.find((person: { id: string }) => person.id === task.ownerId);
  await choose(page, `App role for ${person.name}`, 'Viewer');
  await expect(page.getByText('Reassign this person’s unfinished work before making them a Viewer or removing access.', { exact: true })).toBeVisible();
  const url = await invite(page, 'pending@example.com', 'Member');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Invite member', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address', exact: true }).fill('PENDING@example.com');
  await page.getByRole('button', { name: 'Create invitation', exact: true }).click();
  await expect(page.getByText('A pending invitation already exists for this email.')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Revoke invitation', exact: true }).click();
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Accept invitation', exact: true })).toHaveCount(0);
});

test('removing and restoring a workspace person changes only this app and its assignee options', async ({ page }) => {
  await page.goto('/tasks/people');
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    const state = root.spaces[root.active];
    state.people.push({ id: 'colleague', name: 'Workspace Colleague', email: 'colleague@example.com', access: 'member', department: 'Operations', role: 'Team member' });
    state.appMembers.tasks.colleague = 'member'; state.appMembers.meetings.colleague = 'member';
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  });
  await page.reload();
  const state = await stored(page);
  const person = state.people.find((person: { id: string; access: string }) => person.id !== state.meId && person.access !== 'owner' && !state.tasks.some((task: { ownerId: string; assignedById?: string; status: string }) => state.taskStatuses.find((status: { id: string }) => status.id === task.status).category !== 'done' && (task.ownerId === person.id || task.assignedById === person.id)));
  const row = page.getByRole('main').getByRole('listitem').filter({ has: page.getByText(person.name, { exact: true }) });
  await row.getByRole('button', { name: 'Remove access', exact: true }).click();
  await page.getByRole('dialog', { name: 'Remove app access?' }).getByRole('button', { name: 'Remove access', exact: true }).click();
  expect((await stored(page)).appMembers.tasks[person.id]).toBeUndefined();
  expect((await stored(page)).appMembers.meetings[person.id]).toBeDefined();
  await page.getByRole('button', { name: 'Invite member', exact: true }).click();
  await page.getByRole('tab', { name: 'Workspace person', exact: true }).click();
  await choose(page, 'Workspace person', person.name);
  await choose(page, 'App role', 'Viewer');
  await page.getByRole('button', { name: 'Add to app', exact: true }).click();
  expect((await stored(page)).appMembers.tasks[person.id]).toBe('viewer');
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await page.getByRole('dialog', { name: 'New task' }).getByRole('combobox', { name: 'Owner', exact: true }).click();
  await expect(page.getByRole('option', { name: person.name, exact: true })).toHaveCount(0);
});

test('app team and invite dialog fit Khmer dark mode with shared controls', async ({ page }, info) => {
  await page.addInitScript(() => { localStorage.setItem('anumat-locale', 'km'); localStorage.setItem('anumat-theme', 'dark'); });
  await page.goto('/tasks/people');
  await page.getByRole('button', { name: 'អញ្ជើញសមាជិក', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/app-team-km-dark-${info.project.name}.png`, animations: 'disabled' });
});
