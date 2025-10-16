import { NextResponse } from "next/server";
import { getServerUrl } from "../../../../lib/serverUrl";

// Proxy login to backend and normalize response to { token, user }
export async function POST(req: Request) {
  const serverUrl = getServerUrl();
  const url = `${serverUrl}/auth/login`;
  try {
    const contentType = req.headers.get("content-type") || "";
    const form = new URLSearchParams();
    if (contentType.includes("application/json")) {
      try {
        const body = await req.json();
        if (body && typeof body === "object") {
          if (body.password) {
            form.set("password", String(body.password));
          }
          // 透传可选 ttl（秒）。用于本地/E2E 测试短期令牌过期场景
          if (body.ttl !== undefined && body.ttl !== null) {
            const ttlNum = typeof body.ttl === "number" ? body.ttl : parseInt(String(body.ttl), 10);
            if (!Number.isNaN(ttlNum) && ttlNum > 0) {
              form.set("ttl", String(ttlNum));
            }
          }
        }
      } catch (_) {
        // ignore json parse error and fallback to text
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const incoming = new URLSearchParams(text);
      const pwd = incoming.get("password");
      if (pwd) form.set("password", pwd);
      const ttl = incoming.get("ttl");
      if (ttl) form.set("ttl", ttl);
    } else {
      // Fallback: try reading as text and parse naive key=value
      const text = await req.text();
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") {
          if (parsed.password) {
            form.set("password", String(parsed.password));
          }
          if (parsed.ttl !== undefined && parsed.ttl !== null) {
            const ttlNum = typeof parsed.ttl === "number" ? parsed.ttl : parseInt(String(parsed.ttl), 10);
            if (!Number.isNaN(ttlNum) && ttlNum > 0) {
              form.set("ttl", String(ttlNum));
            }
          }
        }
      } catch (_) {
        const incoming = new URLSearchParams(text);
        const pwd = incoming.get("password");
        if (pwd) form.set("password", pwd);
        const ttl = incoming.get("ttl");
        if (ttl) form.set("ttl", ttl);
      }
    }
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const backend = await resp.json();
    const token = backend?.data?.token ?? backend?.data?.access_token ?? backend?.token;
    const expiresAt = backend?.data?.expiresAt ?? backend?.expiresAt ?? null;
    const user = backend?.data?.user ?? backend?.data ?? null;
    return NextResponse.json({ token, expiresAt, user }, { status: resp.status });
  } catch (e) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}