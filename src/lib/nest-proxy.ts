import { NextRequest, NextResponse } from "next/server";

const SKIP_FORWARD_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
]);

/**
 * Origin HTTP của Nest (không kèm `/api`).
 * Mặc định :4000 — khớp PORT mặc định backend (Next thường :3000).
 */
export function getNestOriginForProxy(): string {
  const raw = process.env.BACKEND_ORIGIN || process.env.NEST_ORIGIN || "http://127.0.0.1:4000";
  return raw.replace(/\/$/, "");
}

/**
 * Danh sách segment đầu tiên sau `/api/` được phép proxy (vd. `auth,users,projects`).
 * Đặt `NEST_PROXY_ALLOWLIST` trong env; nếu không set → cho phép mọi path (tiện dev).
 */
function getProxyAllowlist(): string[] | null {
  const raw = process.env.NEST_PROXY_ALLOWLIST?.trim();
  if (!raw) return null;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : null;
}

function isProxyPathAllowed(pathSegments: string[] | undefined): boolean {
  const allow = getProxyAllowlist();
  if (!allow) return true;

  const first = (pathSegments ?? [])[0];
  // Bare `/api` — không có segment; vẫn cho phép khi đã bật allowlist (health/ping).
  if (first === undefined || first === "") return true;

  return allow.some((prefix) => first === prefix || first.startsWith(`${prefix}/`));
}

function proxyTimeoutMs(method: string): number {
  const fromEnv = process.env.NEST_PROXY_TIMEOUT_MS?.trim();
  if (fromEnv) {
    const n = Number(fromEnv);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const m = method.toUpperCase();
  return m === "GET" || m === "HEAD" ? 15_000 : 120_000;
}

/**
 * Chuyển tiếp request từ Next `/api/...` sang Nest `/api/...` (cùng path sau prefix).
 */
export async function proxyRequestToNest(
  req: NextRequest,
  pathSegments: string[] | undefined
): Promise<NextResponse> {
  if (!isProxyPathAllowed(pathSegments)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const nest = getNestOriginForProxy();
  const path = (pathSegments ?? []).join("/");
  const apiPath = path ? `/api/${path}` : "/api";
  const target = `${nest}${apiPath}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (SKIP_FORWARD_HEADERS.has(k)) return;
    headers.set(key, value);
  });

  const method = req.method.toUpperCase();
  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 0) {
      body = buf;
      // Incoming Content-Length đã bỏ qua khi copy header; set lại cho body thực tế.
      headers.set("Content-Length", String(buf.byteLength));
    }
  }

  let res: Response;
  try {
    const ms = proxyTimeoutMs(method);
    const signal = AbortSignal.timeout(ms);
    res = await fetch(target, { method, headers, body, redirect: "manual", signal });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "fetch failed";
    console.error("[nest-proxy] upstream fetch failed", { target, nest, detail });
    return NextResponse.json(
      {
        message: "Không kết nối được máy chủ API. Thử lại sau hoặc kiểm tra backend đã chạy chưa.",
      },
      { status: 502 }
    );
  }

  const outHeaders = new Headers(res.headers);
  outHeaders.delete("transfer-encoding");

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: outHeaders,
  });
}
