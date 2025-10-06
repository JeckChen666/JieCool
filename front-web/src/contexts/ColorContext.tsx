'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// 颜色上下文类型
interface ColorContextType {
  dominantColor: string;
  setDominantColor: (color: string) => void;
}

// 创建颜色上下文
const ColorContext = createContext<ColorContextType | undefined>(undefined);

// 颜色提供者组件
interface ColorProviderProps {
  children: ReactNode;
}

export const ColorProvider: React.FC<ColorProviderProps> = ({ children }) => {
  const [dominantColor, setDominantColor] = useState<string>('#ffffff'); // 默认白色，避免图片加载前的颜色闪烁

  return (
    <ColorContext.Provider value={{ dominantColor, setDominantColor }}>
      {children}
    </ColorContext.Provider>
  );
};

// 使用颜色上下文的Hook
export const useColor = (): ColorContextType => {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useColor must be used within a ColorProvider');
  }
  return context;
};