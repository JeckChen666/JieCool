"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Navbar.module.css";
import Dropdown from "../ui/Dropdown";
import { useColor } from "@/contexts/ColorContext";
import { getToken, clearToken } from "@/lib/token";
import { Message } from "@arco-design/web-react";

const SITE_NAME = "JieCool";

function getTitleFromPath(pathname: string) {
  const map: Record<string, string> = {
    "/": "首页",
    "/file-management": "文件管理",
    "/admin/config": "配置管理",
    "/admin/url-token": "URL Token管理",
  };
  return map[pathname] || "页面";
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = useMemo(() => getTitleFromPath(pathname), [pathname]);

  const [theme, setTheme] = useState<string | null>(null);
  const [lang, setLang] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  // 使用全局颜色上下文
  const { dominantColor } = useColor();

  useEffect(() => {
    // 初始化主题
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
    // 初始化语言
    const savedLang = localStorage.getItem("lang") || "zh";
    setLang(savedLang);
    document.documentElement.lang = savedLang === "zh" ? "zh-CN" : "en";
    // 初始化登录状态
    try {
      const t = getToken();
      setIsLoggedIn(!!t);
    } catch {}
  }, []);

  const onThemeToggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const onLangChange = (next: string) => {
    setLang(next);
    localStorage.setItem("lang", next);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  };

  const onJumpChange = (to: string) => {
    if (to && to !== pathname) {
      window.location.assign(to);
    }
  };

  const onLogout = async () => {
    try {
      const token = getToken();
      const resp = await fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await resp.json();
      if (resp.status === 401) {
        throw new Error(data?.message || "未授权");
      }
      if (data?.loggedOut) {
        clearToken();
        setIsLoggedIn(false);
        Message.success("已退出登录");
        const next = pathname || "/";
        router.push(`/login?next=${encodeURIComponent(next)}`);
      } else {
        throw new Error(data?.message || "登出失败");
      }
    } catch (e: any) {
      Message.error(e?.message || "登出失败");
    }
  };

  return (
    <header 
      className={`${styles.navbar} ${pathname === '/' ? styles.homePage : ''}`}
      style={pathname === '/' ? { 
        background: `color-mix(in oklab, ${dominantColor} 50%, var(--background) 50%)`,
        backdropFilter: 'blur(15px)'
      } : undefined}
    >
      <div className={styles.left}>
        <div className={styles.brand}>
          <Image src="/file.svg" alt="logo" width={20} height={20} />
          <span className={styles.siteName}>{SITE_NAME}</span>
        </div>
        <span className={styles.title}>{pageTitle}</span>
      </div>
      <div className={styles.right}>
        <Dropdown
          ariaLabel="Jump to"
          options={[
            { label: "首页", value: "/" },
            { label: "文件管理", value: "/file-management" },
            ...(isLoggedIn ? [
              { label: "配置管理", value: "/admin/config" },
              { label: "URL Token", value: "/admin/url-token" }
            ] : [])
          ]}
          value={pathname}
          onChange={onJumpChange}
        />

        <Dropdown
          ariaLabel="Language"
          options={[
            { label: "中文", value: "zh" },
            { label: "English", value: "en" },
          ]}
          value={lang ?? "zh"}
          onChange={onLangChange}
        />

        {isLoggedIn && (
          <button type="button" className={styles.button} onClick={onLogout}>
            退出登录
          </button>
        )}

        <button type="button" className={styles.button} onClick={onThemeToggle}>
          {theme === "dark" ? "🌙 暗黑" : "☀️ 亮色"}
        </button>
      </div>
    </header>
  );
}