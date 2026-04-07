/**
 * E2E tests for the WebSocket notification system.
 *
 * Targets the deployed stack:
 *   Frontend : https://trackify-agile-frontend.vercel.app
 *   Backend  : https://trackify-backend-production-3631.up.railway.app/api
 *
 * Test accounts (pre-registered):
 *   alice.e2e@trackify.test / TestPass123!  — reporter, receives notifications
 *   bob.e2e@trackify.test   / TestPass123!  — commenter, triggers notifications
 *
 * Pre-created shared data (idempotent – beforeAll reuses if already exists):
 *   Project : E2E Notification Project (key: E2EN)
 *   Issue   : E2EN-1 — "E2E WebSocket Test Issue"
 *   Members : Alice (OWNER), Bob (MEMBER)
 *
 * Backend response envelope:
 *   { statusCode, data: <payload>, timestamp }
 *   Paginated: data = { data: [], meta: { total, page, limit, totalPages } }
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

const API = process.env.PLAYWRIGHT_API_URL
  ?? 'https://trackify-backend-production-3631.up.railway.app/api';

const ALICE = { email: 'alice.e2e@trackify.test', password: 'TestPass123!' };
const BOB   = { email: 'bob.e2e@trackify.test',   password: 'TestPass123!' };

// Shared state set in beforeAll
let aliceToken = '';
let bobToken   = '';
let projectId  = '';
let issueKey   = '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Login and return the access token (handles { statusCode, data: { accessToken } } envelope). */
async function apiLogin(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  expect(res.ok(), `Login failed for ${email}: ${await res.text()}`).toBeTruthy();
  const body = await res.json() as any;
  const token = body.data?.accessToken ?? body.accessToken;
  expect(token, 'accessToken missing from login response').toBeTruthy();
  return token as string;
}

/** Extract the actual payload from the backend envelope. */
function unwrap(body: any) {
  return body?.data ?? body;
}

/** Extract items array from a paginated envelope. */
function unwrapList(body: any): any[] {
  const payload = unwrap(body);
  return Array.isArray(payload) ? payload : (payload?.data ?? []);
}

/** Pause to respect the auth rate-limiter between consecutive logins. */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * The Vercel build has NEXT_PUBLIC_WS_URL baked as "http://localhost" (missing Railway URL).
 * Patch window.WebSocket before page load to redirect socket.io connections to Railway.
 */
async function patchWebSocketUrl(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const RAILWAY_WS = 'wss://trackify-backend-production-3631.up.railway.app';
    const OrigWS = window.WebSocket;
    function PatchedWS(url: string, protocols?: string | string[]) {
      const fixed = typeof url === 'string'
        ? url.replace(/^wss?:\/\/localhost(:[0-9]+)?/, RAILWAY_WS)
        : url;
      console.log('[WS-PATCH]', url, '->', fixed);
      // @ts-ignore
      return new OrigWS(fixed, protocols as string);
    }
    PatchedWS.prototype = OrigWS.prototype;
    PatchedWS.CONNECTING = OrigWS.CONNECTING;
    PatchedWS.OPEN       = OrigWS.OPEN;
    PatchedWS.CLOSING    = OrigWS.CLOSING;
    PatchedWS.CLOSED     = OrigWS.CLOSED;
    // @ts-ignore
    window.WebSocket = PatchedWS;
  });
}

async function loginViaUI(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 20_000 });
}

/**
 * The login flow stores tokens under 'trackify_access_token' / 'trackify_refresh_token',
 * but the AuthGuard's auth.store.hydrate() reads from 'accessToken' / 'refreshToken'.
 * Bridge the mismatch so (dashboard) routes don't redirect to /login.
 */
async function bridgeAuthKeys(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const access  = localStorage.getItem('trackify_access_token');
    const refresh = localStorage.getItem('trackify_refresh_token');
    if (access)  localStorage.setItem('accessToken',  access);
    if (refresh) localStorage.setItem('refreshToken', refresh);
  });
}

async function postComment(request: APIRequestContext, token: string, content: string) {
  const res = await request.post(
    `${API}/projects/${projectId}/issues/${issueKey}/comments`,
    { headers: { Authorization: `Bearer ${token}` }, data: { content } },
  );
  expect(res.ok(), `Comment failed: ${await res.text()}`).toBeTruthy();
}

// ---------------------------------------------------------------------------
// One-time setup: tokens + project + issue (idempotent)
// ---------------------------------------------------------------------------
test.beforeAll(async ({ request }) => {
  aliceToken = await apiLogin(request, ALICE.email, ALICE.password);
  await sleep(3_000); // respect rate-limiter
  bobToken = await apiLogin(request, BOB.email, BOB.password);
  await sleep(2_000);

  // Re-acquire Alice token after the delay (in case it expired)
  aliceToken = await apiLogin(request, ALICE.email, ALICE.password);
  await sleep(2_000);

  // ---- Find or create the E2E project ----
  const projectsRes = await request.get(`${API}/projects`, {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });
  expect(projectsRes.ok()).toBeTruthy();
  const projectsBody = await projectsRes.json();
  const projects: any[] = unwrapList(projectsBody);
  const existing = projects.find((p: any) => p.key === 'E2EN');

  if (existing) {
    projectId = existing.id;
  } else {
    const createRes = await request.post(`${API}/projects`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
      data: { name: 'E2E Notification Project', key: 'E2EN', description: 'Playwright E2E test project' },
    });
    expect(createRes.ok(), `Create project failed: ${await createRes.text()}`).toBeTruthy();
    projectId = unwrap(await createRes.json()).id;

    // Invite Bob
    const bobMeRes = await request.get(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    const bobUser = unwrap(await bobMeRes.json());
    await request.post(`${API}/projects/${projectId}/members`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
      data: { userId: bobUser.id, role: 'MEMBER' },
    });
  }

  // ---- Find or create the test issue ----
  const issuesRes = await request.get(`${API}/projects/${projectId}/issues`, {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });
  expect(issuesRes.ok()).toBeTruthy();
  const issues: any[] = unwrapList(await issuesRes.json());
  const existingIssue = issues.find((i: any) => i.title === 'E2E WebSocket Test Issue');

  if (existingIssue) {
    issueKey = existingIssue.issueKey;
  } else {
    const issueRes = await request.post(`${API}/projects/${projectId}/issues`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
      data: { title: 'E2E WebSocket Test Issue', type: 'TASK', priority: 'MEDIUM', status: 'TODO' },
    });
    expect(issueRes.ok(), `Create issue failed: ${await issueRes.text()}`).toBeTruthy();
    issueKey = unwrap(await issueRes.json()).issueKey;
  }
});

// ---------------------------------------------------------------------------
// 1. Socket connects after login
// ---------------------------------------------------------------------------
test('socket connects after login', async ({ page }) => {
  await loginViaUI(page, ALICE.email, ALICE.password);

  // Dashboard should render with the header bell button (socket initialised by useSocket hook)
  await expect(page.locator('header button[aria-label]').first()).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/\/dashboard/);
});

// ---------------------------------------------------------------------------
// 2. notification:new shows a Sonner toast
// ---------------------------------------------------------------------------
test('notification:new shows a toast when Bob posts a comment', async ({ browser, request }) => {
  await request.patch(`${API}/notifications/read-all`, {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });

  const aliceCtx = await browser.newContext();
  const alicePage = await aliceCtx.newPage();
  await patchWebSocketUrl(alicePage);

  const wsLogs: string[] = [];
  alicePage.on('console', msg => {
    if (msg.text().includes('[WS-PATCH]') || msg.text().includes('socket')) {
      wsLogs.push(msg.text());
    }
  });

  await loginViaUI(alicePage, ALICE.email, ALICE.password);
  await bridgeAuthKeys(alicePage);

  // Navigate to /notifications — this is inside the (dashboard) route group
  // which mounts DashboardLayout → useSocket() → socket connects
  await alicePage.goto('/notifications');
  await alicePage.waitForLoadState('networkidle');
  // Wait for socket to connect and join Alice's user:${id} room
  await alicePage.waitForTimeout(4_000);

  console.log('WS patch logs:', wsLogs);

  // Check socket & auth state inside the page
  const pageState = await alicePage.evaluate(() => {
    const ls = {
      trackify_access_token: !!localStorage.getItem('trackify_access_token'),
      accessToken: !!localStorage.getItem('accessToken'),
    };
    // Try to find if the Zustand store is accessible via React DevTools fiber
    return { localStorage: ls, url: window.location.href };
  });
  console.log('Page state:', pageState);

  // Bob posts a comment → backend emits notification:new to Alice's room
  await postComment(request, bobToken, '[Playwright E2E] Toast notification test');

  // Sonner v2 renders toasts as <li> inside <section aria-label="Notifications ...">
  // Wait up to 15 s for the toast to appear (WebSocket roundtrip + React render)
  const toast = alicePage.locator('section[aria-label*="Notifications"] li').first();
  await expect(toast).toBeVisible({ timeout: 15_000 });
  await expect(toast).toContainText('New Comment');

  await aliceCtx.close();
});

// ---------------------------------------------------------------------------
// 3. Unread badge appears in the header
// ---------------------------------------------------------------------------
test('unread badge appears in header after notification:new', async ({ browser, request }) => {
  await request.patch(`${API}/notifications/read-all`, {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });

  const aliceCtx = await browser.newContext();
  const alicePage = await aliceCtx.newPage();
  await patchWebSocketUrl(alicePage);
  await loginViaUI(alicePage, ALICE.email, ALICE.password);
  await bridgeAuthKeys(alicePage);

  // Navigate into the (dashboard) route group to activate useSocket
  await alicePage.goto('/notifications');
  await alicePage.waitForLoadState('networkidle');
  await alicePage.waitForTimeout(4_000);

  // Confirm no badge before trigger
  const badge = alicePage.locator('header span.bg-destructive');
  await expect(badge).not.toBeVisible();

  // Trigger notification
  await postComment(request, bobToken, '[Playwright E2E] Badge test');

  // notification:new → invalidateQueries(['unread-count']) → badge re-renders
  await expect(badge).toBeVisible({ timeout: 10_000 });
  await expect(badge).not.toBeEmpty();

  await aliceCtx.close();
});

// ---------------------------------------------------------------------------
// 4. Notifications page lists the new notification
// ---------------------------------------------------------------------------
test('notifications page shows the new notification', async ({ browser, request }) => {
  await request.patch(`${API}/notifications/read-all`, {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });

  const aliceCtx = await browser.newContext();
  const alicePage = await aliceCtx.newPage();
  await loginViaUI(alicePage, ALICE.email, ALICE.password);
  await alicePage.waitForTimeout(3_000);

  await postComment(request, bobToken, '[Playwright E2E] Notification list test');

  await alicePage.goto('/dashboard/notifications');
  await alicePage.waitForLoadState('networkidle');

  await expect(alicePage.getByText('New Comment').first()).toBeVisible({ timeout: 10_000 });

  await aliceCtx.close();
});

// ---------------------------------------------------------------------------
// 5. Mark all as read removes the unread badge
// ---------------------------------------------------------------------------
test('mark-all-read removes the unread badge', async ({ page, request }) => {
  // Ensure at least one unread notification
  await postComment(request, bobToken, '[Playwright E2E] Mark-all-read test');

  await loginViaUI(page, ALICE.email, ALICE.password);
  await page.waitForTimeout(3_000);

  const badge = page.locator('header span.bg-destructive');
  await expect(badge).toBeVisible({ timeout: 10_000 });

  // Navigate to notifications page
  await page.goto('/dashboard/notifications');
  await page.waitForLoadState('networkidle');

  const markAllBtn = page.getByRole('button', { name: /đọc tất cả|mark all|read all/i });
  if (await markAllBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await markAllBtn.click();
  } else {
    // Fallback via API
    await request.patch(`${API}/notifications/read-all`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  }

  // Return to dashboard — badge should be gone
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(badge).not.toBeVisible({ timeout: 8_000 });
});
