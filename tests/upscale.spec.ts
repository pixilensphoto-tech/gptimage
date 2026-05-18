import { test, expect } from '@playwright/test';

const BASE_URL = 'https://gptimage.pixilens.app';

test('AI Upscale button creates placeholder in gallery', async ({ page }) => {
  // 1. Go to gallery
  await page.goto(`${BASE_URL}/images`);
  
  // Wait for images to load
  await page.waitForSelector('article', { timeout: 30000 });
  
  // 2. Find the first image with an AI Upscale button
  // We'll wait for the button specifically
  const upscaleButton = page.locator('button').filter({ hasText: /^AI Upscale$/ }).first();
  await upscaleButton.waitFor({ state: 'visible', timeout: 30000 });
  
  await page.screenshot({ path: 'tests/screenshots/before_click.png' });
  
  // 3. Click upscale
  await upscaleButton.click();
  
  await page.screenshot({ path: 'tests/screenshots/after_click.png' });
  
  // 4. Verify placeholder appears (it should be the first card now)
  // The placeholder usually has status "Queued AI upscale"
  const placeholder = page.locator('article').first();
  await expect(placeholder).toContainText(/Queued AI upscale|processing|succeeded|failed/i, { timeout: 30000 });
  
  const status = await placeholder.locator('.absolute.left-3.top-3').textContent();
  console.log(`Current status: ${status}`);
  
  if (status === 'failed') {
    const errorText = await placeholder.locator('p.text-red-200').textContent();
    console.error(`Upscale failed with error: ${errorText}`);
    throw new Error(`Upscale failed: ${errorText}`);
  }
  
  // 5. Verify it moves to "processing"
  await expect(placeholder).toContainText(/processing/i, { timeout: 60000 });
  
  await page.screenshot({ path: 'tests/screenshots/final.png' });
});
