# services/dictionary_service.py
# Xử lý logic nghiệp vụ liên quan đến từ điển: gọi API từ điển, chuẩn hóa dữ liệu.
# Tuân thủ SRP: Chỉ xử lý logic nghiệp vụ, không xử lý API.

from fastapi import HTTPException
from .dictionary.dictionary_client import DictionaryClient

class DictionaryService:
    def __init__(self, dictionaryapi_client: DictionaryClient, wordnik_client: DictionaryClient):
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
            raise HTTPException(status_code=400, detail="No word provided")
        if source not in self.clients:
            raise HTTPException(status_code=400, detail=f"Unsupported dictionary source: {source}")
        
        word = word.strip().lower()
        source = source.strip().lower()
        return await self.clients[source].get_word_info(word, limit)