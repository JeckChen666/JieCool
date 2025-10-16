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
  // URL token 静默登录：读取 ?token=...，持久化到 localStorage，并清理地址栏参数
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get("token");
      if (token) {
        localStorage.setItem("token", token);
        url.searchParams.delete("token");
        // 保留 next，但不自动跳转，交给业务自行处理
        window.history.replaceState(null, "", url.toString());
      }
    } catch {}
  }, []);

  return (
    <ConfigProvider>
      <ColorProvider>
        {children}
      </ColorProvider>
    </ConfigProvider>
  );
}