from minio import Minio
from utils import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, AVATARS_BUCKET, AUDIO_BUCKET, IMAGE_BUCKET

# Kết nối MinIO
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False  # Đặt True nếu dùng HTTPS
)