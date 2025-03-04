
import axios, {HttpError, HttpResponse} from './interceptor.ts';
import qs from 'query-string';
import type { RcFile } from 'rc-upload/lib/interface';
import { message } from 'antd';
import { getToken } from '../utils/auth';
export interface NoteSourceReq {
    file: RcFile;
    active?: boolean;
    file_type?: string;
}

export interface NoteSourceUpdateReq {
    title?: string;
    content?: string;
    type?: string;
    url?: string;
    active?: boolean;
}

export interface NoteSourceNotebookReq {
    notebook_ids: number[];
}

export interface NoteSourceRes {
    id: number;
    uuid: string;
    title: string;
    content: string;
    type: string;
    url: string;
    created_time: string;
    updated_time: string;
    active: boolean;
}

export interface NoteSourceParams {
    title?: string;
    active?: boolean;
    page?: number;
    size?: number;
}

export interface NoteSourceListRes {
    items: NoteSourceRes[];
    total: number;
}

export interface NoteSourceDeleteParams {
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
// 获取所有来源
export function queryNoteSourceAll(): Promise<NoteSourceRes[]> {
    return spnAxios.get('/v1/notesource/all');
}

// 获取来源详情
export function queryNoteSourceDetail(pk: number): Promise<NoteSourceRes> {
    return spnAxios.get(`/v1/notesource/${pk}`);
}

// 获取来源列表（分页）
export function queryNoteSourceList(params: NoteSourceParams): Promise<NoteSourceListRes> {
    return spnAxios.get('/v1/notesource', {
        params,
        paramsSerializer: (obj) => {
            return qs.stringify(obj);
        },
    });
}

// 创建来源
export function createNoteSource({ notebookId, data }: { notebookId: number; data: NoteSourceReq }) {
    const formData = new FormData();
    formData.append('file', data.file);  // Attach the file
    formData.append('file_type', 'pdf');  // Set the file type
    formData.append('active', String(data.active ?? true));  // Default to true if not specified

    // Ensure axios sends the data as multipart/form-data
    return spnAxios.post(`/v1/notesource/${notebookId}/notebooks`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

// 更新来源
export function updateNoteSource(pk: number, data: NoteSourceUpdateReq) {
    return spnAxios.put(`/v1/notesource/${pk}`, data);
}

// 更新来源关联的笔记本
export function updateNoteSourceNotebooks(pk: number, data: NoteSourceNotebookReq) {
    return spnAxios.put(`/v1/notesource/${pk}/notebooks`, data);
}

// 批量删除来源
export function deleteNoteSource(params: NoteSourceDeleteParams) {
    return spnAxios.delete('/v1/notesource', {
        params,
        paramsSerializer: (obj) => {
            return qs.stringify(obj);
        },
    });
}
