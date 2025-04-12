# services/translation_service.py
# Xử lý logic nghiệp vụ liên quan đến dịch văn bản.
# Gọi TranslationClient để thực hiện dịch.
# Tuân thủ SRP: Chỉ xử lý logic nghiệp vụ, không xử lý API.

from fastapi import HTTPException
from .translation.translation_client import TranslationClient

class TranslationService:
    def __init__(self, translation_client: TranslationClient):
        self.translation_client = translation_client

    async def translate(self, text: str, target_lang: str) -> dict:
        try:
            translated = self.translation_client.translate(text, source="auto", target=target_lang)
            return {"translatedText": translated}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")