#database/database_interface.py
#Định nghĩa abstraction DatabaseInterface với các phương thức connect, close, và get_db.
#Đảm bảo các module cấp cao (như repository) chỉ phụ thuộc vào interface, không phụ thuộc vào implementation cụ thể

from abc import ABC, abstractmethod

class DatabaseInterface(ABC):
    @abstractmethod
    async def connect(self):
        """Connect to the database."""
        pass

    @abstractmethod
    async def close(self):
        """Close the connection to the database."""
        pass

    @abstractmethod
    async def get_db(self):
        """Get the database instance."""
        pass