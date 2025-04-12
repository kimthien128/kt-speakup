from fastapi import APIRouter, Request, Depends
from services.tts.tts_service import TTSService
from ..dependencies import get_audio_processor, get_storage_client, get_gtts_client, get_piper_client

router = APIRouter()

# Khởi tạo TTSService
async def get_tts_service(
    audio_processor = Depends(get_audio_processor),
    storage_client = Depends(get_storage_client),
    gtts_client = Depends(get_gtts_client),
    piper_client = Depends(get_piper_client)
):
    return TTSService(audio_processor, storage_client, gtts_client, piper_client)

@router.post("")
async def tts(request: Request, tts_service: TTSService = Depends(get_tts_service)):
    data = await request.json()
    text = data.get('text', '')
    method = request.query_params.get('method', 'gtts')
    return await tts_service.generate_audio(text, method)