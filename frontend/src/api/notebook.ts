import axios from './interceptor.ts';
import qs from 'query-string';

export interface NotebookReq {
    title: string;
    content?: string;
    active?: boolean;
}

export interface NotebookUpdateReq {
    title?: string;
    content?: string;
    active?: boolean;
}

export interface NotebookSourceReq {
    source_ids: number[];
}

export interface NotebookRes {
    id: number;
    uuid: string;
    user_uuid: string;
    title: string;
    content: string;
    type: string;
    created_time: string;
    updated_time: string;
    active: boolean;
    source?: NotebookSourceRes[];
    notes?: NotebookNotesRes[];
}

export interface NotebookSourceRes {
    id: number;
    uuid: string;
    title: string;
    content: string;
    type: string;
    url: string;
}

export interface NotebookNotesRes {
    id: number;
    uuid: string;
    title: string;
    content: string;
    type: string;
}

export interface NotebookParams {
    title?: string;
    active?: boolean;
    page?: number;
    size?: number;
}

export interface NotebookListRes {
    items: NotebookRes[];
    total: number;
}

export interface NotebookDeleteParams {
    pk: number[];
}

const spnAxios = axios.create({
    baseURL: '/spn',  // 设置 baseURL 为 spn
    withCredentials: true,
});

// 获取所有笔记本
export function queryNotebookAll(): Promise<NotebookRes[]> {
    return spnAxios.get('/v1/notebook/all');
}

// 获取指定用户的所有笔记本
export function queryNotebookAllByUser(): Promise<NotebookRes[]> {
    return spnAxios.get(`/v1/notebook/user/all`);
}

// 获取笔记本详情
export function queryNotebookDetail(pk: number): Promise<NotebookRes> {
    return spnAxios.get(`/v1/notebook/${pk}`);
}

export function queryNotebookDetailByUuid(uuid: string): Promise<NotebookRes> {
    return spnAxios.get(`/v1/notebook/uuid/${uuid}`);
}

// 获取笔记本列表（分页）
export function queryNotebookList(params: NotebookParams): Promise<NotebookListRes> {
    return spnAxios.get('/v1/notebook', {
        params,
        paramsSerializer: (obj) => {
            return qs.stringify(obj);
        },
    });
}

// 创建笔记本
export function createNotebook(data: NotebookReq) {
    return spnAxios.post('/v1/notebook', data);
}

// 更新笔记本
export function updateNotebook(pk: number, data: NotebookUpdateReq) {
    return spnAxios.put(`/v1/notebook/${pk}`, data);
}

// 更新笔记本的来源
export function updateNotebookSource(pk: number, data: NotebookSourceReq) {
    return spnAxios.put(`/v1/notebook/${pk}/sources`, data);
}

// 批量删除笔记本
export function deleteNotebook(params: NotebookDeleteParams) {
    return spnAxios.delete('/v1/notebook', {
        params,
        paramsSerializer: (obj) => {
            return qs.stringify(obj);
        },
    });
}
