import { test, expect } from "@playwright/test";

test.describe("Dashboard Home", () => {
  // Uses saved auth state from global setup (no login needed)
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("shows the 3 stat cards", async ({ page }) => {
    // Project stat card
    await expect(page.locator("text=/project tham gia/i").first()).toBeVisible({ timeout: 8000 });
    // Issues stat card
    await expect(page.locator("text=/issue gán/i").first()).toBeVisible({ timeout: 8000 });
    // Notifications stat card
    await expect(page.locator("text=/thông báo chưa đọc/i").first()).toBeVisible({ timeout: 8000 });
  });

  test("shows 'Việc của tôi' section", async ({ page }) => {
    await expect(page.locator("text=/việc của tôi/i").first()).toBeVisible({ timeout: 8000 });
  });

  test("shows sidebar navigation", async ({ page }) => {
    await expect(page.locator("text=/projects/i").first()).toBeVisible();
    await expect(page.locator("text=/notifications/i").first()).toBeVisible();
    await expect(page.locator("text=/profile/i").first()).toBeVisible();
  });

  test("navigates to projects page", async ({ page }) => {
    await page.locator("a[href='/dashboard/projects']").first().click();
    await expect(page).toHaveURL(/\/dashboard\/projects/);
  });
});
