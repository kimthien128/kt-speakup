# services/tts/tts_client.py
# Định nghĩa interface TTSClient để không phụ thuộc trực tiếp vào implementation cụ thể (gTTS, Piper, v.v.).
# Tuân thủ DIP: Các module cấp cao chỉ phụ thuộc vào abstraction này.

from abc import ABC, abstractmethod

class TTSClient(ABC):
    @abstractmethod
    def generate_audio(self, text: str, output_path: str) -> str:
        pass