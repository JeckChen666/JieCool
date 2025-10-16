package auth

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/golang-jwt/jwt/v5"

	"server/internal/service/configcache"
)

// Claims 自定义声明（可扩展）
type Claims struct {
	Subject string `json:"sub"`
	jwt.RegisteredClaims
}

// 统一未授权错误
var ErrUnauthorized = errors.New("unauthorized")

const (
	nsAuth               = "auth"
	keyJwtSecret         = "jwt_secret"
	keyPasswordUpdatedAt = "password_updated_at" // Unix 秒时间戳
)

// currentEnv 获取当前环境（用于动态配置命名空间检索）
func currentEnv(ctx context.Context) string {
	if v, _ := g.Cfg().Get(ctx, "env"); v != nil && v.String() != "" {
		return v.String()
	}
	if v, _ := g.Cfg().Get(ctx, "app.env"); v != nil && v.String() != "" {
		return v.String()
	}
	return "default"
}

func getJwtSecret(ctx context.Context) (string, error) {
	env := currentEnv(ctx)
	it, ok := configcache.Get(ctx, nsAuth, env, keyJwtSecret)
	if !ok || it.Value == nil || strings.TrimSpace(g.NewVar(it.Value).String()) == "" {
		return "", errors.New("jwt secret not configured")
	}
	// 兼容可能的引号
	return strings.Trim(g.NewVar(it.Value).String(), " \t\r\n\""), nil
}

func getPasswordUpdatedAt(ctx context.Context) int64 {
	env := currentEnv(ctx)
	it, ok := configcache.Get(ctx, nsAuth, env, keyPasswordUpdatedAt)
	if !ok || it.Value == nil {
		return 0
	}
	v := g.NewVar(it.Value)
	if v.IsInt() {
		return v.Int64()
	}
	s := strings.TrimSpace(v.String())
	if s == "" {
		return 0
	}
	ts := g.NewVar(s).Int64()
	return ts
}

// GenerateToken 生成令牌
func GenerateToken(ctx context.Context, ttlSeconds int64) (string, int64, error) {
	secret, err := getJwtSecret(ctx)
	if err != nil {
		return "", 0, err
	}
	now := time.Now()
	exp := now.Add(time.Duration(ttlSeconds) * time.Second)
	claims := &Claims{
		Subject: "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(exp),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", 0, err
	}
	return signed, exp.Unix(), nil
}

// ValidateToken 校验令牌，并结合 password_updated_at 实现统一失效
func ValidateToken(ctx context.Context, tokenString string) (*Claims, error) {
	secret, err := getJwtSecret(ctx)
	if err != nil {
		return nil, err
	}
	parsed, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil || !parsed.Valid {
		return nil, ErrUnauthorized
	}
	claims, ok := parsed.Claims.(*Claims)
	if !ok {
		return nil, ErrUnauthorized
	}
	// 令牌统一失效：签发时间不得早于密码更新时间
	pwdUpdatedAt := getPasswordUpdatedAt(ctx)
	if pwdUpdatedAt > 0 {
		iat := int64(0)
		if claims.IssuedAt != nil {
			iat = claims.IssuedAt.Unix()
		}
		if iat < pwdUpdatedAt {
			return nil, ErrUnauthorized
		}
	}
	return claims, nil
}
