# services/stt/google_stt_client.py
# Triển khai STTClient cho Google Speech-to-Text.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến Google Speech-to-Text.

import os
from google.cloud import speech_v1 as speech
from .stt_client import STTClient
from ...logging_config import logger

class GoogleSTTClient(STTClient):
    def __init__(self):
        # Khởi tạo client Google Speech-to-Text
        # Credentials sẽ được tự động load từ biến môi trường GOOGLE_APPLICATION_CREDENTIALS
        self.client = speech.SpeechClient.from_service_account_file('backend/google-credentials.json')
        
    def transcribe(self, wav_path: str) -> str:
        logger.info('Starting Google STT transcription...')
        
        # Đọc file WAV
        try:
            with open(wav_path, "rb") as audio_file:
                content = audio_file.read()
        except Exception as e:
            logger.error(f"Error reading WAV file: {str(e)}")
            raise RuntimeError(f"Failed to read WAV file: {str(e)}")
        
        # Cấu hình audio và recognition
        audio = speech.RecognitionAudio(content=content)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,  # Điều chỉnh nếu file WAV có sample rate khác
            language_code="en-US",
        )
        
        # Gửi yêu cầu đến Google Speech-to-Text API
        try:
            response = self.client.recognize(config=config, audio=audio)
        except Exception as e:
            logger.error(f"Google Speech-to-Text error: {str(e)}")
            raise RuntimeError(f"Google Speech-to-Text transcription failed: {str(e)}")
        
        # Xử lý kết quả
        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript + " "
        
        transcript = transcript.strip()
        if not transcript:
            logger.warning("Warning: Google Speech-to-Text returned empty transcript")
            return "No speech detected"

        logger.info(f"Google Speech-to-Text transcript: {transcript}")
        return transcript