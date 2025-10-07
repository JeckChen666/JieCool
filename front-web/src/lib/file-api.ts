import { alova } from './alova';

// TypeScript类型定义
export interface FileInfo {
  /** 文件UUID */
  file_uuid: string;
  /** 文件名 */
  file_name: string;
  /** 文件大小（字节） */
  file_size: number;
  /** 文件MIME类型 */
  mime_type: string;
  /** 文件分类 */
  category: string;
  /** 上传者ID */
  uploader_id: number;
  /** 下载次数 */
  download_count: number;
  /** 文件状态：1-正常，0-已删除 */
  file_status: number;
  /** 是否有缩略图 */
  has_thumbnail: boolean;
  /** 缩略图路径 */
  thumbnail_path?: string;
  /** 文件MD5哈希值 */
  file_md5?: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

export interface FileListItem {
  /** 文件ID */
  id?: number;
  /** 文件UUID */
  file_uuid: string;
  /** 文件名 */
  file_name: string;
  /** 文件扩展名 */
  file_extension?: string;
  /** 文件大小（字节） */
  file_size: number;
  /** 文件MIME类型 */
  mime_type: string;
  /** 文件MD5哈希值 */
  file_md5?: string;
  /** 文件分类 */
  category?: string;
  /** 文件分类（后端字段名） */
  file_category?: string;
  /** 下载次数 */
  download_count: number;
  /** 是否有缩略图 */
  has_thumbnail: boolean;
  /** 创建时间 */
  created_at: string;
  /** 下载URL */
  download_url?: string;
  /** 缩略图URL */
  thumbnail_url?: string;
}

export interface FileListParams {
  /** 页码，从1开始 */
  page?: number;
  /** 每页数量，默认10 */
  page_size?: number;
  /** 搜索关键词 */
  keyword?: string;
  /** 文件分类筛选 */
  category?: string;
  /** 文件扩展名筛选 */
  extension?: string;
  /** 排序字段：created_at, file_size, download_count */
  sort_by?: string;
  /** 排序方向：asc, desc */
  sort_order?: string;
}

export interface FileListResponse {
  /** 文件列表 */
  files: FileListItem[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  page_size: number;
  /** 总页数 */
  total_pages: number;
}

// 后端原始返回的数据结构
interface BackendFileListResponse {
  /** 文件列表 */
  list: FileListItem[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  page_size: number;
  /** 总页数 */
  total_pages: number;
}

export interface UploadFileResponse {
  /** 文件UUID */
  file_uuid: string;
  /** 文件名 */
  file_name: string;
  /** 文件大小 */
  file_size: number;
  /** 文件MIME类型 */
  mime_type: string;
  /** 文件MD5哈希值 */
  file_md5: string;
  /** 文件分类 */
  category: string;
  /** 下载URL */
  download_url: string;
  /** 缩略图URL（如果有） */
  thumbnail_url?: string;
}

export interface CategoryStats {
  /** 分类名称 */
  category: string;
  /** 文件数量 */
  count: number;
  /** 总大小 */
  size: number;
}

export interface ExtensionStats {
  /** 扩展名 */
  extension: string;
  /** 文件数量 */
  count: number;
  /** 总大小 */
  size: number;
}

export interface SizeDistribution {
  /** 大小范围 */
  range: string;
  /** 文件数量 */
  count: number;
}

export interface DailyUploadStats {
  /** 日期 */
  date: string;
  /** 上传数量 */
  count: number;
  /** 上传大小 */
  size: number;
}

export interface FileMd5Response {
  /** 文件UUID */
  file_uuid: string;
  /** 文件名 */
  file_name: string;
  /** 文件MD5哈希值 */
  file_md5: string;
  /** 文件大小 */
  file_size: number;
}

export interface FileStats {
  /** 总文件数 */
  total_files: number;
  /** 总大小（字节） */
  total_size: number;
  /** 总下载次数 */
  total_downloads: number;
  /** 分类统计 */
  category_stats: CategoryStats[];
  /** 扩展名统计 */
  extension_stats: ExtensionStats[];
  /** 大小分布 */
  size_distribution: SizeDistribution[];
  /** 每日上传统计（最近7天） */
  daily_upload_stats: DailyUploadStats[];
}

// API接口函数
export const fileApi = {
  /**
   * 上传文件
   * @param file 文件对象
   * @param category 文件分类（可选）
   */
  uploadFile: (file: File, category?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) {
      formData.append('category', category);
    }
    
    return alova.Post<UploadFileResponse>('/file/upload', formData, {
      headers: {
        // 不设置Content-Type，让浏览器自动设置multipart/form-data边界
      }
    });
  },

  /**
   * 获取文件列表
   * @param params 查询参数
   */
  getFileList: (params?: FileListParams) => {
    return alova.Get<BackendFileListResponse>('/file/list', {
      params: params || {},
      // 禁用缓存，强制每次都重新获取数据
      cacheFor: 0,
      transform: (response: any): BackendFileListResponse => {
        // alova响应拦截器已经提取了data字段，所以response就是data的内容
        // 将后端返回的 list 字段转换为前端期望的 files 字段，并处理字段映射
        const list = (response.list || []).map((item: any) => ({
          ...item,
          category: item.file_category || item.category || '未分类'
        }));
        
        return {
          list,
          total: response.total || 0,
          page: response.page || 1,
          page_size: response.page_size || 10,
          total_pages: response.total_pages || 0
        };
      }
    });
  },

  /**
   * 获取文件信息
   * @param fileUuid 文件UUID
   */
  getFileInfo: (fileUuid: string) => {
    return alova.Get<FileInfo>(`/file/info/${fileUuid}`);
  },

  /**
   * 删除文件
   * @param fileUuid 文件UUID
   */
  deleteFile: (fileUuid: string) => {
    return alova.Delete<{ success: boolean; message: string }>(`/file/delete/${fileUuid}`);
  },

  /**
   * 恢复文件
   * @param fileUuid 文件UUID
   */
  restoreFile: (fileUuid: string) => {
    return alova.Post<{ success: boolean; message: string }>(`/file/restore/${fileUuid}`);
  },

  /**
   * 获取文件统计信息
   */
  getFileStats: () => {
    return alova.Get<FileStats>('/file/stats');
  },

  /**
   * 获取文件MD5值
   * @param fileUuid 文件UUID
   */
  getFileMd5: (fileUuid: string) => {
    return alova.Get<{ file_md5: string }>(`/file/md5/${fileUuid}`);
  },

  /**
   * 获取文件下载URL
   * @param fileUuid 文件UUID
   */
  getDownloadUrl: (fileUuid: string) => {
    return `http://localhost:8080/file/download/${fileUuid}`;
  },

  /**
   * 获取缩略图URL
   * @param fileUuid 文件UUID
   */
  getThumbnailUrl: (fileUuid: string) => {
    return `http://localhost:8080/file/thumbnail/${fileUuid}`;
  }
};

// 工具函数
export const fileUtils = {
  /**
   * 格式化文件大小
   * @param bytes 字节数
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * 获取文件图标类型
   * @param mimeType MIME类型
   */
  getFileIconType: (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    return 'file';
  },

  /**
   * 格式化日期时间
   * @param dateString 日期字符串
   */
  formatDateTime: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  /**
   * 下载文件
   * @param fileUuid 文件UUID
   * @param fileName 文件名
   */
  downloadFile: async (fileUuid: string, fileName: string) => {
    try {
      const url = fileApi.getDownloadUrl(fileUuid);
      
      // 使用 fetch 发送请求以确保后端统计被触发
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }

      // 获取文件内容
      const blob = await response.blob();
      
      // 创建下载链接
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理 URL 对象
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('文件下载失败:', error);
      throw error;
    }
  },

  /**
   * 获取文件MD5哈希值
   * @param fileUuid 文件UUID
   */
  getFileMd5: (fileUuid: string) => {
    return alova.Get<FileMd5Response>(`/file/md5/${fileUuid}`);
  },

  /**
   * 计算文件的SHA-256哈希值（客户端）
   * 注意：Web Crypto API不支持MD5，这里使用SHA-256作为替代
   * @param file 文件对象
   */
  calculateFileSha256: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          resolve(hashHex);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * 下载文件并校验MD5
   * @param fileUuid 文件UUID
   * @param fileName 文件名
   * @param expectedMd5 期望的MD5值
   */
  downloadFileWithMd5Verification: async (fileUuid: string, fileName: string, expectedMd5?: string) => {
    try {
      const url = fileApi.getDownloadUrl(fileUuid);
      
      // 使用 fetch 发送请求
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }

      // 获取文件内容
      const blob = await response.blob();
      
      // 如果提供了期望的MD5值，进行校验
      // 注意：这里仍然使用服务器提供的MD5值进行校验
      if (expectedMd5) {
        // 获取服务器端的MD5值进行比较
        const md5Response = await fileApi.getFileMd5(fileUuid);
        const serverMd5 = md5Response.file_md5;
        
        if (serverMd5 !== expectedMd5) {
          throw new Error(`文件完整性校验失败！期望MD5: ${expectedMd5}, 服务器MD5: ${serverMd5}`);
        }
      }
      
      // 创建下载链接
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理 URL 对象
      window.URL.revokeObjectURL(downloadUrl);
      
      return true; // 下载并校验成功
    } catch (error) {
      console.error('文件下载或校验失败:', error);
      throw error;
    }
  }
};