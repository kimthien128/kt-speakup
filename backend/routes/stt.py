from fastapi import APIRouter, Request, Query, Depends
from services.stt.vosk_stt_client import VoskSTTClient
from services.stt.assemblyai_stt_client import AssemblyAISTTClient
from services.audio.ffmpeg_audio_processor import FFmpegAudioProcessor
from services.stt_service import STTService

router = APIRouter()

# Khởi tạo STTService
async def get_stt_service():
    audio_processor = FFmpegAudioProcessor()
    vosk_client = VoskSTTClient()
    assemblyai_client = AssemblyAISTTClient()
    return STTService(audio_processor, vosk_client, assemblyai_client)

@router.post("")
async def stt(request: Request, method: str = Query("vosk"), stt_service: STTService = Depends(get_stt_service)):
    audio_blob = await request.body()
    return await stt_service.transcribe(audio_blob, method)