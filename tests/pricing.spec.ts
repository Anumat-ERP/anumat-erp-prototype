import { expect, test } from '@playwright/test';

test('pricing offers the pilot and working deployment actions', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Run Anumat where your data needs to live.');
  await expect(page.locator('.an-pricing-plans > li')).toHaveCount(3);
  await expect(page.locator('.an-plan-price').first()).toContainText('$0');
  await page.getByRole('button', { name: 'Contact sales about Your own cloud' }).click();
  await expect(page.getByRole('combobox', { name: 'Where do you want to run Anumat?' })).toContainText('Your own cloud');
  await expect(page.getByRole('textbox', { name: 'Your name' })).toBeFocused();
  await page.getByRole('button', { name: 'Contact sales', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Your name' })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Enter your name.', { exact: false })).toBeVisible();
  await page.getByRole('textbox', { name: 'Your name' }).fill('Pricing Reviewer');
  await page.getByRole('textbox', { name: 'Work email' }).fill('reviewer@example.com');
  await page.getByRole('textbox', { name: 'Company', exact: true }).fill('Review Company');
  await page.getByRole('button', { name: 'Contact sales', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Thanks, Pricing.' })).toBeVisible();
  await page.getByRole('button', { name: 'Contact sales about On-premise' }).click();
  await expect(page.getByRole('combobox', { name: 'Where do you want to run Anumat?' })).toContainText('On-premise');
  await page.getByRole('link', { name: 'Start free', exact: true }).click();
  await expect(page).toHaveURL(/\/welcome$/);
});

test('pricing comparison and FAQ explain the pilot', async ({ page }) => {
  await page.goto('/pricing');
  await page.getByRole('link', { name: 'Compare deployments' }).click();
  await expect(page).toHaveURL(/#compare-deployments$/);
  await expect(page.getByRole('region', { name: 'How the deployment options compare' })).toBeVisible();
  const question = page.getByRole('button', { name: 'How does pricing work after the pilot?' });
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Pricing will be agreed with pilot companies before the pilot ends. Contact us to discuss your company, deployment needs and a plan that fits.')).toBeVisible();
});

test('pricing cards align actions on desktop', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/pricing');
  await page.evaluate(() => document.fonts.ready);
  const positions = await page.locator('.an-plan-action').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().top));
  expect(Math.max(...positions) - Math.min(...positions)).toBeLessThanOrEqual(2);
});
