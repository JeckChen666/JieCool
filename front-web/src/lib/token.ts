"use client";

// Token 存取工具：同时支持 localStorage 与 Cookie，读取时按顺序检查
// Cookie 仅用于在某些场景 localStorage 不可用时兜底；不用于跨域或安全敏感存储

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const ls = window.localStorage.getItem("token");
    if (ls && ls.trim()) return ls.trim();
  } catch {}
  // 兜底从 Cookie 读取
  try {
    const cookie = document.cookie || "";
    const parts = cookie.split(";").map((s) => s.trim());
    for (const p of parts) {
      if (p.startsWith("token=")) {
        const v = decodeURIComponent(p.substring("token=".length));
        if (v && v.trim()) return v.trim();
      }
    }
  } catch {}
  return null;
}

export function setToken(token: string, expiresAt?: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("token", token);
  } catch {}
  try {
    // 根据后端返回的 expiresAt（秒级时间戳）设置 Cookie 过期时间
    let attr = "path=/; SameSite=Lax";
    if (expiresAt && typeof expiresAt === "number") {
      const ms = expiresAt * 1000;
      const d = new Date(ms);
      attr += "; expires=" + d.toUTCString();
    }
    document.cookie = `token=${encodeURIComponent(token)}; ${attr}`;
  } catch {}
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("token");
  } catch {}
  try {
    // 清除 Cookie
    document.cookie = "token=; path=/; Max-Age=0; SameSite=Lax";
  } catch {}
}