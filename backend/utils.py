# backend/utils.py
# Định nghĩa các hằng số và cấu hình cơ bản.
# Tuân thủ SRP: Chỉ chứa các hằng số và cấu hình.

import os

# Thư mục cache
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # Folder backend
CACHE_DIR = os.path.join(BASE_DIR, "cache")

# Load biến môi trường
HF_API_KEY = os.getenv("HF_API_KEY")
HF_API_URL = os.getenv("HF_API_URL")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
VOSK_MODEL_DIR = os.getenv("VOSK_MODEL_DIR", "vosk-model-en-us-0.22-lgraph")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
WORDNIK_API_KEY = os.getenv("WORDNIK_API_KEY")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY")
AUDIO_BUCKET = os.getenv("AUDIO_BUCKET")
AVATARS_BUCKET = os.getenv("AVATARS_BUCKET")
IMAGE_BUCKET = os.getenv("IMAGE_BUCKET")