"use client";
import React from "react";
import Link from "next/link";
import {
  Typography,
  Space,
  Card,
  Statistic,
  Button,
  Alert,
  Message,
} from "@arco-design/web-react";
import { IconRefresh } from "@arco-design/web-react/icon";

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
      const msg = "获取统计失败";
      setMessage(msg);
      Message.error(msg);
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
        const msg = `刷新成功：${data.entries} 项，耗时 ${data.elapsed_ms}ms`;
        setMessage(msg);
        Message.success(msg);
      } else {
        const errText = data?.status || data?.error || `HTTP ${res.status}`;
        const msg = `刷新失败：${errText}`;
        setMessage(msg);
        Message.error(msg);
      }
      await loadStats();
    } catch (e) {
      const msg = "刷新失败";
      setMessage(msg);
      Message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadStats();
  }, []);

  return (
    <Space direction="vertical" size="large" style={{ padding: 24 }}>
      <Typography.Title heading={2}>动态配置管理</Typography.Title>
      <Typography.Text type="secondary">
        支持查看缓存条目数与一键刷新缓存；如需管理具体配置项，请进入管理页。
      </Typography.Text>

      <Card
        title="缓存统计"
        extra={
          <Button
            type="secondary"
            icon={<IconRefresh />}
            onClick={loadStats}
            disabled={loading}
          >
            刷新统计
          </Button>
        }
      >
        <Statistic
          title="缓存条目数"
          value={entries === null ? "加载中..." : entries}
        />
      </Card>

      <Card title="操作">
        <Space size="medium">
          <Button
            type="primary"
            icon={<IconRefresh />}
            loading={loading}
            onClick={refreshCache}
          >
            {loading ? "刷新中..." : "刷新缓存"}
          </Button>
          <Link href="/admin/config/manage" prefetch>
            <Button type="outline">进入管理页</Button>
          </Link>
        </Space>

        {message && (
          <div style={{ marginTop: 12 }}>
            <Alert
              type={message.startsWith("刷新成功") ? "success" : "error"}
              content={message}
              closable
            />
          </div>
        )}
      </Card>
    </Space>
  );
}