# services/dictionary/dictionary_client.py
# Định nghĩa interface DictionaryClient để không phụ thuộc trực tiếp vào implementation cụ thể (DictionaryAPI, Wordnik, v.v.).
# Tuân thủ DIP: Các module cấp cao chỉ phụ thuộc vào abstraction này.

from abc import ABC, abstractmethod

class DictionaryClient(ABC):
    @abstractmethod
    async def get_word_info(self, word: str, limit: int) -> dict:
        """Lấy thông tin từ từ điển cho một từ cụ thể."""
        pass