'use client';

import React, {useCallback, useRef, useState} from 'react';
import {Button, Card, Message, Progress, Select, Space, Typography} from '@arco-design/web-react';
import {IconDelete, IconFile, IconUpload} from '@arco-design/web-react/icon';
import {fileApi, fileUtils, UploadFileResponse} from '@/lib/file-api';
import styles from './FileUpload.module.css';

const {Title, Text} = Typography;
const {Option} = Select;

interface FileUploadProps {
    /** 上传成功回调 */
    onUploadSuccess?: (file: UploadFileResponse) => void;
    /** 上传失败回调 */
    onUploadError?: (error: Error) => void;
}

interface UploadingFile {
    file: File;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    result?: UploadFileResponse;
    error?: string;
}

const FILE_CATEGORIES = [
    {label: '自动检测', value: ''},
    {label: '图片', value: 'image'},
    {label: '文档', value: 'document'},
    {label: '视频', value: 'video'},
    {label: '音频', value: 'audio'},
    {label: '压缩包', value: 'archive'},
    {label: '其他', value: 'other'}
];

export default function FileUpload({onUploadSuccess, onUploadError}: FileUploadProps) {
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 处理文件上传
    const handleFileUpload = useCallback(async (files: File[]) => {
        const newUploadingFiles: UploadingFile[] = files.map(file => ({
            file,
            progress: 0,
            status: 'uploading' as const
        }));

        setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

        // 逐个上传文件
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileIndex = uploadingFiles.length + i;

            try {
                // 创建上传请求
                const uploadRequest = fileApi.uploadFile(file, selectedCategory || undefined);

                // 模拟进度更新（实际项目中可以使用XMLHttpRequest监听进度）
                const progressInterval = setInterval(() => {
                    setUploadingFiles(prev => {
                        const updated = [...prev];
                        if (updated[fileIndex] && updated[fileIndex].progress < 90) {
                            // 确保进度不会超过90%，并且增量合理
                            const increment = Math.random() * 10; // 减少增量范围
                            updated[fileIndex].progress = Math.min(90, updated[fileIndex].progress + increment);
                        }
                        return updated;
                    });
                }, 200);

                // 执行上传
                const result = await uploadRequest.send();

                // 清除进度定时器
                clearInterval(progressInterval);

                // 更新上传状态
                setUploadingFiles(prev => {
                    const updated = [...prev];
                    if (updated[fileIndex]) {
                        updated[fileIndex].progress = 100;
                        updated[fileIndex].status = 'success';
                        updated[fileIndex].result = result;
                    }
                    return updated;
                });

                // 调用成功回调
                onUploadSuccess?.(result);
                Message.success(`文件 "${file.name}" 上传成功`);

            } catch (error) {
                // 更新错误状态
                setUploadingFiles(prev => {
                    const updated = [...prev];
                    if (updated[fileIndex]) {
                        updated[fileIndex].status = 'error';
                        updated[fileIndex].error = error instanceof Error ? error.message : '上传失败';
                    }
                    return updated;
                });

                // 调用错误回调
                const uploadError = error instanceof Error ? error : new Error('上传失败');
                onUploadError?.(uploadError);
                Message.error(`文件 "${file.name}" 上传失败: ${uploadError.message}`);
            }
        }
    }, [selectedCategory, uploadingFiles.length, onUploadSuccess, onUploadError]);

    // 处理拖拽上传
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileUpload(files);
        }
    }, [handleFileUpload]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    // 处理文件选择
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            handleFileUpload(files);
        }
        // 清空input值，允许重复选择同一文件
        e.target.value = '';
    }, [handleFileUpload]);

    // 移除上传项
    const removeUploadItem = useCallback((index: number) => {
        setUploadingFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    // 清空所有上传项
    const clearAllUploads = useCallback(() => {
        setUploadingFiles([]);
    }, []);

    return (
        <Card className={styles.uploadCard}>
            <div className={styles.uploadHeader}>
                <Title heading={6}>文件上传</Title>
                <Space>
                    <Select
                        placeholder="选择文件分类"
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        style={{width: 120}}
                        size="small"
                    >
                        {FILE_CATEGORIES.map(category => (
                            <Option key={category.value} value={category.value}>
                                {category.label}
                            </Option>
                        ))}
                    </Select>
                    {uploadingFiles.length > 0 && (
                        <Button size="small" onClick={clearAllUploads}>
                            清空列表
                        </Button>
                    )}
                </Space>
            </div>

            {/* 拖拽上传区域 */}
            <div
                className={styles.dropZone}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className={styles.dropZoneContent}>
                    <IconUpload style={{fontSize: 48, color: '#165DFF'}}/>
                    <Title heading={6} style={{margin: '16px 0 8px'}}>
                        点击或拖拽文件到此处上传
                    </Title>
                    <Text type="secondary">
                        支持单个或批量上传，支持所有文件类型
                    </Text>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{display: 'none'}}
                    onChange={handleFileSelect}
                />
            </div>

            {/* 上传列表 */}
            {uploadingFiles.length > 0 && (
                <div className={styles.uploadList}>
                    <Title heading={6} style={{marginBottom: 16}}>
                        上传列表 ({uploadingFiles.length})
                    </Title>
                    {uploadingFiles.map((item, index) => (
                        <div key={index} className={styles.uploadItem}>
                            <div className={styles.fileInfo}>
                                <IconFile style={{fontSize: 16, marginRight: 8}}/>
                                <div className={styles.fileDetails}>
                                    <Text className={styles.fileName}>{item.file.name}</Text>
                                    <Text type="secondary" className={styles.fileSize}>
                                        {fileUtils.formatFileSize(item.file.size)}
                                    </Text>
                                </div>
                            </div>

                            <div className={styles.uploadProgress}>
                                {item.status === 'uploading' && (
                                    <Progress
                                        percent={Math.min(100, Math.round(item.progress))}
                                        size="small"
                                        style={{width: 120}}
                                    />
                                )}
                                {item.status === 'success' && (
                                    <Text type="success">上传成功</Text>
                                )}
                                {item.status === 'error' && (
                                    <Text type="error" title={item.error}>
                                        上传失败
                                    </Text>
                                )}
                            </div>

                            <Button
                                type="text"
                                size="small"
                                icon={<IconDelete/>}
                                onClick={() => removeUploadItem(index)}
                                className={styles.removeButton}
                            />
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}