import { expect, test } from '@playwright/test';

test('first sign-in opens modules; later sign-ins open dashboard', async ({ page }, testInfo) => {
  const signIn = async () => {
    await page.goto('/signin');
    await page.getByRole('textbox', { name: 'Email address' }).fill('alex@example.com');
    await page.getByLabel(/^Password/).fill('demo-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.getByRole('textbox', { name: 'Digit 1 of 6' }).fill('123456');
    await page.getByRole('button', { name: 'Verify code' }).click();
  };
  await signIn();
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByRole('heading', { name: 'What would you like to work on?' })).toBeVisible();
  // Alex has collaboration access; HR apps explain why they cannot be opened.
  await expect(page.locator('.an-catalog-locked')).toHaveCount(8);
  await expect(page.locator('.an-catalog-locked').getByRole('link')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Requests & approvals.*Open app/ })).toBeVisible();
  await page.getByRole('link', { name: /Tasks.*Open app/ }).click();
  await expect(page).toHaveURL(/\/home\?app=tasks$/);
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'Explore modules' }).click();
  await expect(page).toHaveURL(/\/discover$/);
  await signIn();
  await expect(page).toHaveURL(/\/home\?app=tasks$/);
});
