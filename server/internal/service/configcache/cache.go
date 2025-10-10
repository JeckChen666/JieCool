package configcache

import (
	"context"
	"sync"
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

// ConfigItem 以内存形式存储的配置项
type ConfigItem struct {
	Namespace   string
	Env         string
	Key         string
	Type        string
	Value       interface{}
	Enabled     bool
	Version     int
	Description string
	UpdatedBy   string
	UpdatedAt   string
}

// 进程内缓存结构：ns -> env -> key -> item
var (
	mu    sync.RWMutex
	store map[string]map[string]map[string]ConfigItem
)

// PreloadAll 启动时预加载所有 enabled 配置到内存缓存
func PreloadAll(ctx context.Context) (int, error) {
	start := time.Now()
	items := make([]ConfigItem, 0)

	// 从数据库读取动态配置（按需调整字段名/表名）
	// 期望表结构：dynamic_configs
	// 字段示例：namespace, env, key, type, value, enabled, version, description, updated_by, updated_at
	rows, err := g.DB().Ctx(ctx).Model("dynamic_configs").Where("enabled", true).All()
	if err != nil {
		g.Log().Error(ctx, "PreloadAll query failed:", err)
		return 0, err
	}
	for _, r := range rows {
		items = append(items, ConfigItem{
			Namespace:   r["namespace"].String(),
			Env:         r["env"].String(),
			Key:         r["key"].String(),
			Type:        r["type"].String(),
			Value:       r["value"].Val(),
			Enabled:     r["enabled"].Bool(),
			Version:     int(r["version"].Int()),
			Description: r["description"].String(),
			UpdatedBy:   r["updated_by"].String(),
			UpdatedAt:   r["updated_at"].String(),
		})
	}

	// 构建新缓存
	newStore := make(map[string]map[string]map[string]ConfigItem)
	for _, it := range items {
		nsMap, ok := newStore[it.Namespace]
		if !ok {
			nsMap = make(map[string]map[string]ConfigItem)
			newStore[it.Namespace] = nsMap
		}
		envMap, ok := nsMap[it.Env]
		if !ok {
			envMap = make(map[string]ConfigItem)
			nsMap[it.Env] = envMap
		}
		envMap[it.Key] = it
	}

	// 原子替换
	mu.Lock()
	store = newStore
	mu.Unlock()

	elapsed := time.Since(start)
	g.Log().Infof(ctx, "ConfigCache PreloadAll completed: entries=%d, elapsed=%s", len(items), elapsed)
	return len(items), nil
}

// Rebuild 销毁并重建缓存
func Rebuild(ctx context.Context) (int, time.Duration, error) {
	start := time.Now()
	// 清空旧缓存（避免读到脏数据）；在失败情况下会保留旧缓存，因此这里先构造新缓存再替换
	// 为简化，此处直接调用 PreloadAll，它内部会替换 store
	cnt, err := PreloadAll(ctx)
	elapsed := time.Since(start)
	if err != nil {
		g.Log().Errorf(ctx, "ConfigCache Rebuild failed: %v", err)
		return 0, elapsed, err
	}
	g.Log().Infof(ctx, "ConfigCache Rebuild success: entries=%d, elapsed=%s", cnt, elapsed)
	return cnt, elapsed, nil
}

// Get 内部读取接口
func Get(ctx context.Context, ns, env, key string) (ConfigItem, bool) {
	mu.RLock()
	defer mu.RUnlock()
	if store == nil {
		return ConfigItem{}, false
	}
	nsMap, ok := store[ns]
	if !ok {
		return ConfigItem{}, false
	}
	envMap, ok := nsMap[env]
	if !ok {
		return ConfigItem{}, false
	}
	it, ok := envMap[key]
	return it, ok
}

// Stats 当前缓存条目数
func Stats() int {
	mu.RLock()
	defer mu.RUnlock()
	total := 0
	for _, ns := range store {
		for _, env := range ns {
			total += len(env)
		}
	}
	return total
}