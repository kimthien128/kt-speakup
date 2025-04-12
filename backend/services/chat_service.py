# services/chat_service.py
# Xử lý logic nghiệp vụ liên quan đến chat: kiểm tra hợp lệ, chuẩn hóa dữ liệu, dịch tin nhắn.
# Gọi ChatRepository để thực hiện truy vấn dữ liệu.
# Tuân thủ SRP: Chỉ xử lý logic nghiệp vụ, không xử lý API hay truy vấn trực tiếp.

from fastapi import HTTPException
from bson import ObjectId
from deep_translator import GoogleTranslator
from ..logging_config import logger

class ChatService:
    def __init__(self, chat_repository):
        self.chat_repository = chat_repository
        
    async def create_chat(self, user_id: str):
        """Tạo một chat mới"""
        chat_data = {
            "title": "",
            "history" : [],
            "vocab_ids": [],
            "user_id": user_id
            
        }
        result = await self.chat_repository.create_chat(chat_data)
        return {
            "chat_id": str(result.inserted_id),
            "message": "Chat created"
        }
        
    async def get_all_chats(self, user_id: str):
        """Lấy tất cả các chat của người dùng"""
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid user ID")
        
        chats = await self.chat_repository.find_chats_by_user(user_id)
        for chat in chats:
            chat["_id"] = str(chat["_id"])
        return chats
        
    async def get_chat(self, chat_id: str, user_id: str):
        """Lấy thông tin chi tiết của một chat"""
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
        chat = await self.chat_repository.find_chat_by_id_and_user(chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        chat["_id"] = str(chat["_id"])
        return chat
    
    async def delete_chat(self, chat_id: str, user_id: str):
        """Xóa một chat và các từ vựng liên quan"""
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
        result = await self.chat_repository.delete_chat(chat_id, user_id)
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        await self.chat_repository.delete_vocab_by_chat(chat_id, user_id)
        return {"message": "Chat deleted successfully"}
    
    async def update_chat_title(self, chat_id: str, new_title: str, user_id: str):
        """Cập nhật tiêu đề của chat"""
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        if not new_title or not isinstance(new_title, str):
            raise HTTPException(status_code=400, detail="Invalid title: must be a non-empty string")
        
        chat = await self.chat_repository.find_chat_by_id_and_user(chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        result = await self.chat_repository.update_chat(
            chat_id,
            user_id,
            {"$set": {"title": new_title}},
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found, not owned by user, or title unchanged")
        return {"message": "Chat title updated successfully"}
    
    async def update_chat_suggestion(self, chat_id: str, data: dict, user_id: str):
        """Cập nhật các trường suggestion của chat"""
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
        chat = await self.chat_repository.find_chat_by_id_and_user(chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        update_data = {}
        latest_suggestion = data.get("latest_suggestion")
        if latest_suggestion is not None:
            if not isinstance(latest_suggestion, str):
                raise HTTPException(status_code=400, detail="Invalid latest_suggestion: must be a string")
            update_data["latest_suggestion"] = latest_suggestion
            
        translate_suggestion = data.get("translate_suggestion")
        if translate_suggestion is not None:
            if not isinstance(translate_suggestion, str):
                raise HTTPException(status_code=400, detail="Invalid translate_suggestion: must be a string")
            update_data["translate_suggestion"] = translate_suggestion
            
        suggestion_audio_url = data.get("suggestion_audio_url")
        if suggestion_audio_url is not None:
            if not isinstance(suggestion_audio_url, str):
                raise HTTPException(status_code=400, detail="Invalid suggestion_audio_url: must be a string")
            update_data["suggestion_audio_url"] = suggestion_audio_url
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        result = await self.chat_repository.update_chat(
            chat_id,
            user_id,
            {"$set": update_data},
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found or no changes made")
        return {"message": "Chat suggestion updated successfully"}
    
    async def get_chat_history(self, chat_id: str, user_id: str):
        """Lấy lịch sử tin nhắn của chat"""
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
        chat = await self.chat_repository.find_chat_by_id_and_user(chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        return {"history": chat.get("history", [])}
    
    async def add_chat_history(self, chat_id: str, data: dict, user_id: str):
        """Thêm tin nhắn vào lịch sử chat"""
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
        chat = await self.chat_repository.find_chat_by_id_and_user(chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        message = {
            "user": data.get("user", ""),
            "ai": data.get("ai", ""),
            "audioUrl": data.get("audioUrl", "")
        }
        
        title_update = None
        if not chat["history"] and not chat["title"]:
            title_update = {"title": message["user"]}
            
        result = await self.chat_repository.update_chat_history(
            chat_id,
            message,
            title_update
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found, not owned by user, or no update")
        return {"message": "History updated"}
    
    async def update_chat_history_audio(self, chat_id: str, index: int, audio_url: str, user_id: str):
        """Cập nhật audioUrl trong lịch sử chat"""
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        if index is None or not isinstance(index, int) or index < 0:
            raise HTTPException(status_code=400, detail="Invalid index: must be a non-negative integer")
        if not audio_url or not isinstance(audio_url, str):
            raise HTTPException(status_code=400, detail="Invalid audioUrl: must be a non-empty string")
        
        chat = await self.chat_repository.find_chat_by_id_and_user(chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        if index >= len(chat["history"]):
            raise HTTPException(status_code=400, detail="Index out of range")
        
        result = await self.chat_repository.update_chat_history_audio(
            chat_id,
            index,
            audio_url
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found, not owned by user, or no update")
        return {"message": "History audio URL updated"}
    
    async def translate_chat_ai(self, chat_id: str, text: str, target_lang: str, index: int, user_id: str):
        """Dịch tin nhắn AI trong lịch sử"""
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
        chat = await self.chat_repository.find_chat_by_id_and_user(chat_id, user_id)
        if not chat or "history" not in chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        chat_history = chat["history"]
        if not isinstance(chat_history, list) or index >= len(chat_history):
            raise HTTPException(status_code=400, detail="Index out of range or history format invalid")
        
        chat_entry = chat_history[index]
        if "ai" not in chat_entry:
            raise HTTPException(status_code=400, detail="Chat entry missing 'ai' field")
        
        if "translateAi" in chat_entry and chat_entry["translateAi"]:
            logger.info("AI chat already translated. Get from DB")
            return {"translatedTextAi": chat_entry["translateAi"], "message": "AI chat already translated"}
        
        logger.info("Translating AI chat...")
        translator = GoogleTranslator(source='auto', target=target_lang)
        translated_text = translator.translate(chat_entry["ai"])
        
        result = await self.chat_repository.update_chat_history_translation(
            chat_id,
            index,
            translated_text,
            chat_entry["ai"]
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found, not owned by user, or text mismatch")
        return {"translatedTextAi": translated_text, "message": "AI chat translated and updated"}
    
    async def get_chat_vocab(self, chat_id: str, user_id: str):
        """Lấy danh sách từ vựng của chat"""
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
        chat = await self.chat_repository.find_chat_by_id_and_user(chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        vocab_list = await self.chat_repository.find_vocab_by_chat(chat_id, user_id)
        for vocab in vocab_list:
            vocab["_id"] = str(vocab["_id"])
        return vocab_list