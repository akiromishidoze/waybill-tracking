import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/user.json' })

test.describe('Driver App workflow', () => {
  test('driver app page loads', async ({ page }) => {
    await page.goto('/driver-app')
    await expect(page.locator('h2')).toContainText(/driver app/i)
  })

  test('shows active deliveries section', async ({ page }) => {
    await page.goto('/driver-app')
    await expect(page.locator('text=/active deliveries/i')).toBeVisible()
  })

  test('shows recent scan events section', async ({ page }) => {
    await page.goto('/driver-app')
    await expect(page.locator('text=Recent Scan Events')).toBeVisible()
  })

  test('driver filter dropdown is present', async ({ page }) => {
    await page.goto('/driver-app')
    const select = page.locator('select').first()
    await expect(select).toBeVisible()
    const options = await select.locator('option').allTextContents()
    expect(options.length).toBeGreaterThanOrEqual(1)
    expect(options[0]).toMatch(/all drivers/i)
  })

  test('scan modal opens and requires location', async ({ page }) => {
    await page.goto('/driver-app')
    const scanBtn = page.getByRole('button', { name: /scan/i }).first()
    if (await scanBtn.isVisible()) {
      await scanBtn.click()
      await expect(page.locator('text=/record scan/i')).toBeVisible()

      const recordBtn = page.getByRole('button', { name: /record scan/i })
      await expect(recordBtn).toBeDisabled()

      await page.locator('input[placeholder*="location" i], input[placeholder*="Main St" i]').first().fill('Manila Hub')
      await expect(recordBtn).toBeEnabled()

      await page.getByRole('button', { name: /cancel/i }).click()
      await expect(page.locator('text=/record scan/i')).not.toBeVisible()
    }
  })

  test('completed deliveries section visible', async ({ page }) => {
    await page.goto('/driver-app')
    await expect(page.locator('text=/completed deliveries/i')).toBeVisible()
  })
})
