# routes/users.py
#dùng để admin xử lý các chức năng liên quan đến user

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..security import UserInDB
from ..services.user_service import UserService
from ..services.auth_service import AuthService
from ..logging_config import logger
from ..dependencies import get_auth_repository, get_storage_client
from ..config.jwt_config import JWTConfig, get_jwt_config
from .auth import get_admin_user

router = APIRouter()

# Model cho request cập nhật user (dành cho admin)
class UpdateUserRequest(BaseModel):
    email: str | None = None
    displayName: str | None = None
    phoneNumber: str | None = None
    gender: str | None = None
    location: str | None = None
    isAdmin: bool | None = None
    status: str | None = None
    
# Model cho request tạo user mới (dành cho admin)
class CreateUserRequest(BaseModel):
    email: str
    password: str
    displayName: str | None = None
    phoneNumber: str | None = None
    gender: str | None = None
    location: str | None = None
    isAdmin: bool = False
    
# Dependency để lấy jwt_config
def get_jwt_config_dep():
    return get_jwt_config()

# Khởi tạo UserService
async def get_user_service(
    auth_repository=Depends(get_auth_repository),
    storage_client=Depends(get_storage_client),
    jwt_config: JWTConfig = Depends(get_jwt_config_dep)
):
    return UserService(auth_repository, storage_client)

# Tạo user mới (chỉ dành cho admin)
@router.post("")
async def create_user(
    request: CreateUserRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: UserInDB = Depends(get_admin_user)  # kiểm tra user có quyền admin thông qua dependency nên không cần gọi bên trong hàm nữa, chỉ cần truyền ở đây
):
    try:
        return await user_service.create_user_by_admin(request.dict())
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user")

# Lấy danh sách tất cả user (chỉ dành cho admin)
@router.get("")
async def get_all_users(
    user_service: UserService = Depends(get_user_service),
    current_user: UserInDB = Depends(get_admin_user),  # kiểm tra user có quyền admin thông qua dependency nên không cần gọi bên trong hàm nữa, chỉ cần truyền ở đây
):
    try:
        return await user_service.get_all_users()
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching all users: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")

# Cập nhật thông tin user (chỉ dành cho admin)
@router.patch("/{user_id}")
async def update_user_by_admin(
    user_id: str,
    request: UpdateUserRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: UserInDB = Depends(get_admin_user) # kiểm tra user có quyền admin thông qua dependency nên không cần gọi bên trong hàm nữa, chỉ cần truyền ở đây
):
    try:
        return await user_service.update_user_by_admin(user_id, request.dict())
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user")

# Xóa user (chỉ dành cho admin)
@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
    current_user: UserInDB = Depends(get_admin_user)
):
    try:
        return await user_service.delete_user(user_id, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user")