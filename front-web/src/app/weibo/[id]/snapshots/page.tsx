"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSnapshots } from "@/lib/weibo";
import { Typography, Space, Button, Tag, Spin, Alert, Pagination, Card } from "@arco-design/web-react";

export default function WeiboSnapshotsPage() {
  const params = useParams();
  const idParam = params?.id as string | undefined;
  const postId = idParam ? Number(idParam) : NaN;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Awaited<ReturnType<typeof getSnapshots>>["items"]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!postId || Number.isNaN(postId)) return;
    setLoading(true);
    setError(null);
    getSnapshots(postId, page, size)
      .then((res) => {
        setItems(Array.isArray(res.items) ? res.items : []);
        setTotal(typeof res.total === "number" ? res.total : 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [postId, page, size]);

  const pages = Math.max(1, Math.ceil((total || 0) / size));

  return (
    <div style={{ padding: 24 }}>
      <Space size={16} direction="vertical" style={{ width: '100%' }}>
        <Typography.Title heading={3}>快照历史</Typography.Title>
        <Space>
          <Link href={`/weibo/${postId}`}>
            <Button>返回详情</Button>
          </Link>
        </Space>
        {Number.isNaN(postId) && <Alert type="error" title="ID 参数无效" />}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin tip="加载中" />
          </div>
        )}
        {error && <Alert type="error" title="加载失败" content={error} />}

        {!loading && !error && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {items.length === 0 ? (
              <Alert type="normal" title="暂无快照" />
            ) : (
              items.map((it) => (
                <Card key={it.id} bordered hoverable>
                  <Space size={8}>
                    <Typography.Text type="secondary">版本 {it.version}</Typography.Text>
                    <Typography.Text type="secondary">{it.createdAt}</Typography.Text>
                    <Tag color={it.visibility === 'private' ? 'orangered' : 'green'}>{it.visibility}</Tag>
                    <Link href={`/weibo/snapshot/${it.id}`}>
                      <Button type="text">查看该版本</Button>
                    </Link>
                  </Space>
                </Card>
              ))
            )}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                total={total || 0}
                current={page}
                pageSize={size}
                onChange={(p) => setPage(p)}
              />
            </div>
          </Space>
        )}
      </Space>
    </div>
  );
}