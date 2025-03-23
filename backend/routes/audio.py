from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
from utils import CACHE_DIR

router = APIRouter()

# Phát lại audio
@router.get('/{filename}')
async def get_audio(filename: str):
    audio_path = os.path.join(CACHE_DIR, filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=400, detail='Audio not found')
    return FileResponse(audio_path, media_type="audio/mp3")