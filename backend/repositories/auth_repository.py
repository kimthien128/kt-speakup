# repositories/auth_repository.py
# Định nghĩa AuthRepository để xử lý các truy vấn dữ liệu liên quan đến user.
# Nhận một instance của BaseRepository thông qua constructor để không phụ thuộc vào implementation cụ thể.
# Tuân thủ DIP: Chỉ phụ thuộc vào abstraction BaseRepository.

from bson import ObjectId

class AuthRepository:
    def __init__(self, repository):
        self.repository = repository
        
    async def find_user_by_email(self, email: str):
        """Tìm người dùng theo email."""
        query = {"email": email}
        return await self.repository.find_one("users", query)
    
    async def find_user_by_id(self, user_id: str):
        """Tìm người dùng theo ID."""
        try:
            query = {"_id": ObjectId(user_id)}
            return await self.repository.find_one("users", query)
        except Exception as e:
            raise ValueError(f"Invalid user ID: {user_id}")
        
    async def get_all_users(self):
        """Lấy danh sách tất cả người dùng."""
        query = {}
        return await self.repository.find_many("users", query)
    
    async def create_user(self, user_data: dict):
        """Tạo người dùng mới."""
        return await self.repository.insert_one("users", user_data)
    
    async def update_user(self, email: str, update_data: dict):
        """Cập nhật thông tin người dùng."""
        query = {"email": email}
        return await self.repository.update_one("users", query, update_data)
    
    async def update_user_by_id(self, user_id: str, update_data: dict):
        """Cập nhật thông tin người dùng theo ID."""
        try:
            query = {"_id": ObjectId(user_id)}
            return await self.repository.update_one("users", query, update_data)
        except Exception as e:
            raise ValueError(f"Invalid user ID: {user_id}")
        
    async def delete_user(self, user_id: str):
        """Xóa người dùng theo ID."""
        try:
            query = {"_id": ObjectId(user_id)}
            return await self.repository.delete_one("users", query)
        except Exception as e:
            raise ValueError(f"Invalid user ID: {user_id}")