from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from datetime import datetime, timedelta
from minio.error import S3Error
from routes.auth import get_current_user, UserInDB
from utils import minio_client, IMAGE_BUCKET
from database import db
import uuid
import os
import io

router = APIRouter()

# Model cho config
class SiteConfig(BaseModel):
    backgroundImage: str | None
    logoImage: str | None
    aiChatIcon: str | None
    updatedAt: str
    
# Lấy config hiện tại
@router.get("/", response_model=SiteConfig)
async def get_config():
    config = await db.site_configs.find_one({"_id": "site_config_id"})
    if not config:
        # Nếu chưa có config, tạo mặc định
        default_config = {
            "_id": "site_config_id",
            "backgroundImage": None,
            "logoImage": None,
            "aiChatIcon": None,
            "updatedAt": datetime.now().isoformat()
        }
        await db.site_configs.insert_one(default_config)
        return default_config
    return config

# Cập nhật config
@router.patch("/")
async def update_config(
    background: UploadFile = File(None),
    logo: UploadFile = File(None),
    aiIcon: UploadFile = File(None),
    current_user: UserInDB = Depends(get_current_user)
):
    # Kiểm tra quyền admin
    if not current_user.isAdmin:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Lấy config hiện tại
    config = await db.site_config.find_one({"_id": "site_config_id"})
    if not config:
        config = {
            "_id": "site_config_id",
            "backgroundImage": None,
            "logoImage": None,
            "aiChatIcon": None,
            "updatedAt": datetime.now().isoformat()
        }
        
    update_data = {}
    
    # Xử lý upload từng file
    allowed_extensions = {".png", ".jpg", ".jpeg", ".gif"}
    for file, field in [(background, "backgroundImage"), (logo, "logoImage"), (aiIcon, "aiChatIcon")]:
        if file:
            # Validate file type
            file_extension = os.path.splitext(file.filename)[1].lower()
            if file_extension not in allowed_extensions:
                raise HTTPException(status_code=400, detail=f"Only image files (jpg, jpeg, png, gif) are allowed for {field}")
            
            # Validate file size (2MB)
            content = await file.read()
            if len(content) > 2 * 1024 * 1024:
                raise HTTPException(status_code=400, detail=f"File size must be less than 2MB for {field}")
            
            # Tạo tên file duy nhất
            file_name = f"{field}-{uuid.uuid4()}{file_extension}"
            try:
                file_like = io.BytesIO(content)
                minio_client.put_object(
                    IMAGE_BUCKET,
                    file_name,
                    data=file_like,
                    length=len(content),
                    content_type=file.content_type
                )
                
                # Tạo presigned URL
                url = minio_client.presigned_get_object(
                    IMAGE_BUCKET,
                    file_name,
                    expires=timedelta(days=7)
                )
                update_data[field] = url
            except S3Error as e:
                print(f"Error uploading to MinIO: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to upload {field} to MinIO")
            finally:
                await file.close()
            
            # Xóa file cũ nếu có
            if config.get(field):
                try:
                    old_file_name = config[field].split("/")[-1].split("?")[0]
                    minio_client.remove_object(IMAGE_BUCKET, old_file_name)
                except S3Error as e:
                    print(f"Error deleting old file from MinIO: {e}")
    
    # Cập nhật updatedAt
    update_data["updatedAt"] = datetime.now().isoformat()
    
    # Cập nhật config trong MongoDB
    try:
        await db.site_configs.update_one(
            {"_id": "site_config_id"},
            {"$set": update_data},
            upsert=True # Tạo document mới nếu chưa có
        )
    except Exception as e:
        print(f"Error updating config in DB: {e}")
        raise HTTPException(status_code=500, detail="Failed to update config in database")
        
    # Lấy config đã cập nhật    
    updated_config = await db.site_configs.find_one({"_id": "site_config_id"})
    return updated_config