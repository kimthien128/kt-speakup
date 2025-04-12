# services/http/httpx_client.py
# Triển khai HTTPClient bằng httpx.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến httpx.

import httpx
from .http_client import HTTPClient
from ...logging_config import logger

class HttpxClient(HTTPClient):
    async def get(self, url: str, headers: dict = None) -> dict:
        async with httpx.AsyncClient() as client:
            logger.info(f"Making request to: {url}")
            response = await client.get(url, headers=headers or {})
            logger.info(f"Response: {response.status_code}, {response.text}")
            response.raise_for_status()  # Ném lỗi nếu status code không phải 2xx
            return response.json()