#database/database_factory.py
#Tạo factory để khởi tạo instance của DatabaseInterface dựa trên biến môi trường DB_TYPE.
#Dễ dàng mở rộng cho các loại database khác

from .mongo_database import MongoDatabase

# Factory để tạo instance của Database dựa trên cấu hình
def create_database(db_type: str) -> "DatabaseInterface":
    if db_type.lower() == "mongodb":
        return MongoDatabase()
    # Có thể mở rộng cho các loại database khác trong tương lai
    # elif db_type.lower() == "postgres":
    #     return PostgresDatabase()
    else:
        raise ValueError(f"Unsupported database type: {db_type}")
    
# Tạo instance database từ biến môi trường DB_TYPE
import os
from dotenv import load_dotenv

load_dotenv()
DB_TYPE = os.getenv("DB_TYPE", "mongodb")
database = create_database(DB_TYPE)