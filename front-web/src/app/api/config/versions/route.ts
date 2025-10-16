import { NextResponse, NextRequest } from "next/server";
import { getServerUrl } from "../../../../lib/serverUrl";

// Normalize backend response shape to UI expectation
// Backend: { code, message, data: { items } }
// Frontend UI expects: { items }
export async function GET(req: NextRequest) {
  const serverUrl = getServerUrl();
  const qs = req.nextUrl.searchParams.toString();
  const url = `${serverUrl}/config/versions${qs ? `?${qs}` : ""}`;
  try {
    const auth = req.headers.get("authorization") || "";
    const resp = await fetch(url, {
      cache: "no-store",
      headers: auth ? { Authorization: auth } : undefined,
    });
    const backend = await resp.json();
    const items = backend?.data?.items ?? [];
    return NextResponse.json({ items }, { status: resp.status });
  } catch (e) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}