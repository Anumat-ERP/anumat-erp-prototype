import { expect, test } from '@playwright/test';

test('account menu works by keyboard and restores trigger focus', async ({
  page,
}) => {
  await page.goto('/home');
  const trigger = page.getByRole('button', { name: /^Account:/ });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /Dara Sok/ })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: /Alex Tan/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('menuitem', { name: /Alex Tan/ }).click();
  await expect(
    page.getByRole('button', { name: /^Account: Alex Tan/ }),
  ).toBeVisible();
});

test('dark theme, Khmer and mobile navigation stay usable', async ({
  page,
}, testInfo) => {
  await page.goto('/home');
  await page.getByRole('button', { name: /^Account:/ }).click();
  await page.getByRole('menuitem', { name: 'Dark theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page
    .getByRole('combobox', { name: 'Language', exact: true })
    .click();
  await page.getByRole('option', { name: 'ខ្មែរ' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'km');
  if (testInfo.project.name === 'mobile') {
    await page
      .getByRole('button', { name: 'បើកការរុករក', exact: true })
      .click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await sheet.locator('a[href="/requests"]').click();
    await expect(page).toHaveURL('/requests');
    await expect(sheet).not.toBeVisible();
  }
  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth,
  );
  expect(overflow).toBe(false);
  const utilities = await page.locator('.an-utilities').boundingBox();
  expect(utilities!.x + utilities!.width).toBeLessThanOrEqual(testInfo.project.use.viewport!.width);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('lang', 'km');
});

test('task owner select exposes grouped choices and supports keyboard dismissal', async ({ page }) => {
  await page.goto('/tasks');
  const owner = page.getByRole('combobox', { name: 'Whose tasks' });
  await owner.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await expect(page.getByRole('option', { name: 'Priya Shah' })).toBeVisible();
  await page.getByRole('option', { name: 'Priya Shah' }).click();
  await expect(owner).toContainText('Priya Shah');
  await owner.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).not.toBeVisible();
  await expect(owner).toBeFocused();
});

test('all prototype routes render without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of [
    '/',
    '/signin',
    '/welcome',
    '/pricing',
    '/home',
    '/requests',
    '/approvals',
    '/processes',
    '/processes?tab=marketplace',
    '/settings/people',
    '/settings/notifications',
    '/insights',
    '/tasks',
    '/meetings',
    '/documents',
    '/surveys',
    '/support',
    '/telegram',
  ]) {
    await page.goto(route);
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page.getByRole('heading').first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('page actions and workspace utilities remain separately clickable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Mobile utilities use a separate header.');
  for (const width of [1440, 1100, 900]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/requests');
    const action = await page.getByRole('button', { name: 'New request', exact: true }).boundingBox();
    const tools = await page.locator('.an-utilities').boundingBox();
    expect(action).not.toBeNull();
    expect(tools).not.toBeNull();
    const overlaps = action!.x < tools!.x + tools!.width && action!.x + action!.width > tools!.x && action!.y < tools!.y + tools!.height && action!.y + action!.height > tools!.y;
    expect(overlaps).toBe(false);
  }
});

test('workspace setup creates a workspace without starter processes', async ({ page }) => {
  await page.goto('/welcome');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText(/Enter your company’s name. You can change it later\./)).toBeVisible();
  await page.getByRole('textbox', { name: 'Company name', exact: false }).fill('Quay Operations');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText(/No approval processes yet/)).toBeVisible();
  await page.getByRole('button', { name: 'Create workspace', exact: true }).click();
  await expect(page).toHaveURL(/\/discover$/);
  await page.reload();
  const saved = await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    return root.spaces[root.active];
  });
  expect(saved.org.name).toBe('Quay Operations');
  expect(saved.processes).toHaveLength(0);
  expect(saved.requests).toHaveLength(0);
});

test('login validates fields, reveals password, verifies code and remembers only email', async ({ page }) => {
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByText(/Enter the email you use for work/)).toBeVisible();
  await page.getByRole('textbox', { name: 'Email address' }).fill('alex@example.com');
  await page.getByLabel(/^Password/).fill('demo-password');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.getByLabel(/^Password/)).toHaveAttribute('type', 'text');
  await page.getByRole('checkbox', { name: 'Remember me' }).check();
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('heading', { name: /6-digit code/ })).toBeFocused();
  await page.getByRole('textbox', { name: 'Digit 1 of 6' }).fill('999999');
  await page.getByRole('button', { name: 'Verify code', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Wrong verification code');
  await page.getByRole('textbox', { name: 'Digit 1 of 6' }).fill('123456');
  await page.getByRole('button', { name: 'Verify code', exact: true }).click();
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByRole('heading', { name: 'What would you like to work on?' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('anumat-demo-email'))).toBe('alex@example.com');
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('demo-password');
  await page.goto('/signin');
  await expect(page.getByRole('textbox', { name: 'Email address' })).toHaveValue('alex@example.com');
  await expect(page.getByLabel(/^Password/)).toHaveValue('');
});

test('recovery validates confirmation and returns to demo login', async ({ page }) => {
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Forgot password?', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('priya@example.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText(/This prototype sends no email/)).toBeVisible();
  await page.getByRole('button', { name: 'Open demo reset link' }).click();
  await page.getByLabel(/^New password/).fill('demo-reset-password');
  await page.getByLabel(/^Confirm password/).fill('mismatch');
  await page.getByRole('button', { name: 'Reset password', exact: true }).click();
  await expect(page.getByText(/The passwords do not match/)).toBeVisible();
  await page.getByLabel(/^Confirm password/).fill('demo-reset-password');
  await page.getByRole('button', { name: 'Reset password', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re ready to log in' })).toBeVisible();
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back!' })).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('demo-reset-password');
});

test('SSO demo supports code paste, replacement and keyboard correction', async ({ page }) => {
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Log in with SSO', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('sokha@example.com');
  await page.getByRole('button', { name: 'Continue with SSO' }).click();
  const first = page.getByRole('textbox', { name: 'Digit 1 of 6' });
  await first.evaluate(element => {
    const clipboardData = new DataTransfer(); clipboardData.setData('text', '123 456');
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
  });
  await expect(page.getByRole('textbox', { name: 'Digit 6 of 6' })).toHaveValue('6');
  await page.getByRole('textbox', { name: 'Digit 6 of 6' }).press('Backspace');
  await page.getByRole('textbox', { name: 'Digit 6 of 6' }).press('Backspace');
  await expect(page.getByRole('textbox', { name: 'Digit 5 of 6' })).toBeFocused();
  await page.getByRole('textbox', { name: 'Digit 5 of 6' }).fill('56');
  await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByRole('button', { name: /^Account: Sokha/ })).toBeVisible();
});
