'use client';

import React from 'react';
import styles from './test.module.css';
import Link from 'next/link';
import { Table } from '@arco-design/web-react';

/**
 * 测试页面组件
 * 显示一个表格，左边为中文名，右边为路径，点击路径可以跳转。
 */
const TestPage: React.FC = () => {
  const routes = [
    { path: '/', name: '首页' },
    { path: '/test', name: '测试页面' },
    { path: '/admin/config', name: '管理' },
    { path: '/admin/config/manage', name: '动态配置管理' },
  ];

  const columns = [
    {
      title: '中文名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      render: (path: string) => (
        <Link href={path} className={styles.routeLink}>
          {path}
        </Link>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>测试页面</h1>
        <p className={styles.description}>
          以下是前端所有路径的表格，点击路径即可跳转：
        </p>
        <Table
          columns={columns}
          data={routes}
          rowKey="path"
          pagination={false} // 禁用分页
          className={styles.routeTable}
        />
      </div>
    </div>
  );
};

export default TestPage;