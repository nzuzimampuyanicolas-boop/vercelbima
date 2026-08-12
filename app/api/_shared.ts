import { NextResponse } from "next/server";

const DEFAULT_BIMA_API_URL =
  "https://ebilhzvgvinbpmmpezua.supabase.co/functions/v1/bima-api";

export const bimaResponseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
};

export function bimaBackendUrl(path: string) {
  const baseUrl = (process.env.BIMA_API_URL || DEFAULT_BIMA_API_URL).replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function apiOptions() {
  return new NextResponse(null, { status: 204, headers: bimaResponseHeaders });
}

export async function proxyBima(
  request: Request,
  path: string,
  options: { forwardSearch?: boolean } = {},
) {
  try {
    const requestUrl = new URL(request.url);
    const search = options.forwardSearch ? requestUrl.search : "";
    const headers = new Headers();

    for (const name of ["accept", "authorization", "content-type"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    const method = request.method.toUpperCase();
    const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
    const upstream = await fetch(`${bimaBackendUrl(path)}${search}`, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const outgoingHeaders = new Headers(bimaResponseHeaders);
    for (const name of ["content-type", "content-disposition"]) {
      const value = upstream.headers.get(name);
      if (value) outgoingHeaders.set(name, value);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: outgoingHeaders,
    });
  } catch (error) {
    console.error("BIMA API proxy failed", error);
    return NextResponse.json(
      { error: "Le service BIMA est momentanément indisponible." },
      { status: 502, headers: bimaResponseHeaders },
    );
  }
}
