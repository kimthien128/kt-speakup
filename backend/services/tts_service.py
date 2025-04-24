# services/tts/tts_service.py
# Xử lý logic nghiệp vụ liên quan đến TTS: xử lý file âm thanh, gọi dịch vụ TTS, upload lên MinIO.
# Tuân thủ SRP: Chỉ xử lý logic nghiệp vụ, không xử lý API.

import os
import time
import re
from fastapi import HTTPException, Response
from .tts.tts_client import TTSClient
from .audio.audio_processor import AudioProcessor
from ..storage.storage_client import StorageClient
from ..utils import CACHE_DIR
from ..logging_config import logger

class TTSService:
    def __init__(self, audio_processor: AudioProcessor, storage_client: StorageClient, gtts_client: TTSClient, piper_client: TTSClient):
        self.audio_processor = audio_processor
        self.storage_client = storage_client
        self.clients = {
            "gtts": gtts_client,
            "piper": piper_client
        }
        self.audio_bucket = os.getenv("AUDIO_BUCKET")

    def santize_filename(self, filename: str) -> str:
        """
        Loại bỏ hoặc thay thế các ký tự không hợp lệ trong tên file.
        """
        # Thay thế các ký tự không hợp lệ bằng '_'
        sanitized = re.sub(r'[^\w\s.-]', '_', filename)
        # Loại bỏ khoảng trắng thừa và thay bằng '_'
        sanitized = sanitized.strip().replace(' ', '_')
        return sanitized
    
    async def generate_audio(self, text: str, method: str) -> Response:
        if not text:
            raise HTTPException(status_code=400, detail="No text provided")

        if method not in self.clients:
            raise HTTPException(status_code=400, detail=f"Unsupported TTS method: {method}")

        # Phân biệt từ đơn và đoạn chat
        is_single_word = ' ' not in text
        timestamp = int(time.time() * 1000)
        # Làm sạch tên file nếu là từ đơn
        sanitized_text = self.santize_filename(text) if is_single_word else f"output_{timestamp}"
        audio_filename = f"{sanitized_text}.mp3"
        temp_path = f"temp_{timestamp}.mp3"
        wav_path = os.path.join(CACHE_DIR, f"output_{timestamp}.wav") if method == "piper" else None

        try:
            if method == "gtts":
                # gTTS tạo trực tiếp file MP3
                self.clients[method].generate_audio(text, temp_path)
            else:
                # Piper tạo file WAV, sau đó chuyển đổi sang MP3
                self.clients[method].generate_audio(text, wav_path)
                self.audio_processor.convert_to_mp3(wav_path, temp_path)
                if os.path.exists(wav_path):
                    os.remove(wav_path)

            # Kiểm tra file tồn tại trước khi upload
            if not os.path.exists(temp_path):
                raise HTTPException(status_code=500, detail=f"Audio file {temp_path} not found")
            
            # Tính độ dài file
            file_size = os.path.getsize(temp_path)
            
            # Upload file lên MinIO
            with open(temp_path, 'rb') as file_data:
                self.storage_client.put_object(
                    bucket_name=self.audio_bucket,
                    object_name=audio_filename,
                    data=file_data,
                    length=file_size,
                    content_type='audio/mpeg'
                )
            logger.info(f'Uploaded to MinIO: {audio_filename}')

            # Tạo URL từ MinIO
            audio_url = self.storage_client.presigned_get_object(self.audio_bucket, audio_filename)
            logger.info(f'Returning audio URL: {audio_url}')

            # Trả về URL trong header
            return Response(
                status_code=200,
                headers={"x-audio-url": audio_url}
            )

        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to generate audio: {str(e)}")
        finally:
            # Xóa file tạm
            for file_path in [temp_path, wav_path]:
                if file_path and os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except OSError as e:
                        logger.warning(f"Warning: Could not delete file {file_path} - {e}")