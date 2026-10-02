import { expect, test } from '@playwright/test';

for (const locale of ['en', 'km']) {
  for (const theme of ['light', 'dark']) {
    test(`shared page layouts fit the viewport in ${locale} ${theme}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(({ locale, theme }) => {
        localStorage.setItem('anumat-locale', locale);
        localStorage.setItem('anumat-theme', theme);
      }, { locale, theme });
      for (const route of ['/signin', '/welcome', '/pricing', '/requests', '/requests/new', '/approvals', '/processes', '/processes?tab=marketplace', '/settings/people', '/settings/notifications', '/insights', '/tasks', '/meetings', '/documents', '/surveys', '/support']) {
        await page.goto(route);
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const width = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: window.innerWidth }));
        expect(width.content, `${route} must fit ${locale} ${theme}`).toBeLessThanOrEqual(width.viewport);
      }
      expect(errors).toEqual([]);
    });
  }
}
