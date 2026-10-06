import { expect, test } from '@playwright/test';

test('welcome plays once, retains app navigation and pauses offscreen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/discover');
  const motion = page.locator('.an-welcome-motion');
  await expect(motion).toHaveAttribute('data-motion-status', 'playing');
  await expect(motion.locator('svg')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(motion).toHaveAttribute('data-motion-status', 'paused');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(motion).toHaveAttribute('data-motion-status', 'complete', { timeout: 8000 });
  await expect(page.getByRole('link').filter({ has: page.getByText('Tasks', { exact: true }) })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('reduced motion keeps artwork and does not request player or animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const loaded: string[] = []; page.on('request', request => loaded.push(request.url()));
  await page.goto('/discover');
  const motion = page.locator('.an-welcome-motion');
  await expect(motion).toHaveAttribute('data-motion-status', 'static');
  await expect(motion.locator('img')).toBeVisible();
  await expect(motion.locator('svg')).toHaveCount(0);
  expect(loaded.filter(url => /lottie_light|assets\/animations\/workspace-folder/.test(url))).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(motion).toHaveAttribute('data-motion-status', 'playing');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(motion.locator('img')).toBeVisible();
  await expect(motion.locator('svg')).toHaveCount(0);
});

test('failed animation load preserves banner artwork and navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/src/assets/animations/workspace-folder.json*', route => route.abort());
  await page.goto('/discover');
  const motion = page.locator('.an-welcome-motion');
  await expect(motion).toHaveAttribute('data-motion-status', 'fallback');
  await expect(motion.locator('img')).toBeVisible();
  await page.getByRole('link').filter({ has: page.getByText('Tasks', { exact: true }) }).click();
  await expect(page.getByRole('heading', { name: 'Tasks dashboard' })).toBeVisible();
});
