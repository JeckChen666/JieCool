# 每日一句 API 文档

## 概述
每日一句API提供来自金山词霸的每日英语句子，包含英文原文、中文翻译、配图和音频。

## 基础配置
- **API基础地址**: `http://localhost:8080`
- **内容类型**: `application/json`
- **字符编码**: `UTF-8`

## 接口列表

### 1. 获取每日一句

#### 接口信息
- **路径**: `/daily/sentence`
- **方法**: `GET`
- **描述**: 获取当日的英语句子及相关信息

#### 请求参数
无需参数

#### 响应格式
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "sid": "5735",
    "content": "The full moon unites hearts across miles.",
    "note": "满月让千里心相连。",
    "picture4": "https://staticedu-wps.cache.iciba.com/image/xxx.jpg",
    "tts": "https://staticedu-wps.cache.iciba.com/audio/xxx.mp3",
    "dateline": "2025-10-06",
    "caption": "词霸每日一句",
    "translation": "满月让千里心相连。",
    "tags": ["情感", "自然"]
  }
}
```

#### 响应字段说明
| 字段名 | 类型 | 描述 |
|--------|------|------|
| code | number | 响应状态码，0表示成功 |
| message | string | 响应消息 |
| data | object | 数据对象 |
| data.sid | string | 句子唯一标识 |
| data.content | string | 英文句子 |
| data.note | string | 中文翻译 |
| data.picture4 | string | 配图URL |
| data.tts | string | 音频URL |
| data.dateline | string | 日期 |
| data.caption | string | 标题 |
| data.translation | string | 翻译（与note相同） |
| data.tags | array | 标签数组 |

#### 示例请求
```bash
curl -X GET "http://localhost:8080/daily/sentence"
```

#### 示例响应
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "sid": "5735",
    "content": "The full moon unites hearts across miles.",
    "note": "满月让千里心相连。",
    "picture4": "https://staticedu-wps.cache.iciba.com/image/8650f20240930.jpg",
    "tts": "https://staticedu-wps.cache.iciba.com/audio/8650f20240930.mp3",
    "dateline": "2025-10-06",
    "caption": "词霸每日一句",
    "translation": "满月让千里心相连。",
    "tags": ["情感", "自然"]
  }
}
```

## 错误处理

### 错误响应格式
```json
{
  "code": 1,
  "message": "错误描述",
  "data": null
}
```

### 常见错误码
| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| 1 | 获取数据失败 | 检查网络连接，稍后重试 |
| 500 | 服务器内部错误 | 联系技术支持 |

## 注意事项
1. 该接口调用金山词霸的公开API，数据来源为第三方服务
2. 图片和音频资源托管在金山词霸的CDN上
3. 服务器已实现内存缓存：当日内容在服务器内存中缓存至本地时间的下一次午夜；在第三方服务短暂不可用时，接口会降级返回最近的缓存内容
4. 音频文件为MP3格式，支持现代浏览器播放
5. 图片为JPG格式，适合作为背景图片使用

## 更新日志
- 2025-10-06: 初始版本，支持获取每日一句功能
- 2025-10-09: 服务端新增内存缓存，缓存当日数据至次日凌晨，并在外部服务不可用时返回最近的缓存数据