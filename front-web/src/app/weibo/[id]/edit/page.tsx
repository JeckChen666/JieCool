"use client";
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import Link from "next/link";
import {AssetInput, getDetail, updatePost} from "@/lib/weibo";
import {fileApi} from "@/lib/file-api";
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
    Modal,
    Select,
    Space,
    Spin,
    Typography
} from "@arco-design/web-react";

export default function WeiboEditPage() {
    const params = useParams();
    const router = useRouter();
    const idParam = params?.id as string | undefined;
    const id = idParam ? Number(idParam) : NaN;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [content, setContent] = useState("");
    const [visibility, setVisibility] = useState<"public" | "private">("public");
    const [city, setCity] = useState("");
    const [device, setDevice] = useState("");
    const [lat, setLat] = useState<string>("");
    const [lng, setLng] = useState<string>("");
    // 资产编辑相关状态
    const [assets, setAssets] = useState<AssetInput[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    // 预览相关
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        if (!id || Number.isNaN(id)) return;
        setLoading(true);
        setError(null);
        getDetail(id)
            .then((res) => {
                setContent(res.content || "");
                setVisibility((res.visibility as any) === "private" ? "private" : "public");
                setCity(res.city || "");
                setDevice(res.device || "");
                setLat(typeof res.lat === "number" ? String(res.lat) : "");
                setLng(typeof res.lng === "number" ? String(res.lng) : "");
                // 初始化资产列表
                const initAssets: AssetInput[] = Array.isArray(res.assets)
                    ? res.assets.map((a) => ({
                        fileId: a.fileId,
                        kind: (a.kind as any) === 'attachment' ? 'attachment' : 'image'
                    }))
                    : [];
                setAssets(initAssets);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);

    // 文件选择并上传
    const onSelectFiles: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploadError(null);
        setUploading(true);
        try {
            for (const file of files) {
                const res = await fileApi.uploadFile(file, "image");
                const info: any = await fileApi.getFileInfo(res.file_uuid);
                const idNum = Number(info?.id);
                if (!idNum || idNum <= 0) {
                    throw new Error("文件上传成功，但未获取到有效的文件ID");
                }
                // 自动添加为图片资产，并设置顺序为当前列表末尾
                setAssets((prev) => [...prev, {fileId: idNum, kind: 'image', sortOrder: prev.length}]);
                Message.success(`上传成功，文件ID: ${idNum}`);
            }
        } catch (err: any) {
            console.error(err);
            setUploadError(err?.message || "文件上传失败");
            Message.error(err?.message || "文件上传失败");
        } finally {
            setUploading(false);
        }
    };

    const removeAsset = (idx: number) => {
        setAssets((prev) => prev.filter((_, i) => i !== idx));
    };

    // 拖拽排序处理
    const onDragStart = (e: React.DragEvent, fromIdx: number) => {
        e.dataTransfer.setData('text/plain', String(fromIdx));
    };
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };
    const onDrop = (e: React.DragEvent, toIdx: number) => {
        e.preventDefault();
        const fromIdxStr = e.dataTransfer.getData('text/plain');
        const fromIdx = Number(fromIdxStr);
        if (Number.isNaN(fromIdx) || fromIdx === toIdx) return;
        setAssets((prev) => {
            const next = [...prev];
            const [moved] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, moved);
            // 重置顺序
            return next.map((a, i) => ({...a, sortOrder: i}));
        });
    };

    // 预览图片（通过 fileId 获取 uuid 与下载地址）
    const onPreviewImage = async (fileId: number) => {
        try {
            setPreviewLoading(true);
            const info: any = await fileApi.getFileInfoById(fileId).send();
            const uuid = info.file_uuid;
            const url = info.download_url || fileApi.getDownloadUrl(uuid);
            setPreviewUrl(url);
            setPreviewVisible(true);
        } catch (e: any) {
            Message.error(e?.message || '预览失败');
        } finally {
            setPreviewLoading(false);
        }
    };

    async function onSubmit() {
        if (!id || Number.isNaN(id)) {
            setError("ID 参数无效");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await updatePost({
                id,
                content,
                visibility,
                assets,
                city: city || undefined,
                device: device || undefined,
                lat: lat ? Number(lat) : undefined,
                lng: lng ? Number(lng) : undefined,
            });
            Message.success("保存成功");
            router.push(`/weibo/${id}`);
        } catch (e: any) {
            setError(e.message);
            Message.error(e.message || "保存失败");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{padding: 24}}>
            <Space size={16} direction="vertical" style={{width: '100%'}}>
                <Typography.Title heading={3}>编辑微博</Typography.Title>
                <Space>
                    <Link href={`/weibo/${id}`}>
                        <Button>返回详情</Button>
                    </Link>
                </Space>
                {Number.isNaN(id) && <Alert type="error" title="ID 参数无效"/>}
                {error && <Alert type="error" title="保存失败" content={error}/>}
                {loading && (
                    <div style={{display: 'flex', justifyContent: 'center', padding: 24}}>
                        <Spin tip="加载中"/>
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
                    <Divider orientation="left">图片资产</Divider>
                    <Space direction="vertical" style={{width: '100%'}}>
                        <Card bordered>
                            <Space direction="vertical" style={{width: '100%'}}>
                                <Form.Item label="选择图片上传（可多选）">
                                    <input id="editImageInput" type="file" accept="image/*" multiple
                                           onChange={onSelectFiles} style={{display: 'none'}}/>
                                    <Button type="primary"
                                            onClick={() => (document.getElementById('editImageInput') as HTMLInputElement | null)?.click()}>选择文件</Button>
                                </Form.Item>
                                {uploading && <Spin tip="上传中"/>}
                                {uploadError && <Alert type="error" title="上传失败" content={uploadError}/>}
                            </Space>
                        </Card>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
                            {assets
                                .map((a, idx) => ({a, idx}))
                                .filter(({a}) => a.kind === 'image')
                                .map(({a, idx}) => (
                                    <Card
                                        key={`${a.fileId}-${idx}`}
                                        bordered
                                        style={{width: 160, position: 'relative'}}
                                        onDragOver={onDragOver}
                                        onDrop={(e) => onDrop(e, idx)}
                                    >
                                        {/* 拖拽手柄 */}
                                        <div
                                            draggable
                                            onDragStart={(e) => onDragStart(e, idx)}
                                            title="拖拽排序"
                                            style={{
                                                position: 'absolute',
                                                left: 8,
                                                top: 8,
                                                cursor: 'grab',
                                                fontSize: 12,
                                                color: '#999'
                                            }}
                                        >
                                            ⇅
                                        </div>
                                        {/* 操作区 */}
                                        <div style={{position: 'absolute', right: 8, top: 8, display: 'flex', gap: 6}}>
                                            <Button size="mini" onClick={() => onPreviewImage(a.fileId)}>预览</Button>
                                            <Button size="mini" status="danger"
                                                    onClick={() => removeAsset(idx)}>删除</Button>
                                        </div>
                                        <div style={{paddingTop: 24}}>
                                            <FileThumbnail fileId={a.fileId} size={120} clickable={true}/>
                                        </div>
                                        <Space direction="vertical" size={4} style={{marginTop: 8}}>
                                            <Typography.Text type="secondary">文件ID: {a.fileId}</Typography.Text>
                                            <Typography.Text
                                                type="secondary">顺序: {a.sortOrder ?? idx}</Typography.Text>
                                        </Space>
                                    </Card>
                                ))}
                        </div>
                    </Space>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>保存</Button>
                    </Form.Item>
                </Form>
            </Space>
            <Modal
                visible={previewVisible}
                title="图片预览"
                onCancel={() => setPreviewVisible(false)}
                footer={null}
            >
                {previewLoading ? (
                    <div style={{display: 'flex', justifyContent: 'center', padding: 24}}>
                        <Spin tip="加载中"/>
                    </div>
                ) : (
                    previewUrl ? (
                        <img src={previewUrl} alt="预览" style={{maxWidth: '100%', borderRadius: 8}}/>
                    ) : (
                        <Alert type="error" title="预览链接无效"/>
                    )
                )}
            </Modal>
        </div>
    );
}