package daily

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "server/api/daily/v1"
	"server/internal/service"
)

// GetSentence 获取每日一句
func (c *ControllerV1) GetSentence(ctx context.Context, req *v1.GetSentenceReq) (res *v1.GetSentenceRes, err error) {
	// 调用服务层获取每日一句数据
	sentence, err := service.Daily().GetSentence(ctx)
	if err != nil {
		return nil, gerror.WrapCode(gcode.CodeInternalError, err, "获取每日一句失败")
	}

	// 返回响应数据
	return &v1.GetSentenceRes{
		Sid:         sentence.Sid,
		Content:     sentence.Content,
		Note:        sentence.Note,
		Picture4:    sentence.Picture4,
		Tts:         sentence.Tts,
		Dateline:    sentence.Dateline,
		Caption:     sentence.Caption,
		Translation: sentence.Translation,
		Tags:        sentence.Tags,
	}, nil
}