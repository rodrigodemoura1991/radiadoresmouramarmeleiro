const { test, expect } = require('@playwright/test');

test('aplicação abre sem erro de carregamento', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('./', { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();
  expect(errors, `Erros JavaScript: ${errors.join(' | ')}`).toEqual([]);
});

test('tela de login possui os controles principais', async ({ page }) => {
  await page.goto('./', { waitUntil: 'networkidle' });
  await expect(page.locator('#login')).toBeVisible();
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#pass')).toBeVisible();
});
