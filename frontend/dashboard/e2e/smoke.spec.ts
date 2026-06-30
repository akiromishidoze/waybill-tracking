import { test, expect } from '@playwright/test'

test('login page loads and shows sign in form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('h1')).toContainText('Sign In')
  await expect(page.locator('input[type="password"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
})

test.describe('authenticated smoke', () => {
  test.use({ storageState: 'e2e/.auth/user.json' })

  test('dashboard loads with KPI cards', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h2')).toBeVisible()
  })

  test('analytics page loads', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page.locator('main h2')).toContainText('KPI Dashboard')
  })

  test('unauthorized page shows access denied message', async ({ page }) => {
    await page.goto('/unauthorized')
    await expect(page.locator('body')).toContainText(/access|unauthorized|permission/i)
  })
})
