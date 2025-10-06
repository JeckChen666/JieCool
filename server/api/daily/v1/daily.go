package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

// GetSentenceReq 获取每日一句请求结构
type GetSentenceReq struct {
	g.Meta `path:"/daily/sentence" tags:"Daily" method:"get" summary:"Get daily sentence from iciba"`
}

// GetSentenceRes 每日一句响应结构
type GetSentenceRes struct {
	Sid         string   `json:"sid"`         // 句子ID
	Content     string   `json:"content"`     // 英文句子
	Note        string   `json:"note"`        // 中文翻译
	Picture4    string   `json:"picture4"`    // 图片地址
	Tts         string   `json:"tts"`         // 音频地址
	Dateline    string   `json:"dateline"`    // 日期
	Caption     string   `json:"caption"`     // 标题
	Translation string   `json:"translation"` // 翻译（备用）
	Tags        []string `json:"tags"`        // 标签
}
