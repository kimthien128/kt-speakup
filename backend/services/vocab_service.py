#services/vocab_service.py
# Xử lý logic nghiệp vụ liên quan đến từ vựng: kiểm tra hợp lệ, chuẩn hóa dữ liệu.
# Gọi VocabRepository để thực hiện truy vấn dữ liệu.
# Tuân thủ SRP: Chỉ xử lý logic nghiệp vụ, không xử lý API hay truy vấn trực tiếp.

from fastapi import HTTPException
from bson import ObjectId
from datetime import datetime, timezone
from .dictionary.dictionary_client import DictionaryClient
from ..logging_config import logger

class VocabService:
    def __init__(self, vocab_repository, dictionaryapi_client: DictionaryClient, wordnik_client: DictionaryClient):
        self.vocab_repository = vocab_repository
        self.clients = {
            "dictionaryapi": dictionaryapi_client,
            "wordnik": wordnik_client
        }
        
    async def get_word_info(self, word: str, source: str, limit: int) -> dict:
        """
        Lấy thông tin từ điển cho từ đã cho từ nguồn đã chỉ định.
        :param word: Từ cần tra cứu.
        :param source: Nguồn từ điển (dictionaryapi hoặc wordnik).
        :param limit: Giới hạn số lượng kết quả trả về.
        :return: Thông tin từ điển dưới dạng dict.
        """
        if not word:
            logger.error("No word provided in request")
            raise HTTPException(status_code=400, detail="No word provided")
        if source not in self.clients:
            logger.error(f"Unsupported dictionary source: {source}")
            raise HTTPException(status_code=400, detail=f"Unsupported dictionary source: {source}")
        
        word = word.strip().lower()
        source = source.strip().lower()
        logger.debug(f"Calling {source} client for word: {word}, limit: {limit}")
        return await self.clients[source].get_word_info(word, limit)
        
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
        current_time = datetime.now(timezone.utc)
        word_data = {
            "word" : data.get("word", "").capitalize(), #viết hoa chữ cái đầu tiên
            "sourceDictionary" : data.get("sourceDictionary", "dictionaryapi"),
            "definition": data.get("definition", "No definition found"),
            "translatedDefinition": data.get("translatedDefinition", ""),
            "phonetic": data.get("phonetic", "N/A"),
            "audio1": data.get("audio1", ""),
            "audio2": data.get("audio2", ""),
            "example1": data.get("example1", ""),
            "translatedExample1": data.get("translatedExample1", ""),
            "example2": data.get("example2", ""),
            "translatedExample2": data.get("translatedExample2", ""),
            "chat_id": ObjectId(chat_id),
            "user_id": user_id,
            "createdAt": current_time,
            "updatedAt": current_time
            
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