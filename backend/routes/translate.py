from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from deep_translator import GoogleTranslator

router = APIRouter()

class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "vi"

@router.post('')
async def translate_text(request: TranslateRequest):
    try:
        translated = GoogleTranslator(source='auto', target=request.target_lang).translate(request.text)
        return {"translatedText": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")