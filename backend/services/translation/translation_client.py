# services/translation/translation_client.py
# Định nghĩa interface TranslationClient để không phụ thuộc trực tiếp vào implementation cụ thể (GoogleTranslator, MicrosoftTranslator, v.v.).
# Tuân thủ DIP: Các module cấp cao chỉ phụ thuộc vào abstraction này.

from abc import ABC, abstractmethod

class TranslationClient(ABC):
    @abstractmethod
    def translate(self, text: str, source: str, target: str) -> str:
        """Translate text from source language to target language."""
        pass