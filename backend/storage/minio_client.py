# storage/minio_client.py
# Triển khai StorageClient cho MinIO.
# Khởi tạo MinIO client và cấu hình bucket policy.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến MinIO.

import os
import json
from minio import Minio
from minio.error import S3Error
from .storage_client import StorageClient
from ..logging_config import logger

class MinioClient(StorageClient):
    def __init__(self):
        self.endpoint = os.getenv("MINIO_ENDPOINT")
        self.access_key = os.getenv("MINIO_ACCESS_KEY")
        self.secret_key = os.getenv("MINIO_SECRET_KEY")
        self.image_bucket = os.getenv("IMAGE_BUCKET")
        self.audio_bucket = os.getenv("AUDIO_BUCKET")
        
        self.client = Minio(
            endpoint=self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=False  # Đặt True nếu dùng HTTPS
        )
        
        self.bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{self.image_bucket}/*"]
                }
            ]
        }
        
        self._initialize_buckets()
    
    def _initialize_buckets(self):
        """Khởi tạo các bucket và thiết lập policy."""
        try:
            # Kiểm tra nếu bucket đã tồn tại
            if not self.bucket_exists(self.image_bucket):
                self.make_bucket(self.image_bucket)
                logger.info(f"Created bucket: {self.image_bucket}")
            
            # Áp dụng policy
            self.set_bucket_policy(self.image_bucket, json.dumps(self.bucket_policy))
            logger.info(f"Public read policy set for bucket: {self.image_bucket}")
        except S3Error as e:
            logger.error(f"Error configuring MinIO bucket: {e}")
            
    def bucket_exists(self, bucket_name: str) -> bool:
        """Kiểm tra xem bucket có tồn tại hay không."""
        return self.client.bucket_exists(bucket_name)
    
    def make_bucket(self, bucket_name: str):
        """Tạo bucket mới."""
        self.client.make_bucket(bucket_name)
        
    def set_bucket_policy(self, bucket_name: str, policy: str):
        """Thiết lập policy cho bucket."""
        self.client.set_bucket_policy(bucket_name, policy)
        
    def list_objects(self, bucket_name: str, recursive: bool = True) -> list:
        return self.client.list_objects(bucket_name, recursive=recursive)

    def stat_object(self, bucket_name: str, object_name: str) -> dict:
        return self.client.stat_object(bucket_name, object_name)

    def remove_object(self, bucket_name: str, object_name: str):
        self.client.remove_object(bucket_name, object_name)