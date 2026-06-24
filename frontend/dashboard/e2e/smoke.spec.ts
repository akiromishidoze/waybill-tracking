import { test, expect } from '@playwright/test'

test('login page loads', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveTitle(/Waybill/i)
  await expect(page.locator('h1')).toContainText('Sign In')
})
