import { NextResponse } from "next/server";
import { getServerUrl } from "../../../../lib/serverUrl";

export async function POST(req: Request) {
  const serverUrl = getServerUrl();
  try {
    const auth = req.headers.get("authorization") || "";
    const body = await req.json().catch(() => ({}));
    const resp = await fetch(`${serverUrl}/config/refresh`, {
      method: "POST",
      headers: auth ? { "Content-Type": "application/json", Authorization: auth } : { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: body?.reason || "frontend-refresh" }),
    });
    const data = await resp.json();
    // 后端返回形如 { code, message, data: { status, entries, elapsed_ms } }
    // 统一解包为前端期望的 { status, entries, elapsed_ms }
    const result = (data && typeof data === "object" && "data" in data) ? (data as any).data : data;
    return NextResponse.json(result, { status: resp.status });
  } catch (e) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}