import { test, expect } from '@playwright/test'

test.describe('critical path', () => {
  const admin = { email: 'admin@waybilltrack.com', password: 'teccadmin00' }

  test('login, create waybill, add scan, and track publicly', async ({ page }) => {
    // 1. Login
    await page.goto('/login')
    await expect(page).toHaveTitle(/Waybill/i)
    await page.getByRole('textbox', { name: 'Email' }).fill(admin.email)
    await page.getByRole('textbox', { name: 'Password' }).fill(admin.password)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')

    // 2. Create waybill
    await page.goto('/waybills/new')
    await expect(page.locator('h2')).toContainText('New Waybill')
    const trackingId = `E2E-${Date.now()}`
    await page.getByRole('textbox', { name: 'Recipient Name' }).fill('E2E Recipient')
    await page.getByRole('textbox', { name: 'Recipient Phone' }).fill('+63900000000')
    await page.getByRole('textbox', { name: 'Recipient Address' }).fill('123 Test St, Quezon City')
    await page.getByRole('textbox', { name: 'Origin' }).fill('Manila')
    await page.getByRole('textbox', { name: 'Destination' }).fill('Cebu')
    await page.getByRole('spinbutton', { name: 'Weight (kg)' }).fill('1.5')
    await page.getByRole('button', { name: 'Create Waybill' }).click()
    await page.waitForURL('/waybills')
    await expect(page).toHaveURL('/waybills')

    // Open the first (newest) waybill detail
    await page.locator('table tbody tr:first-child td:first-child a').click()
    await page.waitForURL(/\/waybills\/[\w-]+/)
    await expect(page.locator('h2')).toContainText('Waybill #')

    // 3. Add a scan event via the dashboard
    await page.locator('label', { hasText: 'Status' }).locator('..').locator('select').selectOption('PICKED_UP')
    await page.getByRole('textbox', { name: 'Location' }).fill('Manila Hub')
    await page.getByRole('button', { name: 'Add Scan' }).click()
    await expect(page.locator('text=Manila Hub')).toBeVisible()
    await expect(page.locator('text=PICKED_UP')).toBeVisible()

    // Capture the tracking number from the heading
    const heading = await page.locator('h2').textContent()
    const trackingNumber = heading?.replace('Waybill #', '').trim() ?? ''
    expect(trackingNumber).not.toBe('')

    // 4. Public tracking page
    await page.goto(`/track/${trackingNumber}`)
    await expect(page.locator('text=Tracking Number')).toBeVisible()
    await expect(page.locator(`text=${trackingNumber}`)).toBeVisible()
    await expect(page.locator('text=PICKED_UP')).toBeVisible()
    await expect(page.locator('text=Manila Hub')).toBeVisible()
  })
})
