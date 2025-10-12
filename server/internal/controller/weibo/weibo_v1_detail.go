package weibo

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/weibo/v1"
	"server/internal/service"
)

func (c *ControllerV1) Detail(ctx context.Context, req *v1.DetailReq) (res *v1.DetailRes, err error) {
	post, assets, err := service.Weibo().Detail(ctx, req.Id)
	if err != nil {
		return nil, gerror.Wrap(err, "查询微博详情失败")
	}

	var latPtr, lngPtr *float64
	if post.Lat != 0 {
		lat := post.Lat
		latPtr = &lat
	}
	if post.Lng != 0 {
		lng := post.Lng
		lngPtr = &lng
	}
	aset := make([]v1.AssetItem, 0)
	for _, a := range assets {
		aset = append(aset, v1.AssetItem{FileId: a.FileId, Kind: a.Kind})
	}

	return &v1.DetailRes{
		Id:         post.Id,
		Content:    post.Content,
		Visibility: post.Visibility,
		CreatedAt: func() string {
			if post.CreatedAt != nil {
				return post.CreatedAt.String()
			}
			return ""
		}(),
		UpdatedAt: func() string {
			if post.UpdatedAt != nil {
				return post.UpdatedAt.String()
			}
			return ""
		}(),
		City:   post.City,
		Lat:    latPtr,
		Lng:    lngPtr,
		Device: post.Device,
		Assets: aset,
	}, nil
}
