import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('uploaded PDF and image remain viewable after a request reload', async ({ page }) => {
  await page.goto('/processes');
  await page.getByRole('button', { name: 'New process' }).first().click();
  await page.goto('/requests/new');
  await page.getByRole('textbox', { name: 'Title' }).fill('File review');
  await page.locator('input[type="file"]').setInputFiles([
    'src/assets/documents/licence-quote-demo.pdf',
    'src/assets/documents/licence-quote-demo.png',
  ]);
  await expect(page.getByText('Files are saved in this browser only and can be viewed from the request.')).toBeVisible();
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page).toHaveURL(/\/requests\//);
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
