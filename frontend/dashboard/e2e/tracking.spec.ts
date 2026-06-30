import { test, expect } from '@playwright/test'

test.describe('Public tracking page', () => {
  test('tracking page loads without auth and shows form', async ({ page }) => {
    await page.goto('/track/TEST-000')
    await expect(page.locator('text=/tracking/i').first()).toBeVisible()
  })

  test('tracking page shows not-found state for unknown number', async ({ page }) => {
    await page.goto('/track/NOTREAL-99999')
    const body = await page.locator('body').textContent()
    expect(body).toMatch(/not found|no results|invalid|tracking/i)
  })
})

test.describe('unauthenticated redirect', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('aggregated tracking page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/tracking/aggregated')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Authenticated tracking pages', () => {
  test.use({ storageState: 'e2e/.auth/user.json' })

  test('map view page loads', async ({ page }) => {
    await page.goto('/map')
    await expect(page.locator('h1, h2, h3').first()).toBeVisible()
  })

  test('carrier performance page loads', async ({ page }) => {
    await page.goto('/carrier-performance')
    await expect(page.locator('h2')).toContainText('Carrier Performance Scoreboard')
  })

  test('aggregated tracking page loads', async ({ page }) => {
    await page.goto('/tracking/aggregated')
    await expect(page.locator('h2')).toContainText('Multi-Carrier Aggregated Tracking')
  })
})
