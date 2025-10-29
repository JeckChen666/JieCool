// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package blog

import (
	"context"

	"server/api/blog/v1"
)

type IBlogV1 interface {
	Create(ctx context.Context, req *v1.CreateReq) (res *v1.CreateRes, err error)
	Update(ctx context.Context, req *v1.UpdateReq) (res *v1.UpdateRes, err error)
	List(ctx context.Context, req *v1.ListReq) (res *v1.ListRes, err error)
	Detail(ctx context.Context, req *v1.DetailReq) (res *v1.DetailRes, err error)
	Delete(ctx context.Context, req *v1.DeleteReq) (res *v1.DeleteRes, err error)
	CreateCategory(ctx context.Context, req *v1.CreateCategoryReq) (res *v1.CreateCategoryRes, err error)
	ListCategories(ctx context.Context, req *v1.ListCategoriesReq) (res *v1.ListCategoriesRes, err error)
	CreateComment(ctx context.Context, req *v1.CreateCommentReq) (res *v1.CreateCommentRes, err error)
	ListComments(ctx context.Context, req *v1.ListCommentsReq) (res *v1.ListCommentsRes, err error)
	DeleteComment(ctx context.Context, req *v1.DeleteCommentReq) (res *v1.DeleteCommentRes, err error)
}
