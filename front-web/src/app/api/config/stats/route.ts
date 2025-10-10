import { NextResponse } from "next/server";
import { getServerUrl } from "../../../../lib/serverUrl";

export async function GET() {
  const serverUrl = getServerUrl();
  try {
    const resp = await fetch(`${serverUrl}/config/stats`, { cache: "no-store" });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (e) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}