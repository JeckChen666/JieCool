'use client';

import React from 'react';
import styles from './test.module.css';

/**
 * 测试页面组件
 * 这是一个简单的空白测试页面，用于验证页面跳转功能
 */
const TestPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>测试页面</h1>
        <p className={styles.description}>
          欢迎来到测试页面！这是一个简单的空白页面，用于验证导航功能。
        </p>
        <div className={styles.actions}>
          <button 
            className={styles.backButton}
            onClick={() => window.history.back()}
          >
            返回上一页
          </button>
          <button 
            className={styles.homeButton}
            onClick={() => window.location.href = '/'}
          >
            回到首页
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestPage;