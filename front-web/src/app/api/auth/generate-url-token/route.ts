import { NextResponse } from "next/server";
import { getServerUrl } from "../../../../lib/serverUrl";

// 生成URL Token的API路由
export async function POST(req: Request) {
  const serverUrl = getServerUrl();
  const url = `${serverUrl}/auth/generate-url-token`;
  console.log("Generate URL token request:", url);
  try {
    // 获取Authorization header
    const authorization = req.headers.get("authorization");
    if (!authorization) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 解析请求体
    const contentType = req.headers.get("content-type") || "";
    const form = new URLSearchParams();
    
    if (contentType.includes("application/json")) {
      try {
        const body = await req.json();
        if (body && typeof body === "object") {
          // 设置描述信息
          if (body.description) {
            form.set("description", String(body.description));
          }
          // 设置TTL（生存时间，秒）
          if (body.ttl !== undefined && body.ttl !== null) {
            const ttlNum = typeof body.ttl === "number" ? body.ttl : parseInt(String(body.ttl), 10);
            if (!Number.isNaN(ttlNum) && ttlNum > 0) {
              form.set("ttl", String(ttlNum));
            }
          }
          // 设置token_via参数
          if (body.token_via) {
            form.set("token_via", String(body.token_via));
          }
        }
      } catch (_) {
        // 忽略JSON解析错误，回退到文本处理
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const incoming = new URLSearchParams(text);
      const description = incoming.get("description");
      if (description) form.set("description", description);
      const ttl = incoming.get("ttl");
      if (ttl) form.set("ttl", ttl);
      const tokenVia = incoming.get("token_via");
      if (tokenVia) form.set("token_via", tokenVia);
    }

    // 向后端发送请求，添加超时和重试机制
    let lastError: any;
    const maxRetries = 2; // 最多重试2次
    const timeoutMs = 5000; // 5秒超时
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 创建AbortController用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const resp = await fetch(url, {
          method: "POST",
          headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": authorization
          },
          body: form.toString(),
          signal: controller.signal, // 添加超时信号
        });
        
        clearTimeout(timeoutId); // 清除超时定时器

        console.log(`Generate URL token attempt ${attempt + 1} succeeded.`);

        // 检查响应状态
        if (!resp.ok) {
          throw new Error(`Backend responded with status: ${resp.status}`);
        }
        
        const backend = await resp.json();
        
        // 返回后端响应
        return NextResponse.json(backend, { status: resp.status });
      } catch (e) {
        lastError = e;
        console.error(`Generate URL token attempt ${attempt + 1} failed:`, e);
        
        // 如果是最后一次尝试，不再重试
        if (attempt === maxRetries) {
          break;
        }
        
        // 等待一小段时间后重试
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
    
    // 所有重试都失败了
    console.error("Generate URL token failed after all retries:", lastError);
    return NextResponse.json({ 
      error: "upstream_error", 
      message: "Backend service temporarily unavailable" 
    }, { status: 502 });
  } catch (e) {
    console.error("Generate URL token error:", e);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}