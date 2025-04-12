# services/dictionary/wordnik_client.py
# Triển khai DictionaryClient cho Wordnik API.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến Wordnik API.

from fastapi import HTTPException
from ..http.http_client import HTTPClient
from .dictionary_client import DictionaryClient
from utils import WORDNIK_API_KEY
from ...logging_config import logger

class WordnikClient(DictionaryClient):
    def __init__(self, http_client: HTTPClient):
        if not WORDNIK_API_KEY:
            raise HTTPException(status_code=500, detail="Wordnik API key is not set.")
        self.http_client = http_client
        self.base_url = "https://api.wordnik.com/v4/word.json"
        self.headers = {"api_key": WORDNIK_API_KEY}
        
    async def get_word_info(self, word: str, limit: int) -> dict:
        try:
            definition = "No definition found"
            phonetic = "N/A"
            audio = []
            examples = []
            hyphenation = []
            phrases = []
            pronunciations = []
            related_words = []
            top_example = ""
            
            # 1. Lấy definitions
            definitions_url = f"{self.base_url}/{word}/definitions?limit={limit}&includeRelated=false&useCanonical=false&includeTags=false"
            definitions = await self.http_client.get(definitions_url, headers=self.headers)
            if isinstance(definitions, list):
                for def_item in definitions:
                    if isinstance(def_item, dict) and "text" in def_item:
                        definition = def_item["text"]
                        break
            else:
                logger.warning(f"No definitions found for word: {word}")

            # 2. Lấy audio
            audio_url = f"{self.base_url}/{word}/audio?limit={limit}"
            audio_data = await self.http_client.get(audio_url, headers=self.headers)
            if isinstance(audio_data, list) and len(audio_data) > 0:
                audio_files = [item["fileUrl"] for item in audio_data if isinstance(item, dict) and "fileUrl" in item][:2]
                audio = audio_files
                logger.info(f"Found {len(audio_files)} audio files for word: {word}")
            else:
                logger.warning(f"No audio found for word: {word}")

            # 3. Lấy examples
            examples_url = f"{self.base_url}/{word}/examples?limit={limit}"
            examples_data = await self.http_client.get(examples_url, headers=self.headers)
            examples_list = examples_data.get("examples", [])
            if isinstance(examples_list, list):
                examples = [example["text"] for example in examples_list if isinstance(example, dict) and "text" in example][:limit]
            else:
                logger.warning(f"No examples found for word: {word}")

            # 4. Lấy hyphenation
            hyphenation_url = f"{self.base_url}/{word}/hyphenation?useCanonical=false"
            hyphenation_data = await self.http_client.get(hyphenation_url, headers=self.headers)
            if isinstance(hyphenation_data, list):
                hyphenation = [part["text"] for part in hyphenation_data if isinstance(part, dict) and "text" in part][:limit]
            else:
                logger.warning(f"No hyphenation data found for word: {word}")

            # 5. Lấy phrases
            phrases_url = f"{self.base_url}/{word}/phrases?limit={limit}"
            phrases_data = await self.http_client.get(phrases_url, headers=self.headers)
            if isinstance(phrases_data, list):
                phrases = [
                    f"{phrase['gram1']} {phrase['gram2']}"
                    for phrase in phrases_data
                    if isinstance(phrase, dict) and "gram1" in phrase and "gram2" in phrase
                ][:limit]
            else:
                logger.warning(f"No phrases found for word: {word}")

            # 6. Lấy pronunciations
            pronunciations_url = f"{self.base_url}/{word}/pronunciations?limit={limit}&typeFormat=IPA"
            pronunciations_data = await self.http_client.get(pronunciations_url, headers=self.headers)
            if isinstance(pronunciations_data, list):
                pronunciations = [pron["raw"] for pron in pronunciations_data if isinstance(pron, dict) and "raw" in pron][:limit]
                phonetic = pronunciations[0] if pronunciations else "N/A"
            else:
                logger.warning(f"No pronunciations found for word: {word}")

            # 7. Lấy related words
            related_words_url = f"{self.base_url}/{word}/relatedWords?limitPerRelationshipType={limit}"
            related_words_data = await self.http_client.get(related_words_url, headers=self.headers)
            if isinstance(related_words_data, list):
                related_words = [
                    {
                        "relationshipType": rel.get("relationshipType", "Unknown"),
                        "words": rel.get("words", [])[:limit]
                    }
                    for rel in related_words_data
                    if isinstance(rel, dict) and "relationshipType" in rel and "words" in rel
                ]
            else:
                logger.warning(f"No related words found for word: {word}")

            # 8. Lấy top example
            top_example_url = f"{self.base_url}/{word}/topExample"
            top_example_data = await self.http_client.get(top_example_url, headers=self.headers)
            if isinstance(top_example_data, dict):
                top_example = top_example_data.get("text", "")
            else:
                logger.warning(f"No top example found for word: {word}")

            return {
                "definition": definition,
                "phonetic": phonetic,
                "audio": audio,
                "examples": examples,
                "hyphenation": hyphenation,
                "phrases": phrases,
                "pronunciations": pronunciations,
                "relatedWords": related_words,
                "topExample": top_example
            }
        except Exception as e:
            logger.error(f"Wordnik error: {str(e)}")
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