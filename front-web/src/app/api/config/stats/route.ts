import { NextResponse } from "next/server";
import { getServerUrl } from "../../../../lib/serverUrl";

export async function GET() {
  const serverUrl = getServerUrl();
  try {
    const resp = await fetch(`${serverUrl}/config/stats`, { cache: "no-store" });
    const data = await resp.json();
    // 后端返回形如 { code, message, data: { entries } }
    // 统一解包为前端期望的 { entries }
    const result = (data && typeof data === "object" && "data" in data) ? (data as any).data : data;
    return NextResponse.json(result, { status: resp.status });
  } catch (e) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}