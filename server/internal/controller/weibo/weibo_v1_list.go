package weibo

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/weibo/v1"
	"server/internal/service"
)

func (c *ControllerV1) List(ctx context.Context, req *v1.ListReq) (res *v1.ListRes, err error) {
	posts, assetsMap, total, err := service.Weibo().List(ctx, req)
	if err != nil {
		return nil, gerror.Wrap(err, "查询微博列表失败")
	}

	items := make([]v1.WeiboItem, 0, len(posts))
	for _, p := range posts {
		var latPtr, lngPtr *float64
		if p.Lat != 0 {
			lat := p.Lat
			latPtr = &lat
		}
		if p.Lng != 0 {
			lng := p.Lng
			lngPtr = &lng
		}
		assets := make([]v1.AssetItem, 0)
		for _, a := range assetsMap[p.Id] {
			assets = append(assets, v1.AssetItem{FileId: a.FileId, Kind: a.Kind})
		}
		item := v1.WeiboItem{
			Id:         p.Id,
			Content:    p.Content,
			Visibility: p.Visibility,
			CreatedAt: func() string {
				if p.CreatedAt != nil {
					return p.CreatedAt.String()
				}
				return ""
			}(),
			City:   p.City,
			Lat:    latPtr,
			Lng:    lngPtr,
			Device: p.Device,
			Assets: assets,
		}
		items = append(items, item)
	}

	page := req.Page
	size := req.Size
	if page <= 0 {
		page = 1
	}
	if size <= 0 {
		size = 10
	}

	return &v1.ListRes{Page: page, Size: size, Total: total, List: items}, nil
}
