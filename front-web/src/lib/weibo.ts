import { alova } from './alova';

export type AssetInput = {
  fileId: number;
  kind: 'image' | 'attachment';
  sortOrder?: number;
};

export type WeiboItem = {
  id: number;
  content: string;
  visibility: 'public' | 'private';
  createdAt: string;
  city?: string;
  lat?: number | null;
  lng?: number | null;
  device?: string;
  assets: { fileId: number; kind: string }[];
};

// API接口函数
export const weiboApi = {
  /**
   * 获取微博列表
   * @param params 查询参数
   */
  listPosts: (params: { page?: number; size?: number; visibility?: 'public' | 'private' } = {}) => {
    return alova.Get<{ page: number; size: number; total: number; list: WeiboItem[] }>('/weibo/posts', {
      params
    });
  },

  /**
   * 创建微博
   * @param data 微博数据
   */
  createPost: (data: { content: string; visibility?: 'public' | 'private'; assets?: AssetInput[]; lat?: number; lng?: number; city?: string; device?: string }) => {
    return alova.Post<{ id: number; createdAt: string }>('/weibo/posts', data);
  },

  /**
   * 更新微博
   * @param data 微博数据
   */
  updatePost: (data: { id: number; content?: string; visibility?: 'public' | 'private'; assets?: AssetInput[]; lat?: number; lng?: number; city?: string; device?: string }) => {
    return alova.Put<{ updated: boolean; snapshotVersion: number }>('/weibo/posts/update', data);
  },

  /**
   * 获取微博详情
   * @param id 微博ID
   */
  getDetail: (id: number) => {
    return alova.Get<{ id: number; content: string; visibility: string; createdAt: string; updatedAt: string; city?: string; lat?: number | null; lng?: number | null; device?: string; assets: { fileId: number; kind: string }[] }>('/weibo/posts/detail', {
      params: { id: String(id) }
    });
  },

  /**
   * 获取微博快照列表
   * @param postId 微博ID
   * @param page 页码
   * @param size 每页数量
   */
  getSnapshots: (postId: number, page = 1, size = 10) => {
    return alova.Get<{ page: number; size: number; total: number; items: { id: number; version: number; createdAt: string; visibility: string }[] }>('/weibo/posts/snapshots', {
      params: { postId: String(postId), page: String(page), size: String(size) }
    });
  },

  /**
   * 获取微博快照详情
   * @param id 快照ID
   */
  getSnapshot: (id: number) => {
    return alova.Get<{ id: number; version: number; createdAt: string; visibility: string; content: string; assets: { fileId: number; kind: string }[] }>('/weibo/snapshot', {
      params: { id: String(id) }
    });
  },

  /**
   * 删除微博
   * @param id 微博ID
   */
  deletePost: (id: number) => {
    return alova.Delete<{ ok: boolean }>('/weibo/posts/delete', {
      id: String(id)
    });
  }
};

// 为了向后兼容，导出原有的函数
export const listPosts = weiboApi.listPosts;
export const createPost = weiboApi.createPost;
export const updatePost = weiboApi.updatePost;
export const getDetail = weiboApi.getDetail;
export const getSnapshots = weiboApi.getSnapshots;
export const getSnapshot = weiboApi.getSnapshot;
export const deletePost = weiboApi.deletePost;