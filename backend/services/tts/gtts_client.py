# services/tts/gtts_client.py
# Triển khai TTSClient cho gTTS.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến gTTS.

from gtts import gTTS
from .tts_client import TTSClient

class GTTSClient(TTSClient):
    def generate_audio(self, text: str, output_path: str) -> str:
        tts = gTTS(text=text, lang='en')
        tts.save(output_path)
        print(f'Generated audio with gTTS: {output_path}')
        return output_path