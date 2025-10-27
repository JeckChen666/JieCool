package utility

import (
	"bytes"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"strings"

	"github.com/disintegration/imaging"
	"github.com/gogf/gf/v2/errors/gerror"
)

// ImageProcessor 图片处理器
type ImageProcessor struct {
	MaxWidth  int // 最大宽度
	MaxHeight int // 最大高度
	Quality   int // JPEG质量 (1-100)
}

// NewImageProcessor 创建新的图片处理器
func NewImageProcessor() *ImageProcessor {
	return &ImageProcessor{
		MaxWidth:  800, // 默认最大宽度
		MaxHeight: 600, // 默认最大高度
		Quality:   85,  // 默认JPEG质量
	}
}

// GenerateThumbnail 生成缩略图
// content: 原始图片内容
// mimeType: 图片MIME类型
// width: 缩略图宽度
// height: 缩略图高度
// 返回: 缩略图内容, 实际宽度, 实际高度, 错误
func (p *ImageProcessor) GenerateThumbnail(content []byte, mimeType string, width, height int) ([]byte, int, int, error) {
	// 检查是否为支持的图片格式
	if !p.IsSupportedImageType(mimeType) {
		return nil, 0, 0, gerror.Newf("不支持的图片格式: %s", mimeType)
	}

	// 解码图片
	img, format, err := image.Decode(bytes.NewReader(content))
	if err != nil {
		return nil, 0, 0, gerror.Wrap(err, "解码图片失败")
	}

	// 如果指定的尺寸为0，则使用默认尺寸
	if width <= 0 {
		width = 200
	}
	if height <= 0 {
		height = 200
	}

	// 生成缩略图，保持宽高比
	thumbnail := imaging.Thumbnail(img, width, height, imaging.Lanczos)

	// 获取实际尺寸
	bounds := thumbnail.Bounds()
	actualWidth := bounds.Dx()
	actualHeight := bounds.Dy()

	// 编码缩略图
	var buf bytes.Buffer
	switch strings.ToLower(format) {
	case "jpeg", "jpg":
		err = jpeg.Encode(&buf, thumbnail, &jpeg.Options{Quality: p.Quality})
	case "png":
		err = png.Encode(&buf, thumbnail)
	case "gif":
		err = gif.Encode(&buf, thumbnail, nil)
	default:
		// 默认使用JPEG格式
		err = jpeg.Encode(&buf, thumbnail, &jpeg.Options{Quality: p.Quality})
	}

	if err != nil {
		return nil, 0, 0, gerror.Wrap(err, "编码缩略图失败")
	}

	return buf.Bytes(), actualWidth, actualHeight, nil
}

// IsSupportedImageType 检查是否为支持的图片类型
func (p *ImageProcessor) IsSupportedImageType(mimeType string) bool {
	supportedTypes := []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp", // 注意：需要额外的库支持WebP
	}

	mimeType = strings.ToLower(mimeType)
	for _, supportedType := range supportedTypes {
		if mimeType == supportedType {
			return true
		}
	}
	return false
}

// GetImageInfo 获取图片信息
func (p *ImageProcessor) GetImageInfo(content []byte) (width, height int, format string, err error) {
	img, format, err := image.Decode(bytes.NewReader(content))
	if err != nil {
		return 0, 0, "", gerror.Wrap(err, "解码图片失败")
	}

	bounds := img.Bounds()
	return bounds.Dx(), bounds.Dy(), format, nil
}

// ResizeImage 调整图片尺寸
func (p *ImageProcessor) ResizeImage(content []byte, width, height int, keepAspectRatio bool) ([]byte, error) {
	img, format, err := image.Decode(bytes.NewReader(content))
	if err != nil {
		return nil, gerror.Wrap(err, "解码图片失败")
	}

	var resized image.Image
	if keepAspectRatio {
		// 保持宽高比
		resized = imaging.Resize(img, width, height, imaging.Lanczos)
	} else {
		// 强制调整到指定尺寸
		resized = imaging.Fit(img, width, height, imaging.Lanczos)
	}

	// 编码图片
	var buf bytes.Buffer
	switch strings.ToLower(format) {
	case "jpeg", "jpg":
		err = jpeg.Encode(&buf, resized, &jpeg.Options{Quality: p.Quality})
	case "png":
		err = png.Encode(&buf, resized)
	case "gif":
		err = gif.Encode(&buf, resized, nil)
	default:
		err = jpeg.Encode(&buf, resized, &jpeg.Options{Quality: p.Quality})
	}

	if err != nil {
		return nil, gerror.Wrap(err, "编码图片失败")
	}

	return buf.Bytes(), nil
}

// ValidateImageSize 验证图片尺寸是否在允许范围内
func (p *ImageProcessor) ValidateImageSize(content []byte) error {
	width, height, _, err := p.GetImageInfo(content)
	if err != nil {
		return err
	}

	if width > p.MaxWidth || height > p.MaxHeight {
		return gerror.Newf("图片尺寸过大，最大允许尺寸: %dx%d，当前尺寸: %dx%d",
			p.MaxWidth, p.MaxHeight, width, height)
	}

	return nil
}

// GetMimeTypeFromExtension 根据文件扩展名获取MIME类型
func GetMimeTypeFromExtension(extension string) string {
	extension = strings.ToLower(strings.TrimPrefix(extension, "."))

	mimeTypes := map[string]string{
		"jpg":  "image/jpeg",
		"jpeg": "image/jpeg",
		"png":  "image/png",
		"gif":  "image/gif",
		"webp": "image/webp",
		"bmp":  "image/bmp",
		"tiff": "image/tiff",
		"svg":  "image/svg+xml",
	}

	if mimeType, exists := mimeTypes[extension]; exists {
		return mimeType
	}

	return "application/octet-stream"
}

// IsImageFile 检查文件是否为图片文件
func IsImageFile(mimeType string) bool {
	return strings.HasPrefix(strings.ToLower(mimeType), "image/")
}

// DetectFileCategory 根据MIME类型和文件扩展名自动检测文件分类
func DetectFileCategory(mimeType, extension string) string {
	mimeType = strings.ToLower(mimeType)
	extension = strings.ToLower(strings.TrimPrefix(extension, "."))

	// 图片文件
	if strings.HasPrefix(mimeType, "image/") {
		return "image"
	}

	// 视频文件
	if strings.HasPrefix(mimeType, "video/") {
		return "video"
	}

	// 音频文件
	if strings.HasPrefix(mimeType, "audio/") {
		return "audio"
	}

	// 文档文件（基于MIME类型和扩展名）
	documentTypes := map[string]string{
		// Microsoft Office文档
		"application/msword": "document",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
		"application/vnd.ms-excel": "document",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":         "document",
		"application/vnd.ms-powerpoint":                                             "document",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": "document",

		// PDF文档
		"application/pdf": "document",

		// 文本文档
		"text/plain":      "document",
		"text/csv":        "document",
		"text/rtf":        "document",
		"text/html":       "document",
		"text/xml":        "document",
		"text/css":        "document",
		"text/javascript": "document",
		"text/markdown":   "document",

		// 代码文件
		"application/json":       "document",
		"application/xml":        "document",
		"application/javascript": "document",
		"application/x-yaml":     "document",
		"application/yaml":       "document",
	}

	if category, exists := documentTypes[mimeType]; exists {
		return category
	}

	// 压缩包文件
	archiveTypes := map[string]string{
		"application/zip":              "archive",
		"application/x-rar-compressed": "archive",
		"application/x-7z-compressed":  "archive",
		"application/x-tar":            "archive",
		"application/x-gzip":           "archive",
		"application/gzip":             "archive",
		"application/x-bzip2":          "archive",
	}

	if category, exists := archiveTypes[mimeType]; exists {
		return category
	}

	// 基于扩展名的备用检测（用于MIME类型为application/octet-stream的情况）
	extensionCategories := map[string]string{
		// 图片扩展名
		"jpg": "image", "jpeg": "image", "png": "image", "gif": "image",
		"webp": "image", "bmp": "image", "tiff": "image", "svg": "image",
		"ico": "image", "psd": "image", "raw": "image",

		// 视频扩展名
		"mp4": "video", "avi": "video", "mkv": "video", "mov": "video",
		"wmv": "video", "flv": "video", "webm": "video", "m4v": "video",
		"3gp": "video", "mpg": "video", "mpeg": "video", "ts": "video",

		// 音频扩展名
		"mp3": "audio", "wav": "audio", "flac": "audio", "aac": "audio",
		"ogg": "audio", "wma": "audio", "m4a": "audio", "opus": "audio",
		"mka": "audio", "aiff": "audio", "au": "audio", "ra": "audio",

		// 文档扩展名
		"doc": "document", "docx": "document", "xls": "document", "xlsx": "document",
		"ppt": "document", "pptx": "document", "pdf": "document", "txt": "document",
		"rtf": "document", "csv": "document", "html": "document", "htm": "document",
		"xml": "document", "json": "document", "yaml": "document", "yml": "document",
		"md": "document", "markdown": "document", "tex": "document", "latex": "document",
		"css": "document", "scss": "document", "less": "document", "sass": "document",

		// 压缩包扩展名
		"zip": "archive", "rar": "archive", "7z": "archive", "tar": "archive",
		"gz": "archive", "tgz": "archive", "bz2": "archive", "xz": "archive",
		"deb": "archive", "rpm": "archive", "dmg": "archive", "iso": "archive",
	}

	if category, exists := extensionCategories[extension]; exists {
		return category
	}

	// 默认分类为其他
	return "other"
}
