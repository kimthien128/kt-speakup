# services/ai/ai_client.py
# Định nghĩa interface AIClient để không phụ thuộc trực tiếp vào implementation cụ thể (OpenAI, Mistral, Gemini, v.v.).
# Tuân thủ DIP: Các module cấp cao chỉ phụ thuộc vào abstraction này.

from abc import ABC, abstractmethod

class AIClient(ABC):
    @abstractmethod
    def generate_response(self, messages: list) -> str:
        pass
    
    @abstractmethod
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        pass