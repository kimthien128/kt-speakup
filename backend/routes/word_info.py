# routes/word_info.py
from fastapi import APIRouter, Request, Depends
from ..services.http.httpx_client import HttpxClient
from ..services.dictionary.dictionaryapi_client import DictionaryAPIClient
from ..services.dictionary.wordnik_client import WordnikClient
from ..services.dictionary_service import DictionaryService

router = APIRouter()

# Khởi tạo DictionaryService
async def get_dictionary_service():
    http_client = HttpxClient()
    dictionaryapi_client = DictionaryAPIClient(http_client)
    wordnik_client = WordnikClient(http_client)
    return DictionaryService(dictionaryapi_client, wordnik_client)

@router.post("")
async def word_info(request: Request, dictionary_service: DictionaryService = Depends(get_dictionary_service)):
    data = await request.json()
    word = data.get("word", "").strip().lower()
    source = data.get("source", "dictionaryapi").strip().lower()
    limit = data.get("limit", 2)
    return await dictionary_service.get_word_info(word, source, limit)