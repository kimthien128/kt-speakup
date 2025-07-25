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
        self.access_key = os.getenv("MINIO_ACCESS_KEY")
        self.secret_key = os.getenv("MINIO_SECRET_KEY")
        self.image_bucket = os.getenv("IMAGE_BUCKET")
        self.audio_bucket = os.getenv("AUDIO_BUCKET")
        self.avatars_bucket = os.getenv("AVATARS_BUCKET")
        
        self.client = Minio(
            endpoint='localhost:9000', # chỉ tương tác nội bộ ở server
            # endpoint='storage.speakup.ktstudio.vn:443',
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=False,  # Đặt True nếu dùng HTTPS, local thì False
            cert_check=False  # Tắt kiểm tra chứng chỉ SSL
        )
        # Lưu URL công khai để tạo presigned URL
        self.public_endpoint = os.getenv("MINIO_ENDPOINT", 'https://storage.speakup.ktstudio.vn')
        # if not self.public_endpoint:
        #     logger.error("MINIO_ENDPOINT environment variable not set!")
        #     self.public_endpoint = "https://storage.speakup.ktstudio.vn"  # Giá trị mặc định
            
        logger.info(f"MinIO public endpoint: {self.public_endpoint}")
        
        # Thêm kiểm tra kết nối ngay khi khởi tạo
        try:
            if not self.client.bucket_exists(self.image_bucket):
                logger.info("MinIO connection successful")
        except Exception as e:
            logger.error(f"MinIO connection failed: {e}")
            raise
    
        self._initialize_buckets()
    
    def _generate_public_read_policy(self, bucket_name: str) -> str:
        """Tạo policy cho phép đọc công khai cho bucket."""
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}/*"]
                }
            ]
        }
        return json.dumps(policy)
    
    def _setup_bucket(self, bucket_name: str):
        """Khởi tạo bucket và thiết lập policy."""
        try:
            # Kiểm tra và tạo bucket nếu chưa tồn tại
            if not self.bucket_exists(bucket_name):
                self.make_bucket(bucket_name)
                logger.info(f"Created bucket: {bucket_name}")
            else:
                logger.info(f"Bucket already exists: {bucket_name}")

            # Áp dụng policy
            policy = self._generate_public_read_policy(bucket_name)
            self.set_bucket_policy(bucket_name, policy)
            logger.info(f"Public read policy set for bucket: {bucket_name}")
        except S3Error as e:
            logger.error(f"Error configuring MinIO bucket {bucket_name}: {e}")
            raise
        
    def _initialize_buckets(self):
        """Khởi tạo các bucket và thiết lập policy."""
        self._setup_bucket(self.image_bucket)
        self._setup_bucket(self.audio_bucket)
        self._setup_bucket(self.avatars_bucket)
            
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
        
    def put_object(self, bucket_name: str, object_name: str, data, length: int, content_type: str):
        """Tải file lên bucket."""
        try:
            self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=data,
                length=length,
                content_type=content_type
            )
            logger.info(f"Uploaded file to MinIO: {bucket_name}/{object_name}")
        except S3Error as e:
            logger.error(f"Failed to upload file to MinIO: {e}")
            raise
        
    def presigned_get_object(self, bucket_name: str, object_name: str) -> str:
        """Tạo URL công khai để truy cập file."""
        try:
            # Trả về URL trực tiếp thay vì presigned URL, vì đã thiết lập policy công khai
            url = f"{self.public_endpoint.rstrip('/')}/{bucket_name}/{object_name}"
            logger.info(f"Final URL: {url}")
            return url
        except S3Error as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise