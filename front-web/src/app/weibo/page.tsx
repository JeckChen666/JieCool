"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listPosts, WeiboItem } from "@/lib/weibo";
import FileThumbnail from "@/components/FileThumbnail";
import { Typography, Space, Button, Tag, Spin, Alert, Pagination, Card, Modal, Message, Input, DatePicker, Select } from "@arco-design/web-react";
import { fileApi } from "@/lib/file-api";

export default function WeiboListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<WeiboItem[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);
  // 筛选条件
  const [keyword, setKeyword] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [dateRange, setDateRange] = useState<any[]>([]);
  // 已应用的筛选条件（点击“搜索”后生效）
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedVisibility, setAppliedVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [appliedDateRange, setAppliedDateRange] = useState<any[]>([]);
  // 图片预览
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  // 行内拖拽滚动状态
  const [dragState, setDragState] = useState<{ el: HTMLDivElement | null; startX: number; scrollLeft: number; dragging: boolean }>({ el: null, startX: 0, scrollLeft: 0, dragging: false });

  useEffect(() => {
    setLoading(true);
    setError(null);
    // 仅 visibility 由后端支持；其他在前端进行筛选
    listPosts({ page, size, visibility: appliedVisibility === 'all' ? undefined : appliedVisibility })
      .then((res) => {
        // 兼容后端返回字段异常的情况，保证前端不崩溃
        setItems(Array.isArray((res as any)?.list) ? (res as any).list : []);
        setTotal(typeof (res as any)?.total === 'number' ? (res as any).total : 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, size, appliedVisibility]);

  // 前端筛选（keyword、dateRange）
  const filteredItems = items.filter((it) => {
    let ok = true;
    if (appliedKeyword.trim()) {
      ok = ok && (it.content?.toLowerCase().includes(appliedKeyword.trim().toLowerCase()));
    }
    if (appliedDateRange && appliedDateRange.length === 2 && appliedDateRange[0] && appliedDateRange[1]) {
      const start = new Date(appliedDateRange[0]).getTime();
      const end = new Date(appliedDateRange[1]).getTime();
      const created = new Date(it.createdAt).getTime();
      ok = ok && created >= start && created <= end;
    }
    return ok;
  });
  const isFilterActive = !!appliedKeyword.trim() || (appliedDateRange && appliedDateRange.length === 2 && appliedDateRange[0] && appliedDateRange[1]);
  const displayTotal = isFilterActive ? filteredItems.length : (total || 0);
  const pages = Math.max(1, Math.ceil(displayTotal / size));

  const resetFilters = () => {
    setKeyword("");
    setVisibilityFilter('all');
    setDateRange([]);
    setAppliedKeyword("");
    setAppliedVisibility('all');
    setAppliedDateRange([]);
    setPage(1);
  };

  const applySearch = () => {
    setAppliedKeyword(keyword.trim());
    setAppliedDateRange(Array.isArray(dateRange) ? dateRange : []);
    setAppliedVisibility(visibilityFilter);
    setPage(1);
  };

  const onPreviewImage = async (fileId: number) => {
    try {
      setPreviewLoading(true);
      const info: any = await fileApi.getFileInfoById(fileId).send();
      const uuid = info.file_uuid;
      const url = info.download_url || fileApi.getDownloadUrl(uuid);
      setPreviewUrl(url);
      setPreviewVisible(true);
    } catch (e: any) {
      Message.error(e?.message || "预览失败");
    } finally {
      setPreviewLoading(false);
    }
  };

  const makeDragHandlers = () => {
    const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
      const el = e.currentTarget as HTMLDivElement;
      setDragState({ el, startX: e.clientX, scrollLeft: el.scrollLeft, dragging: true });
      el.style.cursor = 'grabbing';
    };
    const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
      if (!dragState.dragging || !dragState.el) return;
      const dx = e.clientX - dragState.startX;
      dragState.el.scrollLeft = dragState.scrollLeft - dx;
    };
    const endDrag = () => {
      if (dragState.el) dragState.el.style.cursor = 'grab';
      setDragState({ el: null, startX: 0, scrollLeft: 0, dragging: false });
    };
    return { onMouseDown, onMouseMove, onMouseUp: endDrag, onMouseLeave: endDrag };
  };

  return (
    <div style={{ padding: 24 }}>
      <Space size={16} direction="vertical" style={{ width: '100%' }}>
        <Typography.Title heading={3}>微博列表</Typography.Title>
        <Space>
          <Link href="/weibo/new">
            <Button type="primary">发布微博</Button>
          </Link>
        </Space>

        {/* 搜索筛选区域 */}
        <Card bordered style={{ marginTop: 8 }}>
          <Space wrap>
            <Input
              allowClear
              value={keyword}
              onChange={setKeyword}
              placeholder="搜索正文（模糊匹配）"
              style={{ width: 240 }}
            />
            <DatePicker.RangePicker
              value={dateRange as any}
              onChange={(v) => setDateRange(v as any)}
              style={{ width: 320 }}
              allowClear
              placeholder={["开始时间", "结束时间"]}
            />
            <Select
              value={visibilityFilter}
              onChange={(v) => setVisibilityFilter(v as any)}
              style={{ width: 160 }}
            >
              <Select.Option value="all">全部可见性</Select.Option>
              <Select.Option value="public">公开</Select.Option>
              <Select.Option value="private">非公开</Select.Option>
            </Select>
            <Button type="primary" onClick={applySearch}>搜索</Button>
            <Button onClick={resetFilters}>重置</Button>
          </Space>
        </Card>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin tip="加载中" />
          </div>
        )}

        {error && <Alert type="error" title="加载失败" content={error} />}

        {!loading && !error && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {items.length === 0 ? (
              <Alert type="normal" title="暂无内容" />
            ) : (
              (isFilterActive ? filteredItems : items).map((it, idx) => {
                const imgAssets = Array.isArray(it.assets) ? it.assets.filter(a => a.kind === 'image') : [];
                const dragHandlers = makeDragHandlers();
                return (
                  <Card key={`${it.id}-${idx}`} bordered hoverable>
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      {/* 主体：微博内容 */}
                      <Typography.Paragraph
                        onClick={() => router.push(`/weibo/${it.id}`)}
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          marginTop: 4,
                          cursor: 'pointer',
                          // 使用 clamp 在不同分辨率下保持舒适阅读大小
                          fontSize: 'clamp(14px, 2.2vw, 18px)',
                          lineHeight: 1.6,
                          fontWeight: 500,
                        }}
                      >
                        {it.content}
                      </Typography.Paragraph>
                      {/* 图片一行，小方块，超出可左右拖动滚动 */}
                      {imgAssets.length > 0 && (
                        <div
                          style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0', cursor: 'grab' }}
                          {...dragHandlers}
                        >
                          {imgAssets.map((a, idx) => (
                            <div key={`${a.fileId}-${idx}`} style={{ flex: '0 0 auto' }} onClick={() => onPreviewImage(a.fileId)}>
                              <FileThumbnail fileId={a.fileId} size={80} clickable={false} />
                            </div>
                          ))}
                        </div>
                      )}
                      {/* 底部信息行：左侧时间，右侧地址 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space size={8}>
                          <Typography.Text type="secondary" style={{ fontSize: 'clamp(12px, 1.6vw, 14px)' }}>
                            {it.createdAt}
                          </Typography.Text>
                          <Tag
                            color={it.visibility === 'private' ? 'orangered' : 'green'}
                            style={{ fontSize: 'clamp(11px, 1.4vw, 13px)' }}
                          >
                            {it.visibility}
                          </Tag>
                        </Space>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 'clamp(12px, 1.6vw, 14px)', textAlign: 'right' }}
                        >
                          {it.city ? it.city : ''}
                          {typeof it.lat === 'number' && typeof it.lng === 'number' ? ` (${it.lat}, ${it.lng})` : ''}
                        </Typography.Text>
                      </div>
                      {/* 移除“查看详情”按钮，点击文本主体即可跳转 */}
                    </Space>
                  </Card>
                );
              })
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
      <Modal
        visible={previewVisible}
        title="图片预览"
        onCancel={() => setPreviewVisible(false)}
        footer={null}
      >
        {previewLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin tip="加载中" />
          </div>
        ) : (
          previewUrl ? (
            <img src={previewUrl} alt="预览" style={{ maxWidth: '100%', borderRadius: 8 }} />
          ) : (
            <Alert type="error" title="预览链接无效" />
          )
        )}
      </Modal>
    </div>
  );
}