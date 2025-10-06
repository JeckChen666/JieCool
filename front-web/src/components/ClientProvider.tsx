"use client";

// 客户端组件：承载 Arco Design 的 ConfigProvider 和颜色上下文。
// 在 Next.js App Router 中，Server Component（如 layout.tsx）无法直接使用 React Context，
// 因此通过客户端组件包裹，避免运行时错误并保留服务端布局的 metadata 能力。
import React from "react";
import { ConfigProvider } from "@arco-design/web-react";
import { ColorProvider } from "@/contexts/ColorContext";

type Props = {
  children: React.ReactNode;
};

export default function ClientProvider({ children }: Props) {
  return (
    <ConfigProvider>
      <ColorProvider>
        {children}
      </ColorProvider>
    </ConfigProvider>
  );
}