# services/ai_service.py
# Xử lý logic nghiệp vụ liên quan đến AI: xử lý lịch sử chat, gọi mô hình AI.
# Tuân thủ SRP: Chỉ xử lý logic nghiệp vụ, không xử lý API.

from fastapi import HTTPException
from ..repositories.chat_repository import ChatRepository
from .ai.ai_client import AIClient
from ..logging_config import logger

class AIService:
    def __init__(self, chat_repository: ChatRepository, openai_client: AIClient, mistral_client: AIClient, gemini_client: AIClient):
        self.chat_repository = chat_repository
        self.clients = {
            "chatgpt": openai_client,
            "mistral": mistral_client,
            "gemini": gemini_client
        }
        
    async def generate_response(self, transcript: str, chat_id: str, user_id: str, method: str) -> dict:
        if not transcript:
            raise HTTPException(status_code=400, detail="No transcript provided")
        if not chat_id:
            raise HTTPException(status_code=400, detail="No chat_id provided")
        if method not in self.clients:
            raise HTTPException(status_code=400, detail=f"Unsupported generate method: {method}")
        
        # Lấy lịch sử chat
        chat = await self.chat_repository.find_chat_by_id_and_user(chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        # Chuẩn bị messages
        history = chat.get('history', [])
        messages = [
            {"role": "system", "content": "You are a chatbot assisting in learning English. Reply with one short, complete sentence."}
        ]
        for msg in history:
            messages.append({"role": "user", "content": msg["user"]})
            if msg.get("ai"):
                messages.append({"role": "assistant", "content": msg["ai"]})
        messages.append({"role": "user", "content": transcript})
        logger.info(f'{method.capitalize()} messages: {messages}')
        
        # Gọi mô hình AI tương ứng
        generated_text = self.clients[method].generate_response(messages)
        if not generated_text:
            generated_text = "I don't know what to say!"
        logger.info(f'{method.capitalize()} response: {generated_text}')
        return {'response': generated_text}