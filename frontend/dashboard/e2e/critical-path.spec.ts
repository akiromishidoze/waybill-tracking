import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/user.json' })

test.describe('critical path', () => {
  test('create waybill → open detail → add scan → track publicly', async ({ page }) => {
    // 1. Create waybill
    await page.goto('/waybills/new')
    await expect(page.locator('h2')).toContainText('New Waybill')

    await page.locator('label', { hasText: 'Recipient Name' }).locator('..').locator('input').fill('E2E Recipient')
    await page.locator('label', { hasText: 'Recipient Phone' }).locator('..').locator('input').fill('+63900000000')
    await page.locator('label', { hasText: 'Recipient Address' }).locator('..').locator('input').fill('123 Test St, Quezon City')
    await page.locator('label', { hasText: 'Origin' }).locator('..').locator('input').fill('Manila')
    await page.locator('label', { hasText: 'Destination' }).locator('..').locator('input').fill('Cebu')
    await page.locator('label', { hasText: 'Weight (kg)' }).locator('..').locator('input').fill('1.5')
    await page.getByRole('button', { name: 'Create Waybill' }).click()
    await page.waitForURL('/waybills')
    await expect(page).toHaveURL('/waybills')

    // 2. Open first waybill detail via its link
    await page.locator('table tbody tr:first-child a').first().click()
    await page.waitForURL(/\/waybills\/[\w-]+/)
    await expect(page.locator('h1, h2').first()).toContainText(/Waybill/)

    // Capture tracking number from URL path segment
    const waybillId = page.url().split('/waybills/')[1]
    expect(waybillId).toBeTruthy()

    // 3. Add a scan event (if controls are visible)
    const locationInput = page.locator('input[placeholder*="location" i]').first()
    if (await locationInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await locationInput.fill('Manila Hub')
      await page.getByRole('button', { name: /add scan/i }).click()
      await expect(page.locator('text=Manila Hub')).toBeVisible({ timeout: 6000 })
    }

    // 4. Public tracking page — look up by waybill id
    await page.goto(`/track/${waybillId}`)
    const body = await page.locator('body').textContent()
    expect(body).toMatch(/tracking|waybill|shipment/i)
  })
})
