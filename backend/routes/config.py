from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel
from ..services.auth_service import UserInDB
from .auth import get_auth_service
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

# Lấy config hiện tại
@router.get("/", response_model=SiteConfig)
async def get_config(config_service: ConfigService = Depends(get_config_service)):
    logger.info("Fetching site config")
    return await config_service.get_config()
    
# Cập nhật config
@router.patch("/", response_model=SiteConfig)
async def update_config(
    background: UploadFile = File(None),
    logo: UploadFile = File(None),
    aiIcon: UploadFile = File(None),
    hero: UploadFile = File(None),
    saveWord: UploadFile = File(None),
    current_user: UserInDB = Depends(get_auth_service),
    config_service: ConfigService = Depends(get_config_service)
):
    logger.info(f"User {current_user.id} is updating site config")
    return await config_service.update_config(
        background, logo, aiIcon, hero, saveWord, current_user
    )