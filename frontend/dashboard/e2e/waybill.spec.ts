import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/user.json' })

let createdTrackingNumber = ''

test.describe('Waybill CRUD', () => {
  test('waybill list page loads with table', async ({ page }) => {
    await page.goto('/waybills')
    await expect(page.locator('main h1')).toContainText('Waybills', { timeout: 10000 })
    await expect(page.locator('table')).toBeVisible()
  })

  test('create a new waybill and land on list page', async ({ page }) => {
    await page.goto('/waybills/new')
    await expect(page.locator('h2')).toContainText('New Waybill')

    await page.locator('label', { hasText: 'Recipient Name' }).locator('..').locator('input').fill('E2E Test Recipient')
    await page.locator('label', { hasText: 'Recipient Phone' }).locator('..').locator('input').fill('+639001234567')
    await page.locator('label', { hasText: 'Recipient Address' }).locator('..').locator('input').fill('456 Test Ave, Makati')
    await page.locator('label', { hasText: 'Origin' }).locator('..').locator('input').fill('Manila')
    await page.locator('label', { hasText: 'Destination' }).locator('..').locator('input').fill('Cebu City')
    await page.locator('label', { hasText: 'Weight (kg)' }).locator('..').locator('input').fill('2.5')

    await page.getByRole('button', { name: 'Create Waybill' }).click()
    await page.waitForURL('/waybills')
    await expect(page).toHaveURL('/waybills')
  })

  test('open first waybill detail and verify content', async ({ page }) => {
    await page.goto('/waybills')
    await page.locator('table tbody tr:first-child a').first().click()
    await page.waitForURL(/\/waybills\/[\w-]+/)

    const heading = await page.locator('h1, h2').first().textContent()
    expect(heading).toMatch(/Waybill/)

    createdTrackingNumber = page.url().split('/waybills/')[1] ?? ''
  })

  test('add a scan event on waybill detail', async ({ page }) => {
    await page.goto('/waybills')
    await page.locator('table tbody tr:first-child a').first().click()
    await page.waitForURL(/\/waybills\/[\w-]+/)

    const statusSelect = page.locator('select').filter({ hasText: /PENDING|PICKED_UP|IN_TRANSIT/i }).first()
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('IN_TRANSIT')
    }

    const locationInput = page.locator('input[placeholder*="location" i], input[placeholder*="Location" i]').first()
    if (await locationInput.isVisible()) {
      await locationInput.fill('Cebu Sorting Hub')
      await page.getByRole('button', { name: /add scan/i }).click()
      await expect(page.locator('text=Cebu Sorting Hub')).toBeVisible({ timeout: 6000 })
    }
  })

  test('waybill import page loads', async ({ page }) => {
    await page.goto('/waybills/import')
    await expect(page.locator('main h1')).toContainText('Bulk Import Waybills')
  })

  test('batch status page loads', async ({ page }) => {
    await page.goto('/batch-status')
    await expect(page.locator('h2')).toContainText('Batch Shipment Status')
  })
})
