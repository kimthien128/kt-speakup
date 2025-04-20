from fastapi import APIRouter, Request, Query, Depends
from ..services.stt_service import STTService
from ..dependencies import get_audio_processor, get_vosk_client, get_assemblyai_client, get_google_stt_client

router = APIRouter()

# Khởi tạo STTService
async def get_stt_service(
    audio_processor = Depends(get_audio_processor),
    vosk_client = Depends(get_vosk_client),
    assemblyai_client = Depends(get_assemblyai_client),
    google_stt_client = Depends(get_google_stt_client)
):
    return STTService(audio_processor, vosk_client, assemblyai_client, google_stt_client)

@router.post("")
async def stt(request: Request, method: str = Query("vosk"), stt_service: STTService = Depends(get_stt_service)):
    audio_blob = await request.body()
    return await stt_service.transcribe(audio_blob, method)