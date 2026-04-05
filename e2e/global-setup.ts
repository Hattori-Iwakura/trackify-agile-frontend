import { chromium, type FullConfig } from "@playwright/test";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local so NEXT_PUBLIC_* vars are available in Node context
config({ path: resolve(__dirname, "../.env.local") });

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
const E2E_EMAIL = process.env.E2E_EMAIL ?? "e2etest@gmail.com";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "E2eTest@123";
const E2E_FULLNAME = "E2E Tester";

async function registerTestAccount() {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: E2E_FULLNAME, email: E2E_EMAIL, password: E2E_PASSWORD }),
    });
    if (res.ok) {
      console.log(`\n✅ Registered test account: ${E2E_EMAIL}`);
    } else {
      const body = await res.json().catch(() => ({}));
      // 409 = already exists — that's fine
      if (res.status === 409 || (body as { message?: string }).message?.includes("exist")) {
        console.log(`\n⚠️  Account already exists: ${E2E_EMAIL}`);
      } else {
        console.warn(`\n⚠️  Register returned ${res.status}:`, body);
      }
    }
  } catch (e) {
    console.error("\n❌ Could not reach API to register test account:", e);
  }
}

export default async function globalSetup(config: FullConfig) {
  // 1. Register test account (no-op if it already exists)
  await registerTestAccount();

  // 2. Log in via browser UI and save auth state
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`);
  await page.locator("#login-email").fill(E2E_EMAIL);
  await page.locator("#login-password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  try {
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    console.log("✅ Login successful — saving auth state");
  } catch {
    const html = await page.content();
    const alertText = await page.locator('[role="alert"]').textContent().catch(() => "");
    console.error("❌ Login failed. Alert:", alertText);
    console.error("Page URL:", page.url());
    if (html.includes("Đăng nhập")) {
      console.error("Still on login page — check credentials or backend connection.");
    }
    await browser.close();
    throw new Error(`Login failed for ${E2E_EMAIL}. Is the backend running at ${API_URL}?`);
  }

  // Save cookies + localStorage so tests skip logging in
  await page.context().storageState({ path: "e2e/.auth-state.json" });
  await browser.close();
}
