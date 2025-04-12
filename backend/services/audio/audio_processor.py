# services/audio/audio_processor.py
# Định nghĩa interface AudioProcessor để không phụ thuộc trực tiếp vào implementation cụ thể (ffmpeg, v.v.).
# Tuân thủ DIP: Các module cấp cao chỉ phụ thuộc vào abstraction này.

from abc import ABC, abstractmethod

class AudioProcessor(ABC):
    @abstractmethod
    def convert_to_wav(self, input_path: str, output_path: str):
        """Convert audio file to WAV format."""
        pass