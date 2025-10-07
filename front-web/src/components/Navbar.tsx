"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";
import Dropdown from "./ui/Dropdown";
import { useColor } from "@/contexts/ColorContext";

const SITE_NAME = "JieCool";

function getTitleFromPath(pathname: string) {
  const map: Record<string, string> = {
    "/": "首页",
    "/file-management": "文件管理",
  };
  return map[pathname] || "页面";
}

export default function Navbar() {
  const pathname = usePathname();
  const pageTitle = useMemo(() => getTitleFromPath(pathname), [pathname]);

  const [theme, setTheme] = useState<string | null>(null);
  const [lang, setLang] = useState<string | null>(null);
  
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
            { label: "文件管理", value: "/file-management" }
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

        <button type="button" className={styles.button} onClick={onThemeToggle}>
          {theme === "dark" ? "🌙 暗黑" : "☀️ 亮色"}
        </button>
      </div>
    </header>
  );
}