# services/ai/gemini_client.py
# Triển khai AIClient cho Gemini.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến Gemini.

import google.generativeai as genai
from fastapi import HTTPException
from ...utils import GOOGLE_API_KEY
from .ai_client import AIClient
from ...logging_config import logger

class GeminiClient(AIClient):
    def __init__(self):
        genai.configure(api_key=GOOGLE_API_KEY)
        self.model = genai.GenerativeModel(
            "gemini-1.5-flash",
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=30, # Giới hạn token (~1 câu ngắn)
                temperature=0.7 # Điều chỉnh độ sáng tạo
            )
        )
        
    def generate_response(self, messages: list) -> str:
        try:
            # Chuyển đổi messages sang định dạng parts mà Gemini yêu cầu
            chat_history = []
            for msg in messages:
                # Khi gặp role là "system", thêm vào chat_history với vai trò "user"
                if msg["role"] == "system":
                    chat_history.append({"role": "user", "parts": [{"text": msg["content"]}]})
                    chat_history.append({"role": "model", "parts": [{"text": "Understood, I'll follow your instructions."}]})
                elif msg["role"] == "user":
                    chat_history.append({"role": "user", "parts": [{"text": msg["content"]}]})
                elif msg["role"] == "assistant":
                    chat_history.append({"role": "model", "parts": [{"text": msg["content"]}]})
            
            chat_session = self.model.start_chat(history=chat_history)
            transcript = messages[-1]["content"]  # Tin nhắn cuối cùng là transcript
            response = chat_session.send_message(transcript)
            return response.text.strip()
        except genai.types.generation_types.BrokenResponseError as e:
            logger.error(f'Gemini API error: {e}')
            raise HTTPException(status_code=400, detail=f"Gemini API error: {str(e)}")
        
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        try:
            prompt = f"Translate the following {source_lang} text to {target_lang}: {text}"
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except genai.types.generation_types.BrokenResponseError as e:
            logger.error(f'Gemini API translation error: {e}')
            raise HTTPException(status_code=400, detail=f"Gemini API translation error: {str(e)}")