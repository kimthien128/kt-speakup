# services/config_service.py
# Xử lý logic nghiệp vụ liên quan đến site config: kiểm tra quyền admin, xử lý file, chuẩn hóa config.
# Tuân thủ SRP: Chỉ xử lý logic nghiệp vụ, không xử lý API.

from fastapi import HTTPException, UploadFile
from datetime import datetime
import uuid
import os
import io
from ..repositories.config_repository import ConfigRepository
from ..storage.storage_client import StorageClient
from ..security import UserInDB
from ..logging_config import logger

class SiteConfig:
    def __init__(self, backgroundImage: str | None, logoImage: str | None, aiChatIcon: str | None,
                 heroImage: str | None, saveWordImage: str | None, updatedAt: str):
        self.backgroundImage = backgroundImage
        self.logoImage = logoImage
        self.aiChatIcon = aiChatIcon
        self.heroImage = heroImage
        self.saveWordImage = saveWordImage
        self.updatedAt = updatedAt
        
class ConfigService:
    def __init__(self, config_repository: ConfigRepository, storage_client: StorageClient):
        self.config_repository = config_repository
        self.storage_client = storage_client
        self.image_bucket = os.getenv("IMAGE_BUCKET")
        self.minio_endpoint = os.getenv("MINIO_ENDPOINT")
        self.default_config = {
            "backgroundImage": None,
            "logoImage": None,
            "aiChatIcon": None,
            "heroImage": None,
            "saveWordImage": None,
            "updatedAt": datetime.now().isoformat()
        }
        
    async def get_config(self) -> dict:
        config = await self.config_repository.get_config()
        if not config:
            logger.info("No site config found, creating default config")
            config = {"_id": "site_config_id", **self.default_config}
            await self.config_repository.update_config(self.default_config)
        else:
            for key, value in self.default_config.items():
                if key not in config:
                    config[key] = value
                    logger.debug(f"Added missing field {key} to site config")
        return config
    
    async def update_config(
        self, 
        background: UploadFile, 
        logo: UploadFile, 
        aiIcon: UploadFile,
        hero: UploadFile, 
        saveWord: UploadFile, 
        current_user: UserInDB
        ) -> dict:
        # Kiểm tra quyền admin
        if not current_user.isAdmin:
            logger.warning(f"User {current_user.id} attempted to update config without admin rights")
            raise HTTPException(status_code=403, detail="Permission denied")
        
        # Lấy config hiện tại
        config = await self.config_repository.get_config()
        if not config:
            logger.info("No site config found, initializing with default")
            config = {"_id": "site_config_id", **self.default_config}
            
        update_data = {}
        allowed_extensions = {".png", ".jpg", ".jpeg", ".gif"}
        
        # Xử lý upload từng file
        for file, field in [
            (background, "backgroundImage"), 
            (logo, "logoImage"),
            (aiIcon, "aiChatIcon"), 
            (hero, "heroImage"), 
            (saveWord, "saveWordImage")
            ]:
            if file:
                # Validate file type
                file_extension = os.path.splitext(file.filename)[1].lower()
                if file_extension not in allowed_extensions:
                    logger.error(f"Invalid file type for {field}: {file_extension}")
                    raise HTTPException(status_code=400, detail=f"Only image files (jpg, jpeg, png, gif) are allowed for {field}")

                # Validate file size (2MB)
                content = await file.read()
                if len(content) > 2 * 1024 * 1024:
                    logger.error(f"File size too large for {field}: {len(content)} bytes")
                    raise HTTPException(status_code=400, detail=f"File size must be less than 2MB for {field}")

                # Tạo tên file duy nhất
                file_name = f"{field}-{uuid.uuid4()}{file_extension}"
                try:
                    file_like = io.BytesIO(content)
                    self.storage_client.put_object(
                        bucket_name=self.image_bucket,
                        object_name=file_name,
                        data=file_like,
                        length=len(content),
                        content_type=file.content_type
                    )
                    url = f"{self.minio_endpoint}/{self.image_bucket}/{file_name}"
                    update_data[field] = url
                    logger.info(f"Uploaded {field} to MinIO: {url}")
                except Exception as e:
                    logger.error(f"Failed to upload {field} to MinIO: {str(e)}")
                    raise HTTPException(status_code=500, detail=f"Failed to upload {field} to MinIO")
                finally:
                    await file.close()

                # Xóa file cũ nếu có
                old_url = config.get(field)
                if old_url:
                    try:
                        old_file_name = old_url.split("/")[-1].split("?")[0]
                        self.storage_client.remove_object(self.image_bucket, old_file_name)
                        logger.info(f"Deleted old file for {field}: {old_file_name}")
                    except Exception as e:
                        logger.warning(f"Failed to delete old file for {field}: {str(e)}")

        # Cập nhật updatedAt
        update_data["updatedAt"] = datetime.now().isoformat()

        # Cập nhật config trong database
        await self.config_repository.update_config(update_data)
        logger.info("Updated site config successfully")

        # Lấy config đã cập nhật
        updated_config = await self.config_repository.get_config()
        return updated_config