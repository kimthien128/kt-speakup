# routes/word_info.py
from fastapi import APIRouter, Request, Depends
from ..services.dictionary_service import DictionaryService
from ..dependencies import get_dictionaryapi_client, get_wordnik_client
from ..logging_config import logger

router = APIRouter()

# Khởi tạo DictionaryService
async def get_dictionary_service(
    dictionaryapi_client = Depends(get_dictionaryapi_client),
    wordnik_client = Depends(get_wordnik_client)
):
    return DictionaryService(dictionaryapi_client, wordnik_client)

@router.post("")
async def word_info(request: Request, dictionary_service: DictionaryService = Depends(get_dictionary_service)):
    data = await request.json()
    word = data.get("word", "").strip().lower()
    source = data.get("source", "dictionaryapi").strip().lower()
    limit = data.get("limit", 2)
    logger.info(f"Fetching word info for word: {word}, source: {source}")
    return await dictionary_service.get_word_info(word, source, limit)