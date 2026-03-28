import { NextRequest, NextResponse } from "next/server";

/**
 * Origin HTTP của Nest (không kèm `/api`).
 * Mặc định :4000 — khớp PORT mặc định backend (Next thường :3000).
 */
export function getNestOriginForProxy(): string {
  const raw = process.env.BACKEND_ORIGIN || process.env.NEST_ORIGIN || "http://127.0.0.1:4000";
  return raw.replace(/\/$/, "");
}

/**
 * Chuyển tiếp request từ Next `/api/...` sang Nest `/api/...` (cùng path sau prefix).
 */
export async function proxyRequestToNest(
  req: NextRequest,
  pathSegments: string[] | undefined
): Promise<NextResponse> {
  const nest = getNestOriginForProxy();
  const path = (pathSegments ?? []).join("/");
  const apiPath = path ? `/api/${path}` : "/api";
  const target = `${nest}${apiPath}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (["host", "connection", "content-length", "transfer-encoding"].includes(k)) return;
    headers.set(key, value);
  });

  const method = req.method.toUpperCase();
  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 0) body = buf;
  }

  let res: Response;
  try {
    const signal = AbortSignal.timeout(15_000);
    res = await fetch(target, { method, headers, body, redirect: "manual", signal });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return NextResponse.json(
      {
        message: `Không kết nối được Nest tại ${nest}. Chạy backend (PORT mặc định 4000) hoặc đặt BACKEND_ORIGIN trong .env.local.`,
        detail: msg,
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
