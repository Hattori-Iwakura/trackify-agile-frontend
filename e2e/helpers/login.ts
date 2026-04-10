import { type Page } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_EMAIL ?? "test@example.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "password123";

/**
 * Logs in via the UI and waits for the dashboard to load.
 * Call this at the start of tests that require auth.
 */
export async function loginAs(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto("/login");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
}
