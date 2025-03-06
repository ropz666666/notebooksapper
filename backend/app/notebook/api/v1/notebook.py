#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import uuid
import asyncio
from typing import Annotated
from fastapi import WebSocket
from fastapi import APIRouter, Depends, Path, Query, Request, Body
from fastapi import HTTPException
from backend.app.notebook.schema.notebook import CreateNotebookParam, GetNotebookListDetails, UpdateNotebookParam
from backend.app.notebook.service.chat_service import ChatService
from backend.app.notebook.service.notebook_service import notebook_service
from backend.common.pagination import DependsPagination, paging_data
from backend.common.response.response_schema import ResponseModel, response_base
from backend.common.security.jwt import DependsJwtAuth
from backend.database.db_mysql import CurrentSession
from backend.utils.serializers import select_as_dict, select_list_serialize
from starlette.responses import StreamingResponse

router = APIRouter()


@router.get('/all', summary='获取所有笔记本')
async def get_all_notebooks() -> ResponseModel:
    notebooks = await notebook_service.get_all()
    data = [GetNotebookListDetails.from_orm(notebook) for notebook in notebooks]
    return response_base.success(data=data)


@router.get('/user/all', summary='获取用户所有笔记本')
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


@router.post("/sse/ClientLLMResponse", response_class=StreamingResponse)
async def chat_sse(request: Request):
    # 从请求体中获取用户输入的消息
    try:
        user_id = request.headers.get('User-ID')  # 从请求头中获取 User-ID
        print("user_id:", user_id)
        if not user_id:
            raise HTTPException(status_code=400, detail="网络异常！")

        api_key= await notebook_service.get_api_key_by_user_id(user_id=user_id)
        print("api_key", api_key)
        request_data = await request.json()
        user_message = request_data.get("message")
        if not user_message:
            raise HTTPException(status_code=400, detail="Message field is required")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid request body")
    print(user_message)
    # 获取查询参数
    source_param = request.query_params.get("source")
    source = source_param.split(",") if source_param else []

    notes_param = request.query_params.get("notes")
    notes = notes_param.split(",") if notes_param else []
    try:
        # 初始化 ChatService
        chat_service = ChatService(source, notes, api_key)
        await chat_service.initialize_sources()
        async def event_stream():
            try:
                # 调用 process_message 并逐步返回流式生成的内容
                async for chunk in chat_service.process_message(
                    [{"role": "user", "content": user_message}]
                ):
                    yield f"data: {chunk}\n\n"
                    await asyncio.sleep(0.1)  # 模拟延迟

            except asyncio.CancelledError:
                # 处理客户端断开连接
                print("Client disconnected")
            except Exception as e:
                # 处理其他异常
                print(f"Error: {e}")
                yield f"data: Error: {e}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=400, detail="当前API或模型错误,请你重新尝试")