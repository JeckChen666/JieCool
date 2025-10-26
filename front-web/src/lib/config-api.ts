/**
 * 配置管理API
 * 提供配置列表、版本管理、创建、更新、删除、回滚等功能
 */

import {alova} from './alova';

// 配置项类型定义（与后端保持一致）
export interface ConfigItem {
    namespace: string;
    env: string;
    key: string;
    type: string;
    value: any;
    enabled: boolean;
    version: number;
    description: string;
    updated_by: string;
    updated_at: string;
}

// 配置列表查询参数（与后端ListReq保持一致）
export interface ConfigListRequest {
    namespace?: string;
    env?: string;
    key_like?: string;
    enabled?: boolean | string;
    page?: number;
    size?: number;
}

// 配置列表响应（与后端ListRes保持一致）
export interface ConfigListResponse {
    items: ConfigItem[];
    total: number;
}

// 配置版本历史类型定义（与后端VersionItem保持一致）
export interface ConfigVersion {
    version: number;
    value: any;
    changed_by: string;
    change_reason: string;
    created_at: string;
}

// 版本历史查询参数（与后端VersionsReq保持一致）
export interface ConfigVersionsRequest {
    namespace: string;
    env: string;
    key: string;
    page?: number;
    size?: number;
}

// 版本历史响应（与后端VersionsRes保持一致）
export interface ConfigVersionsResponse {
    items: ConfigVersion[];
    total: number;
}

// 创建配置请求参数（与后端CreateReq保持一致）
export interface ConfigCreateRequest {
    namespace: string;
    env: string;
    key: string;
    type: string;
    value: any;
    enabled: boolean;
    description: string;
    change_reason: string;
}

// 创建配置响应（与后端CreateRes保持一致）
export interface ConfigCreateResponse {
    ok: boolean;
}

// 更新配置请求参数（与后端UpdateReq保持一致）
export interface ConfigUpdateRequest {
    namespace: string;
    env: string;
    key: string;
    type: string;
    value: any;
    enabled: boolean;
    description: string;
    version: number;
    change_reason: string;
}

// 更新配置响应（与后端UpdateRes保持一致）
export interface ConfigUpdateResponse {
    ok: boolean;
}

// 删除配置请求参数（与后端DeleteReq保持一致）
export interface ConfigDeleteRequest {
    namespace: string;
    env: string;
    key: string;
    version: number;
    change_reason: string;
}

// 删除配置响应（与后端DeleteRes保持一致）
export interface ConfigDeleteResponse {
    ok: boolean;
}

// 回滚配置请求参数（与后端RollbackReq保持一致）
export interface ConfigRollbackRequest {
    namespace: string;
    env: string;
    key: string;
    to_version: number;
    change_reason: string;
}

// 回滚配置响应（与后端RollbackRes保持一致）
export interface ConfigRollbackResponse {
    ok: boolean;
}

// 缓存刷新请求参数（与后端RefreshReq保持一致）
export interface ConfigRefreshParams {
    reason: string;
}

// 缓存刷新响应（与后端RefreshRes保持一致）
export interface ConfigRefreshResponse {
    status: string;
    entries: number;
    elapsed_ms: number;
}

// 缓存统计响应（与后端StatsRes保持一致）
export interface ConfigStatsResponse {
    entries: number;
}

// 导入配置请求参数（与后端ImportReq保持一致）
export interface ConfigImportRequest {
    items: ConfigItem[];
    change_reason: string;
}

// 导入配置响应（与后端ImportRes保持一致）
export interface ConfigImportResponse {
    ok: boolean;
    added: number;
    updated: number;
}

// 导出配置请求参数（与后端ExportReq保持一致）
export interface ConfigExportRequest {
    namespace?: string;
    env?: string;
    enabled?: boolean;
}

// 导出配置响应（与后端ExportRes保持一致）
export interface ConfigExportResponse {
    items: ConfigItem[];
}

// 单项查询请求参数（与后端ItemReq保持一致）
export interface ConfigItemRequest {
    namespace: string;
    env: string;
    key: string;
}

// 单项查询响应（与后端ItemRes保持一致）
export interface ConfigItemResponse {
    item: ConfigItem;
}

// 配置管理API对象
export const configApi = {
    // 获取配置列表
    list: (params?: ConfigListRequest) =>
        alova.Get<ConfigListResponse>('config/list', {params}),

    // 获取单个配置项
    item: (params: ConfigItemRequest) =>
        alova.Get<ConfigItemResponse>('config/item', {params}),

    // 获取配置的版本历史
    versions: (params: ConfigVersionsRequest) =>
        alova.Get<ConfigVersionsResponse>('config/versions', {params}),

    // 创建新配置
    create: (data: ConfigCreateRequest) =>
        alova.Post<ConfigCreateResponse>('config/create', data),

    // 更新配置
    update: (data: ConfigUpdateRequest) =>
        alova.Put<ConfigUpdateResponse>('config/update', data),

    // 删除配置
    delete: (params: ConfigDeleteRequest) =>
        alova.Delete<ConfigDeleteResponse>('config/delete', {params}),

    // 回滚配置到指定版本
    rollback: (params: ConfigRollbackRequest) =>
        alova.Post<ConfigRollbackResponse>('config/rollback', params),

    // 获取缓存统计信息
    stats: () =>
        alova.Get<ConfigStatsResponse>('config/stats'),

    // 刷新缓存
    refresh: (params: ConfigRefreshParams) =>
        alova.Post<ConfigRefreshResponse>('config/refresh', params),

    // 导入配置
    import: (data: ConfigImportRequest) =>
        alova.Post<ConfigImportResponse>('config/import', data),

    // 导出配置
    export: (params?: ConfigExportRequest) =>
        alova.Get<ConfigExportResponse>('config/export', {params})
};