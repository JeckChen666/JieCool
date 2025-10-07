// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package daily

import (
	"context"

	"server/api/daily/v1"
)

type IDailyV1 interface {
	GetSentence(ctx context.Context, req *v1.GetSentenceReq) (res *v1.GetSentenceRes, err error)
}
