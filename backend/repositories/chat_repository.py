# repositories/chat_repository.py
# Định nghĩa ChatRepository để xử lý các truy vấn dữ liệu liên quan đến chat.
# Nhận một instance của BaseRepository thông qua constructor để không phụ thuộc vào implementation cụ thể.
# Tuân thủ DIP: Chỉ phụ thuộc vào abstraction BaseRepository.
# Tuân thủ OCP: Có thể đổi database (MongoDB sang PostgreSQL) mà không cần sửa code.

from bson import ObjectId

class ChatRepository:
    def __init__(self, repository):
        self.repository = repository

    async def create_chat(self, chat_data: dict):
        """Tạo một chat mới."""
        return await self.repository.insert_one("chats", chat_data)
    
    async def find_chats_by_user(self, user_id: str):
        """Lấy danh sách chat của user"""
        query = {"user_id": user_id}
        return await self.repository.find_many("chats", query)
    
    async def find_chat_by_id_and_user(self, chat_id: str, user_id: str):
        """Lấy chat theo ID và user ID"""
        query = {"_id": ObjectId(chat_id), "user_id": user_id}
        return await self.repository.find_one("chats", query)
    
    async def delete_chat(self, chat_id: str, user_id: str):
        """Xóa chat theo ID và user ID"""
        query = {"_id": ObjectId(chat_id), "user_id": user_id}
        return await self.repository.delete_one("chats", query)
    
    async def delete_vocab_by_chat(self, chat_id: str, user_id: str):
        """Xóa các từ vựng liên quan đến chat"""
        query = {"chat_id": chat_id, "user_id": user_id}
        return await self.repository.delete_many("vocab", query)
    
    async def update_chat(self, chat_id: str, user_id: str, update_data: dict):
        """Cập nhật chat theo ID và user ID"""
        query = {"_id": ObjectId(chat_id), "user_id": user_id}
        return await self.repository.update_one("chats", query, update_data)
    
    async def update_chat_history_audio(self, chat_id: str, index: int, audio_url: str):
        """Cập nhật audioUrl trong history tại index"""
        return await self.repository.update_one(
            "chats",
            {"_id": ObjectId(chat_id)},
            {"$set": {f"history.{index}.audioUrl": audio_url}}
        )
    
    async def update_chat_history(self, chat_id: str, message: dict, title_update: dict = None):
        """Thêm tin nhắn vào history và cập nhật title nếu cần"""
        update_data = {
            "$push": {"history": message}
        }
        if title_update:
            update_data["$set"] = title_update
        return await self.repository.update_one(
            "chats",
            {"_id": ObjectId(chat_id)},
            update_data
        )
        
    async def update_chat_history_translation(self, chat_id: str, index: int, translated_text: str, original_ai_text: str):
        """Cập nhật bản dịch của tin nhắn AI trong history"""
        return await self.repository.update_one(
            "chats",
            {"_id": ObjectId(chat_id),
             f"history.{index}.ai": original_ai_text},
            {"$set": {f"history.{index}.translateAi": translated_text}}
        )
        
    async def find_vocab_by_chat(self, chat_id: str, user_id: str):
        """Lấy danh sách từ vựng theo chat ID và user ID"""
        query = {"chat_id": chat_id, "user_id": user_id}
        return await self.repository.find_many("vocab", query)