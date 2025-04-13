# storage/storage_client.py
# Định nghĩa interface StorageClient để không phụ thuộc trực tiếp vào implementation cụ thể (MinIO, S3, v.v.).
# Tuân thủ DIP: Các module cấp cao chỉ phụ thuộc vào abstraction này.

from abc import ABC, abstractmethod

class StorageClient(ABC):
    @abstractmethod
    def bucket_exists(self, bucket_name: str) -> bool:
        """Kiểm tra xem bucket có tồn tại hay không."""
        pass
    
    @abstractmethod
    def make_bucket(self, bucket_name: str):
        """Tạo bucket mới."""
        pass
    
    @abstractmethod
    def set_bucket_policy(self, bucket_name: str, policy: str):
        """Thiết lập policy cho bucket."""
        pass
    
    @abstractmethod
    def list_objects(self, bucket_name: str, recursive: bool = True) -> list:
        """Liệt kê các đối tượng trong bucket."""
        pass
    
    @abstractmethod
    def stat_object(self, bucket_name: str, object_name: str) -> dict:
        """Lấy thông tin về một đối tượng cụ thể."""
        pass
    
    @abstractmethod
    def remove_object(self, bucket_name: str, object_name: str):
        """Xóa một đối tượng cụ thể."""
        pass
    
    @abstractmethod
    def put_object(self, bucket_name: str, object_name: str, file_path: str):
        """Tải file lên bucket."""
        pass
    
    @abstractmethod
    def presigned_get_object(self, bucket_name: str, object_name: str) -> str:
        """Tạo URL công khai để truy cập file"""
        pass