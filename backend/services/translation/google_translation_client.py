# services/translation/google_translation_client.py
# Triển khai TranslationClient cho GoogleTranslator.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến GoogleTranslator.

from deep_translator import GoogleTranslator
from .translation_client import TranslationClient

class GoogleTranslationClient(TranslationClient):
    def translate(self, text: str, source: str, target: str) -> str:
        """Translate text using Google Translator."""
        try:
            return GoogleTranslator(source=source, target=target).translate(text)
        except Exception as e:
            raise Exception(f"GoogleTranslator error: {str(e)}")