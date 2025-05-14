# services/dictionary/wordnik_client.py
# Triển khai DictionaryClient cho Wordnik API.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến Wordnik API.

from fastapi import HTTPException
from ..http.http_client import HTTPClient
from .dictionary_client import DictionaryClient
from ...utils import WORDNIK_API_KEY
from ...logging_config import logger
import asyncio

class WordnikClient(DictionaryClient):
    def __init__(self, http_client: HTTPClient):
        if not WORDNIK_API_KEY:
            raise HTTPException(status_code=500, detail="Wordnik API key is not set.")
        self.http_client = http_client
        self.base_url = "https://api.wordnik.com/v4/word.json"
        self.headers = {"api_key": WORDNIK_API_KEY}
        
    async def get_word_info(self, word: str, limit: int) -> dict:
        logger.info(f"Fetching word info for word: {word}, source: wordnik")
        
        # Khởi tạo giá trị mặc định
        result = {
            "definition": "No definition found",
            "phonetic": "N/A",
            "audio": [],
            "examples": [],
        }
        try:
            definitions_url = f"{self.base_url}/{word}/definitions?limit={limit}&includeRelated=false&useCanonical=false&includeTags=false"
            audio_url = f"{self.base_url}/{word}/audio?limit={limit}"
            examples_url = f"{self.base_url}/{word}/examples?limit={limit}"
            
            tasks = [
                self.http_client.get(definitions_url, headers=self.headers),
                self.http_client.get(audio_url, headers=self.headers),
                self.http_client.get(examples_url, headers=self.headers),
            ]
            
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Xử lý definitions
            definitions_data = responses[0]
            if isinstance(definitions_data, dict) and "status" in definitions_data and definitions_data["status"] != 200:
                logger.warning(f"Failed to fetch definitions: {definitions_data.get('message', 'Unknown error')}")
            elif isinstance(definitions_data, list) and definitions_data:
                result["definition"] = definitions_data[0].get("text", "No definition found")

            # Xử lý audio
            audio_data = responses[1]
            if isinstance(audio_data, dict) and "status" in audio_data and audio_data["status"] != 200:
                logger.warning(f"Failed to fetch audio: {audio_data.get('message', 'Unknown error')}")
            elif isinstance(audio_data, list) and audio_data:
                result["audio"] = [item.get("fileUrl", "") for item in audio_data if isinstance(item, dict) and "fileUrl" in item][:limit]
                logger.info(f"Found {len(result['audio'])} audio files for word: {word}")

            # Xử lý examples
            examples_data = responses[2]
            if isinstance(examples_data, dict) and "status" in examples_data and examples_data["status"] != 200:
                logger.warning(f"Failed to fetch examples: {examples_data.get('message', 'Unknown error')}")
            elif isinstance(examples_data, dict) and "examples" in examples_data:
                result["examples"] = [example.get("text", "") for example in examples_data["examples"] if isinstance(example, dict) and "text" in example][:limit]

            return result

        except Exception as e:
            logger.error(f"Error fetching word info for {word}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch word info: {str(e)}")