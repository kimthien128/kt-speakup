# services/dictionary/dictionaryapi_client.py
# Triển khai DictionaryClient cho Dictionary API.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến Dictionary API.

from ..http.http_client import HTTPClient
from .dictionary_client import DictionaryClient
from ...logging_config import logger
from fastapi import HTTPException

class DictionaryAPIClient(DictionaryClient):
    def __init__(self, http_client: HTTPClient):
        self.http_client = http_client
        self.base_url = "https://api.dictionaryapi.dev/api/v2/entries/en"
        
    async def get_word_info(self, word: str, limit: int) -> dict:
        logger.info(f"Fetching word info for word: {word}, source: dictionaryapi")
        
        # Khởi tạo giá trị mặc định
        result = {
            "definition": "No definition found",
            "phonetic": "N/A",
            "audio": [],
            "examples": [],
            "pronunciations": [],
            "topExample": ""
        }
        
        try:
            response = await self.http_client.get(f"{self.base_url}/{word}")

            if isinstance(response, dict) and "title" in response and response["title"] == "No Definitions Found":
                logger.warning(f"No definitions found for word: {word}")
                return result

            if not isinstance(response, list) or not response:
                logger.warning(f"Invalid response format or empty response for word: {word}")
                return result

            entry = response[0]
            
            # Lấy definition
            meanings = entry.get("meanings", [])
            if meanings and meanings[0].get("definitions"):
                result["definition"] = meanings[0]["definitions"][0].get("definition", "No definition found")

            # Lấy phonetic và pronunciations
            result["phonetic"] = entry.get("phonetic", "N/A")
            phonetics = entry.get("phonetics", [])
            result["pronunciations"] = [
                phonetic.get("text", "") for phonetic in phonetics if phonetic.get("text")
            ][:limit]
            if result["pronunciations"] and result["phonetic"] == "N/A":
                result["phonetic"] = result["pronunciations"][0]

            # Lấy audio
            result["audio"] = [
                phonetic.get("audio", "") for phonetic in phonetics if phonetic.get("audio")
            ][:limit]
            
            # Lấy examples và topExample
            for meaning in meanings:
                for definition in meaning.get("definitions", []):
                    example = definition.get("example", "")
                    if example:
                        result["examples"].append(example)
                    if not result["topExample"] and example:
                        result["topExample"] = example
                    if len(result["examples"]) >= limit:
                        break
                if len(result["examples"]) >= limit:
                    break

            return result
        
        except Exception as e:
            logger.error(f"DictionaryAPI error for word {word}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch word info: {str(e)}")