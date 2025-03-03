#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import uuid
from typing import Annotated
from fastapi import WebSocket
from fastapi import APIRouter, Depends, Path, Query, Request, Body

from backend.app.notebook.schema.notebook import CreateNotebookParam, GetNotebookListDetails, UpdateNotebookParam
from backend.app.notebook.service.chat_service import ChatService
from backend.app.notebook.service.notebook_service import notebook_service
from backend.common.pagination import DependsPagination, paging_data
from backend.common.response.response_schema import ResponseModel, response_base
from backend.common.security.jwt import DependsJwtAuth
from backend.database.db_mysql import CurrentSession
from backend.utils.serializers import select_as_dict, select_list_serialize

router = APIRouter()


@router.get('/all', summary='获取所有笔记本')
async def get_all_notebooks() -> ResponseModel:
    notebooks = await notebook_service.get_all()
    data = [GetNotebookListDetails.from_orm(notebook) for notebook in notebooks]
    return response_base.success(data=data)


@router.get('/user/all', summary='获取用户所有笔记本', dependencies=[DependsJwtAuth])
async def get_user_all_notebooks(request: Request,) -> ResponseModel:
    notebooks = await notebook_service.get_user_notebooks(user_uuid=request.user.uuid)
    data = select_list_serialize(notebooks)
    return response_base.success(data=data)


@router.get('/{pk}', summary='获取笔记本详情')
async def get_notebook(pk: Annotated[int, Path(...)]) -> ResponseModel:
    notebook = await notebook_service.get(pk=pk)
    data = GetNotebookListDetails(**select_as_dict(notebook))
    return response_base.success(data=data)


@router.get('/uuid/{uuid}', summary='获取来源详情')
async def get_notebook_by_uuid(uuid: Annotated[str, Path(...)]) -> ResponseModel:
    source = await notebook_service.get_by_uuid(uuid=uuid)
    data = GetNotebookListDetails(**select_as_dict(source))
    return response_base.success(data=data)



@router.get(
    '',
    summary='（模糊条件）分页获取所有笔记本',
    dependencies=[
        DependsJwtAuth,
        DependsPagination,
    ],
)
async def get_pagination_notebooks(
    db: CurrentSession,
    title: Annotated[str | None, Query()] = None,
    active: Annotated[bool | None, Query()] = None,
) -> ResponseModel:
    notebook_select = await notebook_service.get_select(title=title, active=active)
    page_data = await paging_data(db, notebook_select, GetNotebookListDetails)
    return response_base.success(data=page_data)


@router.post(
    '',
    summary='创建笔记本',
    dependencies=[
        DependsJwtAuth,
    ],
)
async def create_notebook(
    request: Request,
    title: str = Body(..., embed=True, description="笔记本名字"),
) -> ResponseModel:
    obj = CreateNotebookParam(
        user_uuid=request.user.uuid,
        uuid=str(uuid.uuid4()),
        title=title,
        active=True
    )
    await notebook_service.create(obj=obj)
    return response_base.success()


@router.put(
    '/{pk}',
    summary='更新笔记本',
    # dependencies=[
    #     DependsJwtAuth,
    # ],
)
async def update_notebook(pk: Annotated[int, Path(...)], obj: UpdateNotebookParam) -> ResponseModel:
    count = await notebook_service.update(pk=pk, obj=obj)
    if count > 0:
        return response_base.success()
    return response_base.fail()


@router.put(
    '/{pk}/sources',
    summary='更新笔记本来源',
    dependencies=[
        # DependsJwtAuth,
    ],
)
async def update_notebook_sources(
    pk: Annotated[int, Path(...)], source_ids: Annotated[list[int], Query(...)]) -> ResponseModel:
    count = await notebook_service.update_notebook_sources(pk=pk, source_ids=source_ids)
    if count > 0:
        return response_base.success()
    return response_base.fail()


@router.delete(
    '',
    summary='（批量）删除笔记本',
    dependencies=[

    ],
)
async def delete_notebooks(pk: Annotated[list[int], Query(...)]) -> ResponseModel:
    count = await notebook_service.delete(pk=pk)
    if count > 0:
        return response_base.success()
    return response_base.fail()


@router.websocket("/ws/ClientLLMResponse")
async def chat_websocket(websocket: WebSocket):
    # 获取 WebSocket 连接中的 `source` 参数
    source_param = websocket.query_params.get("source")
    source = source_param.split(",") if source_param else []

    notes_param = websocket.query_params.get("notes")
    notes = notes_param.split(",") if notes_param else []
    chat_service = ChatService(source, notes)
    await chat_service.initialize_sources()
    await websocket.accept()

    while True:
        data = await websocket.receive_text()

        # 处理消息，并可根据 source 参数的值执行不同的逻辑
        result = await chat_service.process_message(json.loads(data))

        await websocket.send_text(result)
