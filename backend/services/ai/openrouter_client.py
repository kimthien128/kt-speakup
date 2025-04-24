# services/ai/openrouter_client.py
# Triển khai AIClient cho OpenRouter.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến OpenRouter.

import requests
import os
from fastapi import HTTPException
from ...utils import OPENROUTER_API_KEY
from .ai_client import AIClient
from ...logging_config import logger

class OpenRouterClient(AIClient):
    def __init__(self):
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        # Lấy APP_URL từ biến môi trường, mặc định là localhost nếu không có
        app_url = os.getenv("APP_URL", "http://localhost:8000")
        self.headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": app_url,  # URL của ứng dụng
            "X-Title": "KT-SpeakUp"  # Tên ứng dụng
        }
        
    def generate_response(self, messages: list) -> str:
        payload = {
            "model": "deepseek/deepseek-v3-base:free",
            "messages": messages,
            "max_tokens": 30,
            "temperature": 0.7
        }
        try:
            response = requests.post(self.api_url, headers=self.headers, json=payload)
            if response.status_code != 200:
                logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=503, detail="OpenRouter API unavailable")

            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error(f"Error calling OpenRouter API: {str(e)}")
            raise HTTPException(status_code=503, detail=f"Failed to generate response from OpenRouter: {str(e)}")