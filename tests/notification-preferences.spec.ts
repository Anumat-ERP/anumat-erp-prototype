import { expect, test } from '@playwright/test';

test('personal channels persist, stay separate between users, and preserve preferences on disconnect', async ({ page }, info) => {
  await page.goto('/settings/notifications');
  await expect(page.getByRole('checkbox', { name: 'Task updates in app', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Task updates by Email', exact: true })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Notification email' }).fill('dara.notify@example.com');
  await page.getByRole('button', { name: 'Save email', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Task updates by Email', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Task updates in app', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Set up Telegram preview', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Set up Telegram preview' });
  await modal.getByRole('textbox', { name: 'Your Telegram username' }).fill('dara_updates');
  await modal.getByRole('button', { name: 'Save preview', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Surveys to answer by Telegram', exact: true }).check();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Task updates by Email', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Task updates in app', exact: true })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Surveys to answer by Telegram', exact: true })).toBeChecked();
  await page.getByRole('button', { name: /^Account:/ }).click();
  await page.getByRole('menuitem', { name: /Alex Tan/ }).click();
  await expect(page.getByRole('textbox', { name: 'Notification email' })).toHaveValue('');
  await expect(page.getByRole('checkbox', { name: 'Task updates in app', exact: true })).toBeChecked();
  await page.getByRole('button', { name: /^Account:/ }).click();
  await page.getByRole('menuitem', { name: /Dara Sok/ }).click();
  await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Notification email' })).toHaveValue('dara.notify@example.com');
  await expect(page.getByRole('checkbox', { name: 'Task updates by Email', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Task updates in app', exact: true })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Surveys to answer by Telegram', exact: true })).not.toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `test-results/notification-preferences-${info.project.name}.png`, fullPage: true });
});

test('the bell includes task and meeting events and respects per-event in-app choices', async ({ page }) => {
  await page.goto('/settings/notifications');
  await page.evaluate(() => {
    const key = 'anumat-hackathon-v1'; const root = JSON.parse(localStorage.getItem(key)!); const state = root.spaces[root.active];
    const at = new Date().toISOString();
    state.tasks[0] = { ...state.tasks[0], title: 'Notification sign-off fixture', ownerId: 'alex', assignedById: 'dara', signOffRequestedAt: at };
    state.meetings[0] = { ...state.meetings[0], title: 'Notification meeting fixture', organizerId: 'alex', attendeeIds: ['dara'], createdAt: at };
    state.notificationPrefs.dara = { events: { approvals: [], requestUpdates: [], tasks: [], meetings: [] } };
    localStorage.setItem(key, JSON.stringify(root));
  });
  await page.reload();
  await page.getByRole('button', { name: /^Notifications(?:,|$)/ }).click();
  await expect(page.getByRole('link', { name: /Notification sign-off fixture/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Notification meeting fixture/ })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.keyboard.press('Escape');
  await page.getByRole('checkbox', { name: 'Task updates in app', exact: true }).uncheck();
  await page.getByRole('button', { name: /^Notifications(?:,|$)/ }).click();
  await expect(page.getByRole('link', { name: /Notification sign-off fixture/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Notification meeting fixture/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Set up Telegram preview', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save preview', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Task updates by Telegram', exact: true }).check();
  await page.getByRole('button', { name: 'Open Telegram preview', exact: true }).click();
  await expect(page.getByText('finished “Notification sign-off fixture” and asked you to sign off', { exact: false })).toBeVisible();

});

test('settings hides inaccessible apps and translates channel choices', async ({ page }, info) => {
  await page.goto('/settings/notifications');
  await page.evaluate(() => {
    const key = 'anumat-hackathon-v1'; const root = JSON.parse(localStorage.getItem(key)!); const state = root.spaces[root.active];
    state.meId = 'alex'; delete state.appMembers.surveys.alex;
    localStorage.setItem(key, JSON.stringify(root));
    localStorage.setItem('anumat-locale', 'km'); localStorage.setItem('anumat-theme', 'dark');
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'ការស្ទង់មតិដែលត្រូវឆ្លើយ', exact: true })).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: 'ការធ្វើបច្ចុប្បន្នភាពកិច្ចការ ក្នុងកម្មវិធី', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/notification-preferences-km-${info.project.name}.png`, fullPage: true });
});
