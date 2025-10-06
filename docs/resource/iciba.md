# 每日一句——金山词霸

请求地址（GET）：

```text
https://open.iciba.com/dsapi/
```

响应示例

```json
{
  "sid": "5735",
  "tts": "https://staticedu-wps.cache.iciba.com/audio/a3b7473ed93afeccd4e00140b96a01f5.mp3",
  "content": "The full moon unites hearts across miles.",
  "note": "满月让千里心相连。",
  "love": "0",
  "translation": "新版每日一句",
  "picture": "https://staticedu-wps.cache.iciba.com/image/d0f9c727b4eafbab0c83e0bafb0ddd22.jpg",
  "picture2": "https://staticedu-wps.cache.iciba.com/image/cd0100507045385761964f58f45a011e.png",
  "caption": "词霸每日一句",
  "dateline": "2025-10-06",
  "s_pv": "0",
  "sp_pv": "0",
  "fenxiang_img": "https://staticedu-wps.cache.iciba.com/image/367e51acc723f11d0a5946dd8fe4e45e.png",
  "picture3": "https://staticedu-wps.cache.iciba.com/image/157d30250633cbd454c34571515e35d8.jpg",
  "picture4": "https://staticedu-wps.cache.iciba.com/image/8650f20da6f5d1fb89c9d4e21c26e3d7.jpg",
  "tags": [
  ]
}
```

响应字段说明

| 字段名 | 类型 | 说明       |
| --- | --- |----------|
| sid | string | 句子id     |
| tts | string | 句子的mp3地址 |
| content | string | 句子       |
| note | string | 句子的翻译    |
| love | string | 喜欢       |
| translation | string | 句子的翻译(旧) |
| picture | string | 句子图片     |
| picture2 | string | 句子图片     |
| caption | string | 句子图片的标题  |
| dateline | string | 句子的日期    |
| fenxiang_img | string | 分享的图片    |
| picture3 | string | 句子图片     |
| picture4 | string | 句子图片     |
| tags | array | 句子的标签    |

其中我们需要使用的字段为
- content：句子
- note：句子翻译
- picture4：图片
- tts：句子的mp3