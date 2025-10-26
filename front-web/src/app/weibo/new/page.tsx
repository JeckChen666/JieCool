"use client";
import {useState} from "react";
import {AssetInput, createPost} from "@/lib/weibo";
import {fileApi} from "@/lib/file-api";
import {useRouter} from "next/navigation";
import FileThumbnail from "@/components/features/weibo/FileThumbnail";
import {
    Alert,
    Button,
    Card,
    Divider,
    Form,
    Grid,
    Input,
    Message,
    Select,
    Space,
    Spin,
    Tag,
    Typography
} from "@arco-design/web-react";

export default function WeiboNewPage() {
    const router = useRouter();
    const [content, setContent] = useState("");
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [assets, setAssets] = useState<AssetInput[]>([]);
    const [city, setCity] = useState("");
    const [device, setDevice] = useState(typeof navigator !== 'undefined' ? navigator.userAgent : "");
    const [lat, setLat] = useState<string>("");
    const [lng, setLng] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // 文件上传相关状态
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string>("");
    // 拖拽排序
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const onSelectFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadError(null);
        setUploading(true);
        try {
            // 上传文件到后端，分类为 image
            const res = await fileApi.uploadFile(file, "image");
            // 上传成功后，根据返回的 file_uuid 查询文件信息以获取 files.id
            const info: any = await fileApi.getFileInfo(res.file_uuid);
            const idNum = Number(info?.id);
            if (!idNum || idNum <= 0) {
                throw new Error("文件上传成功，但未获取到有效的文件ID");
            }
            // 自动添加为图片资产，排序追加到末尾
            setAssets((prev) => [...prev, {fileId: idNum, kind: 'image', sortOrder: prev.length}]);
            // 预览图：优先使用缩略图（相对路径，走前端域由 Next.js 重写代理），否则使用下载地址
            const previewUrl = res.thumbnail_url
                ? fileApi.getThumbnailUrl(res.file_uuid)
                : fileApi.getDownloadUrl(res.file_uuid);
            setUploadedPreviewUrl(previewUrl);
            Message.success(`上传成功，文件ID: ${idNum}`);
        } catch (err: any) {
            console.error(err);
            setUploadError(err?.message || "文件上传失败");
            Message.error(err?.message || "文件上传失败");
        } finally {
            setUploading(false);
        }
    };

    // 拖拽处理
    const handleDragStart = (idx: number) => setDraggedIndex(idx);
    const handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault();
    };
    const handleDrop = (idx: number) => {
        if (draggedIndex === null || draggedIndex === idx) return;
        setAssets((prev) => {
            const next = [...prev];
            const [moved] = next.splice(draggedIndex, 1);
            next.splice(idx, 0, moved);
            // 重新计算 sortOrder
            return next.map((a, i) => ({...a, sortOrder: i}));
        });
        setDraggedIndex(null);
    };

    const removeAsset = (idx: number) => {
        setAssets((prev) => prev.filter((_, i) => i !== idx));
    };

    const onSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload: any = {content, visibility, assets, city, device};
            const latNum = parseFloat(lat);
            const lngNum = parseFloat(lng);
            if (!Number.isNaN(latNum) && Math.abs(latNum) <= 90) payload.lat = latNum;
            if (!Number.isNaN(lngNum) && Math.abs(lngNum) <= 180) payload.lng = lngNum;
            const res = await createPost(payload);
            Message.success("发布成功");
            router.push(`/weibo/${res.id}`);
        } catch (e: any) {
            setError(e.message);
            Message.error(e.message || "发布失败");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{padding: 24}}>
            <Space size={16} direction="vertical" style={{width: '100%'}}>
                <Typography.Title heading={3}>发布微博</Typography.Title>
                {error && <Alert type="error" title="发布失败" content={error}/>}
                {loading && (
                    <div style={{display: 'flex', justifyContent: 'center', padding: 24}}>
                        <Spin tip="发布中"/>
                    </div>
                )}

                <Form layout="vertical" style={{maxWidth: 720}} onSubmit={onSubmit}>
                    <Form.Item label="内容" required>
                        <Input.TextArea value={content} onChange={setContent as any} rows={6} placeholder="输入内容"/>
                    </Form.Item>
                    <Grid.Row gutter={12}>
                        <Grid.Col span={12}>
                            <Form.Item label="可见性" required>
                                <Select value={visibility} onChange={(val) => setVisibility(val as any)}>
                                    <Select.Option value="public">公开</Select.Option>
                                    <Select.Option value="private">私密</Select.Option>
                                </Select>
                            </Form.Item>
                        </Grid.Col>
                        <Grid.Col span={12}>
                            <Form.Item label="城市">
                                <Input value={city} onChange={setCity as any} placeholder="如：杭州"/>
                            </Form.Item>
                        </Grid.Col>
                    </Grid.Row>
                    <Grid.Row gutter={12}>
                        <Grid.Col span={12}>
                            <Form.Item label="设备">
                                <Input value={device} onChange={setDevice as any} placeholder="如：iPhone 15"/>
                            </Form.Item>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Form.Item label="纬度">
                                <Input value={lat} onChange={setLat as any} placeholder="示例：30.12"/>
                            </Form.Item>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Form.Item label="经度">
                                <Input value={lng} onChange={setLng as any} placeholder="示例：120.22"/>
                            </Form.Item>
                        </Grid.Col>
                    </Grid.Row>

                    <Divider orientation="left">资产</Divider>
                    <Space direction="vertical" style={{width: '100%'}}>
                        <Card bordered>
                            <Space direction="vertical" style={{width: '100%'}}>
                                <Form.Item label="选择图片上传">
                                    {/* 隐藏原生文件选择，用按钮触发，提高视觉一致性 */}
                                    <input id="newImageInput" type="file" accept="image/*" onChange={onSelectFile}
                                           style={{display: 'none'}}/>
                                    <Button type="primary"
                                            onClick={() => (document.getElementById('newImageInput') as HTMLInputElement | null)?.click()}>选择文件</Button>
                                </Form.Item>
                                {uploading && <Spin tip="上传中"/>}
                                {uploadError && <Alert type="error" title="上传失败" content={uploadError}/>}
                                {uploadedPreviewUrl && (
                                    <div style={{maxWidth: 320}}>
                                        {/* 使用相对路径，确保经由前端域与 Next.js 重写 */}
                                        <img src={uploadedPreviewUrl} alt="预览"
                                             style={{maxWidth: '100%', borderRadius: 8}}/>
                                    </div>
                                )}
                            </Space>
                        </Card>
                        {assets.map((a, idx) => (
                            <Card
                                key={idx}
                                bordered
                                draggable
                                onDragStart={() => handleDragStart(idx)}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(idx)}
                                style={{cursor: 'grab'}}
                            >
                                <Space size={12} align="center">
                                    <Tag>#{idx + 1}</Tag>
                                    <FileThumbnail fileId={a.fileId} size={80} clickable={true}/>
                                    <Space direction="vertical" size={4}>
                                        <Typography.Text>文件ID: {a.fileId}</Typography.Text>
                                        <Typography.Text>类型: {a.kind}</Typography.Text>
                                        <Typography.Text>顺序: {a.sortOrder ?? 0}</Typography.Text>
                                    </Space>
                                    <Button status="danger" onClick={() => removeAsset(idx)}>删除</Button>
                                </Space>
                            </Card>
                        ))}
                    </Space>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>提交</Button>
                    </Form.Item>
                </Form>
            </Space>
        </div>
    );
}