import { NextResponse } from "next/server";
import { getServerUrl } from "../../../../lib/serverUrl";

// Normalize backend response shape to UI expectation
// Backend: { code, message, data: { ok } }
// Frontend UI expects: { ok }
export async function POST(req: Request) {
  const serverUrl = getServerUrl();
  const url = `${serverUrl}/config/create`;
  try {
    const body = await req.json();
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const backend = await resp.json();
    const ok = backend?.data?.ok === true || backend?.code === 0;
    const message = backend?.message;
    return NextResponse.json({ ok, message }, { status: resp.status });
  } catch (e) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}