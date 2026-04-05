import { test, expect } from "@playwright/test";

test.describe("Notifications page", () => {
  // Uses saved auth state from global setup

  test("renders notification center", async ({ page }) => {
    await page.goto("/dashboard/notifications");
    await expect(page.getByRole("heading", { name: /thông báo/i })).toBeVisible({ timeout: 8000 });
  });

  test("shows filter tabs (Tất cả / Chưa đọc / Đã đọc)", async ({ page }) => {
    await page.goto("/dashboard/notifications");
    await expect(page.getByRole("button", { name: "Tất cả", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Chưa đọc", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Đã đọc", exact: true })).toBeVisible();
  });

  test("'Đánh dấu tất cả đã đọc' button is present", async ({ page }) => {
    await page.goto("/dashboard/notifications");
    await expect(
      page.getByRole("button", { name: /đánh dấu tất cả đã đọc/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test("unread badge resets after visiting notifications", async ({ page }) => {
    await page.goto("/dashboard");
    // Navigate to notifications
    await page.goto("/dashboard/notifications");
    await page.waitForTimeout(500);
    // Navigate back — badge should be cleared
    await page.goto("/dashboard");
    const badge = page.locator("header").locator(".bg-destructive");
    await expect(badge).toHaveCount(0);
  });
});
