# 每日一句功能实现文档

## 需求概述
实现一个每日一句功能，展示来自金山词霸的英语句子，包含英文原文、中文翻译、背景图片和音频播放功能。

## 设计逻辑

### 1. 架构设计
采用前后端分离架构：
- **后端**: 使用GoFrame框架提供API接口
- **前端**: 使用React + TypeScript + CSS Modules
- **数据源**: 金山词霸公开API

### 2. 技术选型
- **后端框架**: GoFrame v2
- **前端框架**: React 18 + TypeScript
- **样式方案**: CSS Modules
- **HTTP客户端**: 原生fetch API
- **音频处理**: HTML5 Audio API
- **图片处理**: Canvas API（用于主色调提取）

## 实现步骤

### 第一阶段：后端API开发

#### 1. 创建控制器结构
```bash
# 文件路径
server/internal/controller/daily/daily.go
server/internal/controller/daily/daily_new.go
server/internal/controller/daily/daily_v1_get_sentence.go
```

#### 2. 定义API接口
```bash
# 文件路径
server/api/daily/daily.go
```

#### 3. 实现服务层
```bash
# 文件路径
server/internal/service/daily.go
```

#### 4. 注册路由
在 `server/internal/cmd/cmd.go` 中注册新的控制器

### 第二阶段：前端组件开发

#### 1. 创建React组件
```bash
# 文件路径
front-web/src/components/DailySentence.tsx
front-web/src/components/DailySentence.module.css
```

#### 2. 集成到首页
修改 `front-web/src/app/page.tsx` 和相关样式文件

### 第三阶段：功能优化

#### 1. CORS配置
在后端添加CORS中间件支持跨域请求

#### 2. 响应式设计
实现移动端和桌面端的适配

#### 3. 用户体验优化
- 图片主色调提取
- 音频播放控制
- 加载状态处理
- 错误处理

## 关键技术实现

### 1. 图片主色调提取
```typescript
// 使用Canvas API分析图片像素
const extractDominantColor = (imageUrl: string): Promise<string> => {
  // 创建canvas元素
  // 绘制图片
  // 分析像素数据
  // 返回主色调
}
```

### 2. 音频播放控制
```typescript
// 使用HTML5 Audio API
const audio = new Audio(audioUrl);
audio.play();
```

### 3. 响应式设计
```css
/* 使用CSS Grid和Flexbox */
.container {
  display: grid;
  place-items: center;
  min-height: 100vh;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .sentenceCard {
    margin: 1rem;
    padding: 1.5rem;
  }
}
```

## 可能遇到的问题及解决方案

### 1. CORS跨域问题
**问题**: 前端无法访问后端API
**解决方案**: 在GoFrame中添加CORS中间件
```go
s.Group("/", func(group *ghttp.RouterGroup) {
    group.Middleware(ghttp.MiddlewareHandlerResponse)
    group.Middleware(ghttp.MiddlewareCORS)
    // ...
})
```

### 2. 图片加载失败
**问题**: 第三方图片资源可能无法访问
**解决方案**: 
- 添加错误处理和默认图片
- 实现图片预加载机制
- 添加重试逻辑

### 3. 音频播放兼容性
**问题**: 不同浏览器对音频格式支持不同
**解决方案**:
- 检测浏览器支持
- 提供降级方案
- 添加用户交互触发

### 4. 移动端适配
**问题**: 在小屏幕设备上显示效果不佳
**解决方案**:
- 使用响应式设计
- 调整字体大小和间距
- 优化触摸交互

## 性能优化建议

### 1. 前端优化
- 实现组件懒加载
- 添加图片预加载
- 使用防抖处理用户交互
- 实现本地缓存机制

### 2. 后端优化
- 添加响应缓存
- 实现请求限流
- 优化HTTP客户端配置
- 添加监控和日志

## 测试策略

### 1. 功能测试
- API接口测试
- 前端组件渲染测试
- 用户交互测试

### 2. 兼容性测试
- 不同浏览器测试
- 移动端设备测试
- 网络环境测试

### 3. 性能测试
- 页面加载速度测试
- 内存使用测试
- 网络请求优化测试

## 部署注意事项

### 1. 环境配置
- 确保后端服务正常运行
- 配置正确的API地址
- 检查网络连接

### 2. 安全考虑
- 验证第三方API的可靠性
- 添加请求频率限制
- 实现错误监控

## 后续扩展计划

### 1. 功能扩展
- 添加历史句子查看
- 实现用户收藏功能
- 支持多语言切换
- 添加分享功能

### 2. 技术优化
- 实现服务端渲染(SSR)
- 添加PWA支持
- 优化SEO
- 实现离线缓存

## 更新日志
- 2025-10-06: 完成基础功能实现，包括API接口、前端组件、CORS配置和响应式设计