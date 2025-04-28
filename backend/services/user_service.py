#services/user_service.py
# Xử lý logic nghiệp vụ liên quan đến quản lý user: lấy danh sách, cập nhật, xóa user.
# Gọi AuthRepository để thực hiện truy vấn dữ liệu.
# Tuân thủ SRP: Chỉ xử lý logic nghiệp vụ, không xử lý API hay truy vấn trực tiếp.

from fastapi import HTTPException
from ..security import UserInDB
from ..logging_config import logger
from ..config.jwt_config import get_password_hash
from datetime import datetime
import os
import re

class UserService:
    def __init__(self, auth_repository, storage_client):
        self.auth_repository = auth_repository
        self.storage_client = storage_client
        self.avatar_bucket = os.getenv("AVATARS_BUCKET")

    async def create_user_by_admin(self, user_data: dict):
        """Tạo user mới (dành cho admin - ko cần xác thực email)"""
        # Kiểm tra xem email đã tồn tại chưa
        existing_user = await self.auth_repository.find_user_by_email(user_data["email"])
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # Kiểm tra mật khẩu nghiêm ngặt
        password_pattern = r"^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$"
        if not re.match(password_pattern, user_data["password"]):
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters long and contain at least one number, one lowercase letter, and one uppercase letter"
            )
            
        # Hash mật khẩu
        hashed_password = get_password_hash(user_data["password"])
        
        user_dict = {
            "email": user_data["email"],
            "hashed_password": hashed_password,
            "avatarPath": user_data.get("avatarPath"),
            "displayName": user_data.get("displayName"),
            "phoneNumber": user_data.get("phoneNumber"),
            "gender": user_data.get("gender"),
            "location": user_data.get("location"),
            "isAdmin": user_data.get("isAdmin", False),
            "status": "active",  # User được tạo bởi admin sẽ tự động active
            "createdAt": datetime.utcnow(),
        }
        await self.auth_repository.create_user(user_dict)
        
        # Lấy thông tin user vừa tạo để trả về
        created_user = await self.auth_repository.find_user_by_email(user_data["email"])
        return {
            "id": str(created_user["_id"]),
            "email": created_user["email"],
            "displayName": created_user.get("displayName"),
            "phoneNumber": created_user.get("phoneNumber"),
            "gender": created_user.get("gender"),
            "location": created_user.get("location"),
            "isAdmin": created_user.get("isAdmin", False),
            "status": created_user.get("status"),
            "createdAt": created_user.get("createdAt"),
        }
    
    async def get_all_users(self):
        """Lấy danh sách tất cả user"""
        
        try:
            users = await self.auth_repository.get_all_users()
            return [
                {
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "displayName": user.get("displayName"),
                    "phoneNumber": user.get("phoneNumber"),
                    "gender": user.get("gender"),
                    "location": user.get("location"),
                    "isAdmin": user.get("isAdmin", False),
                    "status": user.get("status", "pending"),
                    "createdAt": user.get("createdAt"),
                }
                for user in users
            ]
        except Exception as e:
            logger.error(f"Error fetching all users: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch users")
        
    async def update_user_by_admin(self, user_id: str, update_data: dict):
        """Cập nhật thông tin user (dành cho admin)"""
        user = await self.auth_repository.find_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Loại bỏ các trường None khỏi update_data
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        # Cập nhật thông tin user trong DB
        await self.auth_repository.update_user_by_id(user_id, update_data)
        
        # Lấy thông tin user đã cập nhật
        updated_user = await self.auth_repository.find_user_by_id(user_id)
        return {
            "id": str(updated_user["_id"]),
            "email": updated_user["email"],
            "displayName": updated_user.get("displayName"),
            "phoneNumber": updated_user.get("phoneNumber"),
            "gender": updated_user.get("gender"),
            "location": updated_user.get("location"),
            "isAdmin": updated_user.get("isAdmin", False),
            "status": updated_user.get("status"),
            "createdAt": updated_user.get("createdAt"),
        }
        
    async def delete_user(self, user_id: str, current_user: UserInDB):
        """Xóa user (dành cho admin)"""
        user = await self.auth_repository.find_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Không cho phép xóa chính mình
        if str(user["_id"]) == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
        # Xóa avatar nếu có
        avatar_path = user.get("avatarPath")
        if avatar_path:
            try:
                old_file_name = avatar_path.split("/")[-1]
                self.storage_client.remove_object(self.avatar_bucket, old_file_name)
            except Exception as e:
                logger.error(f"Error deleting avatar for user {user_id}: {e}")
                # Không ném lỗi, chỉ log vì xóa user là mục tiêu chính
        
        # Xóa user trong DB
        await self.auth_repository.delete_user(user_id)
        return {"message": "User deleted successfully"}