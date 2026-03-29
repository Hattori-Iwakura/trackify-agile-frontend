import type { NextRequest } from "next/server";
import { proxyRequestToNest } from "@/lib/nest-proxy";

/**
 * Next 15+ passes `params` as a Promise; Next 14 uses a plain object.
 * `Promise.resolve` keeps both runtimes and typings happy.
 */
type RouteParams = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

async function resolvePathSegments(
  params: RouteParams["params"]
): Promise<string[] | undefined> {
  const resolved = await Promise.resolve(params);
  return resolved.path;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return proxyRequestToNest(request, await resolvePathSegments(params));
}

export async function HEAD(request: NextRequest, { params }: RouteParams) {
  return proxyRequestToNest(request, await resolvePathSegments(params));
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return proxyRequestToNest(request, await resolvePathSegments(params));
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return proxyRequestToNest(request, await resolvePathSegments(params));
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return proxyRequestToNest(request, await resolvePathSegments(params));
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return proxyRequestToNest(request, await resolvePathSegments(params));
}
