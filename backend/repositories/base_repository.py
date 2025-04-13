#repositories/base_repository.py
#Định nghĩa các phương thức trừu tượng để các implementation (như MongoRepository) có thể triển khai theo cách riêng

from abc import ABC, abstractmethod
from typing import Any, List, Optional

# resource ở đây có thể là collection nếu là mongo, hoặc table nếu là postgres
class BaseRepository(ABC):
    def __init__(self, db):
        self.db = db
    
    @abstractmethod
    async def find_one(self, resource: str, query: dict) -> Optional[Any]:
        """Tìm một bản ghi trong resource dựa trên query"""
        pass
    
    @abstractmethod
    async def find_many(self, resource: str, query: dict) -> List[Any]:
        """Tìm nhiều bản ghi trong resource dựa trên query"""
        pass
    
    @abstractmethod
    async def insert_one(self, resource: str, document: dict) -> Any:
        """Chèn một bản ghi vào resource"""
        pass
    
    @abstractmethod
    async def update_one(self, resource: str, query: dict, update: dict) -> Any:
        """Cập nhật một bản ghi trong resource dựa trên query"""
        pass
    
    @abstractmethod
    async def delete_one(self, resource: str, query: dict) -> Any:
        """Xóa một bản ghi trong resource dựa trên query"""
        pass
    
    @abstractmethod
    async def delete_many(self, resource: str, query: dict) -> Any:
        """Xóa nhiều bản ghi trong resource dựa trên query"""
        pass