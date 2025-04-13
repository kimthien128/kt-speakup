#routes/auth.py

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import Response
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from ..security import UserInDB, get_current_user, oauth2_scheme
from ..services.auth_service import AuthService
from ..config.jwt_config import get_jwt_config, JWTConfig
from ..dependencies import get_auth_repository, get_storage_client
from ..logging_config import logger

router = APIRouter()

# Model cho request
class UserCreate(BaseModel):
    email: str
    password: str
    avatarPath: str | None = None
    displayName: str | None = None
    phoneNumber: str | None = None
    gender: str | None = None
    location: str | None = None
    isAdmin: bool = False

# Model cho request đổi mật khẩu
class ChangePasswordRequest(BaseModel):
    oldPassword: str
    newPassword: str

# Dependency để lấy jwt_config
def get_jwt_config_dep():
    return get_jwt_config()

# Khởi tạo AuthService
async def get_auth_service(
    auth_repository = Depends(get_auth_repository),
    storage_client = Depends(get_storage_client),
    jwt_config: JWTConfig = Depends(get_jwt_config_dep)
):
    return AuthService(auth_repository, storage_client, jwt_config)

# Dependency để lấy current_user
async def get_current_user_with_auth_service(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
    response: Response = None
) -> UserInDB:
    return await get_current_user(token=token,auth_service=auth_service, response=response)

# Đăng ký user mới.
@router.post("/register")
async def register(user: UserCreate, auth_service: AuthService = Depends(get_auth_service)):
    try:
        return await auth_service.register(user.dict())
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail="Failed to register user")

# Đăng nhập và tạo access token.
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), auth_service: AuthService = Depends(get_auth_service)):
    try:
        return await auth_service.login(form_data)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error logging in: {e}")
        raise HTTPException(status_code=500, detail="Failed to login")

# Lấy thông tin user hiện tại
@router.get("/me")
async def get_me(
    auth_service: AuthService = Depends(get_auth_service),
    current_user: UserInDB = Depends(get_current_user_with_auth_service)
):
    try:
        return await auth_service.get_user_info(current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching user info: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user info")

# Cập nhật thông tin user
@router.patch("/update")
async def update_user(
    displayName: str = Form(...), 
    phoneNumber: str = Form(None),
    gender: str = Form(None),
    location: str = Form(None),
    avatar: UploadFile = File(None), 
    current_user: UserInDB = Depends(get_current_user_with_auth_service),
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        return await auth_service.update_user(displayName, phoneNumber, gender, location, avatar, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user")
    
# Đổi mật khẩu
@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: UserInDB = Depends(get_current_user_with_auth_service),
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        return await auth_service.change_password(request.oldPassword, request.newPassword, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error changing password: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")