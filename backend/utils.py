import os
import time

# Thư mục cache
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # Folder backend
CACHE_DIR = os.path.join(BASE_DIR, "cache")

# Load biến môi trường
HF_API_KEY = os.getenv("HF_API_KEY")
HF_API_URL = os.getenv("HF_API_URL")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
VOSK_MODEL_DIR = os.getenv("VOSK_MODEL_DIR", "vosk-model-en-us-0.22-lgraph")

# Hàm dọn cache (time to live = 1 giờ)
def clean_cache():
    now = time.time()
    for file in os.listdir(CACHE_DIR):
        file_path = os.path.join(CACHE_DIR, file)
        if os.path.isfile(file_path) and now - os.path.getmtime(file_path) > 3600:
            os.remove(file_path)
            print(f'Deleted expired cache: {file_path}')
