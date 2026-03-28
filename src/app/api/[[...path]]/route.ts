import type { NextRequest } from 'next/server';
import { proxyRequestToNest } from '@/lib/nest-proxy';

type RouteParams = { params: { path?: string[] } };

export async function GET(request: NextRequest, { params }: RouteParams) {
  return proxyRequestToNest(request, params.path);
}

export async function HEAD(request: NextRequest, { params }: RouteParams) {
  return proxyRequestToNest(request, params.path);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return proxyRequestToNest(request, params.path);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return proxyRequestToNest(request, params.path);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return proxyRequestToNest(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return proxyRequestToNest(request, params.path);
}
