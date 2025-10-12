# 微博模块（个人微博）实施计划

## 背景与目标
- 在现有项目中新增“微博模块”，类似新浪微博，用于发布文本+图片，支持附件。
- 支持再次编辑与历史快照查看；记录时间、地点（经纬度、城市）、设备、IP 等信息。
- 支持分页查询，默认按创建时间从新到旧。
- 支持可见性设置（公开/登录可见），当前不实现完整权限体系，但需预留接口与字段，未来可对接。
- 图片与附件接入现有文件管理系统，并需以“微博”分类标记，便于后续检索与管理。

## 总体设计
- 服务端：在 server/ 中新增 weibo 相关 API、模型、DAO、Service、控制器、数据库迁移。
- 前端：在 front-web/ 中新增微博页面与组件，包括发布、列表、详情、编辑、历史快照查看。
- 数据：新增 3 张表（微博主表、微博资产表、微博快照表），以及必要索引；资产与文件系统打通。
- 权限：以 visibility 字段表达公开/私有，提供中间件与策略占位；当前私有视图仅做“需登录”判断的预留。

## 数据库设计（server/db/migrations/）
1) weibo_posts（微博主表）
- id: bigint PK
- content: text（正文）
- created_at: timestamp
- updated_at: timestamp
- author_id: bigint（预留，当前可固定为本人或空）
- visibility: varchar(16)（枚举：public, private）默认 public
- lat: decimal(10,6) 可空
- lng: decimal(10,6) 可空
- city: varchar(128) 可空（反向地理解析结果）
- device: varchar(256) 可空（UA/设备名）
- ip: varchar(64) 可空
- is_deleted: boolean 默认 false（软删除预留）
- extra: jsonb 可空（未来扩展字段）

索引建议：
- idx_weibo_posts_created_at_desc（created_at DESC）
- idx_weibo_posts_visibility（visibility）
- idx_weibo_posts_author_id（author_id）

2) weibo_assets（微博资产表，关联图片/附件）
- id: bigint PK
- post_id: bigint FK -> weibo_posts.id
- file_id: bigint（引用文件系统中的文件主键，若已有 file_stats 或 file 表，请对齐）
- kind: varchar(16)（image / attachment）
- sort_order: int（显示顺序）
- created_at: timestamp

索引建议：
- idx_weibo_assets_post_id_kind（post_id, kind）

3) weibo_snapshots（微博快照表，记录编辑历史）
- id: bigint PK
- post_id: bigint FK -> weibo_posts.id
- version: int（从 1 递增）
- snapshot_content: text（当时的内容快照）
- snapshot_visibility: varchar(16)（当时的可见性）
- snapshot_meta: jsonb（当时的元信息，如 lat/lng/city/device/ip 等，以及资产列表的 file_id 集合）
- created_at: timestamp（快照创建时间，即编辑提交时间）

索引建议：
- idx_weibo_snapshots_post_id_version（post_id, version）

快照策略：
- 每次编辑保存前，读取当前最新状态，写入一条快照（version+1）。
- 资产快照初期以 file_id 列表存储于 snapshot_meta 中，后续可演进至快照资产表以满足更细粒度需求。

## 文件管理系统对接
- 通过现有文件接口上传图片/附件时，写入分类标记：
  - source/category: "weibo"
  - usage: "image" 或 "attachment"
  - relate_id: 对应 post_id（可在创建成功后补记）
- 存储与访问路径沿用既有系统；仅在元数据中增加分类标记，便于后续筛选与清理。
- weibo_assets.file_id 直接引用文件系统内的主键或唯一标识。

## 服务端 API 设计（server/api/weibo/ 与 internal/*）
- 路由前缀：/api/weibo

1) POST /api/weibo/posts（创建微博）
请求：
```
{
  "content": "文本内容",
  "visibility": "public|private",
  "assets": [
    {"fileId": 123, "kind": "image", "sortOrder": 1},
    {"fileId": 456, "kind": "attachment", "sortOrder": 2}
  ],
  "location": {"lat": 31.2304, "lng": 121.4737, "city": "Shanghai"},
  "device": "UA/DeviceString"
}
```
响应：
```
{"id": 1001, "createdAt": "2025-10-11T10:00:00Z"}
```

2) PUT /api/weibo/posts/{id}（编辑微博，自动生成快照）
请求：与创建类似（可变更 content、visibility、assets、location、device）
响应：
```
{"updated": true, "snapshotVersion": 3}
```

3) GET /api/weibo/posts（分页列表）
参数：
- page: 默认 1
- pageSize: 默认 10（上限 50）
- visibility: 可选（如仅查询公开）
- orderBy: 默认 created_at desc
响应：
```
{
  "page": 1,
  "pageSize": 10,
  "total": 123,
  "list": [
    {
      "id": 1001,
      "content": "...",
      "visibility": "public",
      "createdAt": "...",
      "assets": [{"fileId": 123, "kind": "image"}],
      "location": {"city": "Shanghai"}
    }
  ]
}
```

4) GET /api/weibo/posts/{id}（详情）
- 返回当前最新状态与资产列表

5) GET /api/weibo/posts/{id}/snapshots（快照列表）
- 返回 version、created_at，供前端选择查看

6) GET /api/weibo/snapshots/{snapshotId}（查看单个快照）
- 返回快照内容与当时资产 file_id 列表

7) DELETE /api/weibo/posts/{id}（软删除，预留）

权限预留：
- visibility=public：匿名可读
- visibility=private：需登录可读（当前实现仅占位，中间件读取登录态但不强制）
- 在 internal/service/ 或 middleware/ 中提供 AuthOptional 钩子与策略接口，未来对接完整权限系统。

## 服务端实现任务分解
1) DB 迁移
- 新增 3 张表的迁移脚本（server/db/migrations/）。

2) Model
- internal/model/weibo_post.go / weibo_asset.go / weibo_snapshot.go

3) DAO
- internal/dao/weibo_post.go / weibo_asset.go / weibo_snapshot.go

4) Service
- internal/service/weibo_service.go：
  - CreatePost(dto)
  - UpdatePost(dto)（落库后生成快照）
  - GetPost(id)
  - ListPosts(query)
  - ListSnapshots(postId)
  - GetSnapshot(id)

5) Controller
- internal/controller/weibo_controller.go：绑定以上 API。
- server/api/weibo/ 路由注册与分组。

6) 文件系统接入
- 创建/编辑时，同步写入文件元数据分类（source=weibo, usage=image/attachment, relate_id=post_id）。

7) 地理位置与设备信息
- IP：后端从请求头/远端地址获取记录。
- 城市：预留反向地理解析（可先用占位：仅保存经纬度与前端上报城市字符串）。

8) 分页与排序
- 标准 offset/limit 或 cursor 方案，初期采用 offset/limit。

9) 日志与审计
- 编辑生成快照即审计记录；额外操作日志可复用 visit/log 机制，后续接入。

## 前端实现任务分解（front-web/）
1) 页面与路由
- /weibo（列表页，默认按创建时间倒序）
- /weibo/new（发布页）
- /weibo/[id]（详情页）
- /weibo/[id]/edit（编辑页）
- /weibo/[id]/history（历史快照查看）

2) 组件
- PostCard：展示文本、图片、附件、位置信息、设备、时间、可见性；
- Composer：编辑器（文本、图片上传、附件上传、可见性开关、位置采集）。
- SnapshotViewer：快照列表与快照内容展示。

3) 交互
- 图片/附件上传接入现有文件接口，携带分类标记（source=weibo, usage=...）。
- 位置采集：前端尝试浏览器 Geolocation 获取经纬度；无法获取则手动输入或只传城市；
- 设备信息：通过 UA 采集传 device 字段；
- IP 不在前端采集，由后端记录。

4) 分页
- 列表支持分页或无限滚动；默认 pageSize=10。

5) 可见性
- 发布与编辑时设置 public/private；详情页显示当前可见性。

## 权限体系预留
- 数据层：visibility 字段；必要时可增加 acl_json（jsonb）以支持更细粒度策略。
- 接口层：中间件 AuthOptional 占位；未来可替换为 AuthRequired，并依据 visibility/acl 判定。
- 前端：若后端返回需登录，跳转登录页或展示受限提示。

## 测试与验收
- 单元测试：Service 层创建/编辑/快照生成、分页查询、可见性过滤。
- 集成测试：API 流程（发布 -> 编辑 -> 查看历史 -> 列表分页）。
- 前端 E2E：发布、编辑、历史查看与文件上传流程。

## 上线与回滚
- 迁移上线前备份数据库。
- 变更仅为新增表与路由，风险较低；如需回滚，删除相关路由与表（谨慎处理数据）。

## 时间计划（建议）
- Day 1-2：DB 设计与迁移、后端模型/DAO/Service 雏形。
- Day 3：后端控制器与路由、文件系统接入。
- Day 4-5：前端页面与组件、上传与分页联调。
- Day 6：快照查看与编辑完善、基础测试。
- Day 7：自测与验收、文档完善。

## 风险与注意事项
- 位置解析依赖浏览器与第三方服务，需做好失败降级。
- 资产快照初期以 file_id 列表记录，若需完整历史复原（含排序与元信息），后续需引入快照资产表。
- 权限仅做占位，私有内容暂不强校验，部署前需要明确使用者范围。

## 后续迭代方向
- 更细粒度的权限与分组（例如仅自己、好友可见）。
- 更丰富的内容类型（视频、链接卡片）。
- 地理反向解析服务接入与缓存。
- 搜索与标签（话题）体系。
- 富文本支持与草稿箱。