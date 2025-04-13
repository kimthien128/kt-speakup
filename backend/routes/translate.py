from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..services.translation_service import TranslationService
from ..dependencies import get_google_translation_client

router = APIRouter()

class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "vi"

# Khởi tạo TranslationService
async def get_translation_service(translation_client = Depends(get_google_translation_client)):
    return TranslationService(translation_client)

@router.post('')
async def translate_text(request: TranslateRequest, translation_service: TranslationService = Depends(get_translation_service)):
    return await translation_service.translate(request.text, request.target_lang)