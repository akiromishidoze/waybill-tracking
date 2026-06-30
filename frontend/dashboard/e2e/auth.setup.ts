import { test as setup, expect } from '@playwright/test'

export const STORAGE_STATE = 'e2e/.auth/user.json'

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('h1')).toContainText('Sign In')

  await page.locator('label', { hasText: 'Email' }).locator('..').locator('input').fill('admin@waybilltrack.com')
  await page.locator('label', { hasText: 'Password' }).locator('..').locator('input').fill('teccadmin00')
  await page.getByRole('button', { name: 'Sign In' }).click()

  await page.waitForURL('/dashboard')
  await expect(page).toHaveURL('/dashboard')

  await page.context().storageState({ path: STORAGE_STATE })
})
