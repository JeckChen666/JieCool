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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    credentials: 'omit',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  // Unwrap GoFrame-style envelope { code, message, data }
  if (json && typeof json === 'object' && 'code' in json) {
    const code = (json as any).code;
    const message = (json as any).message || 'Error';
    if (code !== 0) {
      throw new Error(message);
    }
    return (json as any).data as T;
  }
  return json as T;
}

export async function listPosts(params: { page?: number; size?: number; visibility?: 'public' | 'private' } = {}) {
  const usp = new URLSearchParams();
  if (params.page) usp.set('page', String(params.page));
  if (params.size) usp.set('size', String(params.size));
  if (params.visibility) usp.set('visibility', params.visibility);
  return request<{ page: number; size: number; total: number; list: WeiboItem[] }>(`${API_BASE}/weibo/posts?${usp.toString()}`);
}

export async function createPost(data: { content: string; visibility?: 'public' | 'private'; assets?: AssetInput[]; lat?: number; lng?: number; city?: string; device?: string }) {
  return request<{ id: number; createdAt: string }>(`${API_BASE}/weibo/posts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePost(data: { id: number; content?: string; visibility?: 'public' | 'private'; assets?: AssetInput[]; lat?: number; lng?: number; city?: string; device?: string }) {
  return request<{ updated: boolean; snapshotVersion: number }>(`${API_BASE}/weibo/posts/update`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getDetail(id: number) {
  const usp = new URLSearchParams({ id: String(id) });
  return request<{ id: number; content: string; visibility: string; createdAt: string; updatedAt: string; city?: string; lat?: number | null; lng?: number | null; device?: string; assets: { fileId: number; kind: string }[] }>(
    `${API_BASE}/weibo/posts/detail?${usp.toString()}`
  );
}

export async function getSnapshots(postId: number, page = 1, size = 10) {
  const usp = new URLSearchParams({ postId: String(postId), page: String(page), size: String(size) });
  return request<{ page: number; size: number; total: number; items: { id: number; version: number; createdAt: string; visibility: string }[] }>(`${API_BASE}/weibo/posts/snapshots?${usp.toString()}`);
}

export async function getSnapshot(id: number) {
  const usp = new URLSearchParams({ id: String(id) });
  return request<{ id: number; version: number; createdAt: string; visibility: string; content: string; assets: { fileId: number; kind: string }[] }>(`${API_BASE}/weibo/snapshot?${usp.toString()}`);
}

export async function deletePost(id: number) {
  return request<{ ok: boolean }>(`${API_BASE}/weibo/posts/delete`, {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}