# backend/routes/config.py
# Định nghĩa các route cho cấu hình của ứng dụng
import os
from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel
from .auth import get_auth_service
from ..security import get_current_user, UserInDB, oauth2_scheme
from ..services.auth_service import AuthService
from ..services.config_service import ConfigService, SiteConfig
from ..dependencies import get_config_repository, get_storage_client
from ..logging_config import logger

router = APIRouter()

# Model cho config
class SiteConfig(BaseModel):
    backgroundImage: str | None
    logoImage: str | None
    aiChatIcon: str | None
    heroImage: str | None
    saveWordImage: str | None
    updatedAt: str

# Khởi tạo ConfigService
def get_config_service(
    config_repository = Depends(get_config_repository),
    storage_client = Depends(get_storage_client)
):
    return ConfigService(config_repository, storage_client)

# Dependency để lấy current_user
async def get_current_user_with_auth_service(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
    response: Response = None
) -> UserInDB:
    return await get_current_user(token=token, auth_service=auth_service, response=response)

# Lấy config hiện tại
@router.get("/", response_model=SiteConfig)
async def get_config(config_service: ConfigService = Depends(get_config_service)):
    logger.info("Fetching site config")
    return await config_service.get_config()
    
# Cập nhật config
@router.put("/", response_model=SiteConfig)
async def update_config(
    background: UploadFile = File(None),
    logo: UploadFile = File(None),
    aiIcon: UploadFile = File(None),
    hero: UploadFile = File(None),
    saveWord: UploadFile = File(None),
    current_user: UserInDB = Depends(get_current_user_with_auth_service),
    config_service: ConfigService = Depends(get_config_service)
):
    logger.info(f"User {current_user.id} is updating site config")
    return await config_service.update_config(
        background, logo, aiIcon, hero, saveWord, current_user
    )

# Lấy danh sách các model được bật từ biến môi trường (để frontend gọi)
@router.get("/models")
async def get_available_models():
    """Trả về danh sách các method được bật."""
    return os.getenv("ENABLED_AI_CLIENTS", "").split(",")
