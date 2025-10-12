package service

import (
	"context"
	"encoding/json"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "server/api/weibo/v1"
	"server/internal/dao"
	"server/internal/model/do"
	"server/internal/model/entity"
)

// IWeibo 微博服务接口
type IWeibo interface {
	// Create 创建微博，返回新ID与创建时间字符串
	Create(ctx context.Context, req *v1.CreateReq) (id int64, createdAt string, err error)
	// Update 更新微博并生成快照，返回快照版本号
	Update(ctx context.Context, req *v1.UpdateReq) (snapshotVersion int, err error)
	// List 列表查询，返回帖子列表、每帖资产映射以及总数
	List(ctx context.Context, req *v1.ListReq) (posts []*entity.WeiboPosts, assetsMap map[int64][]*entity.WeiboAssets, total int, err error)
	// Detail 详情
	Detail(ctx context.Context, id int64) (post *entity.WeiboPosts, assets []*entity.WeiboAssets, err error)
	// Snapshots 快照列表
	Snapshots(ctx context.Context, postId int64, page, size int) (items []*entity.WeiboSnapshots, total int, err error)
	// Snapshot 快照详情（含从meta解析出的资产）
	Snapshot(ctx context.Context, id int64) (snap *entity.WeiboSnapshots, metaAssets []v1.AssetItem, err error)
	// Delete 软删除
	Delete(ctx context.Context, id int64) error
}

type sWeibo struct{}

// Weibo 微博服务实例
func Weibo() IWeibo {
	return &sWeibo{}
}

// Create 创建微博
func (s *sWeibo) Create(ctx context.Context, req *v1.CreateReq) (id int64, createdAt string, err error) {
	r := g.RequestFromCtx(ctx)
	var ip string
	if r != nil {
		ip = r.GetClientIp()
	}

	if req.Visibility == "" {
		req.Visibility = "public"
	}

	err = g.DB().Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 插入主帖
		result, err := dao.WeiboPosts.Ctx(ctx).TX(tx).InsertAndGetId(do.WeiboPosts{
			Content:    req.Content,
			Visibility: req.Visibility,
			AuthorId:   0,
			Lat:        req.Lat,
			Lng:        req.Lng,
			City:       req.City,
			Device:     req.Device,
			Ip:         ip,
			IsDeleted:  false,
			CreatedAt:  gtime.Now(),
			UpdatedAt:  gtime.Now(),
		})
		if err != nil {
			return gerror.Wrap(err, "创建微博失败")
		}
		id = result

		// 资产
		for _, a := range req.Assets {
			if a.FileId <= 0 {
				continue
			}
			if a.Kind == "" {
				a.Kind = "attachment"
			}
			if _, err := dao.WeiboAssets.Ctx(ctx).TX(tx).Insert(do.WeiboAssets{
				PostId:    id,
				FileId:    a.FileId,
				Kind:      a.Kind,
				SortOrder: a.SortOrder,
				CreatedAt: gtime.Now(),
			}); err != nil {
				return gerror.Wrap(err, "保存微博资产失败")
			}
		}

		return nil
	})
	if err != nil {
		return 0, "", err
	}

	// 查询创建时间
	rec, err := dao.WeiboPosts.Ctx(ctx).Where(dao.WeiboPosts.Columns().Id, id).One()
	if err != nil {
		return id, "", gerror.Wrap(err, "查询创建时间失败")
	}
	var post entity.WeiboPosts
	if !rec.IsEmpty() {
		_ = rec.Struct(&post)
		if post.CreatedAt != nil {
			createdAt = post.CreatedAt.String()
		}
	}
	return id, createdAt, nil
}

// Update 更新微博并生成快照
func (s *sWeibo) Update(ctx context.Context, req *v1.UpdateReq) (snapshotVersion int, err error) {
	r := g.RequestFromCtx(ctx)
	var ip string
	if r != nil {
		ip = r.GetClientIp()
	}

	err = g.DB().Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 读取当前帖子
		rec, err := dao.WeiboPosts.Ctx(ctx).TX(tx).Where(dao.WeiboPosts.Columns().Id, req.Id).Where(dao.WeiboPosts.Columns().IsDeleted, false).One()
		if err != nil {
			return gerror.Wrap(err, "查询微博失败")
		}
		if rec.IsEmpty() {
			return gerror.New("微博不存在或已删除")
		}
		var cur entity.WeiboPosts
		_ = rec.Struct(&cur)

		// 当前资产
		assetsRec, err := dao.WeiboAssets.Ctx(ctx).TX(tx).Where(dao.WeiboAssets.Columns().PostId, req.Id).Order(dao.WeiboAssets.Columns().SortOrder + "," + dao.WeiboAssets.Columns().Id).All()
		if err != nil {
			return gerror.Wrap(err, "查询微博资产失败")
		}
		var assets []*entity.WeiboAssets
		if !assetsRec.IsEmpty() {
			_ = assetsRec.Structs(&assets)
		}

		// 计算版本
		cnt, err := dao.WeiboSnapshots.Ctx(ctx).TX(tx).Where(dao.WeiboSnapshots.Columns().PostId, req.Id).Count()
		if err != nil {
			return gerror.Wrap(err, "统计快照失败")
		}
		snapshotVersion = cnt + 1

		// 生成快照meta
		type metaAsset struct {
			FileId    int64  `json:"fileId"`
			Kind      string `json:"kind"`
			SortOrder int    `json:"sortOrder"`
		}
		meta := struct {
			Assets []metaAsset `json:"assets"`
			City   string      `json:"city"`
			Lat    *float64    `json:"lat"`
			Lng    *float64    `json:"lng"`
			Device string      `json:"device"`
			Ip     string      `json:"ip"`
		}{}
		for _, a := range assets {
			meta.Assets = append(meta.Assets, metaAsset{FileId: a.FileId, Kind: a.Kind, SortOrder: a.SortOrder})
		}
		meta.City = cur.City
		if cur.Lat != 0 {
			lat := cur.Lat
			meta.Lat = &lat
		}
		if cur.Lng != 0 {
			lng := cur.Lng
			meta.Lng = &lng
		}
		meta.Device = cur.Device
		meta.Ip = cur.Ip
		metaStr, _ := json.Marshal(meta)

		// 保存快照
		if _, err := dao.WeiboSnapshots.Ctx(ctx).TX(tx).Insert(do.WeiboSnapshots{
			PostId:             req.Id,
			Version:            snapshotVersion,
			SnapshotContent:    cur.Content,
			SnapshotVisibility: cur.Visibility,
			SnapshotMeta:       string(metaStr),
			CreatedAt:          gtime.Now(),
		}); err != nil {
			return gerror.Wrap(err, "保存快照失败")
		}

		// 更新帖子
		data := g.Map{}
		if req.Content != "" {
			data[dao.WeiboPosts.Columns().Content] = req.Content
		}
		if req.Visibility != "" {
			data[dao.WeiboPosts.Columns().Visibility] = req.Visibility
		}
		if req.City != "" {
			data[dao.WeiboPosts.Columns().City] = req.City
		}
		if req.Device != "" {
			data[dao.WeiboPosts.Columns().Device] = req.Device
		}
		if req.Lat != nil {
			data[dao.WeiboPosts.Columns().Lat] = *req.Lat
		}
		if req.Lng != nil {
			data[dao.WeiboPosts.Columns().Lng] = *req.Lng
		}
		if ip != "" {
			data[dao.WeiboPosts.Columns().Ip] = ip
		}
		if len(data) > 0 {
			if _, err := dao.WeiboPosts.Ctx(ctx).TX(tx).Where(dao.WeiboPosts.Columns().Id, req.Id).Update(data); err != nil {
				return gerror.Wrap(err, "更新微博失败")
			}
		}

		// 更新资产：先删后插
		if _, err := dao.WeiboAssets.Ctx(ctx).TX(tx).Where(dao.WeiboAssets.Columns().PostId, req.Id).Delete(); err != nil {
			return gerror.Wrap(err, "清理微博资产失败")
		}
		for _, a := range req.Assets {
			if a.FileId <= 0 {
				continue
			}
			kind := a.Kind
			if kind == "" {
				kind = "attachment"
			}
			if _, err := dao.WeiboAssets.Ctx(ctx).TX(tx).Insert(do.WeiboAssets{
				PostId:    req.Id,
				FileId:    a.FileId,
				Kind:      kind,
				SortOrder: a.SortOrder,
				CreatedAt: gtime.Now(),
			}); err != nil {
				return gerror.Wrap(err, "保存微博资产失败")
			}
		}

		return nil
	})

	return snapshotVersion, err
}

// List 列表查询
func (s *sWeibo) List(ctx context.Context, req *v1.ListReq) (posts []*entity.WeiboPosts, assetsMap map[int64][]*entity.WeiboAssets, total int, err error) {
	page := req.Page
	size := req.Size
	if page <= 0 {
		page = 1
	}
	if size <= 0 {
		size = 10
	}

	m := dao.WeiboPosts.Ctx(ctx).Where(dao.WeiboPosts.Columns().IsDeleted, false)
	if req.Visibility != "" {
		m = m.Where(dao.WeiboPosts.Columns().Visibility, req.Visibility)
	}

	total, err = m.Count()
	if err != nil {
		return nil, nil, 0, gerror.Wrap(err, "统计微博失败")
	}

	recs, err := m.OrderDesc(dao.WeiboPosts.Columns().CreatedAt).Limit(size).Offset((page - 1) * size).All()
	if err != nil {
		return nil, nil, 0, gerror.Wrap(err, "查询微博列表失败")
	}
	if !recs.IsEmpty() {
		_ = recs.Structs(&posts)
	}

	assetsMap = make(map[int64][]*entity.WeiboAssets)
	if len(posts) > 0 {
		ids := make([]int64, 0, len(posts))
		for _, p := range posts {
			ids = append(ids, p.Id)
		}
		aRecs, err := dao.WeiboAssets.Ctx(ctx).WhereIn(dao.WeiboAssets.Columns().PostId, ids).Order(dao.WeiboAssets.Columns().SortOrder + "," + dao.WeiboAssets.Columns().Id).All()
		if err != nil {
			return posts, nil, total, gerror.Wrap(err, "查询微博资产失败")
		}
		var allAssets []*entity.WeiboAssets
		if !aRecs.IsEmpty() {
			_ = aRecs.Structs(&allAssets)
		}
		for _, a := range allAssets {
			assetsMap[a.PostId] = append(assetsMap[a.PostId], a)
		}
	}

	return posts, assetsMap, total, nil
}

// Detail 详情
func (s *sWeibo) Detail(ctx context.Context, id int64) (post *entity.WeiboPosts, assets []*entity.WeiboAssets, err error) {
	rec, err := dao.WeiboPosts.Ctx(ctx).Where(dao.WeiboPosts.Columns().Id, id).Where(dao.WeiboPosts.Columns().IsDeleted, false).One()
	if err != nil {
		return nil, nil, gerror.Wrap(err, "查询微博失败")
	}
	if rec.IsEmpty() {
		return nil, nil, gerror.New("微博不存在或已删除")
	}
	_ = rec.Struct(&post)

	aRecs, err := dao.WeiboAssets.Ctx(ctx).Where(dao.WeiboAssets.Columns().PostId, id).Order(dao.WeiboAssets.Columns().SortOrder + "," + dao.WeiboAssets.Columns().Id).All()
	if err != nil {
		return post, nil, gerror.Wrap(err, "查询微博资产失败")
	}
	if !aRecs.IsEmpty() {
		_ = aRecs.Structs(&assets)
	}
	return post, assets, nil
}

// Snapshots 快照列表
func (s *sWeibo) Snapshots(ctx context.Context, postId int64, page, size int) (items []*entity.WeiboSnapshots, total int, err error) {
	if page <= 0 {
		page = 1
	}
	if size <= 0 {
		size = 10
	}
	m := dao.WeiboSnapshots.Ctx(ctx).Where(dao.WeiboSnapshots.Columns().PostId, postId)
	total, err = m.Count()
	if err != nil {
		return nil, 0, gerror.Wrap(err, "统计快照失败")
	}
	recs, err := m.OrderDesc(dao.WeiboSnapshots.Columns().Version).Limit(size).Offset((page - 1) * size).All()
	if err != nil {
		return nil, total, gerror.Wrap(err, "查询快照失败")
	}
	if !recs.IsEmpty() {
		_ = recs.Structs(&items)
	}
	return items, total, nil
}

// Snapshot 快照详情
func (s *sWeibo) Snapshot(ctx context.Context, id int64) (snap *entity.WeiboSnapshots, metaAssets []v1.AssetItem, err error) {
	rec, err := dao.WeiboSnapshots.Ctx(ctx).Where(dao.WeiboSnapshots.Columns().Id, id).One()
	if err != nil {
		return nil, nil, gerror.Wrap(err, "查询快照失败")
	}
	if rec.IsEmpty() {
		return nil, nil, gerror.New("快照不存在")
	}
	_ = rec.Struct(&snap)

	// 从meta解析资产
	type metaAsset struct {
		FileId    int64  `json:"fileId"`
		Kind      string `json:"kind"`
		SortOrder int    `json:"sortOrder"`
	}
	meta := struct {
		Assets []metaAsset `json:"assets"`
	}{}
	if snap.SnapshotMeta != "" {
		_ = json.Unmarshal([]byte(snap.SnapshotMeta), &meta)
		for _, a := range meta.Assets {
			metaAssets = append(metaAssets, v1.AssetItem{FileId: a.FileId, Kind: a.Kind})
		}
	}
	return snap, metaAssets, nil
}

// Delete 软删除
func (s *sWeibo) Delete(ctx context.Context, id int64) error {
	_, err := dao.WeiboPosts.Ctx(ctx).Where(dao.WeiboPosts.Columns().Id, id).Update(g.Map{dao.WeiboPosts.Columns().IsDeleted: true})
	if err != nil {
		return gerror.Wrap(err, "删除微博失败")
	}
	return nil
}
