#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pathlib import Path
from backend.core.registrar import register_app
from fastapi.middleware.cors import CORSMiddleware

import uvicorn

from backend.core.registrar import register_app

# from backend.app.worklog.service.utils import initialize_model


app = register_app()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 或者指定前端的 URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# @app.on_event("startup")
# async def startup():
#     """在应用程序启动时加载模型"""
#     await initialize_model()

if __name__ == '__main__':
    try:
        # 指定 host 和 port
        config = uvicorn.Config(
            app=f'{Path(__file__).stem}:app',
            host="0.0.0.0",   # 你也可以换成其他 IP，如 "0.0.0.0" 使外部可以访问
            port=8020,
            reload=True
        )
        server = uvicorn.Server(config)
        server.run()
    except Exception as e:
        raise e