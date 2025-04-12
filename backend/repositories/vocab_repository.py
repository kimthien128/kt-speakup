#repositories/vocab_repository.py
# Định nghĩa VocabRepository để xử lý các truy vấn dữ liệu liên quan đến từ vựng.
# Nhận một instance của BaseRepository thông qua constructor để không phụ thuộc vào implementation cụ thể.
# Tuân thủ DIP: Chỉ phụ thuộc vào abstraction BaseRepository.
# Tuân thủ OCP: Có thể đổi database (MongoDB sang PostgreSQL) mà không cần sửa code.
# Tuy nhiên, câu query có thể cần thay đổi khi đổi database (vì db khác có thể không dùng ObjectId).

from bson import ObjectId

class VocabRepository:
    def __init__(self, repository):
        self.repository = repository
        
    async def find_vocab_by_word_and_chat(self, word: str, chat_id:str, user_id:str):
        """Tìm từ vựng theo word, chat_id và user_id để kiểm tra trùng lặp"""
        query = {
            "word": word,
            "chat_id": ObjectId(chat_id),
            "user_id": user_id
        }
        return await self.repository.find_one("vocab", query)
    
    async def find_vocab_by_id_and_chat(self, vocab_id: str, chat_id:str, user_id:str):
        """Tìm từ vựng theo vocab_id, chat_id và user_id"""
        query = {
            "_id": ObjectId(vocab_id),
            "chat_id": ObjectId(chat_id),
            "user_id": user_id
        }
        return await self.repository.find_one("vocab", query)
    
    async def find_vocab_by_chat_id(self, chat_id: str):
        """Tìm tất cả từ vựng theo chat_id"""
        query = {
            "chat_id": ObjectId(chat_id)
        }
        return await self.repository.find_many("vocab", query)
    
    async def find_chat_by_id_and_user(self, chat_id: str, user_id:str):
        """Tìm chat theo chat_id và user_id để kiểm tra quyền sở hữu"""
        query = {
            "_id": ObjectId(chat_id),
            "user_id": user_id
        }
        return await self.repository.find_one("chats", query)
    
    async def add_vocab(self, vocab_data: dict):
        """Thêm từ vựng vào database"""
        return await self.repository.insert_one("vocab", vocab_data)
    
    async def delete_vocab(self, vocab_id: str):
        """Xóa từ vựng khỏi database"""
        query = {
            "_id": ObjectId(vocab_id)
        }
        return await self.repository.delete_one("vocab", query)
    
    async def update_chat_vocab_ids(self, chat_id:str, vocab_id:str, action:str):
        """Cập nhật vocab_ids trong chats (thêm hoặc xóa)"""
        query = {"_id": ObjectId(chat_id)}
        if action == "add":
            update = {"$push": {"vocab_ids": vocab_id}}
        else : # action == "remove"
            update = {"$pull": {"vocab_ids": vocab_id}}
        return await self.repository.update_one("chats", query, update)