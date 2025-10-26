'use client';

import React, {useEffect} from 'react';
import {Card, Empty, Grid, Progress, Space, Spin, Statistic, Tag, Typography} from '@arco-design/web-react';
import {IconCalendar, IconDashboard, IconDownload, IconFile, IconStorage} from '@arco-design/web-react/icon';
import {fileApi, fileUtils} from '@/lib/file-api';
import {useRequest} from 'alova/client';
import styles from './FileStats.module.css';

const {Row, Col} = Grid;
const {Title, Text} = Typography;

interface FileStatsProps {
    /** 刷新触发器 */
    refreshTrigger?: number;
}

export default function FileStats({refreshTrigger}: FileStatsProps) {
    // 获取文件统计数据
    const {
        data: statsData,
        loading,
        error,
        send: fetchStats
    } = useRequest(() => fileApi.getFileStats(), {
        immediate: true,
        initialData: {
            total_files: 0,
            total_size: 0,
            total_downloads: 0,
            category_stats: [],
            extension_stats: [],
            size_distribution: [],
            daily_upload_stats: []
        }
    });

    // 监听刷新触发器
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            fetchStats();
        }
    }, [refreshTrigger]); // 移除fetchStats依赖，避免无限循环

    // 计算分类统计的百分比
    const getCategoryPercentage = (count: number, total: number) => {
        return total > 0 ? Math.round((count / total) * 100) : 0;
    };

    // 获取分类颜色
    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            image: '#52c41a',
            document: '#1890ff',
            video: '#722ed1',
            audio: '#fa8c16',
            archive: '#f5222d',
            other: '#8c8c8c'
        };
        return colors[category] || '#8c8c8c';
    };

    if (loading) {
        return (
            <Card className={styles.statsCard}>
                <div className={styles.loadingWrapper}>
                    <Spin size={40}/>
                    <Text style={{marginTop: 16}}>加载统计数据中...</Text>
                </div>
            </Card>
        );
    }

    if (error || !statsData) {
        return (
            <Card className={styles.statsCard}>
                <Empty
                    description="统计数据加载失败"
                    style={{padding: '40px 0'}}
                />
            </Card>
        );
    }

    return (
        <div className={styles.statsContainer}>
            {/* 总体统计卡片 */}
            <Row gutter={16} className={styles.overviewRow}>
                <Col span={8}>
                    <Card className={styles.statCard}>
                        <Statistic
                            title="总文件数"
                            value={statsData.total_files}
                            prefix={<IconFile style={{color: '#1890ff'}}/>}
                            suffix="个"
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className={styles.statCard}>
                        <Statistic
                            title="总存储大小"
                            value={fileUtils.formatFileSize(statsData.total_size)}
                            prefix={<IconStorage style={{color: '#52c41a'}}/>}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className={styles.statCard}>
                        <Statistic
                            title="总下载次数"
                            value={statsData.total_downloads}
                            prefix={<IconDownload style={{color: '#fa8c16'}}/>}
                            suffix="次"
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={16}>
                {/* 分类统计 */}
                <Col span={12}>
                    <Card
                        title={
                            <Space>
                                <IconDashboard/>
                                <span>分类统计</span>
                            </Space>
                        }
                        className={styles.chartCard}
                    >
                        {statsData.category_stats.length > 0 ? (
                            <div className={styles.categoryStats}>
                                {statsData.category_stats.map((category, index) => (
                                    <div key={index} className={styles.categoryItem}>
                                        <div className={styles.categoryHeader}>
                                            <Space>
                                                <Tag color={getCategoryColor(category.category)}>
                                                    {category.category || '未分类'}
                                                </Tag>
                                                <Text>{category.count} 个文件</Text>
                                            </Space>
                                            <Text type="secondary">
                                                {fileUtils.formatFileSize(category.size)}
                                            </Text>
                                        </div>
                                        <Progress
                                            percent={getCategoryPercentage(category.count, statsData.total_files)}
                                            color={getCategoryColor(category.category)}
                                            showText={false}
                                            size="small"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty description="暂无分类数据"/>
                        )}
                    </Card>
                </Col>

                {/* 扩展名统计 */}
                <Col span={12}>
                    <Card
                        title={
                            <Space>
                                <IconDashboard/>
                                <span>文件类型统计</span>
                            </Space>
                        }
                        className={styles.chartCard}
                    >
                        {statsData.extension_stats.length > 0 ? (
                            <div className={styles.extensionStats}>
                                {statsData.extension_stats.slice(0, 8).map((ext, index) => (
                                    <div key={index} className={styles.extensionItem}>
                                        <div className={styles.extensionHeader}>
                                            <Text className={styles.extensionName}>
                                                {ext.extension || '无扩展名'}
                                            </Text>
                                            <Space>
                                                <Text>{ext.count}</Text>
                                                <Text type="secondary">
                                                    {fileUtils.formatFileSize(ext.size)}
                                                </Text>
                                            </Space>
                                        </div>
                                        <Progress
                                            percent={getCategoryPercentage(ext.count, statsData.total_files)}
                                            color="#1890ff"
                                            showText={false}
                                            size="small"
                                        />
                                    </div>
                                ))}
                                {statsData.extension_stats.length > 8 && (
                                    <Text type="secondary" className={styles.moreText}>
                                        还有 {statsData.extension_stats.length - 8} 种文件类型...
                                    </Text>
                                )}
                            </div>
                        ) : (
                            <Empty description="暂无文件类型数据"/>
                        )}
                    </Card>
                </Col>
            </Row>

            <Row gutter={16}>
                {/* 大小分布 */}
                <Col span={12}>
                    <Card
                        title={
                            <Space>
                                <IconStorage/>
                                <span>文件大小分布</span>
                            </Space>
                        }
                        className={styles.chartCard}
                    >
                        {statsData.size_distribution && statsData.size_distribution.length > 0 ? (
                            <div className={styles.sizeDistribution}>
                                {statsData.size_distribution.map((size, index) => (
                                    <div key={index} className={styles.sizeItem}>
                                        <div className={styles.sizeHeader}>
                                            <Text>{size.range}</Text>
                                            <Text>{size.count} 个文件</Text>
                                        </div>
                                        <Progress
                                            percent={getCategoryPercentage(size.count, statsData.total_files)}
                                            color="#52c41a"
                                            showText={false}
                                            size="small"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty description="暂无大小分布数据"/>
                        )}
                    </Card>
                </Col>

                {/* 每日上传统计 */}
                <Col span={12}>
                    <Card
                        title={
                            <Space>
                                <IconCalendar/>
                                <span>最近7天上传统计</span>
                            </Space>
                        }
                        className={styles.chartCard}
                    >
                        {statsData.daily_upload_stats && statsData.daily_upload_stats.length > 0 ? (
                            <div className={styles.dailyStats}>
                                {statsData.daily_upload_stats.map((daily, index) => (
                                    <div key={index} className={styles.dailyItem}>
                                        <div className={styles.dailyHeader}>
                                            <Text>{new Date(daily.date).toLocaleDateString('zh-CN')}</Text>
                                            <Space>
                                                <Text>{daily.count} 个</Text>
                                                <Text type="secondary">
                                                    {fileUtils.formatFileSize(daily.size)}
                                                </Text>
                                            </Space>
                                        </div>
                                        <Progress
                                            percent={Math.min(100, (daily.count / Math.max(...statsData.daily_upload_stats.map(d => d.count))) * 100)}
                                            color="#fa8c16"
                                            showText={false}
                                            size="small"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty description="暂无上传统计数据"/>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}