import { NextResponse, NextRequest } from "next/server";
import { getServerUrl } from "../../../../lib/serverUrl";

// Proxy current user info to backend and normalize to { user }
export async function GET(req: NextRequest) {
  const serverUrl = getServerUrl();
  try {
    const auth = req.headers.get("authorization") || "";
    const resp = await fetch(`${serverUrl}/auth/me`, {
      headers: auth ? { Authorization: auth } : undefined,
      cache: "no-store",
    });
    const backend = await resp.json();
    const user = backend?.data?.user ?? backend?.data ?? null;
    return NextResponse.json({ user }, { status: resp.status });
  } catch (e) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}