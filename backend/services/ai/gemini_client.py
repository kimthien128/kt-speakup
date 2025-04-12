# services/ai/gemini_client.py
# Triển khai AIClient cho Gemini.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến Gemini.

import google.generativeai as genai
from fastapi import HTTPException
from utils import GOOGLE_API_KEY
from .ai_client import AIClient
from ...logging_config import logger

class GeminiClient(AIClient):
    def __init__(self):
        genai.configure(api_key=GOOGLE_API_KEY)
        self.model = genai.GenerativeModel(
            "gemini-1.5-flash",
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=20, # Giới hạn token (~1 câu ngắn)
                temperature=0.7 # Điều chỉnh độ sáng tạo
            )
        )
        
    def generate_response(self, messages: list) -> str:
        try:
            chat_history = [
                {"role": "user", "parts": [{"text": "You are a chatbot assisting me in learning English. Reply with one short, complete sentence."}]},
                {"role": "model", "parts": [{"text": "Understood, I'll keep my responses short!"}]}
            ]
            for msg in messages[1:]:  # Bỏ message "system" đầu tiên
                if msg["role"] == "user":
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