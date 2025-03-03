from typing import List, Any

import openai
import asyncio

from openai import api_key

from sapperrag.llm.base import BaseLLM


class ChatOpenAI(BaseLLM):


    def __init__(self, api_key: str, base_url: str = "https://api.rcouyi.com/v1") -> None:
        self.api_key = api_key
        self.base_url = base_url

        # 初始化 OpenAI 客户端
        self.client = openai.OpenAI(api_key="sk-pAauG9ss64pQW9FVA703F1453b334eFb95B7447b9083BaBd", base_url="https://api.rcouyi.com/v1")
        self.async_client = None  # 异步客户端将在 async_init 中初始化


    async def async_init(self):
        self.client = openai.AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)

    async def process_message(self, messages: List[dict]):
        try:
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model="deepseek-reasoner",
                    messages=messages,
                ),
                timeout=360  # Timeout in seconds
            )
            return response
        except asyncio.TimeoutError:
            print("Request timed out")
        except Exception as e:
            print(f"An error occurred: {e}")

    def generate(self, messages: List[dict], response_format: str = "text", streaming: bool = False,  **kwargs: Any) -> str:
        response = self.client.chat.completions.create(
            model="deepseek-reasoner",
            messages=messages,
            response_format={"type": response_format}
        )
        return response.choices[0].message.content

    async def agenerate(self, messages: List[dict], streaming: bool = False, **kwargs: Any) -> str:
        response = await self.process_message(messages)
        return response.choices[0].message.content
