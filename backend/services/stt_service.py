# services/stt_service.py
# Xử lý logic nghiệp vụ liên quan đến STT: xử lý file âm thanh, gọi dịch vụ STT.
# Tuân thủ SRP: Chỉ xử lý logic nghiệp vụ, không xử lý API.

import os
import time
from fastapi import HTTPException
from .stt.stt_client import STTClient
from .audio.audio_processor import AudioProcessor

class STTService:
    def __init__(self, audio_processor: AudioProcessor, vosk_client: STTClient, assemblyai_client: STTClient):
        self.audio_processor = audio_processor
        self.clients = {
            "vosk": vosk_client,
            "assemblyai": assemblyai_client
        }
        
    async def transcribe(self, audio_blob: bytes, method: str) -> dict:
        if not audio_blob:
            raise HTTPException(status_code=400, detail="No audio data received")

        if method not in self.clients:
            raise HTTPException(status_code=400, detail=f"Unsupported STT method: {method}")
        
        # Tạo tên file duy nhất với timestamp
        timestamp = int(time.time() * 1000)
        webm_path = f"backend/input_{timestamp}.webm"
        wav_path = f"backend/input_{timestamp}.wav"
        
        try:
            # Lưu file WebM
            with open(webm_path, 'wb') as f:
                f.write(audio_blob)
            print(f"Received audio size: {len(audio_blob)} bytes")

            # Chuyển đổi sang WAV
            self.audio_processor.convert_to_wav(webm_path, wav_path)

            # Gọi STT client tương ứng
            transcript = self.clients[method].transcribe(wav_path)
            return {"transcript": transcript}
        except HTTPException as e:
            raise e
        except Exception as e:
            print(f"Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            # Xóa file âm thanh
            for file_path in [webm_path, wav_path]:
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                        print(f"Deleted {file_path}")
                    except OSError as e:
                        print(f"Warning: Could not delete files {file_path} - {e}")