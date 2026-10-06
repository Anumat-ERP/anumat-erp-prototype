import { expect, test } from '@playwright/test';
test('reschedule and cancel retain history, release calendar time, and keep existing tasks', async ({
  page,
}) => {
  await page.goto('/meetings/ops-weekly');
  await page
    .getByRole('button', { name: 'Reschedule meeting', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Reschedule meeting',
    exact: true,
  });
  await dialog
    .getByRole('textbox', { name: 'Meeting date', exact: true })
    .fill('2026-12-01');
  await dialog
    .getByRole('textbox', { name: 'Action reason', exact: true })
    .fill('Move planning to December');
  await dialog
    .getByRole('button', { name: 'Confirm action', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Cancel meeting', exact: true })
    .click();
  const cancel = page.getByRole('dialog', {
    name: 'Cancel meeting',
    exact: true,
  });
  await cancel
    .getByRole('textbox', { name: 'Action reason', exact: true })
    .fill('Team unavailable');
  await cancel
    .getByRole('button', { name: 'Confirm action', exact: true })
    .click();
  await expect(
    page.getByText('Meeting cancelled', { exact: true }),
  ).toBeVisible();
  await page.getByText('Meeting history', { exact: true }).click();
  await expect(
    page.getByText('Move planning to December', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Record', exact: true }),
  ).toBeDisabled();
  const result = await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    const s = root.spaces[root.active];
    return {
      history: s.meetings.find((m: { id: string }) => m.id === 'ops-weekly')
        .history.length,
      tasks: s.tasks.filter(
        (t: { source?: { href: string } }) =>
          t.source?.href === '/meetings/ops-weekly',
      ).length,
    };
  });
  expect(result.history).toBe(2);
  expect(result.tasks).toBeGreaterThan(0);
  await page.goto('/meetings');
  await expect(
    page.getByRole('heading', { name: 'Cancelled', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Operations weekly/ }),
  ).toBeVisible();
});

test('meeting request picker and source query do not expose an inaccessible approval app', async ({
  page,
}) => {
  await page.goto('/meetings/new');
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    const state = root.spaces[root.active];
    state.meId = 'lina';
    delete state.appMembers.approvals.lina;
    state.requests.push({
      id: 'private-request',
      title: 'Restricted acquisition request',
      status: 'pending',
      requesterId: 'dara',
      steps: [],
      department: 'Operations',
      description: '',
      attachments: [],
      activity: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  });
  await page.goto('/meetings/new?request=private-request');
  await expect(
    page.getByRole('textbox', { name: 'Title', exact: true }),
  ).toHaveValue('');
  await page.getByRole('combobox', { name: /About a request/ }).click();
  await expect(
    page.getByRole('option', { name: /Restricted acquisition request/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('option', { name: 'No request', exact: true }),
  ).toBeVisible();
});
