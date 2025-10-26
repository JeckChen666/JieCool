'use client';

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Alert,
    Button,
    Card,
    Checkbox,
    Empty,
    Image,
    Input,
    Message,
    Modal,
    Pagination,
    Progress,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography
} from '@arco-design/web-react';
import {
    IconArchive,
    IconDelete,
    IconDownload,
    IconExclamationCircle,
    IconEye,
    IconFile,
    IconImage,
    IconMusic,
    IconRefresh,
    IconVoice
} from '@arco-design/web-react/icon';
import {fileApi, FileListItem, fileUtils} from '@/lib/file-api';
import {useRequest} from 'alova/client';
import styles from './FileList.module.css';

const {Title, Text} = Typography;
const {Option} = Select;

interface FileListProps {
    /** 刷新触发器 */
    refreshTrigger?: number;
    /** 查看详情回调 */
    onViewDetail?: (file: FileListItem) => void;
    /** 下载文件回调 */
    onDownload?: (file: FileListItem) => void;
    /** 删除文件回调 */
    onDelete?: (file: FileListItem) => void;
}

// 删除确认对话框的数据接口
interface DeleteConfirmData {
    files: FileListItem[];
    totalSize: number;
    hasImportantFiles: boolean;
}


const FILE_CATEGORIES = [
    {label: '全部分类', value: ''},
    {label: '图片', value: 'image'},
    {label: '文档', value: 'document'},
    {label: '视频', value: 'video'},
    {label: '音频', value: 'audio'},
    {label: '压缩包', value: 'archive'},
    {label: '其他', value: 'other'}
];

const SORT_OPTIONS = [
    {label: '创建时间', value: 'created_at'},
    {label: '文件大小', value: 'file_size'},
    {label: '下载次数', value: 'download_count'},
    {label: '文件名', value: 'file_name'}
];

const SORT_ORDERS = [
    {label: '降序', value: 'desc'},
    {label: '升序', value: 'asc'}
];

export default function FileList({refreshTrigger, onViewDetail, onDownload, onDelete}: FileListProps) {
    // 原有状态
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

    // 新增状态：批量选择和删除
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<FileListItem[]>([]);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [deleteConfirmData, setDeleteConfirmData] = useState<DeleteConfirmData | null>(null);
    const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // 构建搜索参数
    const searchParams = useMemo(() => ({
        page: currentPage,
        page_size: pageSize,
        keyword: searchKeyword,
        category: selectedCategory,
        sort_by: sortField,
        sort_order: sortOrder
    }), [currentPage, pageSize, searchKeyword, selectedCategory, sortField, sortOrder]);

    // 获取文件列表
    const {
        data: rawFileListData,
        loading,
        error,
        send: fetchFileList
    } = useRequest(() => fileApi.getFileList(searchParams), {
        immediate: true,
        initialData: {list: [], total: 0, page: 1, page_size: 10, total_pages: 1}
    });

    // 在组件中处理数据转换
    const fileListData = useMemo(() => {
        if (!rawFileListData) {
            return {list: [], total: 0, page: 1, page_size: 10, total_pages: 1};
        }

        // 如果有list字段，进行转换（后端返回的格式）
        if (rawFileListData.list) {
            const list = (rawFileListData.list || []).map((item: any) => ({
                ...item,
                category: item.file_category || item.category || '未分类'
            }));

            return {
                list,
                total: rawFileListData.total || 0,
                page: rawFileListData.page || 1,
                page_size: rawFileListData.page_size || 10,
                total_pages: rawFileListData.total_pages || 0
            };
        }

        // 如果已经是转换后的格式，直接返回
        return rawFileListData;
    }, [rawFileListData]);

    // 删除文件
    const {
        loading: deleteLoading,
        send: deleteFile
    } = useRequest((fileUuid: string) => fileApi.deleteFile(fileUuid), {
        immediate: false
    });

    // 监听刷新触发器
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            fetchFileList();
        }
    }, [refreshTrigger]);

    // 监听搜索参数变化
    useEffect(() => {
        fetchFileList();
    }, [searchParams]);

    // 处理搜索
    const handleSearch = useCallback((keyword: string) => {
        setSearchKeyword(keyword);
        setCurrentPage(1);
    }, []);

    // 处理分类筛选
    const handleCategoryChange = useCallback((category: string) => {
        setSelectedCategory(category);
        setCurrentPage(1);
    }, []);

    // 处理排序
    const handleSortChange = useCallback((sortBy: string, sortOrder: string) => {
        setSortField(sortBy);
        setSortOrder(sortOrder);
        setCurrentPage(1);
    }, []);

    // 处理分页
    const handlePageChange = useCallback((page: number, size: number) => {
        setCurrentPage(page);
        setPageSize(size);
    }, []);

    // 处理页面大小变化
    const handlePageSizeChange = useCallback((current: number, size: number) => {
        setCurrentPage(current);
        setPageSize(size);
    }, []);

    // 处理文件下载
    const handleDownload = useCallback((file: FileListItem) => {
        // 只调用父组件的下载回调，避免重复下载
        onDownload?.(file);
    }, [onDownload]);

    // 处理行选择
    const handleRowSelection = useCallback((selectedRowKeys: (string | number)[], selectedRows: FileListItem[]) => {
        setSelectedRowKeys(selectedRowKeys as string[]);
        setSelectedFiles(selectedRows);
    }, []);

    // 全选/取消全选
    const handleSelectAll = useCallback((checked: boolean) => {
        if (checked && fileListData?.list) {
            const allKeys = fileListData.list.map(file => file.file_uuid);
            setSelectedRowKeys(allKeys);
            setSelectedFiles(fileListData.list);
        } else {
            setSelectedRowKeys([]);
            setSelectedFiles([]);
        }
    }, [fileListData?.list]);

    // 分析删除文件的风险等级
    const analyzeDeleteRisk = useCallback((files: FileListItem[]): DeleteConfirmData => {
        const totalSize = files.reduce((sum, file) => sum + file.file_size, 0);

        // 判断是否包含重要文件（大文件、特定类型等）
        const hasImportantFiles = files.some(file =>
            file.file_size > 10 * 1024 * 1024 || // 大于10MB
            file.download_count > 5 || // 下载次数超过5次
            ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mime_type)
        );

        return {
            files,
            totalSize,
            hasImportantFiles
        };
    }, []);

    // 显示删除确认对话框
    const showDeleteConfirm = useCallback((files: FileListItem[]) => {
        const confirmData = analyzeDeleteRisk(files);
        setDeleteConfirmData(confirmData);
        setDeleteConfirmVisible(true);
    }, [analyzeDeleteRisk]);


    // 单个文件删除
    const handleSingleDelete = useCallback((file: FileListItem) => {
        showDeleteConfirm([file]);
    }, [showDeleteConfirm]);

    // 批量删除
    const handleBatchDelete = useCallback(() => {
        if (selectedFiles.length === 0) {
            Message.warning('请先选择要删除的文件');
            return;
        }
        showDeleteConfirm(selectedFiles);
    }, [selectedFiles, showDeleteConfirm]);

    // 处理第一次确认后的逻辑
    const handleConfirmDelete = useCallback(() => {
        if (!deleteConfirmData) return;

        // 显示第二次确认对话框
        Modal.confirm({
            title: '最终确认',
            content: `您确定要删除这 ${deleteConfirmData.files.length} 个文件吗？此操作不可撤销！`,
            okText: '确认删除',
            cancelText: '取消',
            okButtonProps: {
                status: 'danger' as const,
                size: 'large' as const
            },
            cancelButtonProps: {
                size: 'large' as const
            },
            onOk: () => {
                performDelete(deleteConfirmData.files);
                setDeleteConfirmData(null);
            },
            onCancel: () => {
                setDeleteConfirmData(null);
            }
        });
    }, [deleteConfirmData]);

    // 执行删除操作
    const performDelete = useCallback(async (files: FileListItem[]) => {
        setBatchDeleteLoading(true);

        try {
            // 批量删除API调用
            const deletePromises = files.map(file => deleteFile(file.file_uuid));
            await Promise.all(deletePromises);

            // 显示成功消息
            Message.success(`已删除 ${files.length} 个文件`);

            // 刷新列表
            fetchFileList();

            // 清空选择
            setSelectedRowKeys([]);
            setSelectedFiles([]);

        } catch (error) {
            Message.error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            setBatchDeleteLoading(false);
            setDeleteConfirmVisible(false);
        }
    }, [deleteFile, fetchFileList]);

    // 处理查看详情
    const handleViewDetails = useCallback((file: FileListItem) => {
        onViewDetail?.(file);
    }, [onViewDetail]);

    // 处理刷新
    const handleRefresh = useCallback(() => {
        fetchFileList();
    }, [fetchFileList]);

    // 处理表格变化（排序等）
    const handleTableChange = useCallback((pagination: any, sorter: any) => {
        if (sorter && sorter.field) {
            const order = sorter.direction === 'ascend' ? 'asc' : 'desc';
            handleSortChange(sorter.field, order);
        }
    }, [handleSortChange]);

    // 获取文件图标
    const getFileIcon = useCallback((mimeType: string) => {
        if (mimeType.startsWith('image/')) {
            return <IconImage style={{fontSize: 24, color: '#52c41a'}}/>;
        } else if (mimeType.startsWith('audio/')) {
            return <IconMusic style={{fontSize: 24, color: '#1890ff'}}/>;
        } else if (mimeType.startsWith('video/')) {
            return <IconVoice style={{fontSize: 24, color: '#722ed1'}}/>;
        } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) {
            return <IconArchive style={{fontSize: 24, color: '#fa8c16'}}/>;
        } else {
            return <IconFile style={{fontSize: 24, color: '#8c8c8c'}}/>;
        }
    }, []);

    // 表格行选择配置
    const rowSelection = {
        selectedRowKeys,
        onChange: handleRowSelection,
        checkboxProps: (record: FileListItem) => ({
            disabled: false, // 可以根据文件状态禁用某些行
        }),
    };

    // 表格列定义
    const columns = [
        {
            title: '文件',
            dataIndex: 'file_name',
            key: 'file_name',
            render: (fileName: string, record: FileListItem) => (
                <div className={styles.fileCell}>
                    {record.has_thumbnail && record.mime_type.startsWith('image/') ? (
                        <Image
                            src={fileApi.getThumbnailUrl(record.file_uuid)}
                            width={32}
                            height={32}
                            className={styles.thumbnail}
                            preview={true}
                        />
                    ) : (
                        getFileIcon(record.mime_type)
                    )}
                    <div className={styles.fileInfo}>
                        <Tooltip content={fileName}>
                            <Text className={styles.fileName}>{fileName}</Text>
                        </Tooltip>
                        <Text type="secondary" className={styles.mimeType}>
                            {record.mime_type}
                        </Text>
                    </div>
                </div>
            ),
            width: 300
        },
        {
            title: '大小',
            dataIndex: 'file_size',
            key: 'file_size',
            render: (size: number) => (
                <Text>{fileUtils.formatFileSize(size)}</Text>
            ),
            width: 100,
            sorter: true
        },
        {
            title: '分类',
            dataIndex: 'category',
            key: 'category',
            render: (category: string) => (
                <Tag color="blue">{category || '未分类'}</Tag>
            ),
            width: 100
        },
        {
            title: 'MD5',
            dataIndex: 'file_md5',
            key: 'file_md5',
            render: (md5: string) => (
                <Tooltip content={md5 || '暂无'}>
                    <Text className={styles.md5Text}>
                        {md5 ? md5.substring(0, 8) + '...' : '暂无'}
                    </Text>
                </Tooltip>
            ),
            width: 120
        },
        {
            title: '下载次数',
            dataIndex: 'download_count',
            key: 'download_count',
            render: (count: number) => (
                <Text>{count}</Text>
            ),
            width: 100,
            sorter: true
        },
        {
            title: '上传时间',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (createdAt: string) => (
                <Text>{fileUtils.formatDateTime(createdAt)}</Text>
            ),
            width: 180,
            sorter: true
        },
        {
            title: '操作',
            key: 'actions',
            render: (_: any, record: FileListItem) => (
                <Space>
                    <Tooltip content="下载">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconDownload/>}
                            onClick={() => handleDownload(record)}
                        />
                    </Tooltip>
                    <Tooltip content="查看详情">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconEye/>}
                            onClick={() => handleViewDetails(record)}
                        />
                    </Tooltip>
                </Space>
            ),
            width: 100,
            fixed: 'right' as const
        }
    ];

    return (
        <Card className={styles.fileListCard}>
            {/* 搜索和筛选栏 */}
            <div className={styles.filterBar}>
                <div className={styles.searchSection}>
                    <Input.Search
                        placeholder="搜索文件名..."
                        style={{width: 300}}
                        onSearch={handleSearch}
                        allowClear
                    />
                </div>

                <Space>
                    <Select
                        placeholder="选择分类"
                        value={searchParams.category}
                        onChange={handleCategoryChange}
                        style={{width: 120}}
                    >
                        {FILE_CATEGORIES.map(category => (
                            <Option key={category.value} value={category.value}>
                                {category.label}
                            </Option>
                        ))}
                    </Select>

                    <Select
                        placeholder="排序字段"
                        value={searchParams.sort_by}
                        onChange={(value) => handleSortChange(value, searchParams.sort_order || 'desc')}
                        style={{width: 120}}
                    >
                        {SORT_OPTIONS.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>

                    <Select
                        placeholder="排序方向"
                        value={searchParams.sort_order}
                        onChange={(value) => handleSortChange(searchParams.sort_by || 'created_at', value)}
                        style={{width: 80}}
                    >
                        {SORT_ORDERS.map(order => (
                            <Option key={order.value} value={order.value}>
                                {order.label}
                            </Option>
                        ))}
                    </Select>

                    <Button
                        icon={<IconRefresh/>}
                        onClick={() => fetchFileList()}
                        loading={loading}
                    >
                        刷新
                    </Button>
                </Space>
            </div>

            {/* 批量操作工具栏 - 仅在有选择项时显示 */}
            {selectedRowKeys.length > 0 && (
                <div className={styles.batchActions}>
                    <Space>
                        <Text type="secondary">
                            已选择 {selectedRowKeys.length} 个文件
                        </Text>
                        <Button
                            type="primary"
                            status="danger"
                            icon={<IconDelete/>}
                            loading={batchDeleteLoading}
                            onClick={handleBatchDelete}
                        >
                            批量删除
                        </Button>
                        <Button
                            type="outline"
                            onClick={() => {
                                setSelectedRowKeys([]);
                                setSelectedFiles([]);
                            }}
                        >
                            取消选择
                        </Button>
                    </Space>

                    <Space>
                        {fileListData?.list && fileListData.list.length > 0 && (
                            <Checkbox
                                checked={selectedRowKeys.length === fileListData.list.length}
                                indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < fileListData.list.length}
                                onChange={handleSelectAll}
                            >
                                全选
                            </Checkbox>
                        )}
                    </Space>
                </div>
            )}

            {/* 文件列表表格 */}
            <Table
                columns={columns}
                data={fileListData?.list || []}
                loading={loading}
                pagination={false}
                rowSelection={rowSelection}
                scroll={{x: 1000}}
                noDataElement={
                    <Empty
                        description="暂无文件"
                        style={{padding: '40px 0'}}
                    />
                }
                rowKey="file_uuid"
                className={styles.fileTable}
            />

            {/* 分页器 */}
            {fileListData && fileListData.total > 0 && (
                <div className={styles.paginationWrapper}>
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={fileListData.total}
                        showTotal={(total, range) => `第 ${range[0]}-${range[1]} 项，共 ${total} 项`}
                        sizeCanChange
                        sizeOptions={[10, 20, 50, 100]}
                        onChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </div>
            )}

            {/* 删除确认对话框 */}
            <Modal
                title={
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        <IconExclamationCircle style={{color: '#ff4d4f', fontSize: 20}}/>
                        <span style={{color: '#ff4d4f', fontWeight: 600}}>
              {deleteConfirmData?.files.length === 1 ? '确认删除文件' : '确认批量删除'}
            </span>
                    </div>
                }
                visible={deleteConfirmVisible}
                onCancel={() => {
                    setDeleteConfirmVisible(false);
                    setDeleteConfirmData(null);
                }}
                footer={[
                    <Button
                        key="cancel"
                        size="large"
                        onClick={() => {
                            setDeleteConfirmVisible(false);
                            setDeleteConfirmData(null);
                        }}
                    >
                        取消
                    </Button>,
                    <Button
                        key="confirm"
                        type="primary"
                        status="danger"
                        size="large"
                        loading={batchDeleteLoading}
                        onClick={() => {
                            setDeleteConfirmVisible(false);
                            handleConfirmDelete();
                        }}
                        style={{minWidth: 100}}
                    >
                        确认删除
                    </Button>
                ]}
                style={{width: 650}}
                className={styles.deleteConfirm}
                maskClosable={false}
                escToExit={false}
            >
                {deleteConfirmData && (
                    <div>
                        {/* 风险警告 */}
                        {deleteConfirmData.hasImportantFiles && (
                            <Alert
                                type="warning"
                                title="⚠️ 检测到重要文件"
                                content="您即将删除的文件中包含大文件（>10MB）、高下载量文件（>5次）或重要文档，请谨慎操作。"
                                style={{marginBottom: 16}}
                                showIcon
                                banner
                            />
                        )}

                        {/* 批量删除特别提醒 */}
                        {deleteConfirmData.files.length > 1 && (
                            <Alert
                                type="error"
                                title="🚨 批量删除操作"
                                content={`您即将一次性删除 ${deleteConfirmData.files.length} 个文件，此操作不可恢复，请确认您真的需要删除这些文件。`}
                                style={{marginBottom: 16}}
                                showIcon
                                banner
                            />
                        )}

                        <div className={styles.deleteInfo}>
                            <Text style={{fontSize: 16}}>
                                您即将删除以下 <Text bold
                                                     style={{color: '#ff4d4f'}}>{deleteConfirmData.files.length}</Text> 个文件：
                            </Text>
                        </div>

                        <div className={styles.fileList}>
                            {deleteConfirmData.files.map(file => (
                                <div key={file.file_uuid} className={styles.fileItem}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                                        {getFileIcon(file.mime_type)}
                                        <div style={{flex: 1, minWidth: 0}}>
                                            <div className={styles.fileName} title={file.file_name}>
                                                {file.file_name}
                                            </div>
                                            <div style={{fontSize: 12, color: '#999', marginTop: 2}}>
                                                {file.mime_type} • 下载 {file.download_count} 次
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{textAlign: 'right'}}>
                                        <div className={styles.fileSize}>
                                            {fileUtils.formatFileSize(file.file_size)}
                                        </div>
                                        {file.file_size > 10 * 1024 * 1024 && (
                                            <Tag color="orange" size="small" style={{marginTop: 4}}>
                                                大文件
                                            </Tag>
                                        )}
                                        {file.download_count > 5 && (
                                            <Tag color="blue" size="small" style={{marginTop: 4}}>
                                                热门
                                            </Tag>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.summary}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <Text type="secondary" style={{fontSize: 14}}>
                                    总计：{deleteConfirmData.files.length} 个文件
                                </Text>
                                <Text bold style={{fontSize: 14}}>
                                    总大小：{fileUtils.formatFileSize(deleteConfirmData.totalSize)}
                                </Text>
                            </div>
                            <Progress
                                percent={100}
                                status="error"
                                size="small"
                                style={{marginTop: 8}}
                                formatText={() => '删除后无法恢复'}
                            />
                        </div>

                        {/* 删除选项 */}
                        <div className={styles.deleteOptions}>
                            <Checkbox
                                checked={dontShowAgain}
                                onChange={setDontShowAgain}
                                disabled={deleteConfirmData.files.length > 1}
                            >
                                <Text type="secondary" style={{fontSize: 13}}>
                                    不再显示此确认对话框（仅对单个文件删除生效）
                                </Text>
                            </Checkbox>
                        </div>

                        {/* 底部提醒 */}
                        <div style={{
                            marginTop: 16,
                            padding: 12,
                            backgroundColor: '#fff2f0',
                            borderRadius: 6,
                            border: '1px solid #ffccc7'
                        }}>
                            <Text type="secondary" style={{fontSize: 13}}>
                                💡 提示：删除操作将立即执行且无法撤销，请确保您不再需要这些文件。
                            </Text>
                        </div>
                    </div>
                )}
            </Modal>

            {/* 错误提示 */}
            {error && (
                <div className={styles.errorMessage}>
                    <Text type="error">加载失败: {error.message}</Text>
                    <Button
                        type="text"
                        size="small"
                        onClick={() => fetchFileList()}
                        style={{marginLeft: 8}}
                    >
                        重试
                    </Button>
                </div>
            )}
        </Card>
    );
}