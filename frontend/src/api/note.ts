import axios, {HttpError, HttpResponse} from './interceptor.ts';
import { message } from 'antd';
import qs from 'query-string';
import { getToken } from '../utils/auth';

export interface NoteReq {
    title?: string;
    content?: string;
    type: string;
    active?: boolean;
}

export interface NoteUpdateReq {
    title?: string;
    content?: string;
    active?: boolean;
}

export interface NoteNotebookReq {
    notebook_ids: number[];
}

export interface NoteRes {
    id: number;
    uuid: string;
    title: string;
    content: string;
    type: string;
    created_time: string;
    updated_time: string;
    active: boolean;
}

export interface NoteParams {
    title?: string;
    active?: boolean;
    page?: number;
    size?: number;
}

export interface NoteListRes {
    items: NoteRes[];
    total: number;
}

export interface NoteDeleteParams {
    pk: number[];
}
//封装错误提示逻辑
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
// 获取所有笔记
export function queryNoteAll(): Promise<NoteRes[]> {
    return spnAxios.get('/v1/note/all');
}

// 获取笔记详情
export function queryNoteDetail(pk: number): Promise<NoteRes> {
    return spnAxios.get(`/v1/note/${pk}`);
}

// 获取笔记列表（分页）
export function queryNoteList(params: NoteParams): Promise<NoteListRes> {
    return spnAxios.get('/v1/note', {
        params,
        paramsSerializer: (obj) => {
            return qs.stringify(obj);
        },
    });
}

// 创建笔记
export function createNote({ notebookId, data }: { notebookId: number; data: NoteReq }) {
    return spnAxios.post(`/v1/note/${notebookId}/notebooks`, data);
}

export interface NoteUpdateReq {
    title?: string;
    content?: string;
    active?: boolean;
}

// 更新笔记
export function updateNote(pk: number, data: NoteUpdateReq) {
    return spnAxios.put(`/v1/note/${pk}`,data);
}

// 更新笔记关联的笔记本
export function updateNoteNotebooks(pk: number, data: NoteNotebookReq) {
    return spnAxios.put(`/v1/note/${pk}/notebooks`, data);
}

// 批量删除笔记
export function deleteNote(params: NoteDeleteParams) {
    return spnAxios.delete('/v1/note', {
        params,
        paramsSerializer: (obj) => {
            return qs.stringify(obj);
        },
    });
}
