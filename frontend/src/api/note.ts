import axios from './interceptor.ts';
import qs from 'query-string';

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
const spnAxios = axios.create({
    baseURL: '/spn',  // 设置 baseURL 为 spn
    withCredentials: true,
});
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
