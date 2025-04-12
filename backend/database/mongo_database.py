#database/mongo_database.py
#triển khai DatabaseInterface cho MongoDB
#Nếu sau này cần hỗ trợ database khác (như PostgreSQL), chỉ cần tạo PostgresDatabase mà không sửa code cũ

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from .database_interface import DatabaseInterface

# Implementation cụ thể cho MongoDB
class MongoDatabase(DatabaseInterface):
    def __init__(self):        
        load_dotenv()
        self.mongodb_url = os.getenv("MONGODB_URL")
        self.client = None
        self.db = None
        
    async def connect(self):
        # Connect to MongoDB
        self.client = AsyncIOMotorClient(self.mongodb_url)
        self.db = self.client["kt-speakup"]
        return self.db
    
    async def close(self):
        # Close the connection
        if self.client:
            self.client.close()

    async def get_db(self):
        # Return the database instance
        if not self.db:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self.db