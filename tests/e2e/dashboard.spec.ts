import { test, expect } from '@playwright/test'

test.describe('TechShield AI Dashboard', () => {
  test('loads dashboard with navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
  })

  test('navigates to billing page', async ({ page }) => {
    await page.goto('/billing')
    await expect(page.getByRole('heading', { name: /billing/i })).toBeVisible()
    await expect(page.getByText(/free/i).first()).toBeVisible()
  })

  test('navigates to security scanner', async ({ page }) => {
    await page.goto('/security')
    await expect(page.getByRole('heading', { name: /security/i })).toBeVisible()
  })

  test('navigates to prompt generator', async ({ page }) => {
    await page.goto('/ai/prompts')
    await expect(page.getByRole('heading', { name: /prompt/i })).toBeVisible()
  })

  test('profile page links to billing', async ({ page }) => {
    await page.goto('/profile')
    await page.getByText('Billing').click()
    await expect(page).toHaveURL(/billing/)
  })
})

test.describe('Accessibility', () => {
  test('skip to main content link exists', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /skip to main content/i })).toBeAttached()
  })
})
