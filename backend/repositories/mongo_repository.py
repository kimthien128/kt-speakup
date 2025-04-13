#repositories/mongo_repository.py
#Triển khai BaseRepository cho MongoDB
#Nếu cần hỗ trợ PostgreSQL, có thể tạo PostgresRepository mà không ảnh hưởng đến các file khác

from .base_repository import BaseRepository
from typing import Any, List, Optional

# Implementation cụ thể cho MongoDB
class MongoRepository(BaseRepository):
    def __init__(self, db):
        self.db = db
        
    async def find_one(self, resource: str, query: dict) -> Optional[Any]:
        return await self.db[resource].find_one(query)
    
    async def find_many(self, resource: str, query: dict) -> List[Any]:
        return await self.db[resource].find(query).to_list(length=None) # Lấy tất cả document trả về, không giới hạn số lượng
    
    async def insert_one(self, resource: str, document: dict) -> Any:
        return await self.db[resource].insert_one(document)
    
    async def update_one(self, resource: str, query: dict, update: dict) -> Any:
        return await self.db[resource].update_one(query, update)
        
    async def delete_one(self, resource: str, query: dict) -> Any:
        return await self.db[resource].delete_one(query)