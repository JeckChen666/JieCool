"use client";
import {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import {getSnapshot} from "@/lib/weibo";
import {Alert, Button, Card, Descriptions, Space, Spin, Tag, Typography} from "@arco-design/web-react";

export default function WeiboSnapshotDetailPage() {
    const params = useParams();
    const idParam = params?.id as string | undefined;
    const snapId = idParam ? Number(idParam) : NaN;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<Awaited<ReturnType<typeof getSnapshot>> | null>(null);

    useEffect(() => {
        if (!snapId || Number.isNaN(snapId)) return;
        setLoading(true);
        setError(null);
        getSnapshot(snapId)
            .then((res) => setData(res))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [snapId]);

    return (
        <div style={{padding: 24}}>
            <Space size={16} direction="vertical" style={{width: '100%'}}>
                <Typography.Title heading={3}>快照详情</Typography.Title>
                <Space>
                    <Link href="/weibo">
                        <Button>返回列表</Button>
                    </Link>
                </Space>

                {Number.isNaN(snapId) && <Alert type="error" title="快照ID 参数无效"/>}
                {loading && (
                    <div style={{display: 'flex', justifyContent: 'center', padding: 24}}>
                        <Spin tip="加载中"/>
                    </div>
                )}
                {error && <Alert type="error" title="加载失败" content={error}/>}

                {!loading && !error && data && (
                    <Card bordered hoverable>
                        <Descriptions
                            title="基本信息"
                            column={2}
                            style={{marginBottom: 12}}
                            data={[
                                {label: "版本", value: data.version},
                                {label: "创建时间", value: data.createdAt},
                                {
                                    label: "可见性",
                                    value: (
                                        <Tag
                                            color={data.visibility === 'private' ? 'orangered' : 'green'}
                                        >
                                            {data.visibility}
                                        </Tag>
                                    )
                                },
                                {
                                    label: "资产数量",
                                    value: Array.isArray(data.assets) ? data.assets.length : 0
                                }
                            ]}
                        />
                        <Typography.Paragraph style={{whiteSpace: 'pre-wrap'}}>
                            {data.content}
                        </Typography.Paragraph>
                    </Card>
                )}
            </Space>
        </div>
    );
}