"use client";
import {useEffect, useState} from "react";
import {fileApi} from "@/lib/file-api";
import {BASE_URL} from "@/lib/alova";

type Props = {
    fileId: number;
    size?: number; // square thumbnail size
    clickable?: boolean; // wrap with anchor to open original
};

export default function FileThumbnail({fileId, size = 100, clickable = true}: Props) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileUuid, setFileUuid] = useState<string | null>(null);
    const [thumbUrl, setThumbUrl] = useState<string | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!fileId || fileId <= 0) {
            setError("文件ID无效");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        fileApi
            .getFileInfoById(fileId)
            .send()
            .then((info) => {
                const uuid = info.file_uuid;
                setFileUuid(uuid);
                const tu = info.thumbnail_url || fileApi.getThumbnailUrl(uuid);
                const du = info.download_url || fileApi.getDownloadUrl(uuid);
                setThumbUrl(tu);
                setDownloadUrl(du);
            })
            .catch((e: any) => setError(e.message || "获取文件信息失败"))
            .finally(() => setLoading(false));
    }, [fileId]);

    if (loading) {
        return <div style={{width: size, height: size, background: "#f5f5f5", borderRadius: 8}}/>;
    }
    if (error || !thumbUrl) {
        return <div style={{
            width: size,
            height: size,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff1f0",
            color: "#cf1322",
            border: "1px solid #ffccc7",
            borderRadius: 8,
            fontSize: 12
        }}>缩略图加载失败</div>;
    }
    // 统一将相对路径转换为后端绝对地址，避免 Next.js /api 路由重写不生效导致 404
    // 使用前端源地址，确保经过 Next.js rewrites，再由前端代理到后端
    const prefixURL = BASE_URL;
    const rawThumb = thumbUrl.startsWith("http") ? thumbUrl : `${prefixURL}${thumbUrl}`;
    const sep = rawThumb.includes("?") ? "&" : "?";
    const thumbSrc = `${rawThumb}${sep}width=${size}&height=${size}`;
    const downloadHref = downloadUrl ? (downloadUrl.startsWith("http") ? downloadUrl : `${prefixURL}${downloadUrl}`) : undefined;
    const img = (
        <img
            src={thumbSrc}
            alt="thumbnail"
            style={{width: size, height: size, objectFit: "cover", borderRadius: 8, border: "1px solid #eee"}}
            onError={(e) => {
                if (downloadHref && e.currentTarget.src !== downloadHref) {
                    e.currentTarget.src = downloadHref;
                }
            }}
        />
    );
    if (clickable && downloadHref) {
        return (
            <a href={downloadHref} target="_blank" rel="noopener noreferrer">
                {img}
            </a>
        );
    }
    return img;
}