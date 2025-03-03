from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import mysql.connector
from mysql.connector import Error

router = APIRouter()

# 数据库配置
db_config = {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "yaoth/4994",
    "database": "fba",
}

# 定义 API 响应模型
class ApiKeyResponse(BaseModel):
    api_key: str

# 从数据库读取 API Key
def get_api_key_from_db(uuid: str = None):
    try:
        if not any([uuid]):
            raise ValueError("请提供查询条件（username、email 或 uuid）")

        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        # ✅ 正确的 SQL 查询构造方式
        query = "SELECT API_KEY FROM fba.sys_user"
        conditions = []
        params = []

        # if username:
        #     conditions.append("username = %s")
        #     params.append(username)
        # if email:
        #     conditions.append("email = %s")
        #     params.append(email)
        if uuid:
            conditions.append("uuid = %s")
            params.append(uuid)

        # ✅ 只有当有查询条件时才加 WHERE
        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        cursor.execute(query, tuple(params))
        result = cursor.fetchone()

        cursor.close()
        connection.close()

        if result:
            print(f"✅ 查询到的 API Key: {result['API_KEY']}")  # 直接输出 API Key
            return result["API_KEY"]
        else:
            print("❌ API Key 未找到")
            return None

    except Error as err:
        raise HTTPException(status_code=500, detail=f"数据库错误: {err}")

# 直接查询 API Key 并打印
if __name__ == "__main__":
    api_key = get_api_key_from_db(uuid="95610b3d-459c-4b5f-bec5-7089081cbaf7")

    if api_key:
        print(f"✅ 查询到的 API Key: {api_key}")
    else:
        print("❌ 未找到 API Key")

