# services/ai_service.py
# Xử lý logic nghiệp vụ liên quan đến AI: xử lý lịch sử chat, gọi mô hình AI.
# Tuân thủ SRP: Chỉ xử lý logic nghiệp vụ, không xử lý API.

from fastapi import HTTPException
from ..repositories.chat_repository import ChatRepository
from .ai.ai_client import AIClient
from ..logging_config import logger

class AIService:
    def __init__(
        self, 
        chat_repository: ChatRepository, 
        openai_client: AIClient, # hiện tại không có key dùng thử nghiệm
        deepseek_client: AIClient, # yêu cầu nạp tiền
        openrouter_client: AIClient,
        mistral_client: AIClient, # đã chạy ok, nhưng phải tắt khi deploy vì khá nặng
        gemini_client: AIClient
    ):
        self.chat_repository = chat_repository
        self.clients = {}
        # Chỉ thêm các client không phải None vào self.clients
        if openai_client:
            self.clients["chatgpt"] = openai_client
        if deepseek_client:
            self.clients["deepseek"] = deepseek_client
        if openrouter_client:
            self.clients["openrouter"] = openrouter_client
        if mistral_client:
            self.clients["mistral"] = mistral_client
        if gemini_client:
            self.clients["gemini"] = gemini_client
        
    async def generate_response(self, transcript: str, chat_id: str, user_id: str, method: str) -> dict:
        if not transcript:
            raise HTTPException(status_code=400, detail="No transcript provided")
        if not chat_id:
            raise HTTPException(status_code=400, detail="No chat_id provided")
        if method not in self.clients:
            raise HTTPException(status_code=400, detail=f"Client {method} is disabled or unsupported")
        
        # Lấy lịch sử chat
        chat = await self.chat_repository.find_chat_by_id_and_user(chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        # Chuẩn bị messages
        history = chat.get('history', [])
        messages = [
            {"role": "system", "content": "You are a friendly English conversation partner. Help me practice speaking by replying with short, natural, and complete sentences suitable for daily conversation. After each reply, ask a follow-up question to keep the conversation going. Use clear and simple language appropriate for an intermediate learner."}
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
    
    async def translate(self, text: str, source_lang: str, target_lang: str, method: str) -> dict:
        if not text:
            raise HTTPException(status_code=400, detail="No text provided")
        if method not in self.clients:
            raise HTTPException(status_code=400, detail=f"Client {method} is disabled or unsupported")
        
        # Gọi phương thức translate của client
        logger.info(f'{method.capitalize()} translating: {text} from {source_lang} to {target_lang}')
        translated_text = self.clients[method].translate(text, source_lang, target_lang)
        if not translated_text:
            translated_text = "Translation failed!"
        
        logger.info(f'{method.capitalize()} translated response: {translated_text}')
        return {'translated_text': translated_text}