import axios, {HttpError, HttpResponse} from './interceptor.ts';
import { message } from 'antd';
import qs from 'query-string';
import { getToken } from '../utils/auth';
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
// 从 localStorage 或状态管理中获取 Token
// 封装错误提示逻辑
const showError = (mes: string) => {
    message.error(mes);
};
const spnAxios = axios.create({
    baseURL: '/spn',  // 设置 baseURL 为 spn
    withCredentials: true,
});
// 请求拦截器：添加 Authorization 头
spnAxios.interceptors.request.use((config) => {
    const token=getToken();
    if (token) {
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
        };
    }
    return config;
});

spnAxios.interceptors.response.use(
    (response) => {
        const { code, data }: HttpResponse = response.data;
        if (code === 401) {
            // TODO: 处理 token 过期，自动刷新 token 或跳转登录界面
        }
        return data;
    },
    (error: any) => {
        let res: HttpError = {
            msg: '服务器响应异常，请稍后重试',
            code: 500,
        };

        if (error.response) {
            res = error.response.data;
        }

        if (error.message === 'Network Error') {
            res.msg = '服务器连接异常，请稍后重试';
        }

        if (error.code === 'ECONNABORTED') {
            res.msg = '请求超时，请稍后重试';
        }

        showError(res.msg);

        return Promise.reject(res);
    }
);
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
