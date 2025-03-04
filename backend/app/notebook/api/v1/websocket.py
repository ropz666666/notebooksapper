
# backend/app/notebook/api/v1/websocket.py
from fastapi import WebSocket, APIRouter
from backend.app.notebook.service.chat_service import ChatService
import json

router = APIRouter()


@router.websocket("/client-llm")
async def chat_websocket(websocket: WebSocket):
    # 获取 WebSocket 连接中的 `source` 参数
    print(f"WebSocket 连接请求路径: {websocket.url.path}")
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

@router.websocket("/test")
async def test_websocket(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("测试成功")
    await websocket.close()