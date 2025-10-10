package service

import (
    "context"
    "encoding/json"
    "fmt"
    "time"
    "sync"

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

// 内存缓存：保存每日一句以及过期时间
var (
    cachedSentence *DailySentence
    cacheExpiry    time.Time
    cacheMu        sync.RWMutex
)

// nextMidnight 计算下一个本地午夜时间，用于将缓存设置到当天结束
func nextMidnight(now time.Time) time.Time {
    y, m, d := now.Date()
    loc := now.Location()
    return time.Date(y, m, d+1, 0, 0, 0, 0, loc)
}

// GetSentence 获取每日一句（带内存缓存）
func (s *sDailyService) GetSentence(ctx context.Context) (*DailySentence, error) {
    // 1) 优先读取缓存（未过期直接返回）
    cacheMu.RLock()
    if cachedSentence != nil && time.Now().Before(cacheExpiry) {
        defer cacheMu.RUnlock()
        return cachedSentence, nil
    }
    cacheMu.RUnlock()

    // 2) 缓存不存在或已过期，刷新缓存
    // 为避免并发下重复请求，这里简单使用写锁保护整个刷新过程
    cacheMu.Lock()
    // 双重检查，防止并发情况下重复刷新
    if cachedSentence != nil && time.Now().Before(cacheExpiry) {
        s := cachedSentence
        cacheMu.Unlock()
        return s, nil
    }

    // 金山词霸每日一句API地址
    apiURL := "https://open.iciba.com/dsapi/"

    // 创建HTTP客户端
    client := gclient.New()
    client.SetTimeout(10 * time.Second)

    // 发送GET请求
    response, err := client.Get(ctx, apiURL)
    if err != nil {
        // 如果拉取失败但已有旧数据，返回旧数据（降级）
        if cachedSentence != nil {
            g.Log().Warningf(ctx, "请求金山词霸API失败，返回旧缓存数据: %v", err)
            s := cachedSentence
            cacheMu.Unlock()
            return s, nil
        }
        cacheMu.Unlock()
        g.Log().Errorf(ctx, "请求金山词霸API失败: %v", err)
        return nil, fmt.Errorf("请求金山词霸API失败: %w", err)
    }
    defer response.Close()

    // 检查响应状态码
    if response.StatusCode != 200 {
        if cachedSentence != nil {
            g.Log().Warningf(ctx, "金山词霸API返回错误状态码(%d)，返回旧缓存数据", response.StatusCode)
            s := cachedSentence
            cacheMu.Unlock()
            return s, nil
        }
        cacheMu.Unlock()
        g.Log().Errorf(ctx, "金山词霸API返回错误状态码: %d", response.StatusCode)
        return nil, fmt.Errorf("金山词霸API返回错误状态码: %d", response.StatusCode)
    }

    // 读取响应内容
    content := response.ReadAllString()
    if content == "" {
        if cachedSentence != nil {
            g.Log().Warning(ctx, "金山词霸API返回空内容，返回旧缓存数据")
            s := cachedSentence
            cacheMu.Unlock()
            return s, nil
        }
        cacheMu.Unlock()
        g.Log().Error(ctx, "金山词霸API返回空内容")
        return nil, fmt.Errorf("金山词霸API返回空内容")
    }

    // 解析JSON响应
    var sentence DailySentence
    if err := json.Unmarshal([]byte(content), &sentence); err != nil {
        if cachedSentence != nil {
            g.Log().Warningf(ctx, "解析金山词霸API响应失败，返回旧缓存数据: %v", err)
            s := cachedSentence
            cacheMu.Unlock()
            return s, nil
        }
        cacheMu.Unlock()
        g.Log().Errorf(ctx, "解析金山词霸API响应失败: %v", err)
        return nil, fmt.Errorf("解析金山词霸API响应失败: %w", err)
    }

    // 记录日志
    g.Log().Infof(ctx, "成功获取每日一句: %s - %s", sentence.Content, sentence.Note)

    // 设置缓存与过期时间（到下一次午夜）
    cachedSentence = &sentence
    cacheExpiry = nextMidnight(time.Now())
    cacheMu.Unlock()

    return &sentence, nil
}