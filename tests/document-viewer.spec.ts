import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('uploaded PDFs and images remain available after reloading the request', async ({ page }) => {
  await page.goto('/requests/new?demo=laptops');
  await page.locator('input[type="file"]').setInputFiles([
    'src/assets/documents/licence-quote-demo.pdf',
    'src/assets/documents/licence-quote-demo.png',
  ]);
  await expect(page.getByText('Files are saved in this browser only and can be viewed from the request.')).toBeVisible();
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page).toHaveURL(/\/requests\/PR-\d+$/);
  await page.reload();
  await page.getByRole('button', { name: 'View licence-quote-demo.pdf' }).click();
  const pdfViewer = page.getByRole('dialog');
  await expect(pdfViewer.locator('iframe')).toHaveAttribute('src', /^blob:/);
  const downloading = page.waitForEvent('download');
  await pdfViewer.getByRole('link', { name: 'Download file' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('licence-quote-demo.pdf');
  expect((await readFile((await download.path())!)).subarray(0, 8).toString()).toBe('%PDF-1.4');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'View licence-quote-demo.png' }).click();
  const image = page.getByRole('dialog').getByRole('img');
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
});

test('request attachment opens a readable sample, zooms, downloads and restores focus', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/requests/PR-1044');
  const view = page.getByRole('button', { name: 'View Licence_Quote.pdf' });
  await view.click();
  const viewer = page.getByRole('dialog', { name: 'Licence_Quote.pdf' });
  await expect(viewer).toBeVisible();
  const image = viewer.getByRole('img');
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
  await viewer.getByRole('button', { name: 'Zoom in' }).click();
  await expect(viewer.getByText('125%', { exact: true })).toBeVisible();
  await viewer.getByRole('button', { name: 'Fit to width' }).click();
  await expect(viewer.getByText('100%', { exact: true })).toBeVisible();
  await expect(viewer.getByRole('link', { name: 'Open PDF' })).toHaveAttribute('target', '_blank');
  const downloading = page.waitForEvent('download');
  await viewer.getByRole('link', { name: 'Download PDF' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('Licence_Quote_Demo.pdf');
  const path = await download.path();
  const content = await readFile(path!);
  expect(content.subarray(0, 8).toString()).toBe('%PDF-1.4');
  expect(content.toString()).toContain('Design software licences');
  await page.keyboard.press('Escape');
  await expect(viewer).toBeHidden();
  await expect(view).toBeFocused();
  expect(errors).toEqual([]);
});

test('attachments without file content have an honest fallback', async ({ page }) => {
  await page.goto('/requests/PR-1042');
  await page.getByRole('button', { name: 'View Laptop_Proposal.pdf' }).click();
  const viewer = page.getByRole('dialog', { name: 'Laptop_Proposal.pdf' });
  await expect(viewer.getByRole('heading', { name: 'No file content available' })).toBeVisible();
  await expect(viewer.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
});

test('viewer fits Khmer dark mode without horizontal page overflow', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('anumat-locale', 'km');
    localStorage.setItem('anumat-theme', 'dark');
  });
  await page.goto('/requests/PR-1044');
  await page.getByRole('button', { name: /Licence_Quote.pdf/ }).last().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const size = await page.getByRole('dialog').evaluate(node => ({ left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right, viewport: window.innerWidth }));
  expect(size.left).toBeGreaterThanOrEqual(0);
  expect(size.right).toBeLessThanOrEqual(size.viewport);
});
