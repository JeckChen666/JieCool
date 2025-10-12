"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDetail, deletePost } from "@/lib/weibo";
import { Typography, Space, Button, Tag, Spin, Alert, Card, Descriptions, Message, Popconfirm } from "@arco-design/web-react";
import FileThumbnail from "@/components/FileThumbnail";

export default function WeiboDetailPage() {
  const params = useParams();
  const idParam = params?.id as string | undefined;
  const id = idParam ? Number(idParam) : NaN;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof getDetail>> | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError(null);
    getDetail(id)
      .then((res) => setData(res))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div style={{ padding: 24 }}>
      <Space size={16} direction="vertical" style={{ width: '100%' }}>
        <Typography.Title heading={3}>微博详情</Typography.Title>
        <Space>
          <Link href="/weibo">
            <Button>返回列表</Button>
          </Link>
        </Space>

        {Number.isNaN(id) && <Alert type="error" title="ID 参数无效" />}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin tip="加载中" />
          </div>
        )}
        {error && <Alert type="error" title="加载失败" content={error} />}

        {!loading && !error && data && (
          <Card bordered hoverable>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space size={8}>
                <Typography.Text type="secondary">{data.createdAt}</Typography.Text>
                <Tag color={data.visibility === 'private' ? 'orangered' : 'green'}>{data.visibility}</Tag>
              </Space>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>{data.content}</Typography.Paragraph>
              <Descriptions bordered column={1} title="附加信息">
                {data.city && <Descriptions.Item label="城市">{data.city}</Descriptions.Item>}
                {typeof data.lat === 'number' && typeof data.lng === 'number' && (
                  <Descriptions.Item label="坐标">({data.lat}, {data.lng})</Descriptions.Item>
                )}
                <Descriptions.Item label="设备">{data.device || '设备未知'}</Descriptions.Item>
                <Descriptions.Item label="资产数量">{Array.isArray(data.assets) ? data.assets.length : 0}</Descriptions.Item>
              </Descriptions>
              {Array.isArray(data.assets) && data.assets.filter(a => a.kind === 'image').length > 0 && (
                <Space size={10} wrap>
                  {data.assets.filter(a => a.kind === 'image').map((a, idx) => (
                    <FileThumbnail key={`${a.fileId}-${idx}`} fileId={a.fileId} size={120} clickable={true} />
                  ))}
                </Space>
              )}
              <Space>
                <Link href={`/weibo/${id}/edit`}>
                  <Button type="primary">编辑</Button>
                </Link>
                <Link href={`/weibo/${id}/snapshots`}>
                  <Button>查看历史</Button>
                </Link>
                <Popconfirm
                  title="确认删除这条微博吗？"
                  okText="删除"
                  cancelText="取消"
                  onOk={async () => {
                    if (!id || Number.isNaN(id)) return;
                    try {
                      setDeleting(true);
                      await deletePost(id);
                      Message.success("删除成功");
                      router.push("/weibo");
                    } catch (e: any) {
                      Message.error(e?.message || "删除失败");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  <Button status="danger" loading={deleting}>删除</Button>
                </Popconfirm>
              </Space>
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
}