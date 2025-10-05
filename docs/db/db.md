# 数据库

## 数据库选型

选用关系型数据库 PostgreSQL，版本号为 18.0
测试环境中的参数如下

````json
{
    "PG_HOST": "127.0.0.1",
    "PG_PORT": "5432",
    "PG_USER": "admin",
    "PG_PASSWORD": "123456",
    "PG_DATABASE": "JieCool"
}
````

## 连接与配置（后端 GoFrame）

后端连接串在 `server/manifest/config/config.yaml` 中配置。默认模板使用 MySQL 示例，请替换为 PostgreSQL：

```yaml
database:
  default:
    # 连接串格式：pgsql:<user>:<pass>@tcp(<host>:<port>)/<database>
    link: "pgsql:admin:123456@tcp(127.0.0.1:5432)/JieCool"
```

说明与建议：
- 开发环境建议使用本地或 Docker 启动 PostgreSQL 18，确保端口与权限一致。
- 生产环境请通过环境变量注入敏感信息（用户名、密码），避免明文配置入库。

## 迁移与种子数据（规划）

为保持各环境一致性，采用 SQL 迁移文件管理版本，示例目录如下：

```
db/
├── migrations/
│   ├── 0001_init_users.sql
│   ├── 0002_init_profiles.sql
│   └── 0003_init_misc.sql
└── seeds/
    └── dev/
        ├── users.sql
        └── profiles.sql
```

执行策略（Windows PowerShell 示例，后续将提供脚本）：
- 迁移执行：按文件名编号顺序执行 `db/migrations/*.sql`。
- 种子数据：在开发环境执行 `db/seeds/dev/*.sql`，便于联调。

命名规范：
- 迁移文件采用 4 位编号 + 描述（例如 `0001_init_users.sql`），避免冲突。
- 在迁移中明确索引、外键与约束的设计意图，并添加必要注释。
