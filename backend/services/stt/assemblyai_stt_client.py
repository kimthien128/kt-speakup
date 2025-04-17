# services/stt/assemblyai_stt_client.py
# Triển khai STTClient cho AssemblyAI.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến AssemblyAI.

import assemblyai as aai
from ...utils import ASSEMBLYAI_API_KEY
from .stt_client import STTClient
from ...logging_config import logger

class AssemblyAISTTClient(STTClient):
    def __init__(self):
        aai.settings.api_key = ASSEMBLYAI_API_KEY
        self.transcriber = aai.Transcriber()
        
    def transcribe(self, wav_path : str) -> str:
        logger.info('Starting AssemblyAI transcription...')
        transcript_obj = self.transcriber.transcribe(wav_path)
        if transcript_obj.status == aai.TranscriptStatus.completed:
            transcript = transcript_obj.text or "No speech detected"
            logger.info(f"AssemblyAI transcript: {transcript}")
        elif transcript_obj.status == aai.TranscriptStatus.error:
            logger.error(f"AssemblyAI error: {transcript_obj.error}")
            transcript = ''
            raise RuntimeError(f"AssemblyAI transcription failed: {transcript_obj.error}")
        else:
            logger.info(f"AssemblyAI status: {transcript_obj.status}")
            transcript = ''
            raise RuntimeError(f"AssemblyAI transcription failed with status: {transcript_obj.status}")
        if not transcript:
            logger.warning("Warning: AssemblyAI returned empty transcript")
        return transcript