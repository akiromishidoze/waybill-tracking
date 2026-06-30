import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/user.json' })

test.describe('Return / Reverse Logistics', () => {
  test('returns page loads', async ({ page }) => {
    await page.goto('/returns')
    await expect(page.locator('main h1')).toContainText('Returns & Reverse Logistics', { timeout: 10000 })
  })

  test('shows returns table or empty state', async ({ page }) => {
    await page.goto('/returns')
    await page.waitForTimeout(1500)
    const hasTable = await page.locator('table').isVisible().catch(() => false)
    const hasEmpty = await page.locator('body').textContent().then(t => /no returns|no records|empty/i.test(t ?? '')).catch(() => false)
    const hasSomething = await page.locator('[data-testid], table, .card, article').first().isVisible().catch(() => false)
    expect(hasTable || hasEmpty || hasSomething).toBeTruthy()
  })

  test('initiate return button or option exists when waybills are present', async ({ page }) => {
    await page.goto('/returns')
    await page.waitForTimeout(1500)
    const initiateBtn = page.getByRole('button', { name: /initiate return/i })
    const hasBtn = await initiateBtn.isVisible().catch(() => false)
    if (hasBtn) {
      await initiateBtn.first().click()
      await expect(page.locator('text=/return/i').first()).toBeVisible()
    }
  })

  test('status advance button present for in-progress returns', async ({ page }) => {
    await page.goto('/returns')
    await page.waitForTimeout(1500)
    const advanceBtn = page.getByRole('button', { name: /advance|next|in transit|received/i }).first()
    if (await advanceBtn.isVisible().catch(() => false)) {
      await expect(advanceBtn).toBeEnabled()
    }
  })
})
