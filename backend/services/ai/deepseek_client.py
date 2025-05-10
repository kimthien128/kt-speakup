# services/ai/deepseek_client.py
# Triển khai AIClient cho DeepSeek.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến DeepSeek.

import requests
from fastapi import HTTPException
from ...utils import DEEPSEEK_API_KEY
from .ai_client import AIClient
from ...logging_config import logger

class DeepSeekClient(AIClient):
    def __init__(self):
        self.api_url = "https://api.deepseek.com/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        
    def generate_response(self, messages: list) -> str:
        payload = {
            "model": "deepseek-chat",
            "messages": messages,
            "max_tokens": 30,
            "temperature": 0.7
        }
        try:
            response = requests.post(self.api_url, headers=self.headers, json=payload)
            if response.status_code != 200:
                logger.error(f"DeepSeek API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=503, detail="DeepSeek API unavailable")

            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error(f"Error calling DeepSeek API: {str(e)}")
            raise HTTPException(status_code=503, detail=f"Failed to generate response from DeepSeek: {str(e)}")
        
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        prompt = f"Translate the following text from {source_lang} to {target_lang}: {text}"
        payload = {
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 100,  # Tăng giới hạn token cho dịch
            "temperature": 0.3  # Giảm temperature để dịch chính xác hơn
        }
        try:
            response = requests.post(self.api_url, headers=self.headers, json=payload)
            if response.status_code != 200:
                logger.error(f"DeepSeek API translation error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=503, detail="DeepSeek API translation unavailable")

            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error(f"Error calling DeepSeek API for translation: {str(e)}")
            raise HTTPException(status_code=503, detail=f"Failed to translate with DeepSeek: {str(e)}")