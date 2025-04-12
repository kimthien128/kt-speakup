# services/stt/assemblyai_stt_client.py
# Triển khai STTClient cho AssemblyAI.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến AssemblyAI.

import assemblyai as aai
from utils import ASSEMBLYAI_API_KEY
from .stt_client import STTClient


class AssemblyAISTTClient(STTClient):
    def __init__(self):
        aai.settings.api_key = ASSEMBLYAI_API_KEY
        self.transcribe = aai.Transcriber()
        
    def transcribe(self, wav_path : str) -> str:
        print('Starting AssemblyAI transcription...')
        transcript_obj = self.transcriber.transcribe(wav_path)
        if transcript_obj.status == aai.TranscriptStatus.completed:
            transcript = transcript_obj.text or "No speech detected"
            print(f"AssemblyAI transcript: {transcript}")
        elif transcript_obj.status == aai.TranscriptStatus.error:
            print(f"AssemblyAI error: {transcript_obj.error}")
            transcript = ''
        else:
            print(f"AssemblyAI status: {transcript_obj.status}")
            transcript = ''
        if not transcript:
            print("Warning: AssemblyAI returned empty transcript")
        return transcript