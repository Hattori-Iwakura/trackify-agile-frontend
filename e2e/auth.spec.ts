import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /đăng nhập/i })).toBeVisible();
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#login-email").fill("wrong@example.com");
    await page.locator("#login-password").fill("wrongpassword");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    // Error shown via role="alert" paragraph
    await expect(page.locator("p[role='alert']")).toBeVisible({ timeout: 8000 });
  });

  test("register page is accessible", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
