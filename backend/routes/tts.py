from fastapi import APIRouter, Request, Depends
from services.tts.gtts_client import GTTSClient
from services.tts.piper_client import PiperClient
from services.audio.ffmpeg_audio_processor import FFmpegAudioProcessor
from services.tts.tts_service import TTSService
from ..storage.minio_client import MinioClient

router = APIRouter()

# Khởi tạo TTSService
async def get_tts_service():
    audio_processor = FFmpegAudioProcessor()
    storage_client = MinioClient()
    gtts_client = GTTSClient()
    piper_client = PiperClient()
    return TTSService(audio_processor, storage_client, gtts_client, piper_client)

@router.post("")
async def tts(request: Request, tts_service: TTSService = Depends(get_tts_service)):
    data = await request.json()
    text = data.get('text', '')
    method = request.query_params.get('method', 'gtts')
    return await tts_service.generate_audio(text, method)