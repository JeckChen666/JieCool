'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './DailySentence.module.css';
import { useColor } from '@/components/contexts/ColorContext';

// 每日一句数据类型
interface DailySentenceData {
  sid: string;
  content: string;
  note: string;
  picture4: string;
  tts: string;
  dateline: string;
  caption: string;
  translation: string;
  tags: string[];
}

// API响应类型
interface ApiResponse {
  code: number;
  message: string;
  data: DailySentenceData;
}

// 默认数据，防止接口失效
const DEFAULT_SENTENCE_DATA: DailySentenceData = {
  sid: 'default-001',
  content: 'The best time to plant a tree was 20 years ago. The second best time is now.',
  note: '种一棵树最好的时间是20年前，其次是现在。',
  picture4: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  tts: '',
  dateline: new Date().toISOString().split('T')[0],
  caption: '默认每日一言',
  translation: '种一棵树最好的时间是20年前，其次是现在。',
  tags: ['励志', '成长', '行动']
};

const DailySentence: React.FC = () => {
  const [sentenceData, setSentenceData] = useState<DailySentenceData | null>(DEFAULT_SENTENCE_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localDominantColor, setLocalDominantColor] = useState<string>('#ffffff');
  const [imageLoaded, setImageLoaded] = useState(false); // 跟踪图片加载状态
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // 使用Next.js路由
  const router = useRouter();
  
  // 使用全局颜色上下文
  const { setDominantColor } = useColor();

  // 获取每日一句数据
  useEffect(() => {
    const fetchDailySentence = async () => {
      try {
        setLoading(true);
        setImageLoaded(false); // 重置图片加载状态
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
        const response = await fetch(`${apiBase}/daily/sentence`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result: ApiResponse = await response.json();
        
        if (result.code === 0 && result.data) {
          setSentenceData(result.data);
          // 加载图片并提取主色调
          extractDominantColor(result.data.picture4);
        } else {
          throw new Error(result.message || '获取数据失败');
        }
      } catch (err) {
        console.error('获取每日一句失败，使用默认数据:', err);
        // 使用默认数据而不是显示错误
        setSentenceData(DEFAULT_SENTENCE_DATA);
        // 为默认数据提取主色调
        extractDominantColor(DEFAULT_SENTENCE_DATA.picture4);
        setError(null); // 清除错误状态
      } finally {
        setLoading(false);
      }
    };

    fetchDailySentence();
  }, []);

  // 提取图片主色调
  const extractDominantColor = (imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // 标记图片已加载
        setImageLoaded(true);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        // 缩小图片以提高性能
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        // 计算平均颜色
        let r = 0, g = 0, b = 0;
        const pixelCount = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        
        r = Math.floor(r / pixelCount);
        g = Math.floor(g / pixelCount);
        b = Math.floor(b / pixelCount);
        
        // 确保颜色足够亮以便阅读
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness < 128) {
          // 如果颜色太暗，使用更亮的版本
          r = Math.min(255, r + 100);
          g = Math.min(255, g + 100);
          b = Math.min(255, b + 100);
        }
        
        const extractedColor = `rgb(${r}, ${g}, ${b})`;
        setLocalDominantColor(extractedColor);
        // 只在图片加载完成后才更新导航栏颜色
        setDominantColor(extractedColor);
      } catch (error) {
        console.error('提取颜色失败:', error);
        setImageLoaded(true); // 即使失败也标记为已处理
        // 使用默认颜色
        const defaultColor = '#ffffff';
        setLocalDominantColor(defaultColor);
        // 保持导航栏为白色，不更新
      }
    };
    
    img.onerror = () => {
      console.error('图片加载失败');
      setImageLoaded(true); // 标记为已处理
      const defaultColor = '#ffffff';
      setLocalDominantColor(defaultColor);
      // 图片加载失败时，保持导航栏为白色，不更新
    };
    
    img.src = imageUrl;
  };

  // 播放音频
  const playAudio = async () => {
    if (!sentenceData?.tts || !audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('播放音频失败:', error);
    }
  };

  // 音频播放结束
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>加载失败: {error}</p>
          <button onClick={() => window.location.reload()}>重试</button>
        </div>
      </div>
    );
  }

  if (!sentenceData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 背景图片 */}
      <div 
        className={styles.background}
        style={{ backgroundImage: `url(${sentenceData.picture4})` }}
      />
      
      {/* 内容区域 */}
      <div className={styles.content}>
        <div 
          className={styles.textBox}
          style={{ color: localDominantColor }}
        >
          {/* 英文句子和音频按钮容器 */}
          <div className={styles.englishContainer}>
            <h1 className={styles.englishText}>
              {sentenceData.content}
            </h1>
            {/* 音频播放按钮 - 小喇叭图标 */}
            {sentenceData.tts && (
              <button 
                className={styles.audioButton}
                onClick={playAudio}
                disabled={isPlaying}
                title={isPlaying ? '播放中...' : '播放发音'}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.speakerIcon}
                >
                  <path 
                    d="M11 5L6 9H2V15H6L11 19V5Z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M19.07 4.93C20.9445 6.80448 21.9982 9.34785 21.9982 12C21.9982 14.6522 20.9445 17.1955 19.07 19.07" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={isPlaying ? styles.soundWave : ''}
                  />
                  <path 
                    d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 12C17.0039 13.3308 16.4774 14.6024 15.54 15.54" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={isPlaying ? styles.soundWave : ''}
                  />
                </svg>
              </button>
            )}
          </div>
          
          {/* 中文翻译 */}
          <p className={styles.chineseText}>
            {sentenceData.note}
          </p>
          
          {/* 进入按钮 */}
          <button 
            className={styles.enterButton}
            onClick={() => {
              // 跳转到测试页面
              router.push('/test');
            }}
          >
            进入
          </button>
        </div>
      </div>
      
      {/* 音频元素 */}
      {sentenceData.tts && (
        <audio
          ref={audioRef}
          src={sentenceData.tts}
          onEnded={handleAudioEnded}
          preload="metadata"
        />
      )}
    </div>
  );
};

export default DailySentence;