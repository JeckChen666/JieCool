'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Layout,
  Card,
  Tabs,
  Space,
  Button,
  Typography,
  Message,
  Modal,
  Descriptions,
  Tag,
  Divider,
  Notification
} from '@arco-design/web-react';
import {
  IconFile,
  IconUpload,
  IconList,
  IconDashboard,
  IconRefresh,
  IconEye,
  IconDownload,
  IconDelete,
  IconCheck,
  IconReply
} from '@arco-design/web-react/icon';
import FileUpload from './FileUpload';
import FileList from './FileList';
import FileStats from './FileStats';
import { fileApi, fileUtils, FileInfo, FileListItem } from '@/lib/file-api';
import { useRequest } from 'alova/client';
import styles from './FileManagement.module.css';

const { Content } = Layout;
const { Title } = Typography;
const { TabPane } = Tabs;

export default function FileManagement() {
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 获取文件详情
  const {
    data: fileDetail,
    loading: detailLoading,
    send: fetchFileDetail
  } = useRequest((fileUuid: string) => fileApi.getFileInfo(fileUuid), {
    immediate: false
  });

  // 删除文件
  const {
    loading: deleteLoading,
    send: deleteFile
  } = useRequest((fileUuid: string) => fileApi.deleteFile(fileUuid), {
    immediate: false
  });



  // 刷新数据
  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    Message.success('数据已刷新');
  }, []);



  // 上传成功回调
  const handleUploadSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    // 如果当前在列表页面，自动切换到列表查看上传的文件
    if (activeTab === 'upload') {
      setTimeout(() => {
        setActiveTab('list');
      }, 1000);
    }
  }, [activeTab]);

  // 查看文件详情
  const handleViewDetail = useCallback(async (file: FileListItem) => {
    // 将FileListItem转换为FileInfo格式
    const fileInfo: FileInfo = {
      file_uuid: file.file_uuid,
      file_name: file.file_name,
      file_size: file.file_size,
      mime_type: file.mime_type,
      category: file.category || file.file_category || '未分类',
      uploader_id: 0, // FileListItem中没有此字段，使用默认值
      download_count: file.download_count,
      file_status: 1, // FileListItem中没有此字段，默认为正常状态
      has_thumbnail: file.has_thumbnail,
      thumbnail_url: file.thumbnail_url,
      created_at: file.created_at,
      updated_at: file.created_at // FileListItem中没有updated_at，使用created_at
    };
    setSelectedFile(fileInfo);
    setDetailModalVisible(true);
    try {
      await fetchFileDetail(file.file_uuid);
    } catch (error) {
      Message.error('获取文件详情失败');
    }
  }, [fetchFileDetail]);

  // 下载文件
  const handleDownload = useCallback(async (file: FileListItem) => {
    try {
      await fileUtils.downloadFile(file.file_uuid, file.file_name);
      Message.success('文件下载已开始');
      // 刷新统计数据（下载次数会增加）
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      Message.error('文件下载失败');
    }
  }, []);

  // 删除文件
  const handleDelete = useCallback((file: FileListItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文件 "${file.file_name}" 吗？此操作不可撤销。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { status: 'danger' },
      onOk: async () => {
        try {
          await deleteFile(file.file_uuid);
          Message.success('文件删除成功');
          setRefreshTrigger(prev => prev + 1);
        } catch (error) {
          Message.error('文件删除失败');
        }
      }
    });
  }, [deleteFile]);

  // 关闭详情弹窗
  const handleCloseDetail = useCallback(() => {
    setDetailModalVisible(false);
    setSelectedFile(null);
  }, []);



  // 验证文件MD5
  const handleVerifyMd5 = useCallback(async (file: FileInfo) => {
    try {
      Message.info('正在验证文件完整性...');
      
      // 从服务器获取文件的MD5值
      const md5Response = await fileApi.getFileMd5(file.file_uuid);
      
      if (md5Response.file_md5 === file.file_md5) {
        Message.success('文件完整性验证通过！文件未被篡改。');
      } else {
        Message.error('文件完整性验证失败！文件可能已被篡改。');
      }
    } catch (error) {
      Message.error('验证文件完整性失败');
      console.error('MD5验证错误:', error);
    }
  }, []);

  // 获取文件状态标签
  const getFileStatusTag = (status: number) => {
    const statusMap: Record<number, { text: string; color: string }> = {
      1: { text: '正常', color: 'green' },
      2: { text: '已删除', color: 'red' },
      3: { text: '隐藏', color: 'orange' }
    };
    const statusInfo = statusMap[status] || { text: '未知', color: 'gray' };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  return (
    <Layout className={styles.fileManagement}>
      <Content>
        <div className={styles.header}>
          <Space align="center">
            <IconFile style={{ fontSize: 24, color: '#1890ff' }} />
            <Title heading={2} style={{ margin: 0 }}>
              文件管理
            </Title>
          </Space>
          <Button
            type="outline"
            icon={<IconRefresh />}
            onClick={handleRefresh}
            loading={false}
          >
            刷新数据
          </Button>
        </div>

        <Card className={styles.mainCard}>
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            type="card-gutter"
            size="large"
          >
            <TabPane
              key="upload"
              title={
                <Space>
                  <IconUpload />
                  <span>文件上传</span>
                </Space>
              }
            >
              <div className={styles.tabContent}>
                <FileUpload onUploadSuccess={handleUploadSuccess} />
              </div>
            </TabPane>

            <TabPane
              key="list"
              title={
                <Space>
                  <IconList />
                  <span>文件列表</span>
                </Space>
              }
            >
              <div className={styles.tabContent}>
                <FileList
                  refreshTrigger={refreshTrigger}
                  onViewDetail={handleViewDetail}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                />
              </div>
            </TabPane>

            <TabPane
              key="stats"
              title={
                <Space>
                  <IconDashboard />
                  <span>统计信息</span>
                </Space>
              }
            >
              <div className={styles.tabContent}>
                <FileStats refreshTrigger={refreshTrigger} />
              </div>
            </TabPane>
          </Tabs>
        </Card>

        {/* 文件详情弹窗 */}
        <Modal
          title={
            <Space>
              <IconEye />
              <span>文件详情</span>
            </Space>
          }
          visible={detailModalVisible}
          onCancel={handleCloseDetail}
          footer={
            <Space>
              <Button onClick={handleCloseDetail}>关闭</Button>
              {selectedFile && (
                <>
                  <Button
                    type="outline"
                    icon={<IconDownload />}
                    onClick={() => handleDownload(selectedFile)}
                  >
                    下载
                  </Button>
                  <Button
                    type="primary"
                    status="danger"
                    icon={<IconDelete />}
                    loading={deleteLoading}
                    onClick={() => handleDelete(selectedFile)}
                  >
                    删除
                  </Button>
                </>
              )}
            </Space>
          }
          style={{ width: 600 }}
        >
          {detailLoading ? (
            <div className={styles.detailLoading}>
              <Space direction="vertical" align="center">
                <IconFile style={{ fontSize: 48, color: '#ccc' }} />
                <span>加载文件详情中...</span>
              </Space>
            </div>
          ) : selectedFile ? (
            <div className={styles.fileDetail}>
              {/* 文件基本信息 */}
              <Descriptions
                title="基本信息"
                column={1}
                labelStyle={{ width: 120 }}
                data={[
                  {
                    label: '文件名',
                    value: selectedFile.file_name
                  },
                  {
                    label: '文件大小',
                    value: fileUtils.formatFileSize(selectedFile.file_size)
                  },
                  {
                    label: '文件类型',
                    value: selectedFile.mime_type
                  },
                  {
                    label: '分类',
                    value: selectedFile.category
                  },
                  {
                    label: '状态',
                    value: <Tag color="green">正常</Tag>
                  },
                  {
                    label: '下载次数',
                    value: selectedFile.download_count
                  },
                  {
                    label: '上传时间',
                    value: fileUtils.formatDateTime(selectedFile.created_at)
                  },
                  {
                    label: '更新时间',
                    value: fileUtils.formatDateTime(selectedFile.created_at)
                  },
                  ...(selectedFile.file_md5 ? [{
                    label: 'MD5哈希',
                    value: (
                      <Space direction="vertical" size="small">
                        <code style={{ fontSize: 12, wordBreak: 'break-all', fontFamily: 'Courier New, monospace' }}>
                          {selectedFile.file_md5}
                        </code>
                        <Button
                          type="text"
                          size="small"
                          icon={<IconCheck />}
                          onClick={() => handleVerifyMd5(selectedFile)}
                        >
                          验证文件完整性
                        </Button>
                      </Space>
                    )
                  }] : [])
                ]}
              />

              {/* 详细信息（如果有从API获取的额外信息） */}
              {fileDetail && (
                <>
                  <Divider />
                  <Descriptions
                    title="详细信息"
                    column={1}
                    labelStyle={{ width: 120 }}
                    data={[
                      {
                        label: 'MD5',
                        value: (
                          <code style={{ fontSize: 12, wordBreak: 'break-all' }}>
                            {fileDetail.file_md5}
                          </code>
                        )
                      },
                      {
                        label: '上传者ID',
                        value: fileDetail.uploader_id || '未知'
                      },
                      {
                        label: '缩略图',
                        value: fileDetail.has_thumbnail ? (
                          <Tag color="green">已生成</Tag>
                        ) : (
                          <Tag color="gray">无缩略图</Tag>
                        )
                      }
                    ]}
                  />
                </>
              )}

              {/* 缩略图预览 */}
              {selectedFile.has_thumbnail && (
                <>
                  <Divider />
                  <div className={styles.thumbnailPreview}>
                    <Title heading={4}>缩略图预览</Title>
                    <img
                      src={fileApi.getThumbnailUrl(selectedFile.file_uuid)}
                      alt="缩略图"
                      className={styles.thumbnailImage}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          ) : null}
        </Modal>
      </Content>
    </Layout>
  );
}