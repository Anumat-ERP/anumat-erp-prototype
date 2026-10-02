import { expect, test } from '@playwright/test';

test('workspaces start without templates, requests, or approvals', async ({ page }) => {
  await page.goto('/requests');
  await expect(page.locator('tbody tr')).toHaveCount(0);
  await page.goto('/approvals');
  await expect(page.getByRole('heading', { name: 'All caught up' })).toBeVisible();
  await page.goto('/processes');
  await expect(page.getByRole('heading', { name: 'No approval processes yet' })).toBeVisible();
  await page.getByRole('tab', { name: 'Templates' }).click();
  await expect(page.getByRole('heading', { name: 'No templates available' })).toBeVisible();
  await page.goto('/requests/new');
  await expect(page.getByRole('heading', { name: 'No request types yet' })).toBeVisible();
});

test('older browser data drops starter workflow but keeps user-created work', async ({ page }) => {
  await page.goto('/home');
  await page.evaluate(() => {
    const key = 'anumat-hackathon-v1';
    const root = JSON.parse(localStorage.getItem(key)!);
    const space = root.spaces[root.active];
    const request = {
      id: 'PR-1042', type: 'purchase', title: 'Old starter request', requesterId: 'dara',
      department: 'Operations', description: '', status: 'pending', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), steps: [], attachments: [], activity: [],
    };
    space.requests.push(request, { ...request, id: 'PR-user-created', title: 'My own request' });
    space.processes.push(
      { id: 'proc-purchase', name: 'Old starter process', requestType: 'purchase', active: true, steps: [] },
      { id: 'preset-installed', presetId: 'vendor', name: 'Installed template', requestType: 'vendor', active: true, steps: [] },
      { id: 'proc-user-created', name: 'My own process', requestType: 'mine', active: true, steps: [] },
    );
    localStorage.setItem(key, JSON.stringify(root));
  });
  await page.reload();
  const saved = await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    const space = root.spaces[root.active];
    return { requests: space.requests.map((request: { id: string }) => request.id), processes: space.processes.map((process: { id: string }) => process.id) };
  });
  expect(saved.requests).toEqual(['PR-user-created']);
  expect(saved.processes).toEqual(['preset-installed', 'proc-user-created']);
});

test('a new process still lets the team submit a request for approval', async ({ page }, testInfo) => {
  await page.goto('/processes');
  await page.getByRole('button', { name: 'New process' }).first().click();
  await expect(page).toHaveURL(/\/processes\/proc-/);
  await page.goto('/requests/new');
  await expect(page.getByRole('heading', { name: 'New request' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Title' }).fill('New equipment');
  await page.getByRole('textbox', { name: 'Amount' }).fill('125');
  await page.getByRole('textbox', { name: 'Description' }).fill('Equipment needed for the team.');
  await page.getByRole('button', { name: 'Submit for approval' }).click();
  await expect(page.getByRole('heading', { name: 'New equipment' })).toBeVisible();
  await page.goto('/approvals');
  if (testInfo.project.name === 'mobile') {
    await expect(page.getByRole('link', { name: /New equipment/ }).first()).toBeVisible();
  } else {
    await expect(page.getByRole('row', { name: /New equipment/ })).toBeVisible();
  }
});
