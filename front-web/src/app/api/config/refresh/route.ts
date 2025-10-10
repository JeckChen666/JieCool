import { NextResponse } from "next/server";
import { getServerUrl } from "../../../../lib/serverUrl";

export async function POST(req: Request) {
  const serverUrl = getServerUrl();
  try {
    const body = await req.json().catch(() => ({}));
    const resp = await fetch(`${serverUrl}/config/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: body?.reason || "frontend-refresh" }),
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (e) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}