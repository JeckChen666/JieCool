# 每日一句模块（Daily Sentence Module）

## 模块预期实现的目标

集成金山词霸每日一句API，为网站提供励志英文句子学习功能。通过跨域请求获取每日内容，自动提取图片主色调并动态调整界面配色，支持英文发音播放，为用户提供沉浸式的学习体验。该模块适用于个人网站的内容展示页面，提升网站的文化内涵和用户粘性。

## 模块预期的功能点

### 1. 每日内容获取
- **API集成**：从金山词霸API获取每日一句英文句子和中文翻译
- **跨域处理**：解决跨域请求问题，支持代理和CORS配置
- **错误处理**：API不可用时的降级显示，提供默认内容缓存
- **内容缓存**：本地缓存当日内容，减少重复请求

### 2. 图片处理与配色
- **主色调提取**：使用Canvas API提取图片的主色调
- **动态配色**：根据提取的主色调自动调整界面配色方案
- **图片加载**：跨域图片加载和安全处理
- **背景适配**：图片背景与界面样式的协调统一

### 3. 音频播放功能
- **发音播放**：集成英文句子的音频播放功能
- **播放控制**：支持播放、暂停、重播等基本控制
- **音频处理**：跨域音频资源的加载和播放
- **用户交互**：点击式播放和自动播放选项

### 4. 响应式展示
- **适配设计**：支持不同屏幕尺寸的响应式布局
- **动画效果**：内容加载和切换的平滑动画
- **交互反馈**：用户操作的即时视觉反馈
- **状态管理**：加载状态、错误状态、播放状态的统一管理

## 数据流向与处理逻辑

### 1. 内容获取流程
```
页面加载 → 检查本地缓存 → 缓存有效？
                ↓(否)
请求金山词霸API → 解析响应数据 → 提取句子、翻译、图片URL
                ↓
加载图片 → 提取主色调 → 更新界面配色 → 显示内容
                ↓
缓存当日数据 → 设置定时刷新（24小时）
```

### 2. 图片处理流程
```
图片URL加载 → 跨域验证 → 图片绘制到Canvas
                ↓
像素数据采样 → 颜色聚类分析 → 提取主色调
                ↓
计算对比色 → 生成配色方案 → 应用到界面元素
```

### 3. 音频播放流程
```
用户点击播放 → 加载音频URL → 跨域验证 → 创建Audio对象
                ↓
音频播放控制 → 播放状态更新 → 播放结束处理
```

## 重点代码设计逻辑

### 1. API数据获取逻辑
```pseudocode
PROCEDURE FetchDailySentence()
    TRY:
        步骤1: 检查本地缓存是否存在且未过期
        IF 缓存有效 THEN
            返回缓存数据
        ELSE
            步骤2: 发起跨域请求到金山词霸API
            步骤3: 解析JSON响应数据
            步骤4: 验证数据完整性和格式
            步骤5: 缓存响应数据（24小时有效期）
            返回最新数据
        END IF
    CATCH 网络异常:
        返回默认缓存内容
    CATCH 数据解析异常:
        返回默认句子内容
    CATCH 跨域异常:
        使用代理方式重新请求
    END PROCEDURE
```

### 2. 主色调提取逻辑
```pseudocode
PROCEDURE ExtractDominantColor(imageElement)
    TRY:
        步骤1: 创建Canvas元素并绘制图片
        步骤2: 获取图片像素数据数组
        步骤3: 采样像素点（每10像素采样1个）
        步骤4: RGB颜色聚类统计
        步骤5: 计算颜色频率和分布
        步骤6: 返回频率最高的颜色作为主色调
    CATCH 图片加载异常:
        返回默认主色调（蓝色系）
    CATCH Canvas绘制异常:
        使用CSS滤镜方式提取颜色
    END PROCEDURE
```

### 3. 配色方案生成逻辑
```pseudocode
PROCEDURE GenerateColorScheme(dominantColor)
    步骤1: 解析主色调RGB值
    步骤2: 计算亮度值（0.299*R + 0.587*G + 0.114*B）
    步骤3: 根据亮度确定文字颜色（亮色背景用深色文字）
    步骤4: 生成辅助配色（同色系深浅变化）
    步骤5: 返回完整配色方案对象
END PROCEDURE
```

### 4. 音频播放控制逻辑
```pseudocode
PROCEDURE HandleAudioPlay(audioUrl)
    TRY:
        步骤1: 创建HTML5 Audio对象
        步骤2: 设置音频源URL
        步骤3: 配置跨域属性
        步骤4: 绑定播放事件监听器
        步骤5: 执行播放操作
        步骤6: 更新播放状态UI
    CATCH 音频加载异常:
        显示"音频加载失败"提示
    CATCH 播放异常:
        提供"点击重新播放"选项
    END PROCEDURE
```

### 5. 缓存管理逻辑
```pseudocode
PROCEDURE ManageCache(cacheData)
    步骤1: 检查浏览器localStorage可用性
    步骤2: 存储缓存数据（包含内容和时间戳）
    步骤3: 设置过期时间（当前时间 + 24小时）
    步骤4: 返回存储操作结果
END PROCEDURE

PROCEDURE ValidateCache()
    步骤1: 从localStorage读取缓存数据
    步骤2: 检查缓存是否存在
    步骤3: 验证时间戳是否在有效期内
    步骤4: 返回验证结果和缓存内容
END PROCEDURE
```

## 模块功能使用方式

### 1. 前端界面集成
- **调用入口**：DailySentence组件作为主要展示组件
- **参数传递格式**：通过React Props传递配置选项（如自动播放、刷新间隔等）
- **交互反馈机制**：加载状态指示器、播放控制按钮、颜色过渡动画效果

### 2. 组件初始化
```typescript
// 使用方式
<DailySentence
  autoPlay={false}
  refreshInterval={86400000} // 24小时
  showTranslation={true}
  enableAudio={true}
/>
```

### 3. 后端接口调用
- **服务初始化方式**：通过Next.js API路由实现代理服务
- **API签名示例**：
  ```typescript
  // 获取每日一句
  GET /api/daily/sentence

  // 响应格式
  {
    "content": "英文句子内容",
    "note": "中文翻译",
    "picture": "图片URL",
    "picture2": "备用图片URL",
    "dateline": "日期信息"
  }
  ```
- **异步处理约定**：返回Promise格式的异步响应，支持错误处理

## 第三方组件与数据库设计

### 1. 第三方组件
| 组件名称 | 版本 | 在模块中的具体作用 |
|---------|------|------------------|
| 金山词霸API | v1.0 | 每日一句内容数据源 |
| Next.js API Routes | 14.2.15 | 提供跨域代理服务 |
| Canvas API | HTML5 | 图片像素数据处理和主色调提取 |
| Web Audio API | HTML5 | 英文句子音频播放 |
| Arco Design | 2.66.5 | UI组件库，提供按钮、卡片等组件 |

### 2. 外部API集成
#### 金山词霸每日一句API
- **接口地址**：`http://open.iciba.com/dsapi/`
- **请求方式**：GET
- **响应格式**：JSON
- **数据字段**：
  - `content`: 英文句子内容
  - `note`: 中文翻译
  - `picture`: 配图URL
  - `picture2`: 备用配图URL
  - `dateline`: 日期信息
  - `fenxiang`: 分享链接
  - `love`: 点赞数
  - `translation_speech`: 语音发音链接
  - `picture_speech`: 图片描述语音

### 3. 本地缓存存储
#### localStorage结构
```javascript
{
  "dailySentence": {
    "content": "英文句子内容",
    "note": "中文翻译",
    "picture": "图片URL",
    "timestamp": 1698765432000,
    "expires": 1698851832000,
    "colorScheme": {
      "primary": "#3498db",
      "text": "#ffffff",
      "background": "linear-gradient(...)"
    }
  }
}
```

### 4. 配色方案数据结构
```typescript
interface ColorScheme {
  primary: string;       // 主色调
  secondary: string;     // 辅助色
  text: string;          // 文字颜色
  background: string;    // 背景色
  accent: string;        // 强调色
  gradient: string;      // 渐变色
}
```

### 5. 组件状态管理
```typescript
interface DailySentenceState {
  loading: boolean;      // 加载状态
  error: string | null;  // 错误信息
  data: SentenceData | null;  // 句子数据
  isPlaying: boolean;    // 音频播放状态
  colorScheme: ColorScheme | null;  // 配色方案
  lastUpdated: number;   // 最后更新时间
}
```