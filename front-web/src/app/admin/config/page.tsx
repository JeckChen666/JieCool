"use client";
import React from "react";

export default function AdminConfigPage() {
  const [entries, setEntries] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/config/stats", { cache: "no-store" });
      const data = await res.json();
      setEntries(typeof data?.entries === "number" ? data.entries : 0);
    } catch (e) {
      setMessage("获取统计失败");
    }
  };

  const refreshCache = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/config/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "frontend-refresh" }),
      });
      const data = await res.json();
      if (res.ok && data?.status === "ok") {
        setMessage(`刷新成功：${data.entries} 项，耗时 ${data.elapsed_ms}ms`);
      } else {
        setMessage(`刷新失败：${data?.status || "error"}`);
      }
      await loadStats();
    } catch (e) {
      setMessage("刷新失败");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadStats();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>动态配置管理</h1>
      <div style={{ marginTop: 12 }}>
        <strong>缓存条目数：</strong>
        {entries === null ? "加载中..." : entries}
        <button
          onClick={loadStats}
          style={{ marginLeft: 12 }}
          disabled={loading}
        >
          刷新统计
        </button>
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={refreshCache} disabled={loading}>
          {loading ? "刷新中..." : "刷新缓存"}
        </button>
      </div>
      {message && (
        <div style={{ marginTop: 12, color: "#333" }}>{message}</div>
      )}
    </div>
  );
}