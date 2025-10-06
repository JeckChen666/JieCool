package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/gclient"
)

// DailySentence 每日一句数据结构
type DailySentence struct {
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

// IDailyService 每日一句服务接口
type IDailyService interface {
	GetSentence(ctx context.Context) (*DailySentence, error)
}

type sDailyService struct{}

// Daily 获取每日一句服务实例
func Daily() IDailyService {
	return &sDailyService{}
}

// GetSentence 从金山词霸API获取每日一句
func (s *sDailyService) GetSentence(ctx context.Context) (*DailySentence, error) {
	// 金山词霸每日一句API地址
	apiURL := "https://open.iciba.com/dsapi/"

	// 创建HTTP客户端
	client := gclient.New()
	client.SetTimeout(10 * time.Second)

	// 发送GET请求
	response, err := client.Get(ctx, apiURL)
	if err != nil {
		g.Log().Errorf(ctx, "请求金山词霸API失败: %v", err)
		return nil, fmt.Errorf("请求金山词霸API失败: %w", err)
	}
	defer response.Close()

	// 检查响应状态码
	if response.StatusCode != 200 {
		g.Log().Errorf(ctx, "金山词霸API返回错误状态码: %d", response.StatusCode)
		return nil, fmt.Errorf("金山词霸API返回错误状态码: %d", response.StatusCode)
	}

	// 读取响应内容
	content := response.ReadAllString()
	if content == "" {
		g.Log().Error(ctx, "金山词霸API返回空内容")
		return nil, fmt.Errorf("金山词霸API返回空内容")
	}

	// 解析JSON响应
	var sentence DailySentence
	if err := json.Unmarshal([]byte(content), &sentence); err != nil {
		g.Log().Errorf(ctx, "解析金山词霸API响应失败: %v", err)
		return nil, fmt.Errorf("解析金山词霸API响应失败: %w", err)
	}

	// 记录日志
	g.Log().Infof(ctx, "成功获取每日一句: %s - %s", sentence.Content, sentence.Note)

	return &sentence, nil
}