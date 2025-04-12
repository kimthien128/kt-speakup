# services/stt/stt_client.py
# Định nghĩa interface STTClient để không phụ thuộc trực tiếp vào implementation cụ thể (Vosk, AssemblyAI, v.v.).
# Tuân thủ DIP: Các module cấp cao chỉ phụ thuộc vào abstraction này.

from abc import ABC, abstractmethod

class STTClient(ABC):
    @abstractmethod
    def transcribe(self, wav_path: str) -> str:
        """Trả về văn bản đã chuyển đổi từ file WAV."""
        pass