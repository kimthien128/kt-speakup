# services/audio/audio_processor.py
# Định nghĩa interface AudioProcessor để không phụ thuộc trực tiếp vào implementation cụ thể (ffmpeg, v.v.).
# Thêm phương thức convert_to_mp3 để tái sử dụng từ stt.py.

from abc import ABC, abstractmethod

class AudioProcessor(ABC):
    @abstractmethod
    def convert_to_wav(self, input_path: str, output_path: str):
        """Convert audio file to WAV format."""
        pass
    
    @abstractmethod
    def convert_to_mp3(self, input_path: str, output_path: str):
        """Convert audio file to MP3 format."""
        pass