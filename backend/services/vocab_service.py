#services/vocab_service.py
# Xử lý logic nghiệp vụ liên quan đến từ vựng: kiểm tra hợp lệ, chuẩn hóa dữ liệu.
# Gọi VocabRepository để thực hiện truy vấn dữ liệu.
# Tuân thủ SRP: Chỉ xử lý logic nghiệp vụ, không xử lý API hay truy vấn trực tiếp.

from fastapi import HTTPException
from bson import ObjectId

class VocabService:
    def __init__(self, vocab_repository):
        self.vocab_repository = vocab_repository
        
    async def add_vocab(self, data:dict, user_id:str):
        """Thêm từ vựng mới"""
        chat_id = data.get("chat_id", "")
        if not chat_id:
            raise HTTPException(status_code=400, detail="chat_id is required")
        
        # Kiểm tra chat_id hợp lệ
        chat = await self.vocab_repository.find_chat_by_id_and_user(chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        # Chuẩn hóa dữ liệu từ vựng
        word_data = {
            "word" : data.get("word", "").capitalize(), #viết hoa chữ cái đầu tiên
            "definition": data.get("definition", "No definition found"),
            "phonetic": data.get("phonetic", "N/A"),
            "audio": data.get("audio", ""),
            "chat_id": ObjectId(chat_id),
            "user_id": user_id
        }
        
        # Kiểm tra trùng lặp
        existing_vocab = await self.vocab_repository.find_vocab_by_word_and_chat(word_data["word"], chat_id, user_id)
        if existing_vocab:
            raise HTTPException(status_code=400, detail="The word already exists in the collection.")
        
        # Thêm từ vựng
        result = await self.vocab_repository.add_vocab(word_data)
        vocab_id = result.inserted_id
        
        # Cập nhật vocab_ids trong chats
        await self.vocab_repository.update_chat_vocab_ids(chat_id, str(vocab_id), action="add")
        return {"message" : f'Added {word_data['word']} to vocab'}
    
    async def get_vocab(self, chat_id: str, user_id:str):
        """Lấy danh sách từ vựng theo chat_id"""
        # Kiểm tra chat_id hợp lệ
        chat = await self.vocab_repository.find_chat_by_id_and_user(chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        # Lấy danh sách từ vựng
        vocab_list = await self.vocab_repository.find_vocab_by_chat_id(chat_id)
        for vocab in vocab_list:
            vocab["_id"] = str(vocab["_id"])
            vocab["chat_id"] = str(vocab["chat_id"])
        return {"vocab": vocab_list}
    
    async def delete_vocab(self, chat_id: str, vocab_id: str, user_id:str):
        """Xóa từ vựng"""
        # Kiểm tra chat_id hợp lệ
        chat = await self.vocab_repository.find_chat_by_id_and_user(chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        # Kiểm tra vocab_id hợp lệ
        vocab = await self.vocab_repository.find_vocab_by_id_and_chat(vocab_id, chat_id, user_id)
        if not vocab:
            raise HTTPException(status_code=404, detail="Vocab not found or not owned by user")
        
        # Xóa từ vựng
        await self.vocab_repository.delete_vocab(vocab_id)
        
        # Cập nhật vocab_ids trong chats
        await self.vocab_repository.update_chat_vocab_ids(chat_id, vocab_id, action="remove")
        return {"message": f"Deleted vocab with id {vocab_id}"}