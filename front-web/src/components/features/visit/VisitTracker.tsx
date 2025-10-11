"use client";

import { useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

/**
 * On mount, POST a visit record to backend `/logs/visit`.
 * Sends minimal payload; backend will capture headers/IP/method/path.
 */
export default function VisitTracker() {
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const path = window.location.pathname + window.location.search;
    const payload = { path, ts: Date.now() };

    fetch(`${API_BASE}/logs/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      mode: "cors",
      credentials: "omit",
    })
      .catch(() => {
        // silent failure; logging shouldn't break UI
      })
      .finally(() => clearTimeout(timer));

    return () => clearTimeout(timer);
  }, []);

  return null;
}