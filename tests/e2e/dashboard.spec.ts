import { test, expect } from '@playwright/test'

test.describe('TechShield AI Dashboard', () => {
  test('loads dashboard with welcome message', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
  })

  test('navigates to billing page via sidebar', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Billing' }).click()
    await expect(page.getByRole('heading', { name: /billing/i })).toBeVisible()
    await expect(page.getByText('Free').first()).toBeVisible()
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
