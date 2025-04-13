# services/stt/vosk_stt_client.py
# Triển khai STTClient cho Vosk.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến Vosk.

import wave
import json
from vosk import Model, KaldiRecognizer
from ...utils import VOSK_MODEL_DIR
from .stt_client import STTClient
from ...logging_config import logger

class VoskSTTClient(STTClient):
    def __init__(self):
        # Load Vosk model
        self.model = Model(f"backend/models/{VOSK_MODEL_DIR}")
        self.rec = KaldiRecognizer(self.model, 16000)

    def transcribe(self, wav_path: str) -> str:
        """Trả về văn bản đã chuyển đổi từ file WAV."""
        transcript = ''
        with wave.open(wav_path, 'rb') as wf:
            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                if self.rec.AcceptWaveform(data):
                    result = json.loads(self.rec.Result())
                    logger.info(f"Partial result: {result}")
                    transcript = result.get('text', '')
                    break
            if not transcript:
                result = json.loads(self.rec.FinalResult())
                logger.info(f"Final result: {result}")
                transcript = result.get('text', '')
        return transcript