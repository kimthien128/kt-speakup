# services/audio/ffmpeg_audio_processor.py
# Triển khai AudioProcessor bằng ffmpeg.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến ffmpeg.

import ffmpeg
from fastapi import HTTPException
from .audio_processor import AduioProcessor

class FFmpegAudioProcessor(AduioProcessor):
    def convert_to_wav(self, input_path: str, output_path: str):
        try:
            stream = ffmpeg.input(input_path)
            stream = ffmpeg.output(stream, output_path, ar=16000, ac=1, format='wav')
            ffmpeg.run(stream, quiet=True)
            print("Converted to WAV")
        except ffmpeg.Error as e:
            print(f"FFmpeg error: {e.stderr.decode()}")
            raise HTTPException(status_code=500, detail="Failed to convert audio")