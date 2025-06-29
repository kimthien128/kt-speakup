#routes/auth.py

import os
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.responses import Response
from fastapi.templating import Jinja2Templates
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from ..security import UserInDB, get_current_user, oauth2_scheme
from ..services.auth_service import AuthService
from ..config.jwt_config import get_jwt_config, JWTConfig
from ..dependencies import get_auth_repository, get_storage_client
from ..logging_config import logger

router = APIRouter()

# Dependency để lấy templates
def get_templates():
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

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

# Model cho request quên mật khẩu
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# Model cho request đặt lại mật khẩu
class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
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

# Dependency để kiểm tra quyền admin
async def get_admin_user(
    current_user: UserInDB = Depends(get_current_user_with_auth_service)
) -> UserInDB:
    if not current_user.isAdmin:
        raise HTTPException(status_code=403, detail="Permission denied")
    return current_user


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
    
# Xác nhận email
@router.get("/confirm")
async def confirm_email(
    request: Request,
    email: str,
    token: str,
    auth_service: AuthService = Depends(get_auth_service),
    templates: Jinja2Templates = Depends(get_templates)
):
    logger.info(f"Received request to confirm email: {email}, token: {token}")
    try:
        await auth_service.confirm_email(email, token)
        
        # Render template khi thành công
        return templates.TemplateResponse(
            "confirmation_response.html",
            {
                "request": request,
                "title": "Account Activated Successfully!",
                "message": "Your account has been activated successfully.",
                "success": True,
                "redirect_url": os.getenv("DOMAIN_URL", "http://localhost:5173/"),
            }
        )
    except HTTPException as e:
        # Tùy chỉnh thông điệp cho trường hợp "Account already activated"
        title = "Activation Failed"
        message = e.detail
        if e.detail == "Account already activated":
            title = "Account Already Activated"
            message = "Your account is already active. Please log in to continue."
            
        # Render template khi có lỗi HTTPException
        return templates.TemplateResponse(
            "confirmation_response.html",
            {
                "request": request,
                "title": title,
                "message": message,
                "success": False,
                "redirect_url": os.getenv("DOMAIN_URL", "http://localhost:5173/"),
            }
        )
    except Exception as e:
        logger.error(f"Error confirming email: {e}")
        
        # Render template khi có lỗi server
        return templates.TemplateResponse(
            "confirmation_response.html",
            {
                "request": request,
                "title": "Activation Failed",
                "message": "Failed to confirm email. Please try again later.",
                "success": False,
                "redirect_url": os.getenv("DOMAIN_URL", "http://localhost:5173/"),
            }
        )

# Yêu cầu đặt lại mật khẩu
@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        return await auth_service.forgot_password(request.email)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error sending reset password email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reset password email")
    
# Xử lý đặt lại mật khẩu
@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        return await auth_service.reset_password(request.email, request.token, request.newPassword)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error resetting password: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password")
    
#Cập nhật các methods người dùng
@router.post("/update-methods")
async def update_methods(
    methods: dict,
    current_user: UserInDB = Depends(get_current_user_with_auth_service),
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        return await auth_service.update_user_methods(methods, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating user methods: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user methods")