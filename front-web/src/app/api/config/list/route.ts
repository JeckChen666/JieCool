import { NextResponse, NextRequest } from "next/server";
import { getServerUrl } from "../../../../lib/serverUrl";

// Normalize backend response shape to the UI expectation
// Backend: { code, message, data: { items, total } }
// Frontend UI expects: { items, total }
export async function GET(req: NextRequest) {
  const serverUrl = getServerUrl();
  const params = req.nextUrl.searchParams;
  const qs = params.toString();
  const url = `${serverUrl}/config/list${qs ? `?${qs}` : ""}`;
  try {
    const auth = req.headers.get("authorization") || "";
    const resp = await fetch(url, {
      cache: "no-store",
      headers: auth ? { Authorization: auth } : undefined,
    });
    const backend = await resp.json();
    const items = backend?.data?.items ?? [];
    const total = backend?.data?.total ?? 0;
    return NextResponse.json({ items, total }, { status: resp.status });
  } catch (e) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}