# services/tts/piper_client.py
# Triển khai TTSClient cho Piper.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến Piper.

import os
import subprocess
from fastapi import HTTPException
from ...utils import BASE_DIR
from .tts_client import TTSClient
from ...logging_config import logger

class PiperClient(TTSClient):
    def __init__(self):
        self.piper_exe = os.path.join(BASE_DIR, "models/piper", "piper.exe")
        self.model_path = os.path.join(BASE_DIR, "models/piper", os.getenv("PIPER_VOICE"))

    def generate_audio(self, text: str, output_path: str) -> str:
        cmd = [self.piper_exe, "--model", self.model_path, "--output_file", output_path]
        process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        process.stdin.write(text)
        process.stdin.close()
        stdout, stderr = process.communicate()
        if process.returncode != 0:
            logger.error(f'Piper error: {stderr}')
            raise HTTPException(status_code=500, detail="Failed to generate audio with Piper")
        logger.info(f'Generated audio with Piper: {output_path}')
        return output_path