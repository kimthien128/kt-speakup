import os
import time
from minio import Minio
from minio.error import S3Error

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
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY")
AUDIO_BUCKET = os.getenv("AUDIO_BUCKET")
AVATARS_BUCKET = os.getenv("AVATARS_BUCKET")
IMAGE_BUCKET = os.getenv("IMAGE_BUCKET")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

# Khởi tạo MinIO client
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False  # Đặt True nếu dùng HTTPS
)

# Hàm dọn cache (time to live = 1 giờ)
def clean_cache():
    try:
        now = time.time()
        # Liệt kê tất cả object trong bucket
        objects = minio_client.list_objects(AUDIO_BUCKET, recursive=True)
        
        for obj in objects:
            # Lấy metadata hoặc stat của object
            stat = minio_client.stat_object(AUDIO_BUCKET, obj.object_name)
            last_modified = stat.last_modified.timestamp()
            
            if now - last_modified > 604800:  # 7 ngày = 604,800 giây
                minio_client.remove_object(AUDIO_BUCKET, obj.object_name)
                print(f'Deleted expired cache: {obj.object_name} (last modified: {stat.last_modified})')
    except S3Error as e:
        print(f"MinIO error: {e}")
    except Exception as e:
        print(f"Error cleaning cache: {e}")
