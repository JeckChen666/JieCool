// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package file

import (
	"context"

	v1 "server/api/file/v1"
)

type IFileV1 interface {
	UploadFile(ctx context.Context, req *v1.UploadFileReq) (res *v1.UploadFileRes, err error)
	DownloadFile(ctx context.Context, req *v1.DownloadFileReq) (res *v1.DownloadFileRes, err error)
	GetThumbnail(ctx context.Context, req *v1.GetThumbnailReq) (res *v1.GetThumbnailRes, err error)
	GetFileInfo(ctx context.Context, req *v1.GetFileInfoReq) (res *v1.GetFileInfoRes, err error)
	GetFileList(ctx context.Context, req *v1.GetFileListReq) (res *v1.GetFileListRes, err error)
	DeleteFile(ctx context.Context, req *v1.DeleteFileReq) (res *v1.DeleteFileRes, err error)
	RestoreFile(ctx context.Context, req *v1.RestoreFileReq) (res *v1.RestoreFileRes, err error)
	GetFileStats(ctx context.Context, req *v1.GetFileStatsReq) (res *v1.GetFileStatsRes, err error)
	GetFileMd5(ctx context.Context, req *v1.GetFileMd5Req) (res *v1.GetFileMd5Res, err error)
}
