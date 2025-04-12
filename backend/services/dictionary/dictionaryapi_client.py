# services/dictionary/dictionaryapi_client.py
# Triển khai DictionaryClient cho Dictionary API.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến Dictionary API.

from ..http.http_client import HTTPClient
from .dictionary_client import DictionaryClient
from ...logging_config import logger

class DictionaryAPIClient(DictionaryClient):
    def __init__(self, http_client: HTTPClient):
        self.http_client = http_client
        self.base_url = "https://api.dictionaryapi.dev/api/v2/entries/en"
        
    async def get_word_info(self, word: str, limit: int) -> dict:
        try:
            result = await self.http_client.get(f"{self.base_url}/{word}")
            definition = "No definition found"
            phonetic = "N/A"
            audio = []

            if isinstance(result, list) and len(result) > 0:
                entry = result[0]
                meanings = entry.get("meanings", [])
                definition = (
                    meanings[0]["definitions"][0]["definition"]
                    if meanings and len(meanings) > 0 and len(meanings[0]["definitions"]) > 0
                    else "No definition found"
                )
                phonetic = entry.get("phonetic", "N/A")
                phonetics = entry.get("phonetics", [])
                audio_url = next(
                    (item["audio"] for item in phonetics if item.get("audio", "")), None
                )
                audio = [audio_url] if audio_url else []

            return {
                "definition": definition,
                "phonetic": phonetic,
                "audio": audio,
                "examples": [],
                "hyphenation": [],
                "phrases": [],
                "pronunciations": [],
                "relatedWords": [],
                "topExample": ""
            }
        except Exception as e:
            logger.error(f"DictionaryAPI error: {str(e)}")
            return {
                "definition": "No definition found",
                "phonetic": "N/A",
                "audio": [],
                "examples": [],
                "hyphenation": [],
                "phrases": [],
                "pronunciations": [],
                "relatedWords": [],
                "topExample": ""
            }