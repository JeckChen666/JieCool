"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import styles from "./Navbar.module.css";
import Dropdown from "../ui/Dropdown";
import {useColor} from "@/components/contexts/ColorContext";
import {clearToken, getToken} from "@/lib/token";
import {Message} from "@arco-design/web-react";
import {authApi} from "@/lib/auth-api";

const SITE_NAME = "JieCool";

function getTitleFromPath(pathname: string) {
    const map: Record<string, string> = {
        "/": "首页",
        "/file-management": "文件管理",
        "/admin/config": "配置管理",
        "/admin/url-token": "URL Token管理",
        "/weibo": "weibo",
        "/blog": "博客文章",
        "/blog/create": "创建文章",
        "/blog/categories": "分类管理",
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
    const {dominantColor} = useColor();

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
        } catch {
        }
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
            const resp = await authApi.logout();
            if (resp.loggedOut) {
                clearToken();
                setIsLoggedIn(false);
                Message.success("已退出登录");
                const next = pathname || "/";
                router.push(`/login?next=${encodeURIComponent(next)}`);
            } else {
                console.log("登出失败")
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
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <div className={styles.brand} style={{ alignItems: 'center' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            height: '20px',
                            lineHeight: 0
                        }}>
                            <Image src="/jc-logo.png" alt="logo" width={20} height={20}/>
                        </div>
                        <span className={styles.siteName} style={{
                            display: 'flex',
                            alignItems: 'center',
                            height: '20px',
                            lineHeight: '20px'
                        }}>
                            {SITE_NAME}
                        </span>
                    </div>
                </Link>
                <span className={styles.title}>{pageTitle}</span>
            </div>
            <div className={styles.right}>
                <Dropdown
                    ariaLabel="Jump to"
                    options={[
                        {label: "首页", value: "/"},
                        {label: "博客", value: "/blog"},
                        {label: "微博", value: "/weibo"},
                        ...(isLoggedIn ? [
                            {label: "文件管理", value: "/file-management"},
                            {label: "配置管理", value: "/admin/config"},
                            {label: "URL Token", value: "/admin/url-token"}
                        ] : [{label: "登录", value: "/login"}])
                    ]}
                    value={pathname}
                    onChange={onJumpChange}
                />

                <Dropdown
                    ariaLabel="Language"
                    options={[
                        {label: "中文", value: "zh"},
                        {label: "English", value: "en"},
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