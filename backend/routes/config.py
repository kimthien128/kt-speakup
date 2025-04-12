from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel
from ..database.database_factory import database
from ..repositories.mongo_repository import MongoRepository
from ..repositories.config_repository import ConfigRepository
from ..services.auth_service import UserInDB
from .auth import get_auth_service
from ..services.config_service import ConfigService, SiteConfig
from ..storage.minio_client import MinioClient

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
async def get_config_service():
    db = await database.connect()
    base_repository = MongoRepository(db)
    config_repository = ConfigRepository(base_repository)
    storage_client = MinioClient()
    return ConfigService(config_repository, storage_client)

# Lấy config hiện tại
@router.get("/", response_model=SiteConfig)
async def get_config(config_service: ConfigService = Depends(get_config_service)):
    return await config_service.get_config()
    
# Cập nhật config
@router.patch("/", response_model=SiteConfig)
async def update_config(
    background: UploadFile = File(None),
    logo: UploadFile = File(None),
    aiIcon: UploadFile = File(None),
    hero: UploadFile = File(None),
    saveWord: UploadFile = File(None),
    current_user: UserInDB = Depends(get_auth_service().get_current_user),
    config_service: ConfigService = Depends(get_config_service)
):
    return await config_service.update_config(
        background, logo, aiIcon, hero, saveWord, current_user
    )