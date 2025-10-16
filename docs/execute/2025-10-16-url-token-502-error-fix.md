# URL Token 502错误修复

## 问题描述
在URL Token生成功能中出现间歇性502错误，影响用户体验。

## 问题分析
1. **错误现象**：前端调用`/api/auth/generate-url-token`接口时偶尔返回502状态码
2. **根本原因**：前端到后端的fetch请求存在以下问题：
   - 没有设置超时时间，可能导致请求挂起
   - 没有重试机制，网络波动时容易失败
   - 错误处理不够完善

## 解决方案
### 1. 添加超时控制
- 使用`AbortController`为fetch请求设置5秒超时
- 超时后自动取消请求，避免长时间等待

### 2. 实现重试机制
- 最多重试2次（总共3次尝试）
- 每次重试间隔递增（100ms, 200ms）
- 只有在所有重试都失败后才返回502错误

### 3. 改进错误处理
- 详细记录每次失败的原因
- 为用户提供更友好的错误信息
- 区分不同类型的错误（超时、网络错误、后端错误）

## 实现细节
### 修改文件
- `front-web/src/app/api/auth/generate-url-token/route.ts`

### 关键代码改动
```typescript
// 添加超时和重试机制
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
    
    // 检查响应状态
    if (!resp.ok) {
      throw new Error(`Backend responded with status: ${resp.status}`);
    }
    
    const backend = await resp.json();
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
```

## 测试结果
1. **功能测试**：Token生成功能正常工作
2. **稳定性测试**：连续多次点击生成按钮，所有请求都返回200状态码
3. **网络请求监控**：确认没有502错误出现

## 影响范围
- 提升了URL Token生成功能的稳定性
- 改善了用户体验，减少了因网络波动导致的失败
- 增强了系统的容错能力

## 注意事项
1. 超时时间设置为5秒，适合大多数网络环境
2. 重试次数限制为2次，避免过度重试
3. 重试间隔递增，减少服务器压力
4. 保留详细的错误日志，便于问题排查

## 后续优化建议
1. 可以考虑根据网络状况动态调整超时时间
2. 可以添加指数退避算法优化重试策略
3. 可以考虑添加请求缓存机制，减少重复请求