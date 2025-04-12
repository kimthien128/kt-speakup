#routes/auth.py

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from services.auth_service import AuthService, UserInDB
from ..dependencies import get_auth_repository, get_storage_client

router = APIRouter()

# Cấu hình OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

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

# Khởi tạo AuthService
async def get_auth_service(
    auth_repository = Depends(get_auth_repository),
    storage_client = Depends(get_storage_client)
):
    return AuthService(auth_repository, storage_client)

# Đăng ký user mới.
@router.post("/register")
async def register(user: UserCreate, auth_service: AuthService = Depends(get_auth_service)):
    try:
        return await auth_service.register(user.dict())
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail="Failed to register user")

# Đăng nhập và tạo access token.
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), auth_service: AuthService = Depends(get_auth_service)):
    try:
        return await auth_service.login(form_data)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error logging in: {e}")
        raise HTTPException(status_code=500, detail="Failed to login")

# Lấy thông tin user hiện tại
@router.get("/me")
async def get_me(current_user: UserInDB = Depends(get_auth_service().get_current_user)):
    try:
        return await get_auth_service().get_user_info(current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error fetching user info: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user info")

# Cập nhật thông tin user
@router.patch("/update")
async def update_user(
    displayName: str = Form(...), 
    phoneNumber: str = Form(None),
    gender: str = Form(None),
    location: str = Form(None),
    avatar: UploadFile = File(None), 
    current_user: UserInDB = Depends(get_auth_service().get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        return await auth_service.update_user(displayName, phoneNumber, gender, location, avatar, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user")
    
# Đổi mật khẩu
@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: UserInDB = Depends(get_auth_service().get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        return await auth_service.change_password(request.oldPassword, request.newPassword, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error changing password: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")