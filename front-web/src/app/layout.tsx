import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 引入 Arco Design 全局样式，确保组件样式正确呈现
import "@arco-design/web-react/dist/css/arco.css";
// 使用 Client 组件包裹全局 Arco ConfigProvider，避免在 Server Component 中使用 React Context
import ClientProvider from "@/components/layout/ClientProvider";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JieCool",
  description: "个人网站，分享技术见解，记录学习历程",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {/*
          ClientProvider 为客户端组件，内部注入 Arco 的 ConfigProvider。
          保持布局（Server Component）兼容 metadata 等服务端特性。
        */}
        <ClientProvider>
          <Navbar />
          {/*
            顶部导航固定在页面顶部，高度由 --navbar-height 控制。
            主内容区域高度 = 视口高度 - 导航高度；仅主内容区域内部滚动，外层不滚动。
          */}
          <main className="app-main">{children}</main>
        </ClientProvider>
      </body>
    </html>
  );
}
