# services/ai/openai_client.py
# Triển khai AIClient cho OpenAI.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến OpenAI.

import requests
from fastapi import HTTPException
from ...utils import OPENAI_API_KEY
from .ai_client import AIClient
from ...logging_config import logger

class OpenAIClient(AIClient):
    def __init__(self):
        self.api_url = "https://api.openai.com/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
    def generate_response(self, messages: list) -> str:
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": messages,
            "max_tokens": 30,
            "temperature": 0.7
        }
        
        response = requests.post(self.api_url, headers=self.headers, json=payload)
        if response.status_code != 200:
            logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=503, detail="OpenAI API unavailable")

        result = response.json()
        return result["choices"][0]["message"]["content"].strip()
    
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        prompt = f"Translate the following text from {source_lang} to {target_lang}in a concise manner: {text}"
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 100,  # Tăng giới hạn token cho dịch
            "temperature": 0.3  # Giảm temperature để dịch chính xác hơn
        }
        response = requests.post(self.api_url, headers=self.headers, json=payload)
        if response.status_code != 200:
            logger.error(f"OpenAI API translation error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=503, detail="OpenAI API translation unavailable")

        result = response.json()
        return result["choices"][0]["message"]["content"].strip()