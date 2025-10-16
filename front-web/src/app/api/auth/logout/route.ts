import { NextResponse, NextRequest } from "next/server";
import { getServerUrl } from "../../../../lib/serverUrl";

// Proxy logout to backend and normalize response to { loggedOut }
export async function POST(req: NextRequest) {
  const serverUrl = getServerUrl();
  try {
    const auth = req.headers.get("authorization") || "";
    const resp = await fetch(`${serverUrl}/auth/logout`, {
      method: "POST",
      headers: auth ? { Authorization: auth } : undefined,
    });
    const backend = await resp.json();
    // 统一响应：{ code, message, data }
    if (backend && typeof backend.code === "number") {
      const ok = backend.code === 0;
      const loggedOut = ok && (backend?.data?.loggedOut === true || backend?.loggedOut === true);
      return NextResponse.json({ loggedOut, code: backend.code, message: backend.message ?? "" }, { status: resp.status });
    }
    // 非统一响应兜底
    const loggedOut = backend?.data?.loggedOut ?? backend?.loggedOut ?? (resp.status === 200);
    return NextResponse.json({ loggedOut }, { status: resp.status });
  } catch (e) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}